import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SmartLinksCommerceUseCase } from "../projetos/market/aplicacao/SmartLinksCommerceUseCase.js";
import { RepositorioCarrinhosCommercePrisma } from "../projetos/market/infra/repositorios/RepositorioCarrinhosCommercePrisma.js";
import { RepositorioSmartLinksCommercePrisma } from "../projetos/market/infra/repositorios/RepositorioSmartLinksCommercePrisma.js";
import {
  RepositorioAfiliadosPrisma,
  RepositorioAutenticacaoPrisma,
  RepositorioPecasPrisma,
  RepositorioTrackingComercialPrisma
} from "../use-case/repositorios/RepositorioPrisma.js";

const suite = process.env.DATABASE_URL ? describe : describe.skip;

suite("Smart Links Commerce no PostgreSQL", () => {
  const prisma = new PrismaClient();
  const smartLinksRepo = new RepositorioSmartLinksCommercePrisma(prisma);
  const carrinhos = new RepositorioCarrinhosCommercePrisma(prisma);
  const sufixo = randomUUID().slice(0, 8);
  const codigoSufixo = sufixo.toUpperCase();
  const segredo = "smart-links-prisma-secret-with-more-than-32-characters";
  let negocioId = "";
  let pecaId = "";
  let parceiroId = "";
  let linkId = "";
  let sessaoId = "";
  let carrinhoId = "";
  let compraId = "";

  const useCase = new SmartLinksCommerceUseCase({
    smartLinks: smartLinksRepo,
    afiliados: new RepositorioAfiliadosPrisma(prisma),
    autenticacao: new RepositorioAutenticacaoPrisma(prisma),
    pecas: new RepositorioPecasPrisma(prisma),
    tracking: new RepositorioTrackingComercialPrisma(prisma)
  }, segredo);

  beforeAll(async () => {
    const negocio = await prisma.negocio.create({ data: {
      nomeComercial: `Smart Links PG ${sufixo}`,
      segmento: "Teste",
      tipo: "LOJA",
      slugPublico: `smart-links-pg-${sufixo}`,
      lojaPublicadaEm: new Date()
    } });
    negocioId = negocio.id;
    const peca = await prisma.peca.create({ data: {
      negocioId,
      codigo: `SMART-PG-${codigoSufixo}`,
      nome: "Produto Smart PostgreSQL",
      descricao: "Produto para persistencia Smart Link",
      precoEmKwanza: 7_500,
      quantidade: 3,
      fotosJson: "[]",
      variantesJson: "{}",
      vitrineJson: "{}"
    } });
    pecaId = peca.id;
    const parceiro = await prisma.parceiroComercial.create({ data: {
      negocioId,
      tipo: "AFILIADO",
      codigo: `AFF-PG-${codigoSufixo}`,
      nomePublico: "Afiliado PostgreSQL",
      regraComissaoJson: JSON.stringify({ tipo: "PERCENTUAL", percentual: 5 })
    } });
    parceiroId = parceiro.id;
    const link = await prisma.linkAfiliado.create({ data: {
      negocioId,
      afiliadoId: parceiroId,
      codigo: `LINK-PG-${codigoSufixo}`,
      destinoTipo: "PRODUTO",
      slugLoja: negocio.slugPublico,
      codigoProduto: peca.codigo
    } });
    linkId = link.id;
  });

  afterAll(async () => {
    if (compraId) await prisma.compraUnificada.deleteMany({ where: { id: compraId } });
    if (carrinhoId) await prisma.carrinhoCommerce.deleteMany({ where: { id: carrinhoId } });
    if (sessaoId) await prisma.sessaoCommerce.deleteMany({ where: { id: sessaoId } });
    if (negocioId) await prisma.eventoTrackingComercial.deleteMany({ where: { negocioId } });
    if (linkId) await prisma.linkAfiliado.deleteMany({ where: { id: linkId } });
    if (parceiroId) await prisma.parceiroComercial.deleteMany({ where: { id: parceiroId } });
    if (pecaId) await prisma.peca.deleteMany({ where: { id: pecaId } });
    if (negocioId) await prisma.negocio.deleteMany({ where: { id: negocioId } });
    await prisma.$disconnect();
  });

  it("persiste uma sessao opaca, multiplos toques e a liga ao carrinho e compra", async () => {
    const primeiro = await useCase.resolverClique(`LINK-PG-${codigoSufixo}`, null, { ipHash: "ip-tecnico" });
    expect(primeiro).not.toBeNull();
    sessaoId = primeiro!.sessao.id;
    expect(primeiro!.token).not.toBe(primeiro!.sessao.tokenHash);
    expect(primeiro!.sessao.tokenHash).toHaveLength(64);

    const segundo = await useCase.resolverClique(`LINK-PG-${codigoSufixo}`, primeiro!.token);
    expect(segundo?.sessao.id).toBe(sessaoId);
    expect(await prisma.sessaoCommerce.count({ where: { id: sessaoId } })).toBe(1);
    expect(await prisma.toqueAtribuicaoCommerce.count({ where: { sessaoId } })).toBe(2);
    expect(await prisma.eventoTrackingComercial.count({ where: { trackingId: primeiro!.sessao.trackingId, tipo: "SMART_LINK_CLICK" } })).toBe(2);

    const carrinho = await carrinhos.criar({
      tokenHash: `cart-${sufixo}`,
      contaBizyId: null,
      sessaoCommerceId: sessaoId,
      expiraEm: new Date(Date.now() + 60_000)
    });
    carrinhoId = carrinho.id;
    expect(carrinho.sessaoCommerceId).toBe(sessaoId);

    const compra = await prisma.compraUnificada.create({ data: {
      compradorTelefone: "244923800099",
      carrinhoId,
      sessaoCommerceId: sessaoId,
      origem: "smart-link"
    } });
    compraId = compra.id;
    expect(compra.sessaoCommerceId).toBe(sessaoId);
  });
});
