import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AtribuicaoCommerceUseCase } from "../projetos/market/aplicacao/AtribuicaoCommerceUseCase.js";
import { RepositorioAtribuicaoCommercePrisma } from "../projetos/market/infra/repositorios/RepositorioAtribuicaoCommercePrisma.js";
import { RepositorioSmartLinksCommercePrisma } from "../projetos/market/infra/repositorios/RepositorioSmartLinksCommercePrisma.js";
import {
  RepositorioAfiliadosPrisma,
  RepositorioAutenticacaoPrisma,
  RepositorioComprasUnificadasPrisma,
  RepositorioPedidosPrisma,
  RepositorioTrackingComercialPrisma
} from "../use-case/repositorios/RepositorioPrisma.js";

const suite = process.env.DATABASE_URL ? describe : describe.skip;

suite("Atribuicao Commerce no PostgreSQL", () => {
  const prisma = new PrismaClient();
  const sufixo = randomUUID().slice(0, 8);
  const codigoSufixo = sufixo.toUpperCase();
  const smartLinks = new RepositorioSmartLinksCommercePrisma(prisma);
  const compras = new RepositorioComprasUnificadasPrisma(prisma);
  const useCase = new AtribuicaoCommerceUseCase({
    atribuicao: new RepositorioAtribuicaoCommercePrisma(prisma),
    smartLinks,
    autenticacao: new RepositorioAutenticacaoPrisma(prisma),
    afiliados: new RepositorioAfiliadosPrisma(prisma),
    pedidos: new RepositorioPedidosPrisma(prisma),
    tracking: new RepositorioTrackingComercialPrisma(prisma)
  });
  let negocioId = "";
  let contaId = "";
  let clienteGlobalId = "";
  let clienteNegocioId = "";
  let pecaId = "";
  let sessaoAId = "";
  let sessaoBId = "";
  const parceiroIds: string[] = [];
  const linkIds: string[] = [];
  const pedidoIds: string[] = [];
  const compraIds: string[] = [];

  beforeAll(async () => {
    const negocio = await prisma.negocio.create({
      data: {
        nomeComercial: `Atribuicao PG ${sufixo}`,
        segmento: "Teste",
        tipo: "LOJA",
        slugPublico: `atribuicao-pg-${sufixo}`,
        lojaPublicadaEm: new Date(),
        entregaJson: JSON.stringify({
          atribuicao: {
            modeloPadrao: "CONVERSAO_ASSISTIDA",
            janelaDias: 30,
            pesoPrincipalBasisPoints: 6500
          }
        })
      }
    });
    negocioId = negocio.id;
    const conta = await prisma.contaBizy.create({ data: { nome: "Comprador PG", status: "ATIVA" } });
    contaId = conta.id;
    const clienteGlobal = await prisma.clienteGlobal.create({ data: { nomePreferido: "Comprador PG" } });
    clienteGlobalId = clienteGlobal.id;
    const clienteNegocio = await prisma.clienteNegocio.create({
      data: { negocioId, clienteGlobalId, nome: "Comprador PG", origem: "teste" }
    });
    clienteNegocioId = clienteNegocio.id;
    const peca = await prisma.peca.create({
      data: {
        negocioId,
        codigo: `ATTR-PG-${codigoSufixo}`,
        nome: "Produto atribuicao PostgreSQL",
        descricao: "Produto para persistencia da conversao.",
        precoEmKwanza: 25_000,
        custoEmKwanza: 10_000,
        quantidade: 10
      }
    });
    pecaId = peca.id;

    for (const indice of [0, 1]) {
      const parceiro = await prisma.parceiroComercial.create({
        data: {
          negocioId,
          tipo: "CRIADOR",
          codigo: `ATTR-PG-AFF-${indice}-${codigoSufixo}`,
          nomePublico: `Criador PostgreSQL ${indice}`,
          regraComissaoJson: JSON.stringify({ tipo: "PERCENTUAL", percentual: 10 })
        }
      });
      parceiroIds.push(parceiro.id);
      const link = await prisma.linkAfiliado.create({
        data: {
          negocioId,
          afiliadoId: parceiro.id,
          codigo: `ATTR-PG-LINK-${indice}-${codigoSufixo}`,
          destinoTipo: "PRODUTO",
          slugLoja: negocio.slugPublico,
          codigoProduto: peca.codigo,
          canal: indice === 0 ? "instagram" : "tiktok"
        }
      });
      linkIds.push(link.id);
    }

    const sessaoA = await prisma.sessaoCommerce.create({
      data: {
        tokenHash: `attr-token-a-${sufixo}`,
        trackingId: `attr-track-a-${sufixo}`,
        contaBizyId: contaId,
        expiraEm: new Date(Date.now() + 30 * 24 * 60 * 60_000)
      }
    });
    sessaoAId = sessaoA.id;
    const sessaoB = await prisma.sessaoCommerce.create({
      data: {
        tokenHash: `attr-token-b-${sufixo}`,
        trackingId: `attr-track-b-${sufixo}`,
        contaBizyId: contaId,
        expiraEm: new Date(Date.now() + 30 * 24 * 60 * 60_000)
      }
    });
    sessaoBId = sessaoB.id;
    await prisma.toqueAtribuicaoCommerce.createMany({
      data: [
        {
          sessaoId: sessaoAId,
          negocioId,
          linkId: linkIds[0],
          afiliadoId: parceiroIds[0],
          destinoTipo: "PRODUTO",
          codigoProduto: peca.codigo,
          canal: "instagram",
          criadoEm: new Date(Date.now() - 60_000)
        },
        {
          sessaoId: sessaoBId,
          negocioId,
          linkId: linkIds[1],
          afiliadoId: parceiroIds[1],
          destinoTipo: "PRODUTO",
          codigoProduto: peca.codigo,
          canal: "tiktok",
          criadoEm: new Date()
        }
      ]
    });
  });

  afterAll(async () => {
    if (negocioId) await prisma.eventoTrackingComercial.deleteMany({ where: { negocioId } });
    if (negocioId) await prisma.conversaoAtribuicaoCommerce.deleteMany({ where: { negocioId } });
    if (negocioId) await prisma.politicaAtribuicaoCommerce.deleteMany({ where: { negocioId } });
    if (compraIds.length) await prisma.pedidoFilho.deleteMany({ where: { compraUnificadaId: { in: compraIds } } });
    if (compraIds.length) await prisma.compraUnificada.deleteMany({ where: { id: { in: compraIds } } });
    if (pedidoIds.length) await prisma.pedido.deleteMany({ where: { id: { in: pedidoIds } } });
    if (sessaoAId || sessaoBId) await prisma.sessaoCommerce.deleteMany({ where: { id: { in: [sessaoAId, sessaoBId].filter(Boolean) } } });
    if (linkIds.length) await prisma.linkAfiliado.deleteMany({ where: { id: { in: linkIds } } });
    if (parceiroIds.length) await prisma.parceiroComercial.deleteMany({ where: { id: { in: parceiroIds } } });
    if (pecaId) await prisma.peca.deleteMany({ where: { id: pecaId } });
    if (clienteNegocioId) await prisma.clienteNegocio.deleteMany({ where: { id: clienteNegocioId } });
    if (contaId) await prisma.contaBizy.deleteMany({ where: { id: contaId } });
    if (clienteGlobalId) await prisma.clienteGlobal.deleteMany({ where: { id: clienteGlobalId } });
    if (negocioId) await prisma.negocio.deleteMany({ where: { id: negocioId } });
    await prisma.$disconnect();
  });

  async function criarCompra(numero: number) {
    const pedido = await prisma.pedido.create({
      data: {
        negocioId,
        clienteNegocioId,
        numero,
        subtotalEmKwanza: 25_000,
        totalEmKwanza: 25_000,
        itens: {
          create: {
            pecaId,
            codigoPeca: `ATTR-PG-${codigoSufixo}`,
            nomeProduto: "Produto atribuicao PostgreSQL",
            quantidade: 1,
            precoUnitarioEmKwanza: 25_000,
            subtotalEmKwanza: 25_000
          }
        }
      }
    });
    pedidoIds.push(pedido.id);
    const compra = await prisma.compraUnificada.create({
      data: {
        compradorTelefone: `24492384${String(numero).padStart(4, "0")}`,
        contaBizyId: contaId,
        sessaoCommerceId: sessaoBId,
        subtotalEmKwanza: 25_000,
        totalEmKwanza: 25_000,
        pedidosFilho: {
          create: {
            negocioId,
            pedidoId: pedido.id,
            subtotalEmKwanza: 25_000,
            totalEmKwanza: 25_000
          }
        }
      }
    });
    compraIds.push(compra.id);
    const compraDominio = await compras.buscarPorId(compra.id);
    const filhos = await compras.listarPedidosFilho(compra.id);
    if (!compraDominio) throw new Error("Compra de teste nao persistida.");
    return { compra: compraDominio, filhos };
  }

  it("persiste snapshot, participantes exactos e idempotencia", async () => {
    const primeira = await criarCompra(1);
    const dados = {
      compra: primeira.compra,
      pedidosFilho: primeira.filhos,
      contaBizyId: contaId,
      sessaoCommerceId: sessaoBId,
      trackingId: `attr-track-b-${sufixo}`,
      codigosProdutoPorNegocio: new Map([[negocioId, [`ATTR-PG-${codigoSufixo}`]]])
    };
    const conversoes = await useCase.registrarConversoesCompra(dados);
    await useCase.registrarConversoesCompra(dados);

    expect(conversoes).toHaveLength(1);
    expect(conversoes[0].modelo).toBe("CONVERSAO_ASSISTIDA");
    expect(conversoes[0].participantes).toHaveLength(2);
    expect(conversoes[0].participantes.reduce((total, item) => total + item.pesoBasisPoints, 0)).toBe(10_000);
    expect(conversoes[0].participantes.reduce((total, item) => total + item.valorAtribuidoEmKwanza, 0)).toBe(25_000);
    expect(conversoes[0].explicacao.crossDevice).toBe(true);
    expect(await prisma.conversaoAtribuicaoCommerce.count({ where: { pedidoId: primeira.filhos[0].pedidoId } })).toBe(1);
    expect(await prisma.participanteConversaoCommerce.count({ where: { conversaoId: conversoes[0].id } })).toBe(2);

    const versaoOriginal = conversoes[0].politicaVersao;
    await prisma.negocio.update({
      where: { id: negocioId },
      data: { entregaJson: JSON.stringify({ atribuicao: { modeloPadrao: "PRIMEIRO_TOQUE", janelaDias: 7 } }) }
    });
    const segunda = await criarCompra(2);
    const nova = await useCase.registrarConversoesCompra({ ...dados, compra: segunda.compra, pedidosFilho: segunda.filhos });
    const originalPersistida = await prisma.conversaoAtribuicaoCommerce.findUnique({ where: { id: conversoes[0].id } });

    expect(nova[0].modelo).toBe("PRIMEIRO_TOQUE");
    expect(nova[0].politicaVersao).not.toBe(versaoOriginal);
    expect(originalPersistida?.politicaVersao).toBe(versaoOriginal);
    expect(await prisma.politicaAtribuicaoCommerce.count({ where: { negocioId } })).toBe(2);
  });
});
