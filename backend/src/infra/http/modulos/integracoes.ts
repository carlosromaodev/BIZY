import { CriarInstanciaWhatsAppSchema, EnviarMensagemWhatsAppManualSchema } from "../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import { exigirUsuarioAutenticado } from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const mensagemWhatsAppProtegido = "Faça login para gerir o WhatsApp.";

export const moduloIntegracoes: ModuloHttp = {
  nome: "integracoes",
  descricao: "Status operacional, Evolution API, QR Code e webhooks WhatsApp.",
  registrar(app, contexto) {
    app.get("/integracoes/status", async () => contexto.consultaIntegracoes.listarStatus());

    app.get("/evolution/resumo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para consultar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;
      return contexto.gestaoWhatsAppEvolution.listarResumo(contextoComercial.negocio.id);
    });

    app.get("/whatsapp/templates", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para gerir WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      return { templates: contexto.automacaoWhatsApp.listarTemplates() };
    });

    app.post("/whatsapp/mensagens", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para enviar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = EnviarMensagemWhatsAppManualSchema.parse(request.body ?? {});
      const resultado = await contexto.automacaoWhatsApp.enviarMensagemManual({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });
      return reply.code(202).send(resultado);
    });

    app.post("/evolution/instancias", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para configurar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarInstanciaWhatsAppSchema.parse(request.body);
      const instancia = await contexto.gestaoWhatsAppEvolution.criarInstancia({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });
      return reply.code(201).send({ instancia });
    });

    app.post("/evolution/instancias/:id/conectar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para configurar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const instancia = await contexto.gestaoWhatsAppEvolution.conectar(id, contextoComercial.negocio.id);
      return { instancia };
    });

    app.post("/evolution/instancias/:id/estado", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para consultar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const instancia = await contexto.gestaoWhatsAppEvolution.consultarEstado(id, contextoComercial.negocio.id);
      return { instancia };
    });

    app.post("/evolution/instancias/:id/padrao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para configurar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const instancia = await contexto.gestaoWhatsAppEvolution.definirPadrao(id, contextoComercial.negocio.id);
      return { instancia };
    });

    app.delete("/evolution/instancias/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para configurar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      return contexto.gestaoWhatsAppEvolution.remover(id, contextoComercial.negocio.id);
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
