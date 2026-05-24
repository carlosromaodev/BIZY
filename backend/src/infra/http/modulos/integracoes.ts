import { CriarInstanciaWhatsAppSchema, EnviarMensagemWhatsAppManualSchema } from "../../../dominio/esquemas.js";
import { exigirUsuarioAutenticado } from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const mensagemWhatsAppProtegido = "Faça login para gerir o WhatsApp.";

export const moduloIntegracoes: ModuloHttp = {
  nome: "integracoes",
  descricao: "Status operacional, Evolution API, QR Code e webhooks WhatsApp.",
  registrar(app, contexto) {
    app.get("/integracoes/status", async () => contexto.consultaIntegracoes.listarStatus());

    app.get("/evolution/resumo", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;
      return contexto.gestaoWhatsAppEvolution.listarResumo();
    });

    app.get("/whatsapp/templates", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;

      return { templates: contexto.automacaoWhatsApp.listarTemplates() };
    });

    app.post("/whatsapp/mensagens", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;

      const dados = EnviarMensagemWhatsAppManualSchema.parse(request.body ?? {});
      const resultado = await contexto.automacaoWhatsApp.enviarMensagemManual(dados);
      return reply.code(202).send(resultado);
    });

    app.post("/evolution/instancias", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;

      const dados = CriarInstanciaWhatsAppSchema.parse(request.body);
      const instancia = await contexto.gestaoWhatsAppEvolution.criarInstancia(dados);
      return reply.code(201).send({ instancia });
    });

    app.post("/evolution/instancias/:id/conectar", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;

      const { id } = request.params as { id: string };
      const instancia = await contexto.gestaoWhatsAppEvolution.conectar(id);
      return { instancia };
    });

    app.post("/evolution/instancias/:id/estado", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;

      const { id } = request.params as { id: string };
      const instancia = await contexto.gestaoWhatsAppEvolution.consultarEstado(id);
      return { instancia };
    });

    app.post("/evolution/instancias/:id/padrao", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;

      const { id } = request.params as { id: string };
      const instancia = await contexto.gestaoWhatsAppEvolution.definirPadrao(id);
      return { instancia };
    });

    app.delete("/evolution/instancias/:id", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemWhatsAppProtegido);
      if (!usuario) return;

      const { id } = request.params as { id: string };
      return contexto.gestaoWhatsAppEvolution.remover(id);
    });

    app.post("/webhooks/evolution", async (request, reply) => {
      const tokenConfigurado = process.env.EVOLUTION_WEBHOOK_TOKEN;
      const tokenRecebido = request.headers["x-emeu-evolution-token"];
      const tokenQuery = (request.query as { token?: string }).token;

      if (tokenConfigurado && tokenRecebido !== tokenConfigurado && tokenQuery !== tokenConfigurado) {
        return reply.code(401).send({ erro: "NAO_AUTORIZADO", mensagem: "Token da Evolution inválido." });
      }

      const mensagem = contexto.receberMensagemWhatsApp.processarWebhookEvolution(request.body as Record<string, unknown>);
      return reply.code(202).send({ ok: true, mensagem });
    });
  }
};
