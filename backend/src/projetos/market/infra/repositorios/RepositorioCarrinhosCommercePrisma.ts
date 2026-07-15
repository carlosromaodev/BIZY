import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  CarrinhoCommerce,
  ItemCarrinhoCommerce,
  ItemCarrinhoResolvido,
  RepositorioCarrinhosCommerce
} from "../../dominio/carrinhoCommerce.js";

const incluirItens = { itens: { orderBy: { criadoEm: "asc" as const } } };

export class RepositorioCarrinhosCommercePrisma implements RepositorioCarrinhosCommerce {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: { tokenHash: string | null; contaBizyId: string | null; expiraEm: Date }) {
    return this.mapear(await this.prisma.carrinhoCommerce.create({ data: dados, include: incluirItens }));
  }

  async buscarPorTokenHash(tokenHash: string, agora: Date) {
    const item = await this.prisma.carrinhoCommerce.findFirst({
      where: { tokenHash, estado: "ABERTO", expiraEm: { gt: agora } }, include: incluirItens
    });
    return item ? this.mapear(item) : null;
  }

  async buscarAbertoPorConta(contaBizyId: string, agora: Date) {
    const item = await this.prisma.carrinhoCommerce.findFirst({
      where: { contaBizyId, estado: "ABERTO", expiraEm: { gt: agora } },
      orderBy: { atualizadoEm: "desc" }, include: incluirItens
    });
    return item ? this.mapear(item) : null;
  }

  async buscarPorIdEConta(id: string, contaBizyId: string, agora: Date) {
    const item = await this.prisma.carrinhoCommerce.findFirst({
      where: { id, contaBizyId, estado: "ABERTO", expiraEm: { gt: agora } }, include: incluirItens
    });
    return item ? this.mapear(item) : null;
  }

  async substituirItens(id: string, itens: ItemCarrinhoResolvido[], carrinhoExpiraEm: Date, reservaExpiraEm: Date) {
    await this.executarSerializavel(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT 1 FROM "CarrinhoCommerce" WHERE "id" = ${id} FOR UPDATE`);
      const carrinho = await tx.carrinhoCommerce.findUnique({ where: { id } });
      if (!carrinho || carrinho.estado !== "ABERTO" || carrinho.expiraEm <= new Date()) throw new Error("Carrinho não encontrado.");

      const agora = new Date();
      await tx.reservaStockCheckout.updateMany({
        where: { sessaoId: id, estado: "ATIVA" },
        data: { estado: "LIBERADA", liberadaEm: agora }
      });
      await tx.itemCarrinhoCommerce.deleteMany({ where: { carrinhoId: id } });

      const pecaIds = [...new Set(itens.map((item) => item.pecaId))].sort();
      const varianteIds = [...new Set(itens.map((item) => item.variantePecaId).filter((valor): valor is string => Boolean(valor)))].sort();
      if (pecaIds.length) await tx.$executeRaw(Prisma.sql`SELECT "id" FROM "Peca" WHERE "id" IN (${Prisma.join(pecaIds)}) ORDER BY "id" FOR UPDATE`);
      if (varianteIds.length) await tx.$executeRaw(Prisma.sql`SELECT "id" FROM "VariantePeca" WHERE "id" IN (${Prisma.join(varianteIds)}) ORDER BY "id" FOR UPDATE`);

      for (const item of itens) {
        const peca = await tx.peca.findFirst({ where: { id: item.pecaId, negocioId: item.negocioId } });
        if (!peca || peca.arquivadaEm || peca.estado === "ESGOTADA") throw new Error(`Produto ${item.codigoPeca} indisponível.`);
        const variante = item.variantePecaId
          ? await tx.variantePeca.findFirst({ where: { id: item.variantePecaId, pecaId: item.pecaId, estado: "ATIVA" } })
          : null;
        if (item.variantePecaId && !variante) throw new Error(`Variante de ${item.codigoPeca} indisponível.`);
        const stock = variante?.quantidade ?? peca.quantidade;
        const reservas = await tx.reservaStockCheckout.aggregate({
          where: {
            estado: "ATIVA", expiraEm: { gt: agora }, sessaoId: { not: id },
            ...(variante ? { variantePecaId: variante.id } : { pecaId: peca.id, variantePecaId: null })
          },
          _sum: { quantidade: true }
        });
        if (item.quantidade > stock - (reservas._sum.quantidade ?? 0)) throw new Error(`Stock insuficiente para ${item.nomeProduto}.`);

        const criado = await tx.itemCarrinhoCommerce.create({ data: {
          carrinhoId: id, negocioId: item.negocioId, slugLoja: item.slugLoja,
          pecaId: item.pecaId, variantePecaId: item.variantePecaId, codigoPeca: item.codigoPeca,
          nomeProduto: item.nomeProduto, nomeFornecedor: item.nomeFornecedor, quantidade: item.quantidade,
          precoUnitarioEmKwanza: variante?.precoEmKwanza ?? peca.precoEmKwanza,
          fotoUrl: item.fotoUrl, urlProduto: item.urlProduto, urlLoja: item.urlLoja,
          selecaoVarianteJson: JSON.stringify(item.selecaoVariante), origem: item.origem,
          atribuicaoJson: JSON.stringify(item.atribuicao), chaveItem: item.chaveItem
        } });
        await tx.reservaStockCheckout.create({ data: {
          negocioId: item.negocioId, pecaId: item.pecaId, codigoPeca: item.codigoPeca,
          variantePecaId: item.variantePecaId, combinacaoVariante: item.variantePecaId ? JSON.stringify(item.selecaoVariante) : null,
          quantidade: item.quantidade, sessaoId: id, expiraEm: reservaExpiraEm, carrinhoItemId: criado.id
        } });
      }
      await tx.carrinhoCommerce.update({ where: { id }, data: { expiraEm: carrinhoExpiraEm } });
    });
    return this.exigir(id);
  }

  async associarConta(id: string, contaBizyId: string) {
    const existe = await this.prisma.carrinhoCommerce.findFirst({ where: { id, estado: "ABERTO" } });
    if (!existe) return null;
    return this.mapear(await this.prisma.carrinhoCommerce.update({ where: { id }, data: { contaBizyId, tokenHash: null }, include: incluirItens }));
  }

  async abandonar(id: string) {
    await this.prisma.$transaction([
      this.prisma.reservaStockCheckout.updateMany({ where: { sessaoId: id, estado: "ATIVA" }, data: { estado: "LIBERADA", liberadaEm: new Date() } }),
      this.prisma.carrinhoCommerce.updateMany({ where: { id, estado: "ABERTO" }, data: { estado: "ABANDONADO" } })
    ]);
  }

  async converter(id: string) {
    await this.executarSerializavel(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT 1 FROM "CarrinhoCommerce" WHERE "id" = ${id} FOR UPDATE`);
      const carrinho = await tx.carrinhoCommerce.findUnique({ where: { id }, include: { itens: true } });
      if (!carrinho) throw new Error("Carrinho não encontrado.");
      if (carrinho.estado === "CONVERTIDO") return;
      const agora = new Date();
      if (carrinho.estado !== "ABERTO" || carrinho.expiraEm <= agora) throw new Error("Reserva do carrinho expirada.");
      const pecaIds = [...new Set(carrinho.itens.map((item) => item.pecaId))].sort();
      const varianteIds = [...new Set(carrinho.itens.map((item) => item.variantePecaId).filter((valor): valor is string => Boolean(valor)))].sort();
      if (pecaIds.length) await tx.$executeRaw(Prisma.sql`SELECT "id" FROM "Peca" WHERE "id" IN (${Prisma.join(pecaIds)}) ORDER BY "id" FOR UPDATE`);
      if (varianteIds.length) await tx.$executeRaw(Prisma.sql`SELECT "id" FROM "VariantePeca" WHERE "id" IN (${Prisma.join(varianteIds)}) ORDER BY "id" FOR UPDATE`);
      for (const item of carrinho.itens) {
        const reserva = await tx.reservaStockCheckout.findFirst({ where: { carrinhoItemId: item.id, estado: "ATIVA", expiraEm: { gt: agora } } });
        if (!reserva) throw new Error("Reserva do carrinho inválida.");
        const anterior = await tx.peca.findUniqueOrThrow({ where: { id: item.pecaId } });
        if (item.variantePecaId) {
          const atualizada = await tx.variantePeca.updateMany({ where: { id: item.variantePecaId, quantidade: { gte: item.quantidade } }, data: { quantidade: { decrement: item.quantidade } } });
          if (atualizada.count !== 1) throw new Error("Stock da variante alterado durante o checkout.");
        }
        const produto = await tx.peca.updateMany({ where: { id: item.pecaId, quantidade: { gte: item.quantidade } }, data: { quantidade: { decrement: item.quantidade } } });
        if (produto.count !== 1) throw new Error("Stock do produto alterado durante o checkout.");
        const actual = await tx.peca.findUniqueOrThrow({ where: { id: item.pecaId } });
        if (actual.quantidade === 0 && actual.estado !== "ESGOTADA") {
          await tx.peca.update({ where: { id: item.pecaId }, data: { estado: "ESGOTADA" } });
        }
        await tx.movimentoStock.create({ data: {
          negocioId: item.negocioId, pecaId: item.pecaId, codigoPeca: item.codigoPeca,
          tipo: "SAIDA", quantidade: item.quantidade, quantidadeAnterior: anterior.quantidade,
          quantidadeNova: actual.quantidade, motivo: "Conversão de carrinho Commerce", origem: "checkout-bizy"
        } });
        await tx.reservaStockCheckout.update({ where: { id: reserva.id }, data: { estado: "CONFIRMADA" } });
      }
      await tx.carrinhoCommerce.update({ where: { id }, data: { estado: "CONVERTIDO", convertidoEm: agora } });
    });
    return this.exigir(id);
  }

  private async exigir(id: string) {
    const item = await this.prisma.carrinhoCommerce.findUnique({ where: { id }, include: incluirItens });
    if (!item) throw new Error("Carrinho não encontrado.");
    return this.mapear(item);
  }

  private async executarSerializavel<T>(operacao: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        return await this.prisma.$transaction(operacao, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        });
      } catch (erro) {
        if (!this.ehConflitoSerializacao(erro) || tentativa === 3) throw erro;
        await new Promise((resolve) => setTimeout(resolve, tentativa * 15));
      }
    }
    throw new Error("Não foi possível serializar a operação do carrinho.");
  }

  private ehConflitoSerializacao(erro: unknown) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === "P2034") return true;
      if (erro.code === "P2010" && String(erro.meta?.code) === "40001") return true;
    }
    return erro instanceof Error && erro.message.includes("40001");
  }

  private mapear(item: Prisma.CarrinhoCommerceGetPayload<{ include: typeof incluirItens }>): CarrinhoCommerce {
    return {
      id: item.id, contaBizyId: item.contaBizyId, estado: item.estado as CarrinhoCommerce["estado"],
      expiraEm: item.expiraEm, convertidoEm: item.convertidoEm, criadoEm: item.criadoEm, atualizadoEm: item.atualizadoEm,
      itens: item.itens.map((linha): ItemCarrinhoCommerce => ({
        id: linha.id, carrinhoId: linha.carrinhoId, negocioId: linha.negocioId, slugLoja: linha.slugLoja,
        pecaId: linha.pecaId, variantePecaId: linha.variantePecaId, codigoPeca: linha.codigoPeca,
        nomeProduto: linha.nomeProduto, nomeFornecedor: linha.nomeFornecedor, quantidade: linha.quantidade,
        precoUnitarioEmKwanza: linha.precoUnitarioEmKwanza, fotoUrl: linha.fotoUrl,
        urlProduto: linha.urlProduto, urlLoja: linha.urlLoja,
        selecaoVariante: this.json(linha.selecaoVarianteJson) as Record<string, string>, origem: linha.origem,
        atribuicao: this.json(linha.atribuicaoJson), chaveItem: linha.chaveItem,
        criadoEm: linha.criadoEm, atualizadoEm: linha.atualizadoEm
      }))
    };
  }

  private json(valor: string): Record<string, unknown> {
    try { return JSON.parse(valor) as Record<string, unknown>; } catch { return {}; }
  }
}
