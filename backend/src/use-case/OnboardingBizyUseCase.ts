import type { RepositorioAutenticacao } from "../dominio/repositorios/contratos.js";
import type { DadosNegocioBizy, NovaPeca } from "../dominio/tipos.js";
import type { ContaBizyUseCase } from "../projetos/commerce/aplicacao/ContaBizyUseCase.js";
import type { TipoContextoContaBizy } from "../projetos/commerce/dominio/tipos.js";
import type { GestaoPecasUseCase } from "./GestaoPecasUseCase.js";

export type PendenciaOnboardingBizy =
  | "CONFIGURAR_PERFIL"
  | "CADASTRAR_NEGOCIO"
  | "CADASTRAR_PRODUTO"
  | "CONECTAR_WHATSAPP";

export class OnboardingBizyUseCase {
  constructor(
    private readonly repositorio: RepositorioAutenticacao,
    private readonly gestaoPecas: GestaoPecasUseCase,
    private readonly contaBizy: ContaBizyUseCase
  ) {}

  async obterEstado(usuarioId: string) {
    const usuario = await this.exigirUsuario(usuarioId);
    const negocio = await this.repositorio.buscarNegocioPrincipalPorUsuario(usuarioId);
    const conta = await this.contaBizy.garantirContaUsuario(usuario);
    if (negocio && ["DONO", "ADMIN"].includes(negocio.usuarioPapel ?? "")) {
      await this.contaBizy.configurarContextosUsuario(usuario, ["SELLER", "MEMBRO_NEGOCIO"]);
    }
    const contextos = await this.contaBizy.obterContextos(conta.id);
    const tiposContexto = Array.from(new Set(
      contextos
        .filter((contexto) => contexto.estado === "ATIVO")
        .map((contexto) => contexto.tipo)
    ));
    const perfilConfigurado = Boolean(usuario.perfilCompletoEm || negocio || tiposContexto.length > 0);
    const requerNegocio =
      tiposContexto.includes("SELLER") ||
      tiposContexto.includes("PRODUTOR_LEARNING");
    const pendencias: PendenciaOnboardingBizy[] = [];

    if (!perfilConfigurado) pendencias.push("CONFIGURAR_PERFIL");
    if (perfilConfigurado && requerNegocio && !negocio) pendencias.push("CADASTRAR_NEGOCIO");

    return {
      usuario,
      conta: {
        id: conta.id,
        nome: conta.nome,
        telefone: conta.telefoneCanonico,
        email: conta.emailCanonico,
        status: conta.status
      },
      negocio,
      contextos,
      tiposContexto,
      perfilConfigurado,
      perfilAcademico: usuario.origemCadastro === "ESTUDANTIL",
      servicos: this.resolverServicos(tiposContexto, usuario.origemCadastro === "ESTUDANTIL"),
      destinoRecomendado: this.resolverDestino(tiposContexto, usuario.origemCadastro === "ESTUDANTIL"),
      pendencias,
      completo: pendencias.length === 0
    };
  }

  async configurarPerfil(usuarioId: string, contextos: TipoContextoContaBizy[]) {
    const usuario = await this.exigirUsuario(usuarioId);
    const configuracao = await this.contaBizy.configurarContextosUsuario(usuario, contextos);
    const usuarioAtualizado = await this.repositorio.marcarUsuarioOnboardingCompleto(usuarioId, new Date());

    return {
      usuario: usuarioAtualizado,
      conta: {
        id: configuracao.conta.id,
        nome: configuracao.conta.nome,
        telefone: configuracao.conta.telefoneCanonico,
        email: configuracao.conta.emailCanonico,
        status: configuracao.conta.status
      },
      contextos: configuracao.contextos,
      tiposContexto: Array.from(new Set(configuracao.contextos.map((contexto) => contexto.tipo))),
      destinoRecomendado: this.resolverDestino(contextos, usuario.origemCadastro === "ESTUDANTIL")
    };
  }

