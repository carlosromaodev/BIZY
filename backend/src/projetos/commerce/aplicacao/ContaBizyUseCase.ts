import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { DespachadorEventos } from "../../../dominio/eventos/DespachadorEventos.js";
import type { ProvedorSms } from "../../../dominio/provedores/ProvedorSms.js";
import type { RepositorioAutenticacao, RepositorioComprasUnificadas } from "../../../dominio/repositorios/contratos.js";
import { NormalizadorTelefone } from "../../../dominio/servicos/NormalizadorTelefone.js";
import type { UsuarioSistema } from "../../../dominio/tipos.js";
import type { RepositorioContaBizy } from "../dominio/contratos.js";
import type { ContaBizy, MetadadosAcessoContaBizy } from "../dominio/tipos.js";

interface DependenciasContaBizy {
  contas: RepositorioContaBizy;
  compras: RepositorioComprasUnificadas;
  autenticacao: RepositorioAutenticacao;
  sms: ProvedorSms;
  eventos: DespachadorEventos;
}

interface OpcoesContaBizy {
  segredo: string;
  remetenteSms: string;
  minutosExpiracaoOtp?: number;
  diasExpiracaoSessao?: number;
  diasExpiracaoAcessoGuest?: number;
  permitirSmsDev?: boolean;
  exporCodigoDev?: boolean;
}

interface DadosOtp {
  telefone?: string;
  finalidade?: "LOGIN" | "ASSOCIAR_COMPRA";
  compraId?: string | null;
  tokenCompra?: string | null;
}

const MENSAGEM_OTP_INVALIDO = "Codigo invalido ou expirado.";

export class ContaBizyUseCase {
  private readonly normalizador = new NormalizadorTelefone();
  private readonly minutosExpiracaoOtp: number;
  private readonly diasExpiracaoSessao: number;
  private readonly diasExpiracaoAcessoGuest: number;

  constructor(private readonly deps: DependenciasContaBizy, private readonly opcoes: OpcoesContaBizy) {
    this.minutosExpiracaoOtp = opcoes.minutosExpiracaoOtp ?? 10;
    this.diasExpiracaoSessao = opcoes.diasExpiracaoSessao ?? 30;
    this.diasExpiracaoAcessoGuest = opcoes.diasExpiracaoAcessoGuest ?? 7;
  }

  async solicitarOtp(dados: DadosOtp) {
    const finalidade = dados.finalidade ?? "LOGIN";
    const compra = finalidade === "ASSOCIAR_COMPRA"
      ? await this.exigirCompraGuest(dados.compraId, dados.tokenCompra)
      : null;
    const telefone = this.normalizarTelefone(compra?.compradorTelefone ?? dados.telefone ?? "");
    const agora = new Date();
    const desde = new Date(agora.getTime() - 15 * 60_000);
    if (await this.deps.contas.contarCodigosOtpDesde(telefone, desde) >= 3) {
      throw new Error("Aguarde antes de solicitar outro codigo.");
    }

    if (!this.deps.sms.configurado && !this.opcoes.permitirSmsDev) {
      throw new Error("Integracao SMS nao configurada.");
    }

    const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiraEm = new Date(agora.getTime() + this.minutosExpiracaoOtp * 60_000);
    await this.deps.contas.revogarCodigosOtpAbertos(telefone, finalidade, agora);
    const envio = this.deps.sms.configurado
      ? await this.deps.sms.enviarMensagem({
          telefone,
          conteudo: `Bizy: codigo de acesso ${codigo}. Valido por ${this.minutosExpiracaoOtp} minutos. Nao partilhe este codigo.`,
          remetente: this.normalizarRemetente(this.opcoes.remetenteSms)
        })
      : { ok: true, provider: "dev-console", idExterno: null, erro: null };
    if (!envio.ok) throw new Error(envio.erro ?? "Nao foi possivel enviar o SMS.");

    const conta = await this.buscarContaSemCriar(telefone);
    await this.deps.contas.criarCodigoOtp({
      contaId: conta?.id ?? null,
      contactoCanonico: telefone,
      finalidade,
      compraId: compra?.id ?? null,
      codigoHash: this.hashOtp(telefone, finalidade, compra?.id ?? null, codigo),
      codigoFinal: codigo.slice(-4),
      expiraEm,
      statusEnvio: envio.provider === "dev-console" ? "DEV" : "SENT",
      provider: envio.provider,
      providerMessageId: envio.idExterno
    });
    this.deps.eventos.emitir("CONTA_BIZY_OTP_SOLICITADO", { finalidade, compraId: compra?.id ?? null });

    return {
      sucesso: true,
      expiraEm,
      minutosExpiracao: this.minutosExpiracaoOtp,
      codigoDev: this.opcoes.exporCodigoDev ? codigo : undefined
    };
  }

