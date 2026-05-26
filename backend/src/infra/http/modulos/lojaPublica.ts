import {
  CalcularEntregaPublicaSchema,
  CriarCheckoutAbandonadoPublicoSchema,
  CriarCheckoutSitePublicoSchema,
  GerarCheckoutWhatsAppPublicoSchema,
  PublicarLojaSchema,
  RegistrarEventoTrackingSchema
} from "../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloLojaPublica: ModuloHttp = {
  nome: "loja-publica",
  descricao: "Publicação de loja, catálogo público, checkout WhatsApp e tracking comercial.",
  registrar(app, contexto) {
    app.put("/loja-publica/configuracao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "loja-publica:gerir",
          modulo: "loja-publica",
          mensagemPermissao: "Sem permissão para publicar loja.",
          mensagemModulo: "Loja pública desativada para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = PublicarLojaSchema.parse(request.body ?? {});
      return contexto.lojaPublica.publicarLoja(contextoComercial.negocio.id, dados);
    });

    app.get("/loja-publica/tracking/resumo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "tracking:ler",
          modulo: "tracking",
          mensagemPermissao: "Sem permissão para consultar tracking.",
          mensagemModulo: "Tracking desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      return contexto.lojaPublica.resumirTracking(contextoComercial.negocio.id);
    });

    app.get("/publico/lojas/:slug", async (request) => {
      const { slug } = request.params as { slug: string };
      const query = request.query as Record<string, string | undefined>;
      return contexto.lojaPublica.obterLoja(slug, {
        trackingId: query.trackingId,
        origem: query.origem,
        canal: query.canal,
        utm: extrairUtm(query)
      });
    });

    app.get("/publico/lojas/:slug/produtos/:codigo", async (request) => {
      const { slug, codigo } = request.params as { slug: string; codigo: string };
      const query = request.query as Record<string, string | undefined>;
      return contexto.lojaPublica.obterProduto(slug, codigo, {
        trackingId: query.trackingId,
        origem: query.origem,
        canal: query.canal,
        utm: extrairUtm(query)
      });
    });

    app.post("/publico/lojas/:slug/entrega/calcular", async (request) => {
      const { slug } = request.params as { slug: string };
      const dados = CalcularEntregaPublicaSchema.parse(request.body ?? {});
      return contexto.lojaPublica.calcularEntrega(slug, dados);
    });

    app.post("/publico/lojas/:slug/produtos/:codigo/whatsapp", async (request) => {
      const { slug, codigo } = request.params as { slug: string; codigo: string };
      const dados = GerarCheckoutWhatsAppPublicoSchema.parse(request.body ?? {});
      return contexto.lojaPublica.gerarCheckoutWhatsApp(slug, codigo, dados);
    });

    app.post("/publico/lojas/:slug/checkout", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const dados = CriarCheckoutSitePublicoSchema.parse(request.body ?? {});
      const checkout = await contexto.lojaPublica.criarCheckoutSite(slug, dados);
      return reply.code(201).send(checkout);
    });

    app.post("/publico/lojas/:slug/checkout/abandonado", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const dados = CriarCheckoutAbandonadoPublicoSchema.parse(request.body ?? {});
      const resultado = await contexto.lojaPublica.registrarCheckoutAbandonado(slug, dados);
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.post("/publico/tracking/eventos", async (request, reply) => {
      const dados = RegistrarEventoTrackingSchema.parse(request.body ?? {});
      if (!dados.slugLoja) {
        return reply.code(400).send({ erro: "VALIDACAO", mensagem: "Informe slugLoja para tracking público." });
      }
      if (contemDadoSensivelTracking(dados)) {
        return reply.code(400).send({
          erro: "TRACKING_DADO_SENSIVEL",
          mensagem: "Tracking público deve usar apenas identificadores técnicos, origem, campanha e timestamps."
        });
      }

      const evento = await contexto.lojaPublica.registrarEventoPublico(dados.slugLoja, dados);
      return reply.code(201).send(evento);
    });
  }
};

function extrairUtm(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query)
      .filter(([chave, valor]) => chave.startsWith("utm_") && typeof valor === "string" && valor.trim())
      .map(([chave, valor]) => [chave, valor as string])
  );
}

function contemDadoSensivelTracking(dados: {
  trackingId?: string | null;
  utm?: Record<string, string>;
  metadata?: Record<string, unknown>;
}) {
  const candidatos: unknown[] = [dados.trackingId, dados.utm, dados.metadata];
  return candidatos.some((valor) => contemDadoPessoal(valor));
}

function contemDadoPessoal(valor: unknown): boolean {
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (!texto) return false;
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(texto)) return true;
    const digitos = texto.replace(/\D/g, "");
    return /^(244)?9\d{8}$/.test(digitos);
  }

  if (Array.isArray(valor)) return valor.some((item) => contemDadoPessoal(item));

  if (valor && typeof valor === "object") {
    return Object.entries(valor as Record<string, unknown>).some(([chave, item]) => {
      const chaveNormalizada = chave.toLowerCase();
      if (["telefone", "phone", "email", "nome", "name", "endereco", "address", "whatsapp"].includes(chaveNormalizada)) {
        return true;
      }
      return contemDadoPessoal(item);
    });
  }

  return false;
}
