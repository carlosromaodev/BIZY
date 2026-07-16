import type { PrismaClient } from "@prisma/client";
import type { UsuarioSistema } from "../../../../dominio/tipos.js";
import type { RepositorioContaBizy } from "../../dominio/contratos.js";
import type { ContaBizy, PerfilComprador, SessaoContaBizy, TipoContextoContaBizy } from "../../dominio/tipos.js";

export class RepositorioContaBizyPrisma implements RepositorioContaBizy {
  constructor(private readonly prisma: PrismaClient) {}

  buscarContaPorId(id: string) {
    return this.prisma.contaBizy.findUnique({ where: { id } });
  }

  buscarContaPorUsuarioSistema(usuarioSistemaId: string) {
    return this.prisma.contaBizy.findUnique({ where: { usuarioSistemaId } });
  }

  async garantirContaCompatibilidade(usuario: UsuarioSistema): Promise<ContaBizy> {
    return this.prisma.$transaction(async (tx) => {
      const ligada = await tx.contaBizy.findUnique({ where: { usuarioSistemaId: usuario.id } });
      if (ligada) return ligada;

      const porContacto = usuario.telefone
        ? await tx.contaBizy.findUnique({ where: { telefoneCanonico: usuario.telefone } })
        : usuario.email
          ? await tx.contaBizy.findUnique({ where: { emailCanonico: usuario.email.toLowerCase() } })
          : null;

      if (porContacto) {
        if (porContacto.usuarioSistemaId && porContacto.usuarioSistemaId !== usuario.id) {
          throw new Error("Contacto ja associado a outra conta Bizy.");
        }
        return tx.contaBizy.update({
          where: { id: porContacto.id },
          data: { usuarioSistemaId: usuario.id, nome: porContacto.nome ?? usuario.nome }
        });
      }

      return tx.contaBizy.create({
        data: {
          nome: usuario.nome,
          telefoneCanonico: usuario.telefone,
          emailCanonico: usuario.email?.toLowerCase() ?? null,
          usuarioSistemaId: usuario.id
        }
      });
    });
  }

  async criarOuObterContaTelefoneVerificado(dados: {
    telefoneCanonico: string;
    nome?: string | null;
    emailCanonico?: string | null;
  }): Promise<ContaBizy> {
    const existente = await this.prisma.contaBizy.findUnique({ where: { telefoneCanonico: dados.telefoneCanonico } });
    const agora = new Date();
    if (existente) {
      return this.prisma.contaBizy.update({
        where: { id: existente.id },
        data: {
          telefoneVerificadoEm: existente.telefoneVerificadoEm ?? agora,
          nome: dados.nome?.trim() || existente.nome,
          emailCanonico: existente.emailCanonico ?? dados.emailCanonico?.toLowerCase() ?? undefined
        }
      });
    }
    return this.prisma.contaBizy.create({
      data: {
        telefoneCanonico: dados.telefoneCanonico,
        telefoneVerificadoEm: agora,
        nome: dados.nome?.trim() || null,
        emailCanonico: dados.emailCanonico?.toLowerCase() ?? null
      }
    });
  }

  async garantirPerfilComprador(contaId: string, dados: {
    nomeExibicao?: string | null;
    consentimentoDados?: boolean;
    consentimentoMarketing?: boolean;
    preferencias?: Record<string, unknown>;
  } = {}): Promise<PerfilComprador> {
    const perfil = await this.prisma.perfilComprador.upsert({
      where: { contaId },
      create: {
        contaId,
        nomeExibicao: dados.nomeExibicao?.trim() || null,
        consentimentoDados: dados.consentimentoDados ?? false,
        consentimentoMarketing: dados.consentimentoMarketing ?? false,
        preferenciasJson: JSON.stringify(dados.preferencias ?? {})
      },
      update: {
        nomeExibicao: dados.nomeExibicao?.trim() || undefined,
        consentimentoDados: dados.consentimentoDados,
        consentimentoMarketing: dados.consentimentoMarketing,
        preferenciasJson: dados.preferencias ? JSON.stringify(dados.preferencias) : undefined
      }
    });
    return { ...perfil, preferencias: this.lerObjeto(perfil.preferenciasJson) };
  }

  async obterPerfilComprador(contaId: string) {
    const perfil = await this.prisma.perfilComprador.findUnique({ where: { contaId } });
    return perfil ? { ...perfil, preferencias: this.lerObjeto(perfil.preferenciasJson) } : null;
  }

  async listarEnderecos(contaId: string) {
    return this.prisma.enderecoComprador.findMany({ where: { contaId }, orderBy: [{ principal: "desc" }, { criadoEm: "desc" }] });
  }