  async confirmarOtp(dados: DadosOtp & {
    codigo: string;
    nome?: string | null;
    email?: string | null;
    consentimentoDados?: boolean;
    consentimentoMarketing?: boolean;
  }, metadados: MetadadosAcessoContaBizy = {}) {
    const finalidade = dados.finalidade ?? "LOGIN";
    const compra = finalidade === "ASSOCIAR_COMPRA"
      ? await this.exigirCompraGuest(dados.compraId, dados.tokenCompra)
      : null;
    const telefone = this.normalizarTelefone(compra?.compradorTelefone ?? dados.telefone ?? "");
    const agora = new Date();
    const otp = await this.deps.contas.buscarCodigoOtpValido(telefone, finalidade, compra?.id ?? null, agora);
    if (!otp || otp.tentativas >= 5) throw new Error(MENSAGEM_OTP_INVALIDO);

    const recebido = this.hashOtp(telefone, finalidade, compra?.id ?? null, dados.codigo);
    if (!this.hashIgual(recebido, otp.codigoHash)) {
      await this.deps.contas.incrementarTentativasOtp(otp.id);
      throw new Error(MENSAGEM_OTP_INVALIDO);
    }
    await this.deps.contas.consumirCodigoOtp(otp.id, agora);

    const conta = await this.deps.contas.criarOuObterContaTelefoneVerificado({
      telefoneCanonico: telefone,
      nome: dados.nome ?? compra?.compradorNome,
      emailCanonico: dados.email ?? compra?.compradorEmail
    });
    await this.deps.contas.garantirPerfilComprador(conta.id, {
      nomeExibicao: dados.nome ?? compra?.compradorNome,
      consentimentoDados: dados.consentimentoDados,
      consentimentoMarketing: dados.consentimentoMarketing
    });
    await this.deps.contas.garantirContexto(conta.id, "COMPRADOR");

    if (dados.consentimentoDados !== undefined) {
      await this.deps.contas.criarConsentimento({
        contaId: conta.id,
        tipo: "DADOS_COMMERCE",
        versao: "commerce.v1",
        concedido: dados.consentimentoDados,
        origem: "OTP_COMPRADOR",
        ipHash: metadados.ipHash
      });
    }

    const comprasDoContacto = await this.deps.compras.listarComprasPorComprador(telefone, 200);
    for (const compraDoContacto of comprasDoContacto) {
      if (!compraDoContacto.contaBizyId || compraDoContacto.contaBizyId === conta.id) {
        await this.deps.compras.associarConta(compraDoContacto.id, conta.id);
        await this.deps.contas.revogarAcessosCompra(compraDoContacto.id, "COMPRA_ASSOCIADA_A_CONTA", agora);
      }
    }
    if (compra && !comprasDoContacto.some((item) => item.id === compra.id)) {
      await this.deps.compras.associarConta(compra.id, conta.id);
      await this.deps.contas.revogarAcessosCompra(compra.id, "COMPRA_ASSOCIADA_A_CONTA", agora);
    }

    const sessao = await this.criarSessao(conta, metadados, agora);
    this.deps.eventos.emitir("CONTA_BIZY_AUTENTICADA", { contaId: conta.id, finalidade, compraId: compra?.id ?? null });
    return { conta: this.publicarConta(conta), ...sessao };
  }

