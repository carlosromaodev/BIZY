import { randomUUID } from "node:crypto";
import type { UsuarioSistema } from "../../../../dominio/tipos.js";
import type { RepositorioContaBizy } from "../../dominio/contratos.js";
import type {
  CodigoOtpContaBizy,
  ContaBizy,
  MetadadosAcessoContaBizy,
  PerfilComprador,
  EnderecoComprador,
  FavoritoComprador,
  SessaoContaBizy,
  TipoContextoContaBizy
} from "../../dominio/tipos.js";

interface CodigoOtpMemoria extends CodigoOtpContaBizy {
  codigoFinal: string;
  usadoEm: Date | null;
  revogadoEm: Date | null;
  statusEnvio: string;
  provider: string;
  providerMessageId: string | null;
  criadoEm: Date;
}

interface AcessoCompraMemoria {
  compraId: string;
  tokenHash: string;
  expiraEm: Date;
  revogadoEm: Date | null;
  ultimoAcessoEm: Date | null;
}

export class RepositorioContaBizyMemoria implements RepositorioContaBizy {
  private readonly contas = new Map<string, ContaBizy>();
  private readonly perfis = new Map<string, PerfilComprador>();
  private readonly contextos = new Set<string>();
  private readonly enderecos = new Map<string, EnderecoComprador>();
  private readonly favoritos = new Map<string, FavoritoComprador>();
  private readonly codigos = new Map<string, CodigoOtpMemoria>();
  private readonly sessoes = new Map<string, SessaoContaBizy & { tokenHash: string }>();
  private readonly acessos = new Map<string, AcessoCompraMemoria>();

  async buscarContaPorId(id: string) {
    return this.contas.get(id) ?? null;
  }

  async buscarContaPorUsuarioSistema(usuarioSistemaId: string) {
    return [...this.contas.values()].find((conta) => conta.usuarioSistemaId === usuarioSistemaId) ?? null;
  }

  async garantirContaCompatibilidade(usuario: UsuarioSistema): Promise<ContaBizy> {
    const ligada = await this.buscarContaPorUsuarioSistema(usuario.id);
    if (ligada) return ligada;
    const porContacto = [...this.contas.values()].find((conta) =>
      Boolean(usuario.telefone && conta.telefoneCanonico === usuario.telefone) ||
      Boolean(usuario.email && conta.emailCanonico === usuario.email.toLowerCase())
    );
    if (porContacto) {
      if (porContacto.usuarioSistemaId && porContacto.usuarioSistemaId !== usuario.id) {
        throw new Error("Contacto ja associado a outra conta Bizy.");
      }
      const atualizada = { ...porContacto, usuarioSistemaId: usuario.id, nome: porContacto.nome ?? usuario.nome, atualizadoEm: new Date() };
      this.contas.set(atualizada.id, atualizada);
      return atualizada;
    }
    return this.criarConta({
      nome: usuario.nome,
      telefoneCanonico: usuario.telefone,
      emailCanonico: usuario.email?.toLowerCase() ?? null,
      usuarioSistemaId: usuario.id
    });
  }

  async criarOuObterContaTelefoneVerificado(dados: {
    telefoneCanonico: string; nome?: string | null; emailCanonico?: string | null;
  }): Promise<ContaBizy> {
    const existente = [...this.contas.values()].find((conta) => conta.telefoneCanonico === dados.telefoneCanonico);
    const agora = new Date();
    if (existente) {
      const atualizada = {
        ...existente,
        nome: dados.nome?.trim() || existente.nome,
        emailCanonico: existente.emailCanonico ?? dados.emailCanonico?.toLowerCase() ?? null,
        telefoneVerificadoEm: existente.telefoneVerificadoEm ?? agora,
        atualizadoEm: agora
      };
      this.contas.set(atualizada.id, atualizada);
      return atualizada;
    }
    return this.criarConta({
      nome: dados.nome?.trim() || null,
      telefoneCanonico: dados.telefoneCanonico,
      emailCanonico: dados.emailCanonico?.toLowerCase() ?? null,
      telefoneVerificadoEm: agora
    });
  }

  async garantirPerfilComprador(contaId: string, dados: {
    nomeExibicao?: string | null; consentimentoDados?: boolean; consentimentoMarketing?: boolean;
    preferencias?: Record<string, unknown>;
  } = {}): Promise<PerfilComprador> {
    const atual = this.perfis.get(contaId);
    const agora = new Date();
    const perfil: PerfilComprador = {
      id: atual?.id ?? randomUUID(),
      contaId,
      nomeExibicao: dados.nomeExibicao?.trim() || atual?.nomeExibicao || null,
      preferencias: dados.preferencias ?? atual?.preferencias ?? {},
      consentimentoDados: dados.consentimentoDados ?? atual?.consentimentoDados ?? false,
      consentimentoMarketing: dados.consentimentoMarketing ?? atual?.consentimentoMarketing ?? false,
      criadoEm: atual?.criadoEm ?? agora,
      atualizadoEm: agora
    };
    this.perfis.set(contaId, perfil);
    return perfil;
  }

