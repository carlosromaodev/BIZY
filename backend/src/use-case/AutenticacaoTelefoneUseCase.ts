import { createHash, randomInt, randomUUID } from "node:crypto";
import type { ProvedorSms } from "../dominio/provedores/ProvedorSms.js";
import type { RepositorioAutenticacao } from "../dominio/repositorios/contratos.js";
import { NormalizadorTelefone } from "../dominio/servicos/NormalizadorTelefone.js";
import type { UsuarioSistema } from "../dominio/tipos.js";

export interface OpcoesAutenticacaoTelefone {
  segredo: string;
  remetenteSms: string;
  minutosExpiracaoCodigo?: number;
  diasExpiracaoSessao?: number;
  permitirSmsDev?: boolean;
  exporCodigoDev?: boolean;
}

export class AutenticacaoTelefoneUseCase {
  private readonly normalizadorTelefone = new NormalizadorTelefone();
  private readonly minutosExpiracaoCodigo: number;
  private readonly diasExpiracaoSessao: number;

  constructor(
    private readonly repositorio: RepositorioAutenticacao,
    private readonly provedorSms: ProvedorSms,
    private readonly opcoes: OpcoesAutenticacaoTelefone
  ) {
    this.minutosExpiracaoCodigo = opcoes.minutosExpiracaoCodigo ?? 10;
    this.diasExpiracaoSessao = opcoes.diasExpiracaoSessao ?? 7;
  }

  async solicitarCodigo(dados: { telefone: string; nome?: string }) {
    const telefone = this.normalizarTelefoneOuFalhar(dados.telefone);
    const nome = dados.nome?.trim() || "Vendedor Bizy";
    const usuario = await this.repositorio.criarOuAtualizarUsuario({ telefone, nome });
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + this.minutosExpiracaoCodigo * 60_000);
    const codigo = this.gerarCodigo();

    await this.repositorio.revogarCodigosAbertos(telefone, agora);

    const mensagem = `Bizy: codigo de acesso ${codigo}. Valido por ${this.minutosExpiracaoCodigo} minutos. Nao partilhe este codigo.`;
    if (!this.provedorSms.configurado && !this.opcoes.permitirSmsDev) {
      throw new Error("Integração SMS não configurada.");
    }

    const resultadoEnvio = this.provedorSms.configurado
      ? await this.provedorSms.enviarMensagem({
          telefone,
          conteudo: mensagem,
          remetente: this.normalizarRemetente(this.opcoes.remetenteSms)
        })
      : {
          ok: true,
          provider: "dev-console",
          status: 200,
          idExterno: null,
          resposta: { message: "SMS dev mode", code: codigo },
          erro: null
        };

    const statusEnvio = resultadoEnvio.provider === "dev-console" ? "DEV" : resultadoEnvio.ok ? "SENT" : "FAILED";
    const registro = await this.repositorio.criarCodigoSms({
      telefone,
      codigoHash: this.hashCodigo(telefone, codigo),
      codigoFinal: codigo.slice(-4),
      expiraEm,
      statusEnvio,
      provider: resultadoEnvio.provider,
      providerMessageId: resultadoEnvio.idExterno,
      providerResponseJson: this.serializar(resultadoEnvio.resposta),
      usuarioId: usuario.id
    });

    if (!resultadoEnvio.ok) {
      throw new Error(resultadoEnvio.erro ?? "Não foi possível enviar o SMS.");
    }

    return {
      sucesso: true,
      telefone,
      codigoFinal: registro.codigoFinal,
      expiraEm,
      minutosExpiracao: this.minutosExpiracaoCodigo,
      statusEnvio,
      codigoDev: this.opcoes.exporCodigoDev ? codigo : undefined
    };
  }

  async confirmarCodigo(dados: { telefone: string; codigo: string }) {
    const telefone = this.normalizarTelefoneOuFalhar(dados.telefone);
    const agora = new Date();
    const codigoAberto = await this.repositorio.buscarCodigoSmsValido(telefone, agora);

    if (!codigoAberto) {
      throw new Error("Código expirado ou inexistente. Solicite um novo código.");
    }

    if (codigoAberto.tentativas >= 5) {
      await this.repositorio.marcarCodigoUsado(codigoAberto.id, agora);
      throw new Error("Muitas tentativas inválidas. Solicite um novo código.");
    }

    const hashRecebido = this.hashCodigo(telefone, dados.codigo);

    if (hashRecebido !== codigoAberto.codigoHash) {
      await this.repositorio.incrementarTentativasCodigo(codigoAberto.id);
      throw new Error("Código inválido.");
    }

    await this.repositorio.marcarCodigoUsado(codigoAberto.id, agora);

    const usuario =
      (await this.repositorio.buscarUsuarioPorTelefone(telefone)) ??
      (await this.repositorio.criarOuAtualizarUsuario({ telefone, nome: "Vendedor Bizy" }));
    const sessao = await this.criarSessaoParaUsuario(usuario.id, agora);

    return {
      sucesso: true,
      token: sessao.token,
      expiraEm: sessao.expiraEm,
      usuario
    };
  }

  async criarSessaoParaUsuario(usuarioId: string, agora = new Date()) {
    const token = randomUUID();
    const expiraEm = new Date(agora.getTime() + this.diasExpiracaoSessao * 24 * 60 * 60_000);

    await this.repositorio.criarSessao({
      tokenHash: this.hashToken(token),
      usuarioId,
      expiraEm
    });

    return { token, expiraEm };
  }

  async criarSessaoComUsuario(usuario: UsuarioSistema, agora = new Date()) {
    const sessao = await this.criarSessaoParaUsuario(usuario.id, agora);
    return {
      sucesso: true,
      token: sessao.token,
      expiraEm: sessao.expiraEm,
      usuario
    };
  }

  async obterSessao(token: string | null) {
    if (!token) return null;

    const agora = new Date();
    const sessao = await this.repositorio.buscarSessaoPorTokenHash(this.hashToken(token), agora);
    if (!sessao) return null;

    await this.repositorio.tocarSessao(sessao.id, agora);
    return sessao.usuario;
  }

  async encerrarSessao(token: string | null) {
    if (!token) return;
    await this.repositorio.encerrarSessao(this.hashToken(token));
  }

  normalizarTelefoneOuFalhar(valor: string) {
    const telefone = this.normalizadorTelefone.normalizar(valor);
    if (!telefone) throw new Error("Número de telefone angolano inválido.");
    return telefone;
  }

  private gerarCodigo() {
    return String(randomInt(0, 1_000_000)).padStart(6, "0");
  }

  private hashCodigo(telefone: string, codigo: string) {
    return createHash("sha256")
      .update(`${this.opcoes.segredo}:sms-login:${telefone}:${codigo}`)
      .digest("hex");
  }

  private hashToken(token: string) {
    return createHash("sha256").update(`${this.opcoes.segredo}:sessao:${token}`).digest("hex");
  }

  private normalizarRemetente(valor: string) {
    const remetente = valor.trim().toUpperCase().replace(/\s+/g, " ");
    return /^[A-Z0-9 _-]{3,16}$/.test(remetente) ? remetente : "BIZY";
  }

  private serializar(valor: unknown) {
    try {
      return JSON.stringify(valor);
    } catch {
      return null;
    }
  }
}
