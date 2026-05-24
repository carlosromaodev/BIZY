import {
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

    app.post("/publico/lojas/:slug/produtos/:codigo/whatsapp", async (request) => {
      const { slug, codigo } = request.params as { slug: string; codigo: string };
      const dados = GerarCheckoutWhatsAppPublicoSchema.parse(request.body ?? {});
      return contexto.lojaPublica.gerarCheckoutWhatsApp(slug, codigo, dados);
    });

    app.post("/publico/tracking/eventos", async (request, reply) => {
      const dados = RegistrarEventoTrackingSchema.parse(request.body ?? {});
      if (!dados.slugLoja) {
        return reply.code(400).send({ erro: "VALIDACAO", mensagem: "Informe slugLoja para tracking público." });
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