  async obterPerfilComprador(contaId: string) {
    return this.perfis.get(contaId) ?? null;
  }

  async listarEnderecos(contaId: string) {
    return [...this.enderecos.values()].filter((item) => item.contaId === contaId).sort((a, b) => Number(b.principal) - Number(a.principal));
  }

  async salvarEndereco(contaId: string, dados: {
    id?: string | null; rotulo: string; provincia?: string | null; municipio?: string | null; bairro?: string | null;
    endereco: string; referencia?: string | null; principal?: boolean;
  }) {
    if (dados.id && this.enderecos.get(dados.id)?.contaId !== contaId) return null;
    if (dados.principal) {
      for (const [id, item] of this.enderecos) if (item.contaId === contaId) this.enderecos.set(id, { ...item, principal: false });
    }
    const agora = new Date();
    const atual = dados.id ? this.enderecos.get(dados.id) : null;
    const endereco: EnderecoComprador = {
      id: atual?.id ?? randomUUID(), contaId, rotulo: dados.rotulo, provincia: dados.provincia ?? null,
      municipio: dados.municipio ?? null, bairro: dados.bairro ?? null, endereco: dados.endereco,
      referencia: dados.referencia ?? null, principal: dados.principal ?? false,
      criadoEm: atual?.criadoEm ?? agora, atualizadoEm: agora
    };
    this.enderecos.set(endereco.id, endereco);
    return endereco;
  }

  async removerEndereco(id: string, contaId: string) {
    if (this.enderecos.get(id)?.contaId !== contaId) return false;
    return this.enderecos.delete(id);
  }

  async listarFavoritos(contaId: string) {
    return [...this.favoritos.values()].filter((item) => item.contaId === contaId);
  }

  async adicionarFavorito(contaId: string, slugLoja: string, codigoProduto: string) {
    const chave = `${contaId}:${slugLoja}:${codigoProduto}`;
    const atual = this.favoritos.get(chave);
    if (atual) return atual;
    const favorito = { id: randomUUID(), contaId, slugLoja, codigoProduto, criadoEm: new Date() };
    this.favoritos.set(chave, favorito);
    return favorito;
  }

  async removerFavorito(contaId: string, slugLoja: string, codigoProduto: string) {
    return this.favoritos.delete(`${contaId}:${slugLoja}:${codigoProduto}`);
  }

  async garantirContexto(contaId: string, tipo: TipoContextoContaBizy, negocioId?: string | null): Promise<void> {
    this.contextos.add(`${contaId}:${tipo}:${negocioId ?? "GLOBAL"}`);
  }

  async criarConsentimento(): Promise<void> {}

  async criarCodigoOtp(dados: {
    contaId?: string | null; contactoCanonico: string; finalidade: CodigoOtpContaBizy["finalidade"]; compraId?: string | null;
    codigoHash: string; codigoFinal: string; expiraEm: Date; statusEnvio: string; provider: string; providerMessageId?: string | null;
  }): Promise<void> {
    const codigo: CodigoOtpMemoria = {
      id: randomUUID(), contaId: dados.contaId ?? null, contactoCanonico: dados.contactoCanonico,
      finalidade: dados.finalidade, compraId: dados.compraId ?? null, codigoHash: dados.codigoHash,
      codigoFinal: dados.codigoFinal, tentativas: 0, expiraEm: dados.expiraEm, usadoEm: null,
      revogadoEm: null, statusEnvio: dados.statusEnvio, provider: dados.provider,
      providerMessageId: dados.providerMessageId ?? null, criadoEm: new Date()
    };
    this.codigos.set(codigo.id, codigo);
  }

  async contarCodigosOtpDesde(contactoCanonico: string, desde: Date): Promise<number> {
    return [...this.codigos.values()].filter((codigo) => codigo.contactoCanonico === contactoCanonico && codigo.criadoEm >= desde).length;
  }

  async revogarCodigosOtpAbertos(contactoCanonico: string, finalidade: CodigoOtpContaBizy["finalidade"], agora: Date): Promise<void> {
    for (const codigo of this.codigos.values()) {
      if (codigo.contactoCanonico === contactoCanonico && codigo.finalidade === finalidade && !codigo.usadoEm && !codigo.revogadoEm && codigo.expiraEm > agora) {
        this.codigos.set(codigo.id, { ...codigo, revogadoEm: agora });
      }
    }
  }

