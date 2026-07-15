import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ItemCarrinhoResolvido } from "../projetos/market/dominio/carrinhoCommerce.js";
import { RepositorioCarrinhosCommercePrisma } from "../projetos/market/infra/repositorios/RepositorioCarrinhosCommercePrisma.js";

const habilitado = Boolean(process.env.DATABASE_URL);
const suite = habilitado ? describe : describe.skip;

suite("Carrinho Commerce no PostgreSQL", () => {
  const prisma = new PrismaClient();
  const repositorio = new RepositorioCarrinhosCommercePrisma(prisma);
  const sufixo = randomUUID().slice(0, 8);
  let negocioId = "";
  let pecaId = "";
  const carrinhos: string[] = [];

  beforeAll(async () => {
    const negocio = await prisma.negocio.create({ data: {
      nomeComercial: `Loja concorrencia ${sufixo}`, segmento: "Teste", tipo: "LOJA",
      slugPublico: `loja-concorrencia-${sufixo}`, lojaPublicadaEm: new Date()
    } });
    negocioId = negocio.id;
    const peca = await prisma.peca.create({ data: {
      negocioId, codigo: `CART-PG-${sufixo}`, nome: "Produto concorrente", descricao: "Teste transaccional",
      precoEmKwanza: 5_000, quantidade: 1, fotosJson: "[]", variantesJson: "{}", vitrineJson: "{}"
    } });
    pecaId = peca.id;
  });

  afterAll(async () => {
    if (carrinhos.length) {
      await prisma.reservaStockCheckout.deleteMany({ where: { sessaoId: { in: carrinhos } } });
      await prisma.carrinhoCommerce.deleteMany({ where: { id: { in: carrinhos } } });
    }
    if (pecaId) await prisma.movimentoStock.deleteMany({ where: { pecaId } });
    if (pecaId) await prisma.peca.deleteMany({ where: { id: pecaId } });
    if (negocioId) await prisma.negocio.deleteMany({ where: { id: negocioId } });
    await prisma.$disconnect();
  });

  it("serializa reservas concorrentes sem ultrapassar o stock", async () => {
    const expiraEm = new Date(Date.now() + 30 * 60_000);
    const [a, b] = await Promise.all([
      repositorio.criar({ tokenHash: `hash-a-${sufixo}`, contaBizyId: null, expiraEm }),
      repositorio.criar({ tokenHash: `hash-b-${sufixo}`, contaBizyId: null, expiraEm })
    ]);
    carrinhos.push(a.id, b.id);
    const item: ItemCarrinhoResolvido = {
      negocioId, slugLoja: `loja-concorrencia-${sufixo}`, pecaId, variantePecaId: null,
      codigoPeca: `CART-PG-${sufixo}`, nomeProduto: "Produto concorrente", nomeFornecedor: "Loja concorrencia",
      quantidade: 1, precoUnitarioEmKwanza: 5_000, fotoUrl: null, urlProduto: null, urlLoja: null,
      selecaoVariante: {}, origem: "teste", atribuicao: {}, chaveItem: `${pecaId}:padrao`, stockDisponivel: 1
    };

    const resultados = await Promise.allSettled([
      repositorio.substituirItens(a.id, [item], expiraEm, expiraEm),
      repositorio.substituirItens(b.id, [item], expiraEm, expiraEm)
    ]);
    expect(resultados.filter((resultado) => resultado.status === "fulfilled")).toHaveLength(1);
    expect(resultados.filter((resultado) => resultado.status === "rejected")).toHaveLength(1);

    const reservado = await prisma.reservaStockCheckout.aggregate({
      where: { pecaId, estado: "ATIVA", expiraEm: { gt: new Date() } }, _sum: { quantidade: true }
    });
    expect(reservado._sum.quantidade).toBe(1);

    const carrinhoVencedor = resultados[0].status === "fulfilled" ? a : b;
    const repeticoes = await Promise.allSettled([
      repositorio.substituirItens(carrinhoVencedor.id, [item], expiraEm, expiraEm),
      repositorio.substituirItens(carrinhoVencedor.id, [item], expiraEm, expiraEm)
    ]);
    expect(repeticoes.every((resultado) => resultado.status === "fulfilled")).toBe(true);
    expect(await prisma.reservaStockCheckout.count({
      where: { sessaoId: carrinhoVencedor.id, estado: "ATIVA", expiraEm: { gt: new Date() } }
    })).toBe(1);
  }, 20_000);
});
