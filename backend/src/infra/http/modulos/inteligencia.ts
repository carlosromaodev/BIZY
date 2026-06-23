import { z } from "zod";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloInteligencia: ModuloHttp = {
  nome: "inteligencia",
  descricao: "Motor de inteligência preditiva — RFM, segmentação, LTV, previsão fluxo caixa, anomalias, carga equipa, funil.",

  registrar(app, contexto) {

    /* ── Scoring RFM e Segmentação (RF-T005, RF-T006) ──────── */

    app.get("/inteligencia/rfm", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.calcularRFMClientes(ctx.negocio.id);
      return resultado;
    });

    /* ── Alertas Churn VIP (RF-T007) ────────────────────────── */

    app.get("/inteligencia/churn-vip", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.obterAlertasChurnVIP(ctx.negocio.id);
      return resultado;
    });

    /* ── LTV (RF-T008) ──────────────────────────────────────── */

    app.get("/inteligencia/ltv", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.calcularLTV(ctx.negocio.id);
      return resultado;
    });

    /* ── Previsão Fluxo de Caixa (RF-T010, RF-T011) ────────── */

    app.get("/inteligencia/previsao-caixa", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const { semanas } = z.object({
        semanas: z.coerce.number().int().min(4).max(26).optional()
      }).parse(request.query ?? {});

      const resultado = await contexto.inteligenciaPreditiva.preverFluxoCaixa(ctx.negocio.id, semanas);
      return resultado;
    });

    /* ── Detecção de Anomalias (RF-T013) ────────────────────── */

    app.get("/inteligencia/anomalias", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.detectarAnomalias(ctx.negocio.id);
      return resultado;
    });

    /* ── Carga da Equipa (RF-T015) ──────────────────────────── */

    app.get("/inteligencia/carga-equipa", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.analisarCargaEquipa(ctx.negocio.id);
      return resultado;
    });

    /* ── Funil Comercial (RF-T016) ──────────────────────────── */

    app.get("/inteligencia/funil", async (request, reply) => {
      const ctx = await exigirInteligencia(contexto, request, reply, "equipa:ler");
      if (!ctx) return;

      const resultado = await contexto.inteligenciaPreditiva.analisarFunilComercial(ctx.negocio.id);
      return resultado;
    });
  }
};

/* ── Helper de permissão ──────────────────────────────────────── */

async function exigirInteligencia(
  contexto: ContextoAplicacao,
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply,
  permissao: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    modulo: "crm",
    mensagemPermissao: "Sem permissão para aceder à inteligência preditiva.",
    mensagemModulo: "Módulo de inteligência desativado para este negócio."
  });
}