  async buscarCodigoOtpValido(contactoCanonico: string, finalidade: CodigoOtpContaBizy["finalidade"], compraId: string | null, agora: Date) {
    return [...this.codigos.values()]
      .filter((codigo) => codigo.contactoCanonico === contactoCanonico && codigo.finalidade === finalidade && codigo.compraId === compraId)
      .filter((codigo) => !codigo.usadoEm && !codigo.revogadoEm && codigo.expiraEm > agora && ["SENT", "DEV"].includes(codigo.statusEnvio))
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())[0] ?? null;
  }

  async incrementarTentativasOtp(id: string): Promise<void> {
    const codigo = this.codigos.get(id);
    if (codigo) this.codigos.set(id, { ...codigo, tentativas: codigo.tentativas + 1 });
  }

  async consumirCodigoOtp(id: string, agora: Date): Promise<void> {
    const codigo = this.codigos.get(id);
    if (codigo) this.codigos.set(id, { ...codigo, usadoEm: agora });
  }

  async criarSessao(contaId: string, tokenHash: string, expiraEm: Date, metadados: MetadadosAcessoContaBizy): Promise<SessaoContaBizy> {
    const sessao: SessaoContaBizy & { tokenHash: string } = {
      id: randomUUID(), contaId, tokenHash, dispositivoId: metadados.dispositivoHash ? randomUUID() : null,
      userAgent: metadados.userAgent ?? null, expiraEm, ultimoUsoEm: null, revogadaEm: null, criadaEm: new Date()
    };
    this.sessoes.set(tokenHash, sessao);
    return sessao;
  }

  async buscarSessaoPorTokenHash(tokenHash: string, agora: Date) {
    const sessao = this.sessoes.get(tokenHash);
    const conta = sessao ? this.contas.get(sessao.contaId) : null;
    return sessao && conta && !sessao.revogadaEm && sessao.expiraEm > agora && conta.status === "ATIVA" ? { sessao, conta } : null;
  }

  async tocarSessao(id: string, agora: Date): Promise<void> {
    for (const [hash, sessao] of this.sessoes) if (sessao.id === id) this.sessoes.set(hash, { ...sessao, ultimoUsoEm: agora });
  }

  async listarSessoes(contaId: string, agora: Date) {
    return [...this.sessoes.values()].filter((sessao) => sessao.contaId === contaId && !sessao.revogadaEm && sessao.expiraEm > agora);
  }

  async revogarSessao(id: string, contaId: string, _motivo: string, agora: Date): Promise<boolean> {
    for (const [hash, sessao] of this.sessoes) {
      if (sessao.id === id && sessao.contaId === contaId && !sessao.revogadaEm) {
        this.sessoes.set(hash, { ...sessao, revogadaEm: agora });
        return true;
      }
    }
    return false;
  }

  async revogarSessaoPorTokenHash(tokenHash: string, _motivo: string, agora: Date): Promise<void> {
    const sessao = this.sessoes.get(tokenHash);
    if (sessao && !sessao.revogadaEm) this.sessoes.set(tokenHash, { ...sessao, revogadaEm: agora });
  }

  async criarAcessoCompra(compraId: string, tokenHash: string, expiraEm: Date): Promise<void> {
    this.acessos.set(tokenHash, { compraId, tokenHash, expiraEm, revogadoEm: null, ultimoAcessoEm: null });
  }

  async validarAcessoCompra(compraId: string, tokenHash: string, agora: Date): Promise<boolean> {
    const acesso = this.acessos.get(tokenHash);
    if (!acesso || acesso.compraId !== compraId || acesso.revogadoEm || acesso.expiraEm <= agora) return false;
    this.acessos.set(tokenHash, { ...acesso, ultimoAcessoEm: agora });
    return true;
  }

  async revogarAcessosCompra(compraId: string, _motivo: string, agora: Date): Promise<void> {
    for (const [hash, acesso] of this.acessos) if (acesso.compraId === compraId && !acesso.revogadoEm) this.acessos.set(hash, { ...acesso, revogadoEm: agora });
  }

  private criarConta(dados: Partial<ContaBizy>): ContaBizy {
    const agora = new Date();
    const conta: ContaBizy = {
      id: randomUUID(), nome: null, telefoneCanonico: null, emailCanonico: null,
      telefoneVerificadoEm: null, emailVerificadoEm: null, status: "ATIVA",
      usuarioSistemaId: null, clienteGlobalId: null, criadoEm: agora, atualizadoEm: agora,
      ...dados
    };
    this.contas.set(conta.id, conta);
    return conta;
  }
}