  async salvarEndereco(contaId: string, dados: {
    id?: string | null; rotulo: string; provincia?: string | null; municipio?: string | null; bairro?: string | null;
    endereco: string; referencia?: string | null; principal?: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (dados.id) {
        const existente = await tx.enderecoComprador.findFirst({ where: { id: dados.id, contaId }, select: { id: true } });
        if (!existente) return null;
      }
      if (dados.principal) await tx.enderecoComprador.updateMany({ where: { contaId, principal: true }, data: { principal: false } });
      const payload = {
        rotulo: dados.rotulo, provincia: dados.provincia ?? null, municipio: dados.municipio ?? null,
        bairro: dados.bairro ?? null, endereco: dados.endereco, referencia: dados.referencia ?? null,
        principal: dados.principal ?? false
      };
      return dados.id
        ? tx.enderecoComprador.update({ where: { id: dados.id }, data: payload })
        : tx.enderecoComprador.create({ data: { contaId, ...payload } });
    });
  }

  async removerEndereco(id: string, contaId: string) {
    return (await this.prisma.enderecoComprador.deleteMany({ where: { id, contaId } })).count === 1;
  }

  listarFavoritos(contaId: string) {
    return this.prisma.favoritoComprador.findMany({ where: { contaId }, orderBy: { criadoEm: "desc" } });
  }

  adicionarFavorito(contaId: string, slugLoja: string, codigoProduto: string) {
    return this.prisma.favoritoComprador.upsert({
      where: { contaId_slugLoja_codigoProduto: { contaId, slugLoja, codigoProduto } },
      create: { contaId, slugLoja, codigoProduto }, update: {}
    });
  }

  async removerFavorito(contaId: string, slugLoja: string, codigoProduto: string) {
    return (await this.prisma.favoritoComprador.deleteMany({ where: { contaId, slugLoja, codigoProduto } })).count === 1;
  }

  async garantirContexto(contaId: string, tipo: TipoContextoContaBizy, negocioId?: string | null): Promise<void> {
    const chave = `${tipo}:${negocioId ?? "GLOBAL"}`;
    await this.prisma.contextoContaBizy.upsert({
      where: { contaId_chave: { contaId, chave } },
      create: { contaId, tipo, negocioId: negocioId ?? null, chave },
      update: { estado: "ATIVO" }
    });
  }

  listarContextos(contaId: string) {
    return this.prisma.contextoContaBizy.findMany({
      where: { contaId, estado: "ATIVO" },
      orderBy: [{ tipo: "asc" }, { criadoEm: "asc" }]
    }) as ReturnType<RepositorioContaBizy["listarContextos"]>;
  }

  async criarConsentimento(dados: {
    contaId: string; tipo: string; versao: string; concedido: boolean; origem: string; ipHash?: string | null;
  }): Promise<void> {
    await this.prisma.consentimentoContaBizy.create({ data: { ...dados, ipHash: dados.ipHash ?? null } });
  }

  async criarCodigoOtp(dados: {
    contaId?: string | null; contactoCanonico: string; finalidade: "LOGIN" | "ASSOCIAR_COMPRA"; compraId?: string | null;
    codigoHash: string; codigoFinal: string; expiraEm: Date; statusEnvio: string; provider: string; providerMessageId?: string | null;
  }): Promise<void> {
    await this.prisma.codigoOtpContaBizy.create({
      data: { ...dados, contactoTipo: "TELEFONE", contaId: dados.contaId ?? null, compraId: dados.compraId ?? null, providerMessageId: dados.providerMessageId ?? null }
    });
  }

  async contarCodigosOtpDesde(contactoCanonico: string, desde: Date): Promise<number> {
    return this.prisma.codigoOtpContaBizy.count({ where: { contactoCanonico, criadoEm: { gte: desde } } });
  }

  async revogarCodigosOtpAbertos(contactoCanonico: string, finalidade: "LOGIN" | "ASSOCIAR_COMPRA", agora: Date): Promise<void> {
    await this.prisma.codigoOtpContaBizy.updateMany({
      where: { contactoCanonico, finalidade, usadoEm: null, revogadoEm: null, expiraEm: { gt: agora } },
      data: { revogadoEm: agora }
    });
  }

  async buscarCodigoOtpValido(contactoCanonico: string, finalidade: "LOGIN" | "ASSOCIAR_COMPRA", compraId: string | null, agora: Date) {
    const codigo = await this.prisma.codigoOtpContaBizy.findFirst({
      where: { contactoCanonico, finalidade, compraId, usadoEm: null, revogadoEm: null, expiraEm: { gt: agora }, statusEnvio: { in: ["SENT", "DEV"] } },
      orderBy: { criadoEm: "desc" }
    });
    return codigo ? { ...codigo, finalidade: codigo.finalidade as "LOGIN" | "ASSOCIAR_COMPRA" } : null;
  }

  async incrementarTentativasOtp(id: string): Promise<void> {
    await this.prisma.codigoOtpContaBizy.update({ where: { id }, data: { tentativas: { increment: 1 } } });
  }

  async consumirCodigoOtp(id: string, agora: Date): Promise<void> {
    await this.prisma.codigoOtpContaBizy.update({ where: { id }, data: { usadoEm: agora } });
  }

  async criarSessao(contaId: string, tokenHash: string, expiraEm: Date, metadados: {
    dispositivoHash?: string | null; nomeDispositivo?: string | null; ipHash?: string | null; userAgent?: string | null;
  }): Promise<SessaoContaBizy> {
    let dispositivoId: string | null = null;
    if (metadados.dispositivoHash) {
      const dispositivo = await this.prisma.dispositivoContaBizy.upsert({
        where: { contaId_identificadorHash: { contaId, identificadorHash: metadados.dispositivoHash } },
        create: {
          contaId,
          identificadorHash: metadados.dispositivoHash,
          nome: metadados.nomeDispositivo ?? null,
          userAgent: metadados.userAgent ?? null,
          ultimoIpHash: metadados.ipHash ?? null,
          ultimoUsoEm: new Date()
        },
        update: {
          nome: metadados.nomeDispositivo ?? undefined,
          userAgent: metadados.userAgent ?? undefined,
          ultimoIpHash: metadados.ipHash ?? undefined,
          ultimoUsoEm: new Date(),
          revogadoEm: null
        }
      });
      dispositivoId = dispositivo.id;
    }
    return this.prisma.sessaoContaBizy.create({
      data: { contaId, tokenHash, expiraEm, dispositivoId, ipHash: metadados.ipHash ?? null, userAgent: metadados.userAgent ?? null }
    });
  }

  async buscarSessaoPorTokenHash(tokenHash: string, agora: Date) {
    const sessao = await this.prisma.sessaoContaBizy.findFirst({
      where: { tokenHash, revogadaEm: null, expiraEm: { gt: agora }, conta: { status: "ATIVA" } },
      include: { conta: true }
    });
    if (!sessao) return null;
    const { conta, ...dadosSessao } = sessao;
    return { sessao: dadosSessao, conta };
  }

  async tocarSessao(id: string, agora: Date): Promise<void> {
    await this.prisma.sessaoContaBizy.update({ where: { id }, data: { ultimoUsoEm: agora } });
  }

  listarSessoes(contaId: string, agora: Date) {
    return this.prisma.sessaoContaBizy.findMany({
      where: { contaId, revogadaEm: null, expiraEm: { gt: agora } }, orderBy: { criadaEm: "desc" }
    });
  }

  async revogarSessao(id: string, contaId: string, motivo: string, agora: Date): Promise<boolean> {
    const resultado = await this.prisma.sessaoContaBizy.updateMany({ where: { id, contaId, revogadaEm: null }, data: { revogadaEm: agora, motivoRevogacao: motivo } });
    return resultado.count === 1;
  }

  async revogarSessaoPorTokenHash(tokenHash: string, motivo: string, agora: Date): Promise<void> {
    await this.prisma.sessaoContaBizy.updateMany({ where: { tokenHash, revogadaEm: null }, data: { revogadaEm: agora, motivoRevogacao: motivo } });
  }

  async criarAcessoCompra(compraId: string, tokenHash: string, expiraEm: Date): Promise<void> {
    await this.prisma.acessoCompraConvidado.create({ data: { compraId, tokenHash, expiraEm } });
  }

  async validarAcessoCompra(compraId: string, tokenHash: string, agora: Date): Promise<boolean> {
    const acesso = await this.prisma.acessoCompraConvidado.findFirst({
      where: { compraId, tokenHash, revogadoEm: null, expiraEm: { gt: agora } }, select: { id: true }
    });
    if (!acesso) return false;
    await this.prisma.acessoCompraConvidado.update({ where: { id: acesso.id }, data: { ultimoAcessoEm: agora } });
    return true;
  }

  async revogarAcessosCompra(compraId: string, motivo: string, agora: Date): Promise<void> {
    await this.prisma.acessoCompraConvidado.updateMany({ where: { compraId, revogadoEm: null }, data: { revogadoEm: agora, motivoRevogacao: motivo } });
  }

  private lerObjeto(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor);
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}