  async garantirContaUsuario(usuario: UsuarioSistema): Promise<ContaBizy> {
    const conta = await this.deps.contas.garantirContaCompatibilidade(usuario);
    const negocios = await this.deps.autenticacao.listarNegociosPorUsuario(usuario.id);
    for (const negocio of negocios) await this.deps.contas.garantirContexto(conta.id, "MEMBRO_NEGOCIO", negocio.id);
    return conta;
  }

  async obterSessao(token: string | null) {
    if (!token) return null;
    const agora = new Date();
    const resultado = await this.deps.contas.buscarSessaoPorTokenHash(this.hashToken("sessao", token), agora);
    if (!resultado) return null;
    await this.deps.contas.tocarSessao(resultado.sessao.id, agora);
    return { conta: resultado.conta, sessao: resultado.sessao };
  }

  async listarSessoes(contaId: string) {
    return this.deps.contas.listarSessoes(contaId, new Date());
  }

  async obterContextos(contaId: string) {
    return this.deps.contas.listarContextos(contaId);
  }

  async obterResumo(conta: ContaBizy) {
    const [perfil, contextos, compras, enderecos, favoritos, sessoes] = await Promise.all([
      this.deps.contas.obterPerfilComprador(conta.id),
      this.deps.contas.listarContextos(conta.id),
      this.deps.compras.listarComprasPorConta(conta.id, 100),
      this.deps.contas.listarEnderecos(conta.id),
      this.deps.contas.listarFavoritos(conta.id),
      this.deps.contas.listarSessoes(conta.id, new Date())
    ]);
    const contextosAtivos = new Set(contextos.filter((item) => item.estado === "ATIVO").map((item) => item.tipo));
    return {
      conta: this.publicarConta(conta),
      perfil,
      contextos,
      indicadores: {
        compras: compras.length,
        comprasEmCurso: compras.filter((item) => !["CONCLUIDA", "CANCELADA", "REEMBOLSADA"].includes(item.estado)).length,
        favoritos: favoritos.length,
        enderecos: enderecos.length,
        sessoesAtivas: sessoes.length
      },
      navegacao: {
        conta: true,
        creator: contextosAtivos.has("CRIADOR") || contextosAtivos.has("AFILIADO"),
        team: contextosAtivos.has("SELLER") || contextosAtivos.has("MEMBRO_NEGOCIO"),
        learning: contextosAtivos.has("PRODUTOR_LEARNING")
      }
    };
  }

  revogarSessao(id: string, contaId: string) {
    return this.deps.contas.revogarSessao(id, contaId, "REVOGADA_PELO_TITULAR", new Date());
  }

  async encerrarSessao(token: string | null) {
    if (!token) return;
    await this.deps.contas.revogarSessaoPorTokenHash(this.hashToken("sessao", token), "LOGOUT", new Date());
  }

  async emitirAcessoCompra(compraId: string) {
    const token = randomBytes(32).toString("base64url");
    const expiraEm = new Date(Date.now() + this.diasExpiracaoAcessoGuest * 24 * 60 * 60_000);
    await this.deps.contas.criarAcessoCompra(compraId, this.hashToken("compra", token), expiraEm);
    return { token, expiraEm };
  }

  validarAcessoCompra(compraId: string, token: string | null) {
    if (!token) return Promise.resolve(false);
    return this.deps.contas.validarAcessoCompra(compraId, this.hashToken("compra", token), new Date());
  }

  async listarCompras(contaId: string) {
    return this.deps.compras.listarComprasPorConta(contaId, 100);
  }

  async obterPerfilComprador(contaId: string) {
    const perfil = await this.deps.contas.obterPerfilComprador(contaId)
      ?? await this.deps.contas.garantirPerfilComprador(contaId);
    const [enderecos, favoritos] = await Promise.all([
      this.deps.contas.listarEnderecos(contaId),
      this.deps.contas.listarFavoritos(contaId)
    ]);
    return { perfil, enderecos, favoritos };
  }

