import type { RepositorioAutenticacao } from "../dominio/repositorios/contratos.js";
import type { DadosNegocioBizy, NovaPeca } from "../dominio/tipos.js";
import type { GestaoPecasUseCase } from "./GestaoPecasUseCase.js";

export type PendenciaOnboardingBizy = "CADASTRAR_NEGOCIO" | "CADASTRAR_PRODUTO" | "CONECTAR_WHATSAPP";

export class OnboardingBizyUseCase {
  constructor(
    private readonly repositorio: RepositorioAutenticacao,
    private readonly gestaoPecas: GestaoPecasUseCase
  ) {}

  async obterEstado(usuarioId: string) {
    const usuario = await this.exigirUsuario(usuarioId);
    const negocio = await this.repositorio.buscarNegocioPrincipalPorUsuario(usuarioId);
    const pendencias: PendenciaOnboardingBizy[] = [];

    if (!negocio) pendencias.push("CADASTRAR_NEGOCIO");

    return {
      usuario,
      negocio,
      pendencias,
      completo: pendencias.length === 0
    };
  }

  async salvarNegocio(usuarioId: string, dados: DadosNegocioBizy) {
    await this.exigirUsuario(usuarioId);
    const negocio = await this.repositorio.salvarNegocioUsuario(usuarioId, this.normalizarNegocio(dados));
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
}
