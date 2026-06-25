import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Módulos do negócio", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
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

  it("permite ativar e desativar módulos opcionais sem perder o núcleo BIZY Team", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      const inicial = await app.inject({
        method: "GET",
        url: "/negocio/modulos",
        headers
      });

      expect(inicial.statusCode).toBe(200);
      expect(inicial.json().modulosAtivos).toEqual(expect.arrayContaining(["team-core", "catalogo", "conversas", "pedidos"]));
      expect(inicial.json().modulosAtivos).not.toContain("afiliados");
      expect(inicial.json().modulos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            modulo: "afiliados",
            ativo: false,
            categoria: "CRESCIMENTO"
          })
        ])
      );

      const ativado = await app.inject({
        method: "PATCH",
        url: "/negocio/modulos/afiliados",
        headers,
        payload: {
          ativo: true,
          configuracao: {
            motivo: "Piloto com criadores externos"
          }
        }
      });

      expect(ativado.statusCode).toBe(200);
      expect(ativado.json().modulo).toEqual(
        expect.objectContaining({
          modulo: "afiliados",
          ativo: true,
          configuracao: {
            motivo: "Piloto com criadores externos"
          }
        })
      );
      expect(ativado.json().modulosAtivos).toContain("team-core");
      expect(ativado.json().modulosAtivos).toContain("afiliados");

      const tentativaDesativarLegado = await app.inject({
        method: "PATCH",
        url: "/negocio/modulos/crm",
        headers,
        payload: {
          ativo: false
        }
      });

      expect(tentativaDesativarLegado.statusCode).toBe(400);
      expect(tentativaDesativarLegado.json().mensagem).toContain("team-core");

      const desativado = await app.inject({
        method: "PATCH",
        url: "/negocio/modulos/afiliados",
        headers,
        payload: {
          ativo: false
        }
      });

      expect(desativado.statusCode).toBe(200);
      expect(desativado.json().modulosAtivos).not.toContain("afiliados");

      const rotaAfiliados = await app.inject({
        method: "GET",
        url: "/afiliados",
        headers
      });

      expect(rotaAfiliados.statusCode).toBe(403);
      expect(rotaAfiliados.json()).toEqual(
        expect.objectContaining({
          erro: "MODULO_DESATIVADO",
          modulo: "afiliados"
        })
      );
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000014", nome: "Gestor Módulos" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000014", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
