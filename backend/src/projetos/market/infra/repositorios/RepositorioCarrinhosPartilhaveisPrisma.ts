import type { PrismaClient } from "@prisma/client";
import type {
  DadosCriacaoCarrinhoPartilhavel,
  DadosDestaqueProdutoLive,
  RepositorioCarrinhosPartilhaveis,
  ValidacaoDestaqueProdutoLive
} from "../../dominio/carrinhosPartilhaveis.js";

export class RepositorioCarrinhosPartilhaveisPrisma implements RepositorioCarrinhosPartilhaveis {
  constructor(private readonly prisma: PrismaClient) {}

  async parceiroAtivoDaConta(parceiroId: string, contaBizyId: string): Promise<boolean> {
    return Boolean(await this.prisma.parceiroComercial.findFirst({
      where: { id: parceiroId, contaBizyId, estado: "ATIVO" },
      select: { id: true }
    }));
  }

  criar(dados: DadosCriacaoCarrinhoPartilhavel) {
    return this.prisma.carrinhoPartilhavel.create({ data: dados });
  }

  listarPorConta(contaBizyId: string) {
    return this.prisma.carrinhoPartilhavel.findMany({
      where: { contaBizyId },
      orderBy: { criadoEm: "desc" }
    });
  }

  buscarPublicoPorCodigo(codigo: string, agora: Date) {
    return this.prisma.carrinhoPartilhavel.findFirst({
      where: {
        codigo: codigo.toUpperCase(),
        estado: "ATIVO",
        OR: [{ expiraEm: null }, { expiraEm: { gt: agora } }]
      }
    });
  }

  async incrementarVisualizacoes(id: string): Promise<void> {
    await this.prisma.carrinhoPartilhavel.update({
      where: { id },
      data: { visualizacoes: { increment: 1 } }
    });
  }

  async incrementarImportacoes(id: string): Promise<void> {
    await this.prisma.carrinhoPartilhavel.update({
      where: { id },
      data: { importacoes: { increment: 1 } }
    });
  }

  async validarDestaque(
    negocioId: string,
    dados: Omit<DadosDestaqueProdutoLive, "negocioId">
  ): Promise<ValidacaoDestaqueProdutoLive> {
    const [live, peca] = await Promise.all([
      this.prisma.sessaoLive.findFirst({
        where: { id: dados.liveId, negocioId, ativa: true },
        select: { id: true }
      }),
      this.prisma.peca.findFirst({
        where: { id: dados.pecaId, negocioId, arquivadaEm: null },
        select: { id: true }
      })
    ]);
    if (!live || !peca) return "LIVE_OU_PRODUTO_NAO_ENCONTRADO";

    if (dados.variantePecaId && !await this.prisma.variantePeca.findFirst({
      where: { id: dados.variantePecaId, pecaId: peca.id, estado: "ATIVA" },
      select: { id: true }
    })) {
      return "VARIANTE_INVALIDA";
    }

    if (dados.hostParceiroId && !await this.prisma.parceiroComercial.findFirst({
      where: { id: dados.hostParceiroId, negocioId, estado: "ATIVO" },
      select: { id: true }
    })) {
      return "HOST_INVALIDO";
    }

    return "OK";
  }

  async encerrarDestaquesAtivos(liveId: string, negocioId: string, encerradoEm: Date): Promise<void> {
    await this.prisma.destaqueProdutoLiveCommerce.updateMany({
      where: { liveId, negocioId, estado: "ATIVO" },
      data: { estado: "ENCERRADO", encerradoEm }
    });
  }

  criarDestaque(dados: DadosDestaqueProdutoLive) {
    return this.prisma.destaqueProdutoLiveCommerce.create({ data: dados });
  }

  buscarDestaqueAtivo(liveId: string) {
    return this.prisma.destaqueProdutoLiveCommerce.findFirst({
      where: { liveId, estado: "ATIVO" },
      orderBy: { destacadoEm: "desc" }
    });
  }
}
