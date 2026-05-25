import {
  AtualizarConversaAtendimentoSchema,
  AtualizarTarefaOperacionalSchema,
  CriarTarefaOperacionalSchema,
  DefinirPoliticaAutomacaoAtendimentoSchema,
  RegistrarNotaInternaAtendimentoSchema,
  RegistrarSugestaoIaAtendimentoSchema
} from "../../../dominio/esquemas.js";
import type { EstadoTarefaOperacional } from "../../../dominio/tipos.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import { exigirUsuarioAutenticado } from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloOperacional: ModuloHttp = {
  nome: "operacional",
  descricao: "Leituras operacionais reais para frontend, automações e atendimento.",
  registrar(app, contexto) {
    app.get("/automacoes/status", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar automações.");
      if (!usuario) return;

      return contexto.consultaOperacional.consultar(contexto.consultaIntegracoes.listarStatus());
    });

    app.get("/automacoes/n8n/outbox", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar outbox n8n.");
      if (!usuario) return;

      const limite = Number((request.query as { limite?: string } | undefined)?.limite ?? 100);
      return contexto.consultaOperacional.listarOutboxN8n(Math.max(1, Math.min(limite, 500)));
    });

    app.get("/automacoes/n8n/outbox/saude", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar outbox n8n.");
      if (!usuario) return;

      return contexto.consultaOperacional.consultarSaudeOutboxN8n();
    });

    app.get("/automacoes/whatsapp/outbox", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para consultar outbox WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const limite = Number((request.query as { limite?: string } | undefined)?.limite ?? 100);
      return contexto.repositorios.auditoria.listarMensagensWhatsApp(
        Math.max(1, Math.min(limite, 500)),
        contextoComercial.negocio.id
      );
    });

    app.get("/automacoes/whatsapp/outbox/saude", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para consultar outbox WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.repositorios.auditoria.resumirMensagensWhatsAppOutbox(contextoComercial.negocio.id);
    });

    app.post("/automacoes/whatsapp/outbox/reprocessar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para reprocessar WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const body = (request.body ?? {}) as { incluirFalhadas?: boolean; limite?: number };
      const resultado = await contexto.recuperacaoMensagensWhatsApp.reprocessarPendentes({
        incluirFalhadas: body.incluirFalhadas === true,
        limite: body.limite,
        negocioId: contextoComercial.negocio.id
      });
      return reply.code(202).send(resultado);
    });

    app.get("/tarefas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar tarefas.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const query = (request.query ?? {}) as {
        tipo?: string;
        estado?: EstadoTarefaOperacional;
        responsavelId?: string;
        limite?: string;
      };
      const tarefas = await contexto.gestaoTarefas.listarTarefas(contextoComercial.negocio.id, {
        tipo: query.tipo?.trim() || undefined,
        estado: query.estado,
        responsavelId: query.responsavelId?.trim() || undefined,
        limite: Number.isFinite(Number(query.limite)) ? Number(query.limite) : undefined
      });

      return { tarefas };
    });

    app.post("/tarefas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para criar tarefas.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarTarefaOperacionalSchema.parse(request.body ?? {});
      const tarefa = await contexto.gestaoTarefas.criarTarefa({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });

      return reply.code(201).send({ tarefa });
    });

    app.get("/tarefas/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar tarefas.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const tarefa = await contexto.gestaoTarefas.obterTarefa(id, contextoComercial.negocio.id);
      return { tarefa };
    });

    app.patch("/tarefas/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para atualizar tarefas.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarTarefaOperacionalSchema.parse(request.body ?? {});
      const tarefa = await contexto.gestaoTarefas.atualizarTarefa(id, contextoComercial.negocio.id, dados);
      return { tarefa };
    });

    app.get("/atendimento/conversas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para consultar atendimento.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.consultaAtendimentoOperacional.listarConversas(contextoComercial.negocio.id);
    });

    app.patch("/atendimento/conversas/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para gerir atendimento.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarConversaAtendimentoSchema.parse(request.body ?? {});
      const conversa = await contexto.gestaoAtendimentoCrm.atualizarConversa(
        id,
        dados,
        contextoComercial.negocio.id
      );
      return { conversa: conversa.conversa };
    });

    app.post("/atendimento/conversas/:id/politica", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para gerir atendimento.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = DefinirPoliticaAutomacaoAtendimentoSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoAtendimentoCrm.definirPoliticaAutomacao(
        id,
        dados.politica,
        contextoComercial.negocio.id
      );
      return {
        conversa: resultado.conversa.conversa,
        politicaAutomacao: resultado.politicaAutomacao
      };
    });

    app.post("/atendimento/conversas/:id/notas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para gerir atendimento.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = RegistrarNotaInternaAtendimentoSchema.parse(request.body ?? {});
      const mensagem = await contexto.gestaoAtendimentoCrm.registrarNotaInterna(id, {
        texto: dados.texto,
        autorId: contextoComercial.usuario.id,
        autorNome: contextoComercial.usuario.nome
      }, contextoComercial.negocio.id);
      return reply.code(201).send({ mensagem });
    });

    app.post("/atendimento/conversas/:id/sugestoes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para gerir atendimento.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = RegistrarSugestaoIaAtendimentoSchema.parse(request.body ?? {});
      const mensagem = await contexto.gestaoAtendimentoCrm.registrarSugestaoIa(
        id,
        dados,
        contextoComercial.negocio.id
      );
      return reply.code(201).send({ mensagem });
    });

    app.get("/relatorios/entregas", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar relatórios.");
      if (!usuario) return;

      return contexto.consultaOperacional.listarEntregas();
    });

    app.get("/relatorios/entregas.csv", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para exportar entregas.");
      if (!usuario) return;

      const csv = await contexto.consultaOperacional.exportarEntregasCsv();
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", 'attachment; filename="entregas-emeu.csv"');
      return reply.send(csv);
    });

    app.get("/relatorios/live-piloto", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar relatórios.");
      if (!usuario) return;

      const liveId = (request.query as { liveId?: string } | undefined)?.liveId?.trim();
      return contexto.consultaOperacional.gerarRelatorioLivePiloto(liveId || undefined);
    });

    app.get("/relatorios/crm-pos-live", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar relatórios.");
      if (!usuario) return;

      const liveId = (request.query as { liveId?: string } | undefined)?.liveId?.trim();
      return contexto.consultaOperacional.gerarRelatorioCrmPosLive(liveId || undefined);
    });

    app.get("/relatorios/crm-pos-live.csv", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para exportar relatórios.");
      if (!usuario) return;

      const liveId = (request.query as { liveId?: string } | undefined)?.liveId?.trim();
      const csv = await contexto.consultaOperacional.exportarCrmPosLiveCsv(liveId || undefined);
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", 'attachment; filename="crm-pos-live-emeu.csv"');
      return reply.send(csv);
    });
  }
};