  async salvarNegocio(usuarioId: string, dados: DadosNegocioBizy) {
    const usuario = await this.exigirUsuario(usuarioId);
    const negocio = await this.repositorio.salvarNegocioUsuario(usuarioId, this.normalizarNegocio(dados));
    await this.contaBizy.configurarContextosUsuario(usuario, ["SELLER", "MEMBRO_NEGOCIO"]);
    await this.repositorio.marcarUsuarioOnboardingCompleto(usuarioId, new Date());
    return negocio;
  }

  async criarProdutoInicial(usuarioId: string, dados: NovaPeca & { categoria?: string }) {
    await this.exigirUsuario(usuarioId);
    const negocio = await this.repositorio.buscarNegocioPrincipalPorUsuario(usuarioId);
    if (!negocio) {
      throw new Error("Cadastre o negócio antes de criar o primeiro produto.");
    }

    return this.gestaoPecas.cadastrarPeca({
      codigo: dados.codigo,
      negocioId: negocio.id,
      nome: dados.nome,
      descricao: dados.descricao,
      precoEmKwanza: dados.precoEmKwanza,
      quantidade: dados.quantidade,
      fotos: dados.fotos,
      estado: dados.estado
    });
  }

  private async exigirUsuario(usuarioId: string) {
    const usuario = await this.repositorio.buscarUsuarioPorId(usuarioId);
    if (!usuario) throw new Error("Usuário autenticado não encontrado.");
    return usuario;
  }

  private normalizarNegocio(dados: DadosNegocioBizy): DadosNegocioBizy {
    const entrega = this.objeto(dados.entrega);
    const areasEntrega = this.listaUnica(dados.areasEntrega ?? []);
    const canaisVenda = this.listaUnica(dados.canaisVenda ?? []);
    const metodosPagamento = this.listaUnica(dados.metodosPagamento ?? []);

    return {
      ...dados,
      nomeComercial: dados.nomeComercial.trim(),
      segmento: dados.segmento.trim(),
      tipo: dados.tipo || "LOJA",
      moeda: (dados.moeda ?? "AOA").trim().toUpperCase(),
      fusoHorario: dados.fusoHorario?.trim() || "Africa/Luanda",
      canaisVenda,
      metodosPagamento,
      entrega: {
        ...entrega,
        areasEntrega,
        politicaTrocaDevolucao: this.objeto(dados.politicaTrocaDevolucao),
        onboardingOperacional: {
          modeloVenda: dados.modeloVenda?.trim() || null,
          tipoProdutoVendido: dados.tipoProdutoVendido?.trim() || null,
          regrasComissao: this.objeto(dados.regrasComissao),
          contasSociais: this.objeto(dados.contasSociais),
          canaisVenda,
          metodosPagamento
        }
      },
      minutosReservaPadrao: dados.minutosReservaPadrao ?? 10
    };
  }

  private listaUnica(valores: string[]): string[] {
    return [...new Set(valores.map((valor) => valor.trim().toLowerCase()).filter(Boolean))];
  }

  private objeto(valor?: Record<string, unknown> | null): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
  }

  private resolverServicos(tipos: TipoContextoContaBizy[], perfilAcademico: boolean) {
    const contextos = new Set(tipos);
    return {
      team:
        contextos.has("SELLER") ||
        contextos.has("MEMBRO_NEGOCIO") ||
        contextos.has("PRODUTOR_LEARNING"),
      market: contextos.has("COMPRADOR") || contextos.has("SELLER"),
      creator: contextos.has("CRIADOR") || contextos.has("AFILIADO"),
      learning: perfilAcademico || contextos.has("PRODUTOR_LEARNING")
    };
  }

  private resolverDestino(tipos: TipoContextoContaBizy[], perfilAcademico: boolean) {
    const contextos = new Set(tipos);
    if (contextos.has("PRODUTOR_LEARNING")) return "/app/learning/produtor";
    if (contextos.has("SELLER") || contextos.has("MEMBRO_NEGOCIO")) return "/app";
    if (contextos.has("CRIADOR") || contextos.has("AFILIADO")) return "/creator";
    if (perfilAcademico) return "/learning";
    return "/conta";
  }
}
