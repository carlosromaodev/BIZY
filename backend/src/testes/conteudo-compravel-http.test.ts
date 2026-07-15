import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

async function entrarSeller(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string, nome: string) {
  const otp = await app.inject({ method: "POST", url: "/auth/telefone/solicitar-codigo", payload: { telefone, nome } });
  const login = await app.inject({ method: "POST", url: "/auth/telefone/confirmar-codigo", payload: { telefone, codigo: otp.json().codigoDev } });
  expect(login.statusCode).toBe(200);
  return { authorization: `Bearer ${login.json().token}` };
}

async function entrarCreator(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone: string) {
  const otp = await app.inject({ method: "POST", url: "/conta/otp/solicitar", payload: { telefone } });
  const login = await app.inject({ method: "POST", url: "/conta/otp/confirmar", payload: { telefone, codigo: otp.json().codigoDev } });
  expect(login.statusCode).toBe(200);
  const cabecalho = String(login.headers["set-cookie"] ?? "");
  const cookie = cabecalho.split(";")[0];
  expect(cookie).toMatch(/^bizy_conta_sessao=/);
  return { cookie };
}

async function publicarLojaComProduto(
  app: Awaited<ReturnType<typeof criarAplicacao>>,
  headers: Record<string, string>,
  slug: string,
  codigo: string,
  nome: string
) {
  const produto = await app.inject({
    method: "POST", url: "/pecas", headers,
    payload: {
      codigo, sku: `SKU-${codigo}`, nome, descricao: `${nome} para conteúdo comprável`,
      precoEmKwanza: 25_000, custoEmKwanza: 12_000, quantidade: 7, stockMinimo: 1,
      categoria: "Creator", fotos: [`https://cdn.example.com/${codigo}.jpg`]
    }
  });
  expect(produto.statusCode).toBe(201);
  const loja = await app.inject({
    method: "PUT", url: "/loja-publica/configuracao", headers,
    payload: { slug, descricaoPublica: `Loja ${nome}`, publicada: true }
  });
  expect(loja.statusCode).toBe(200);
  return produto.json();
}

describe("Conteúdo comprável", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      RATE_LIMIT_ATIVO: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: ""
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  it("publica seleção multi-loja apenas após moderação do tenant e mantém divulgação comercial", async () => {
    const app = await criarAplicacao();
    try {
      const sellerA = await entrarSeller(app, "923791001", "Seller Conteúdo A");
      const sellerB = await entrarSeller(app, "923791002", "Seller Conteúdo B");
      await publicarLojaComProduto(app, sellerA, "loja-conteudo-a", "CONTENT-A", "Produto Conteúdo A");
      await publicarLojaComProduto(app, sellerB, "loja-conteudo-b", "CONTENT-B", "Produto Conteúdo B");

      const parceiro = await app.inject({
        method: "POST", url: "/afiliados", headers: sellerA,
        payload: {
          tipo: "CRIADOR", codigo: "CRIADOR-CONTENT", nomePublico: "Criador Content",
          contacto: "923791099", regraComissao: { tipo: "PERCENTUAL", percentual: 10 }
        }
      });
      expect(parceiro.statusCode).toBe(201);
      const creator = await entrarCreator(app, "923791099");

      const invalido = await app.inject({
        method: "POST", url: "/creator/conteudos/criar", headers: creator,
        payload: {
          parceiroId: parceiro.json().id, slug: "conteudo-invalido", tipo: "REEL", titulo: "Conteúdo inválido",
          produtos: [{ slugLoja: "loja-conteudo-a", codigoProduto: "NAO-EXISTE" }]
        }
      });
      expect(invalido.statusCode).toBe(400);
      expect(invalido.json().erro).toBe("PRODUTO_NAO_DISPONIVEL");

      const criado = await app.inject({
        method: "POST", url: "/creator/conteudos/criar", headers: creator,
        payload: {
          parceiroId: parceiro.json().id, slug: "Guia Multi Loja", tipo: "REEL", titulo: "Guia Multi Loja",
          legenda: "Seleção real de produtos de fornecedores diferentes.", divulgacaoComercial: true,
          produtos: [
            { slugLoja: "loja-conteudo-a", codigoProduto: "CONTENT-A" },
            { slugLoja: "loja-conteudo-b", codigoProduto: "CONTENT-B" }
          ]
        }
      });
      expect(criado.statusCode).toBe(201);
      expect(criado.json()).toEqual(expect.objectContaining({ slug: "guia-multi-loja", estado: "EM_REVISAO" }));

      const antes = await app.inject({ method: "GET", url: "/publico/conteudos/guia-multi-loja" });
      expect(antes.statusCode).toBe(404);

      const idor = await app.inject({
        method: "PATCH", url: `/creator/team/conteudos/${criado.json().id}/moderar`, headers: sellerB,
        payload: { aprovar: true }
      });
      expect(idor.statusCode).toBe(404);

      const moderado = await app.inject({
        method: "PATCH", url: `/creator/team/conteudos/${criado.json().id}/moderar`, headers: sellerA,
        payload: { aprovar: true }
      });
      expect(moderado.statusCode).toBe(200);
      expect(moderado.json()).toEqual(expect.objectContaining({ estado: "PUBLICADO", smartLinkId: expect.any(String) }));

      const publico = await app.inject({ method: "GET", url: "/publico/conteudos/guia-multi-loja" });
      expect(publico.statusCode).toBe(200);
      expect(publico.json().divulgacao).toBe("O criador pode receber comissão nesta compra.");
      expect(publico.json().produtos).toHaveLength(2);
      expect(publico.json().produtos.map((item: { loja: { slug: string } }) => item.loja.slug)).toEqual(["loja-conteudo-a", "loja-conteudo-b"]);
      expect(publico.json().produtos[0].url).toBe("/lojas/loja-conteudo-a/produtos/CONTENT-A");
      expect(publico.json().conteudo.smartLink.url).toMatch(/^\/go\//);

      const tracking = await app.inject({ method: "GET", url: "/loja-publica/tracking/resumo", headers: sellerA });
      expect(tracking.statusCode).toBe(200);
      expect(JSON.stringify(tracking.json())).toContain("CONTENT_VIEW");
    } finally {
      await app.close();
    }
  });
});