  async atualizarPerfilComprador(contaId: string, dados: {
    nomeExibicao?: string | null;
    preferencias?: Record<string, unknown>;
    consentimentoDados?: boolean;
    consentimentoMarketing?: boolean;
  }, ipHash?: string | null) {
    const perfil = await this.deps.contas.garantirPerfilComprador(contaId, dados);
    for (const [tipo, concedido] of [
      ["DADOS_COMMERCE", dados.consentimentoDados],
      ["MARKETING", dados.consentimentoMarketing]
    ] as const) {
      if (concedido === undefined) continue;
      await this.deps.contas.criarConsentimento({
        contaId, tipo, versao: "commerce.v1", concedido, origem: "PERFIL_COMPRADOR", ipHash
      });
    }
    return perfil;
  }

  listarEnderecos(contaId: string) {
    return this.deps.contas.listarEnderecos(contaId);
  }

  salvarEndereco(contaId: string, dados: Parameters<RepositorioContaBizy["salvarEndereco"]>[1]) {
    return this.deps.contas.salvarEndereco(contaId, dados);
  }

  removerEndereco(id: string, contaId: string) {
    return this.deps.contas.removerEndereco(id, contaId);
  }

  listarFavoritos(contaId: string) {
    return this.deps.contas.listarFavoritos(contaId);
  }

  adicionarFavorito(contaId: string, slugLoja: string, codigoProduto: string) {
    return this.deps.contas.adicionarFavorito(contaId, slugLoja, codigoProduto);
  }

  removerFavorito(contaId: string, slugLoja: string, codigoProduto: string) {
    return this.deps.contas.removerFavorito(contaId, slugLoja, codigoProduto);
  }

  buscarCompra(contaId: string, compraId: string) {
    return this.deps.compras.buscarPorIdEConta(compraId, contaId);
  }

  async revogarAcessosCompra(compraId: string) {
    await this.deps.contas.revogarAcessosCompra(compraId, "COMPRA_ASSOCIADA_A_CONTA", new Date());
  }

  private async criarSessao(conta: ContaBizy, metadados: MetadadosAcessoContaBizy, agora: Date) {
    const token = randomBytes(32).toString("base64url");
    const expiraEm = new Date(agora.getTime() + this.diasExpiracaoSessao * 24 * 60 * 60_000);
    const sessao = await this.deps.contas.criarSessao(conta.id, this.hashToken("sessao", token), expiraEm, metadados);
    return { token, sessaoId: sessao.id, expiraEm };
  }

  private async exigirCompraGuest(compraId?: string | null, token?: string | null) {
    if (!compraId || !token || !await this.validarAcessoCompra(compraId, token)) throw new Error("Compra nao encontrada.");
    const compra = await this.deps.compras.buscarPorId(compraId);
    if (!compra) throw new Error("Compra nao encontrada.");
    return compra;
  }

  private async buscarContaSemCriar(telefone: string) {
    const compras = await this.deps.compras.listarComprasPorComprador(telefone, 1);
    const contaId = compras.find((compra) => compra.contaBizyId)?.contaBizyId;
    return contaId ? this.deps.contas.buscarContaPorId(contaId) : null;
  }

  private normalizarTelefone(valor: string) {
    const telefone = this.normalizador.normalizar(valor);
    if (!telefone) throw new Error("Numero de telefone angolano invalido.");
    return telefone;
  }

  private hashOtp(telefone: string, finalidade: string, compraId: string | null, codigo: string) {
    return createHash("sha256").update(`${this.opcoes.segredo}:conta-otp:${telefone}:${finalidade}:${compraId ?? ""}:${codigo}`).digest("hex");
  }

  private hashToken(tipo: "sessao" | "compra", token: string) {
    return createHash("sha256").update(`${this.opcoes.segredo}:conta-${tipo}:${token}`).digest("hex");
  }

  private hashIgual(a: string, b: string) {
    const esquerda = Buffer.from(a, "hex");
    const direita = Buffer.from(b, "hex");
    return esquerda.length === direita.length && timingSafeEqual(esquerda, direita);
  }

  private normalizarRemetente(valor: string) {
    const remetente = valor.trim().toUpperCase().replace(/\s+/g, " ");
    return /^[A-Z0-9 _-]{3,16}$/.test(remetente) ? remetente : "BIZY";
  }

  private publicarConta(conta: ContaBizy) {
    return { id: conta.id, nome: conta.nome, telefone: conta.telefoneCanonico, email: conta.emailCanonico, status: conta.status };
  }
}
