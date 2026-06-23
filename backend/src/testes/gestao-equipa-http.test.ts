import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Gestão de Equipa — rotas HTTP", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: "",
      MODULOS_TODOS_ATIVOS: "true"
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ambienteOriginal };
  });

  async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>, telefone = "923000040", nome = "Dono Equipa") {
    const r1 = await app.inject({
      method: "POST",
      url: "/auth/telefone/solicitar-codigo",
      payload: { telefone, nome }
    });
    const r2 = await app.inject({
      method: "POST",
      url: "/auth/telefone/confirmar-codigo",
      payload: { telefone, codigo: r1.json().codigoDev }
    });
    return { authorization: `Bearer ${r2.json().token}` };
  }

  it("lista membros da equipa", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const resp = await app.inject({
        method: "GET",
        url: "/equipa/membros",
        headers
      });
      expect(resp.statusCode).toBe(200);
      expect(Array.isArray(resp.json())).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("cria convite com telefone e lista convites", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const convite = await app.inject({
        method: "POST",
        url: "/equipa/convites",
        headers,
        payload: {
          telefone: "923111222",
          nomeConvidado: "Ana Vendedora",
          papelSugerido: "VENDEDOR"
        }
      });
      expect(convite.statusCode).toBe(200);
      expect(convite.json().estado).toBe("PENDENTE");
      expect(convite.json().token).toBeTruthy();

      const lista = await app.inject({
        method: "GET",
        url: "/equipa/convites",
        headers
      });
      expect(lista.statusCode).toBe(200);
      expect(lista.json().length).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });

  it("rejeita convite sem telefone nem email", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const resp = await app.inject({
        method: "POST",
        url: "/equipa/convites",
        headers,
        payload: { nomeConvidado: "Sem contacto" }
      });
      expect(resp.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it("aceita convite e cria membro com checklist de onboarding", async () => {
    const app = await criarAplicacao();
    try {
      const headersDono = await autenticar(app, "923000041", "Dono");

      // Criar convite
      const convite = await app.inject({
        method: "POST",
        url: "/equipa/convites",
        headers: headersDono,
        payload: {
          telefone: "923000042",
          nomeConvidado: "Novo Membro"
        }
      });
      const token = convite.json().token;

      // Registar o novo membro (autenticação)
      const headersNovo = await autenticar(app, "923000042", "Novo Membro");

      // Aceitar convite
      const aceite = await app.inject({
        method: "POST",
        url: `/equipa/convites/${token}/aceitar`,
        headers: headersNovo
      });
      expect(aceite.statusCode).toBe(200);
      expect(aceite.json().convite.estado).toBe("ACEITE");
      expect(aceite.json().membro).toBeTruthy();

      // Verificar que onboarding foi criado
      const membroId = aceite.json().membro.id;
      const checklist = await app.inject({
        method: "GET",
        url: `/equipa/onboarding/${membroId}`,
        headers: headersNovo
      });
      expect(checklist.statusCode).toBe(200);
      expect(checklist.json().length).toBeGreaterThan(0);
      expect(checklist.json()[0].concluido).toBe(false);
    } finally {
      await app.close();
    }
  });

  it("rejeita aceitar convite já aceite", async () => {
    const app = await criarAplicacao();
    try {
      const headersDono = await autenticar(app, "923000043", "Dono");

      const convite = await app.inject({
        method: "POST",
        url: "/equipa/convites",
        headers: headersDono,
        payload: { telefone: "923000044", nomeConvidado: "Membro" }
      });

      const headersNovo = await autenticar(app, "923000044", "Membro");

      // Primeiro aceite
      await app.inject({
        method: "POST",
        url: `/equipa/convites/${convite.json().token}/aceitar`,
        headers: headersNovo
      });

      // Segundo aceite — deve falhar
      const segundo = await app.inject({
        method: "POST",
        url: `/equipa/convites/${convite.json().token}/aceitar`,
        headers: headersNovo
      });
      expect(segundo.statusCode).toBeGreaterThanOrEqual(400);
    } finally {
      await app.close();
    }
  });

  it("cria nota interna e lista", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const nota = await app.inject({
        method: "POST",
        url: "/equipa/notas",
        headers,
        payload: {
          entidadeTipo: "Pedido",
          entidadeId: "pedido-001",
          conteudo: "Cliente pediu embalagem especial"
        }
      });
      expect(nota.statusCode).toBe(200);
      expect(nota.json().conteudo).toBe("Cliente pediu embalagem especial");

      const lista = await app.inject({
        method: "GET",
        url: "/equipa/notas?entidadeTipo=Pedido&entidadeId=pedido-001",
        headers
      });
      expect(lista.statusCode).toBe(200);
      expect(lista.json().length).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });

  it("lista feed de actividade", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const feed = await app.inject({
        method: "GET",
        url: "/equipa/feed",
        headers
      });
      expect(feed.statusCode).toBe(200);
      expect(Array.isArray(feed.json())).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("cria persona personalizada", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const persona = await app.inject({
        method: "POST",
        url: "/equipa/personas",
        headers,
        payload: {
          nome: "Supervisor de Vendas",
          descricao: "Acesso a relatórios e gestão de vendedores",
          papelBase: "GESTOR"
        }
      });
      expect(persona.statusCode).toBe(200);
      expect(persona.json().nome).toBe("Supervisor de Vendas");

      const lista = await app.inject({
        method: "GET",
        url: "/equipa/personas",
        headers
      });
      expect(lista.statusCode).toBe(200);
      expect(lista.json().length).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });

  it("obtém desempenho da equipa", async () => {
    const app = await criarAplicacao();
    try {
      const headers = await autenticar(app);

      const desemp = await app.inject({
        method: "GET",
        url: "/equipa/desempenho",
        headers
      });
      expect(desemp.statusCode).toBe(200);
      expect(desemp.json().ranking).toBeDefined();
      expect(desemp.json().totais).toBeDefined();
    } finally {
      await app.close();
    }
  });

  it("rejeita rotas de equipa sem autenticação", async () => {
    const app = await criarAplicacao();
    try {
      const resp = await app.inject({
        method: "GET",
        url: "/equipa/membros"
      });
      expect(resp.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});
