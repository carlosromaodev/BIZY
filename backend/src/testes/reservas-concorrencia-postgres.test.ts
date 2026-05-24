import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };
const databaseUrlPostgres = process.env.DATABASE_URL_POSTGRES_TEST;

describe.skipIf(!databaseUrlPostgres)("concorrência de reservas com PostgreSQL real", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      DATABASE_URL: databaseUrlPostgres!,
      MODO_ARMAZENAMENTO: "prisma",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "false",
      WHATSAPP_PROVIDER: "console",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: "",
      OMBALA_API_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("garante apenas uma reserva que bloqueia stock quando vários comentários chegam ao mesmo tempo", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      const codigo = `PG${Date.now().toString().slice(-8)}`;

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers,
        payload: {
          codigo,
          nome: `Peça concorrente ${codigo}`,
          descricao: "Teste PostgreSQL real",
          precoEmKwanza: 10000,
          quantidade: 1,
          fotos: []
        }
      });

      const respostas = await Promise.all(
        Array.from({ length: 5 }, (_, indice) =>
          app.inject({
            method: "POST",
            url: "/comentarios/manual",
            headers,
            payload: {
              liveId: `live_pg_${codigo}`,
              username: `cliente_pg_${indice}`,
              displayName: `Cliente PG ${indice}`,
              commentText: `eu quero 92345678${indice} peça ${codigo}`
            }
          })
        )
      );

      expect(respostas.every((resposta) => resposta.statusCode === 201)).toBe(true);

      const reservas = await app.inject({ method: "GET", url: "/reservas", headers });
      expect(reservas.statusCode).toBe(200);

      const reservasDaPeca = reservas.json().filter((reserva: { codigoPeca: string }) => reserva.codigoPeca === codigo);
      expect(reservasDaPeca).toHaveLength(5);
      expect(reservasDaPeca.filter((reserva: { estado: string }) => reserva.estado === "WAITING_PAYMENT")).toHaveLength(1);
      expect(reservasDaPeca.filter((reserva: { estado: string }) => reserva.estado === "WAITLISTED")).toHaveLength(4);
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const telefone = `923${Date.now().toString().slice(-6)}`;
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome: "Vendedor PG" }
  });

  const codigo = respostaCodigo.json().codigoDev;
  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
