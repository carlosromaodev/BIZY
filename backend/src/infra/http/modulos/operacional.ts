import {
  AtualizarConversaAtendimentoSchema,
  AtualizarOportunidadeRecuperacaoSchema,
  AtualizarTarefaOperacionalSchema,
  CapturarSocialInboxProviderSchema,
  CriarTarefaOperacionalSchema,
  CriarPlaybookRecuperacaoSchema,
  CriarSocialInboxItemSchema,
  ConectarContaSocialSchema,
  DefinirPoliticaAutomacaoAtendimentoSchema,
  EnviarMensagemConversaAtendimentoSchema,
  ExecutarPlaybookRecuperacaoSchema,
  FiltrosExecucoesPlaybookRecuperacaoQuerySchema,
  FiltrosMovimentosFunilComercialQuerySchema,
  FiltrosOportunidadesRecuperacaoQuerySchema,
  FiltrosPlaybookRecuperacaoQuerySchema,
  FiltrosSocialInboxQuerySchema,
  CriarPedidoConversaAtendimentoSchema,
  ImportarSocialInboxCsvSchema,
  QueryAuditoriaOperacionalSchema,
  QueryLimiteSchema,
  QueryLiveIdSchema,
  RegistrarNotaInternaAtendimentoSchema,
  RegistrarMovimentoFunilComercialSchema,
  RegistrarSugestaoIaAtendimentoSchema,
  TransferirResponsavelOperacionalSchema,
  GerarTarefasAutomaticasRotinaSchema,
  VerificarSlaConversasSchema
} from "../../../dominio/esquemas.js";
import {
  tiposEventoSistema,
  type ConversaAtendimentoComMensagens,
  type EstadoTarefaOperacional,
  type EventoOperacional,
  type MensagemAtendimento,
  type Pedido,
  type TipoEventoSistema
} from "../../../dominio/tipos.js";
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

    app.get("/operacional/auditoria", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar auditoria operacional.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const query = QueryAuditoriaOperacionalSchema.parse(request.query);
      const eventos = await contexto.gestaoGovernancaCrm.listarEventos(contextoComercial.negocio.id, {
        topico: query.topico,
        tipo: query.tipo,
        estado: query.estado,
        limite: query.limite ?? 100
      });
      return {
        logs: eventos.map((evento) => ({
          id: evento.id,
          topico: evento.topico,
          tipo: evento.tipo,
          entidadeTipo: evento.entidadeTipo,
          entidadeId: evento.entidadeId,
          estado: evento.estado,
          mensagem: descreverEventoOperacional(evento),
          payload: evento.payload,
          criadoEm: evento.criadoEm
        }))
      };
    });

    app.get("/automacoes/n8n/outbox", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar outbox n8n.");
      if (!usuario) return;

      const { limite } = QueryLimiteSchema.parse(request.query);
      return contexto.consultaOperacional.listarOutboxN8n(Math.max(1, Math.min(limite ?? 100, 500)));
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

      const { limite } = QueryLimiteSchema.parse(request.query);
      return contexto.repositorios.auditoria.listarMensagensWhatsApp(
        Math.max(1, Math.min(limite ?? 100, 500)),
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

    app.get("/auditoria/eventos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar auditoria operacional.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const query = (request.query ?? {}) as { tipo?: string; limite?: string };
      const tipo = tiposEventoSistema.includes(query.tipo as TipoEventoSistema)
        ? (query.tipo as TipoEventoSistema)
        : undefined;
      const limite = Number(query.limite ?? 100);
      const eventos = await contexto.repositorios.auditoria.listarEventosSistema({
        negocioId: contextoComercial.negocio.id,
        tipo,
        limite: Number.isFinite(limite) ? limite : 100
      });

      return { eventos };
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
        mensagemModulo: "Módulo comercial desativado para este negócio."
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
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarTarefaOperacionalSchema.parse(request.body ?? {});
      const tarefa = await contexto.gestaoTarefas.criarTarefa({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });

      return reply.code(201).send({ tarefa });
    });

    app.post("/tarefas/automaticas/rotina", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para gerar tarefas automáticas.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = GerarTarefasAutomaticasRotinaSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoTarefas.gerarTarefasAutomaticasRotina(
        contextoComercial.negocio.id,
        dados
      );
      return reply.code(201).send(resultado);
    });

    app.get("/tarefas/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar tarefas.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
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
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarTarefaOperacionalSchema.parse(request.body ?? {});
      const tarefa = await contexto.gestaoTarefas.atualizarTarefa(id, contextoComercial.negocio.id, dados);
      return { tarefa };
    });

    app.post("/operacional/transferencias", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para transferir responsáveis.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const dados = TransferirResponsavelOperacionalSchema.parse(request.body ?? {});
      const resultados = [];

      for (const item of dados.itens) {
        if (item.tipo === "conversa") {
          const atualizada = await contexto.gestaoAtendimentoCrm.atualizarConversa(
            item.id,
            { responsavelId: dados.responsavelId },
            contextoComercial.negocio.id
          );
          if (dados.motivo) {
            await contexto.gestaoAtendimentoCrm.registrarNotaInterna(
              item.id,
              {
                texto: `Conversa transferida para ${dados.responsavelId}. Motivo: ${dados.motivo}`,
                autorId: contextoComercial.usuario.id,
                autorNome: contextoComercial.usuario.nome
              },
              contextoComercial.negocio.id
            );
          }
          resultados.push({
            tipo: item.tipo,
            id: item.id,
            responsavelId: atualizada.conversa.responsavelId,
            motivo: dados.motivo
          });
          continue;
        }

        if (item.tipo === "pedido") {
          const perfil = await contexto.gestaoPedidos.obterPedido(item.id, contextoComercial.negocio.id);
          const observacao = [
            perfil?.pedido.observacao,
            dados.motivo ? `Transferido para ${dados.responsavelId}: ${dados.motivo}` : null
          ]
            .filter(Boolean)
            .join("\n");
          const atualizado = await contexto.gestaoPedidos.atualizarEstado(item.id, contextoComercial.negocio.id, {
            responsavelId: dados.responsavelId,
            observacao: observacao || null
          });
          resultados.push({
            tipo: item.tipo,
            id: item.id,
            responsavelId: atualizado.responsavelId,
            motivo: dados.motivo
          });
          continue;
        }

        const tarefa = await contexto.gestaoTarefas.obterTarefa(item.id, contextoComercial.negocio.id);
        const observacao = [
          tarefa.observacao,
          dados.motivo ? `Transferida para ${dados.responsavelId}: ${dados.motivo}` : null
        ]
          .filter(Boolean)
          .join("\n");
        const atualizada = await contexto.gestaoTarefas.atualizarTarefa(item.id, contextoComercial.negocio.id, {
          responsavelId: dados.responsavelId,
          observacao: observacao || null
        });
        resultados.push({
          tipo: item.tipo,
          id: item.id,
          responsavelId: atualizada.responsavelId,
          motivo: dados.motivo
        });
      }

      return { resultados };
    });

    app.get("/social/inbox/itens", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "social-inbox:ler",
        modulo: "social-inbox",
        mensagemPermissao: "Sem permissão para consultar social inbox.",
        mensagemModulo: "Social Inbox desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosSocialInboxQuerySchema.parse(request.query ?? {});
      const itens = await contexto.gestaoSocialInbox.listarItens(contextoComercial.negocio.id, filtros);
      return { itens };
    });

    app.get("/social/contas/providers", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "social-inbox:ler",
        modulo: "social-inbox",
        mensagemPermissao: "Sem permissão para consultar providers sociais.",
        mensagemModulo: "Social Inbox desativado para este negócio."
      });
      if (!contextoComercial) return;

      return { providers: contexto.gestaoSocialInbox.listarProvidersAutorizados() };
    });

    app.get("/social/contas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "social-inbox:ler",
        modulo: "social-inbox",
        mensagemPermissao: "Sem permissão para consultar contas sociais.",
        mensagemModulo: "Social Inbox desativado para este negócio."
      });
      if (!contextoComercial) return;

      return { contas: contexto.gestaoSocialInbox.listarContasSociais(contextoComercial.negocio) };
    });

    app.post("/social/contas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "social-inbox:gerir",
        modulo: "social-inbox",
        mensagemPermissao: "Sem permissão para conectar contas sociais.",
        mensagemModulo: "Social Inbox desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = ConectarContaSocialSchema.parse(request.body ?? {});
      const conta = await contexto.gestaoSocialInbox.conectarContaSocial(
        contextoComercial.negocio,
        dados,
        request.body ?? {}
      );
      return reply.code(201).send({ conta });
    });

    app.post("/social/inbox/capturar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "social-inbox:gerir",
        modulo: "social-inbox",
        mensagemPermissao: "Sem permissão para capturar social inbox.",
        mensagemModulo: "Social Inbox desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CapturarSocialInboxProviderSchema.parse(request.body ?? {});
      const item = await contexto.gestaoSocialInbox.capturarItemProvider(contextoComercial.negocio, dados);
      return reply.code(201).send({ item });
    });

    app.post("/social/inbox/importar.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "social-inbox:gerir",
        modulo: "social-inbox",
        mensagemPermissao: "Sem permissão para importar social inbox.",
        mensagemModulo: "Social Inbox desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = ImportarSocialInboxCsvSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoSocialInbox.importarCsv(contextoComercial.negocio.id, dados.csv);
      return reply.code(201).send(resultado);
    });

    app.post("/social/inbox/itens", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "social-inbox:gerir",
        modulo: "social-inbox",
        mensagemPermissao: "Sem permissão para gerir social inbox.",
        mensagemModulo: "Social Inbox desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarSocialInboxItemSchema.parse(request.body ?? {});
      const item = await contexto.gestaoSocialInbox.criarItem({
        negocioId: contextoComercial.negocio.id,
        canal: dados.canal,
        provider: dados.provider,
        tipo: dados.tipo,
        estado: dados.estado,
        postId: dados.postId,
        postUrl: dados.postUrl,
        autorId: dados.autor.id,
        autorUsername: dados.autor.username,
        autorNome: dados.autor.nome,
        autorAvatarUrl: dados.autor.avatarUrl,
        texto: dados.texto,
        intencao: dados.intencao,
        confianca: dados.confianca,
        clienteTelefone: dados.clienteTelefone,
        clienteId: dados.clienteId,
        entidades: dados.entidades,
        contexto: dados.contexto
      });

      return reply.code(201).send({ item });
    });

    app.post("/social/inbox/itens/:id/whatsapp", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para levar interação social ao WhatsApp.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const item = await contexto.gestaoSocialInbox.obterItem(id, contextoComercial.negocio.id);
      if (!item) {
        return reply.code(404).send({ erro: "SOCIAL_INBOX_ITEM_NAO_ENCONTRADO", mensagem: "Interação social não encontrada." });
      }
      if (!item.clienteTelefone) {
        return reply.code(400).send({
          erro: "SOCIAL_INBOX_SEM_TELEFONE",
          mensagem: "Não é possível iniciar WhatsApp sem telefone do cliente."
        });
      }

      const dados = EnviarMensagemConversaAtendimentoSchema.parse(request.body ?? {});
      const mensagemLivre = montarMensagemLivreConversa(dados);
      const janelaAtendimentoAtiva = resolverJanelaAtendimentoSocialWhatsApp(dados, item);
      const envio = await contexto.automacaoWhatsApp.enviarMensagemManual({
        negocioId: contextoComercial.negocio.id,
        telefone: item.clienteTelefone,
        mensagem: mensagemLivre,
        templateId: dados.templateId,
        variaveis: dados.variaveis,
        categoria: dados.categoria,
        consentimentoMarketing: dados.consentimentoMarketing,
        janelaAtendimentoAtiva
      });

      const mensagem = await contexto.repositorios.atendimento.registrarMensagem({
        negocioId: contextoComercial.negocio.id,
        telefone: item.clienteTelefone,
        nomeCliente: item.autorNome,
        usernameCliente: item.autorUsername,
        userIdCliente: item.autorId,
        avatarUrlCliente: item.autorAvatarUrl,
        direcao: "OUTBOUND",
        remetente: "agente",
        canal: "whatsapp",
        tipo: envio.tipo,
        conteudo: envio.conteudo,
        provider: envio.resultado.provider,
        providerMessageId: envio.resultado.idExterno,
        status: "SENT",
        origem: "social_inbox_whatsapp",
        contexto: {
          ...dados.contexto,
          socialInboxItemId: item.id,
          canalSocial: item.canal,
          providerSocial: item.provider,
          postId: item.postId,
          postUrl: item.postUrl,
          intencao: item.intencao,
          confianca: item.confianca,
          autorId: item.autorId,
          autorUsername: item.autorUsername,
          categoriaWhatsApp: envio.politica.categoria,
          templateId: dados.templateId ?? null,
          mediaUrl: dados.mediaUrl ?? null
        }
      });

      await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "social_inbox",
        tipo: "SOCIAL_INBOX_WHATSAPP_SENT",
        entidadeTipo: "social_inbox_item",
        entidadeId: item.id,
        idempotencyKey: `social-inbox:${item.id}:whatsapp:${envio.resultado.idExterno}`,
        estado: "PROCESSADO",
        payload: {
          canal: item.canal,
          provider: item.provider,
          postId: item.postId,
          postUrl: item.postUrl,
          telefone: item.clienteTelefone,
          categoriaWhatsApp: envio.politica.categoria,
          mensagemId: mensagem.id,
          providerMessageId: envio.resultado.idExterno,
          autorUsuarioId: contextoComercial.usuario.id
        }
      });

      return reply.code(202).send({ item, mensagem, envio });
    });

    app.get("/funil/etapas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "funil:ler",
        modulo: "funil",
        mensagemPermissao: "Sem permissão para consultar funil.",
        mensagemModulo: "Funil desativado para este negócio."
      });
      if (!contextoComercial) return;

      return { etapas: contexto.gestaoFunilComercial.listarEtapas() };
    });

    app.get("/funil/movimentos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "funil:ler",
        modulo: "funil",
        mensagemPermissao: "Sem permissão para consultar histórico do funil.",
        mensagemModulo: "Funil desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosMovimentosFunilComercialQuerySchema.parse(request.query ?? {});
      const movimentos = await contexto.gestaoFunilComercial.listarMovimentos(
        contextoComercial.negocio.id,
        filtros
      );
      return { movimentos };
    });

    app.post("/funil/movimentos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "funil:gerir",
        modulo: "funil",
        mensagemPermissao: "Sem permissão para movimentar funil.",
        mensagemModulo: "Funil desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = RegistrarMovimentoFunilComercialSchema.parse(request.body ?? {});
      const movimento = await contexto.gestaoFunilComercial.registrarMovimento({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });

      return reply.code(201).send({ movimento });
    });

    app.get("/recuperacao/oportunidades", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:ler",
        modulo: "automacoes",
        mensagemPermissao: "Sem permissão para consultar oportunidades de recuperação.",
        mensagemModulo: "Automações desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosOportunidadesRecuperacaoQuerySchema.parse(request.query ?? {});
      const oportunidades = await contexto.gestaoOportunidadesRecuperacao.listarOportunidades(
        contextoComercial.negocio.id,
        filtros
      );
      return { oportunidades };
    });

    app.patch("/recuperacao/oportunidades/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:gerir",
        modulo: "automacoes",
        mensagemPermissao: "Sem permissão para atualizar oportunidades de recuperação.",
        mensagemModulo: "Automações desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarOportunidadeRecuperacaoSchema.parse(request.body ?? {});
      const oportunidade = await contexto.gestaoOportunidadesRecuperacao.atualizarOportunidade(
        id,
        contextoComercial.negocio.id,
        dados
      );
      return { oportunidade };
    });

    app.get("/playbooks/recuperacao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:ler",
        modulo: "automacoes",
        mensagemPermissao: "Sem permissão para consultar playbooks de recuperação.",
        mensagemModulo: "Automações desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosPlaybookRecuperacaoQuerySchema.parse(request.query ?? {});
      const playbooks = await contexto.gestaoPlaybooksRecuperacao.listarPlaybooks(
        contextoComercial.negocio.id,
        filtros
      );
      return { playbooks };
    });

    app.post("/playbooks/recuperacao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:gerir",
        modulo: "automacoes",
        mensagemPermissao: "Sem permissão para criar playbooks de recuperação.",
        mensagemModulo: "Automações desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarPlaybookRecuperacaoSchema.parse(request.body ?? {});
      const playbook = await contexto.gestaoPlaybooksRecuperacao.criarPlaybook({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });

      return reply.code(201).send({ playbook });
    });

    app.get("/playbooks/recuperacao/execucoes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:ler",
        modulo: "automacoes",
        mensagemPermissao: "Sem permissão para consultar execuções de playbooks.",
        mensagemModulo: "Automações desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosExecucoesPlaybookRecuperacaoQuerySchema.parse(request.query ?? {});
      const execucoes = await contexto.gestaoPlaybooksRecuperacao.listarExecucoes(
        contextoComercial.negocio.id,
        filtros
      );
      return { execucoes };
    });

    app.post("/playbooks/recuperacao/:id/executar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:gerir",
        modulo: "automacoes",
        mensagemPermissao: "Sem permissão para executar playbooks de recuperação.",
        mensagemModulo: "Automações desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = ExecutarPlaybookRecuperacaoSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoPlaybooksRecuperacao.executarPlaybook(
        id,
        contextoComercial.negocio.id,
        dados
      );

      return reply.code(202).send(resultado);
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

    app.get("/atendimento/conversas/filtros", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para consultar filtros de atendimento.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.consultaAtendimentoOperacional.listarFiltrosConversas(
        contextoComercial.negocio.id,
        contextoComercial.usuario.id
      );
    });

    app.post("/atendimento/conversas/verificar-sla", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "tarefas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para gerar tarefas de SLA.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const dados = VerificarSlaConversasSchema.parse(request.body ?? {});
      const conversas = await contexto.repositorios.atendimento.listarConversasComMensagens(
        dados.limite,
        contextoComercial.negocio.id
      );
      const existentes = await contexto.gestaoTarefas.listarTarefas(contextoComercial.negocio.id, {
        tipo: "SLA_CONVERSA",
        limite: 10_000
      });
      const limiteData = new Date(Date.now() - dados.idadeMinutos * 60_000);
      const tarefas = [];

      for (const conversa of conversas) {
        if (["RESOLVIDA", "ENCERRADA"].includes(conversa.conversa.estado)) continue;
        const ultimaMensagem = [...conversa.mensagens].sort((a, b) => b.enviadaEm.getTime() - a.enviadaEm.getTime())[0];
        if (!ultimaMensagem || ultimaMensagem.remetente !== "cliente") continue;
        if (ultimaMensagem.enviadaEm > limiteData) continue;
        const jaExiste = existentes.some(
          (tarefa) =>
            tarefa.entidadeTipo === "conversa" &&
            tarefa.entidadeId === conversa.conversa.id &&
            !["CONCLUIDA", "CANCELADA"].includes(tarefa.estado)
        );
        if (jaExiste) continue;

        tarefas.push(
          await contexto.gestaoTarefas.criarTarefa({
            negocioId: contextoComercial.negocio.id,
            tipo: "SLA_CONVERSA",
            titulo: `Responder conversa de ${conversa.cliente.nome ?? conversa.conversa.telefone}`,
            descricao: "Conversa com última mensagem do cliente sem resposta dentro do SLA operacional.",
            prioridade: dados.prioridade,
            origem: "sla_conversas",
            clienteId: conversa.conversa.clienteNegocioId,
            entidadeTipo: "conversa",
            entidadeId: conversa.conversa.id,
            clienteTelefone: conversa.conversa.telefone,
            responsavelId: dados.responsavelId,
            prazoEm: new Date(Date.now() + 30 * 60_000),
            contexto: {
              canal: conversa.conversa.canal,
              ultimaMensagemId: ultimaMensagem.id,
              ultimaMensagemEm: ultimaMensagem.enviadaEm.toISOString()
            }
          })
        );
      }

      return reply.code(201).send({ tarefas });
    });

    app.get("/atendimento/conversas/:id/proximas-acoes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para consultar atendimento.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const conversa = await contexto.repositorios.atendimento.buscarConversaComMensagensPorId(
        id,
        contextoComercial.negocio.id
      );
      if (!conversa) return reply.code(404).send({ erro: "CONVERSA_NAO_ENCONTRADA", mensagem: "Conversa não encontrada." });

      const pedidos = conversa.conversa.clienteNegocioId
        ? await contexto.repositorios.pedidos.listar(contextoComercial.negocio.id, {
            clienteId: conversa.conversa.clienteNegocioId,
            limite: 20
          })
        : [];

      return {
        conversaId: id,
        acoes: sugerirAcoesConversa(conversa, pedidos)
      };
    });

    app.post("/atendimento/conversas/:id/pedidos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pedidos:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para criar pedido pela conversa.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = CriarPedidoConversaAtendimentoSchema.parse(request.body ?? {});
      const conversa = await contexto.repositorios.atendimento.buscarConversaComMensagensPorId(
        id,
        contextoComercial.negocio.id
      );
      if (!conversa) return reply.code(404).send({ erro: "CONVERSA_NAO_ENCONTRADA", mensagem: "Conversa não encontrada." });
      if (!conversa.conversa.clienteNegocioId) {
        return reply.code(400).send({
          erro: "CONVERSA_SEM_CLIENTE",
          mensagem: "A conversa ainda não está vinculada a um cliente do negócio."
        });
      }

      const pedido = await contexto.gestaoPedidos.criarPedido({
        ...dados,
        negocioId: contextoComercial.negocio.id,
        clienteNegocioId: conversa.conversa.clienteNegocioId,
        origem: dados.origem ?? "conversa",
        canal: dados.canal ?? conversa.conversa.canal
      });
      const conversaAtualizada = await contexto.gestaoAtendimentoCrm.atualizarConversa(id, {
        estado: "AGUARDANDO_PAGAMENTO",
        responsavelId: dados.responsavelId ?? conversa.conversa.responsavelId,
        tags: [...new Set([...conversa.conversa.tags, "pedido_aberto", `pedido:${pedido.numero}`])]
      }, contextoComercial.negocio.id);
      await contexto.repositorios.atendimento.registrarMensagem({
        negocioId: contextoComercial.negocio.id,
        conversaId: id,
        clienteNegocioId: conversa.conversa.clienteNegocioId,
        telefone: conversa.conversa.telefone,
        direcao: "OUTBOUND",
        remetente: "sistema",
        canal: "sistema",
        tipo: "ORDER_CREATED",
        conteudo: `Pedido #${pedido.numero} criado pela conversa. Total: ${pedido.totalEmKwanza} Kz.`,
        status: "SENT",
        origem: "conversa_pedido",
        contexto: { pedidoId: pedido.id, numero: pedido.numero, totalEmKwanza: pedido.totalEmKwanza }
      });

      return reply.code(201).send({ pedido, conversa: conversaAtualizada.conversa });
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

    app.post("/atendimento/conversas/:id/mensagens", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:gerir",
        modulo: "conversas",
        mensagemPermissao: "Sem permissão para responder conversa.",
        mensagemModulo: "Conversas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = EnviarMensagemConversaAtendimentoSchema.parse(request.body ?? {});
      const conversa = await contexto.repositorios.atendimento.buscarConversaComMensagensPorId(
        id,
        contextoComercial.negocio.id
      );
      if (!conversa) return reply.code(404).send({ erro: "CONVERSA_NAO_ENCONTRADA", mensagem: "Conversa não encontrada." });

      const mensagemLivre = montarMensagemLivreConversa(dados);
      const janelaAtendimentoAtiva = resolverJanelaAtendimentoWhatsApp(dados, conversa.mensagens);
      const envio = await contexto.automacaoWhatsApp.enviarMensagemManual({
        negocioId: contextoComercial.negocio.id,
        telefone: conversa.conversa.telefone,
        mensagem: mensagemLivre,
        templateId: dados.templateId,
        variaveis: dados.variaveis,
        categoria: dados.categoria,
        consentimentoMarketing: dados.consentimentoMarketing,
        janelaAtendimentoAtiva
      });
      const mensagem = await contexto.repositorios.atendimento.registrarMensagem({
        negocioId: contextoComercial.negocio.id,
        conversaId: id,
        clienteNegocioId: conversa.conversa.clienteNegocioId,
        telefone: conversa.conversa.telefone,
        direcao: "OUTBOUND",
        remetente: "agente",
        canal: "whatsapp",
        tipo: envio.tipo,
        conteudo: envio.conteudo,
        provider: envio.resultado.provider,
        providerMessageId: envio.resultado.idExterno,
        status: "SENT",
        origem: "atendimento_conversa",
        contexto: {
          ...dados.contexto,
          tipoSolicitado: dados.tipo,
          entidadeTipo: dados.entidadeTipo,
          entidadeId: dados.entidadeId,
          categoriaWhatsApp: envio.politica.categoria,
          templateId: dados.templateId ?? null,
          mediaUrl: dados.mediaUrl ?? null
        }
      });
      const conversaAtualizada = await contexto.gestaoAtendimentoCrm.atualizarConversa(id, {
        estado: dados.entidadeTipo === "pedido" ? "AGUARDANDO_PAGAMENTO" : "AGUARDANDO_CLIENTE"
      }, contextoComercial.negocio.id);

      return reply.code(202).send({
        mensagem,
        conversa: conversaAtualizada.conversa,
        politica: envio.politica,
        resultado: envio.resultado
      });
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

      const { liveId } = QueryLiveIdSchema.parse(request.query);
      return contexto.consultaOperacional.gerarRelatorioLivePiloto(liveId || undefined);
    });

    for (const rota of ["/relatorios/team-pos-live", "/relatorios/crm-pos-live"]) {
      app.get(rota, async (request, reply) => {
        const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para consultar relatórios.");
        if (!usuario) return;

        const { liveId } = QueryLiveIdSchema.parse(request.query);
        return contexto.consultaOperacional.gerarRelatorioCrmPosLive(liveId || undefined);
      });
    }

    for (const rota of ["/relatorios/team-pos-live.csv", "/relatorios/crm-pos-live.csv"]) {
      app.get(rota, async (request, reply) => {
        const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para exportar relatórios.");
        if (!usuario) return;

        const { liveId } = QueryLiveIdSchema.parse(request.query);
        const csv = await contexto.consultaOperacional.exportarCrmPosLiveCsv(liveId || undefined);
        reply.header("Content-Type", "text/csv; charset=utf-8");
        reply.header("Content-Disposition", 'attachment; filename="team-pos-live-bizy.csv"');
        return reply.send(csv);
      });
    }
  }
};

function sugerirAcoesConversa(conversa: ConversaAtendimentoComMensagens, pedidos: Pedido[]) {
  const pedidosAtivos = pedidos.filter((pedido) => !["CANCELADO", "DEVOLVIDO", "ENTREGUE"].includes(pedido.estado));
  const pedidoPagamentoPendente = pedidosAtivos.find(
    (pedido) => pedido.estadoPagamento === "PENDENTE" || pedido.estado === "AGUARDANDO_PAGAMENTO"
  );
  const pedidoPagoSemEntrega = pedidosAtivos.find(
    (pedido) => pedido.estadoPagamento === "CONFIRMADO" && !["ENTREGUE", "DEVOLVIDO"].includes(pedido.estadoEntrega)
  );
  const textoRecente = conversa.mensagens
    .slice(-5)
    .map((mensagem) => mensagem.conteudo)
    .join(" ")
    .toLowerCase();
  const acoes = [];

  if (!pedidosAtivos.length && /\b(quero|comprar|preço|preco|tem|dispon[ií]vel|produto|pe[cç]a)\b/i.test(textoRecente)) {
    acoes.push({
      tipo: "CRIAR_PEDIDO",
      titulo: "Criar pedido com os produtos mencionados",
      prioridade: "ALTA",
      motivo: "Cliente demonstrou intenção comercial e ainda não há pedido ativo.",
      entidadeTipo: "conversa",
      entidadeId: conversa.conversa.id
    });
  }

  if (pedidoPagamentoPendente) {
    acoes.push({
      tipo: "PEDIR_COMPROVATIVO",
      titulo: "Pedir comprovativo de pagamento",
      prioridade: "ALTA",
      motivo: "Existe pedido aguardando pagamento.",
      entidadeTipo: "pedido",
      entidadeId: pedidoPagamentoPendente.id
    });
    acoes.push({
      tipo: "ENVIAR_DADOS_PAGAMENTO",
      titulo: "Enviar dados de pagamento por WhatsApp",
      prioridade: "NORMAL",
      motivo: "Pedido já tem total calculado e pode receber cobrança segura.",
      entidadeTipo: "pedido",
      entidadeId: pedidoPagamentoPendente.id
    });
  }

  if (pedidoPagoSemEntrega) {
    acoes.push({
      tipo: pedidoPagoSemEntrega.enderecoEntrega ? "CONFIRMAR_ENTREGA" : "PEDIR_ENDERECO",
      titulo: pedidoPagoSemEntrega.enderecoEntrega ? "Confirmar preparação/entrega" : "Pedir endereço de entrega",
      prioridade: "NORMAL",
      motivo: "Pedido pago ainda não foi entregue.",
      entidadeTipo: "pedido",
      entidadeId: pedidoPagoSemEntrega.id
    });
  }

  if (conversa.conversa.estado === "AGUARDANDO_HUMANO" || conversa.conversa.prioridade === "URGENTE") {
    acoes.push({
      tipo: "ASSUMIR_ATENDIMENTO",
      titulo: "Assumir atendimento humano",
      prioridade: "URGENTE",
      motivo: "Conversa marcada para intervenção humana.",
      entidadeTipo: "conversa",
      entidadeId: conversa.conversa.id
    });
  }

  return acoes;
}

function montarMensagemLivreConversa(dados: {
  tipo: "TEXTO" | "TEMPLATE" | "IMAGEM" | "DOCUMENTO" | "RECIBO" | "CATALOGO";
  mensagem?: string;
  mediaUrl?: string;
}) {
  if (dados.mensagem?.trim()) return dados.mensagem.trim();
  if (dados.mediaUrl && dados.tipo === "IMAGEM") return `Imagem enviada: ${dados.mediaUrl}`;
  if (dados.mediaUrl && dados.tipo === "DOCUMENTO") return `Documento enviado: ${dados.mediaUrl}`;
  if (dados.mediaUrl && dados.tipo === "RECIBO") return `Recibo enviado: ${dados.mediaUrl}`;
  if (dados.mediaUrl && dados.tipo === "CATALOGO") return `Catálogo enviado: ${dados.mediaUrl}`;
  return undefined;
}

const JANELA_ATENDIMENTO_WHATSAPP_MS = 24 * 60 * 60 * 1000;

function resolverJanelaAtendimentoWhatsApp(
  dados: {
    tipo: "TEXTO" | "TEMPLATE" | "IMAGEM" | "DOCUMENTO" | "RECIBO" | "CATALOGO";
    templateId?: string;
    categoria?: string;
    janelaAtendimentoAtiva?: boolean;
  },
  mensagens: MensagemAtendimento[]
): boolean | undefined {
  if (!envioPrecisaJanelaDeServico(dados)) return dados.janelaAtendimentoAtiva;

  const janelaCalculada = calcularJanelaServicoPorUltimaMensagemInbound(mensagens);
  if (dados.janelaAtendimentoAtiva === false) return false;
  return janelaCalculada;
}

function resolverJanelaAtendimentoSocialWhatsApp(
  dados: {
    tipo: "TEXTO" | "TEMPLATE" | "IMAGEM" | "DOCUMENTO" | "RECIBO" | "CATALOGO";
    templateId?: string;
    categoria?: string;
    janelaAtendimentoAtiva?: boolean;
  },
  item: { criadoEm: Date; clienteTelefone?: string | null; intencao?: string | null }
): boolean | undefined {
  if (!envioPrecisaJanelaDeServico(dados)) return dados.janelaAtendimentoAtiva;
  if (dados.janelaAtendimentoAtiva === false) return false;
  if (dados.janelaAtendimentoAtiva === true) return true;
  if (!item.clienteTelefone || item.intencao === "SPAM") return false;
  return Date.now() - item.criadoEm.getTime() <= JANELA_ATENDIMENTO_WHATSAPP_MS;
}

function envioPrecisaJanelaDeServico(dados: {
  templateId?: string;
  categoria?: string;
  tipo: "TEXTO" | "TEMPLATE" | "IMAGEM" | "DOCUMENTO" | "RECIBO" | "CATALOGO";
}): boolean {
  if (dados.categoria) return dados.categoria === "service";
  return !dados.templateId && dados.tipo !== "TEMPLATE";
}

function calcularJanelaServicoPorUltimaMensagemInbound(mensagens: MensagemAtendimento[]): boolean {
  const ultimaMensagemInbound = mensagens
    .filter((mensagem) => mensagem.canal === "whatsapp" && mensagem.direcao === "INBOUND")
    .sort((a, b) => b.enviadaEm.getTime() - a.enviadaEm.getTime())[0];

  if (!ultimaMensagemInbound) return false;
  return Date.now() - ultimaMensagemInbound.enviadaEm.getTime() <= JANELA_ATENDIMENTO_WHATSAPP_MS;
}

function descreverEventoOperacional(evento: EventoOperacional): string {
  const payload = evento.payload;
  if (evento.tipo === "DESCONTO_APROVADO") {
    return `Foi aprovado desconto de ${formatarKwanza(Number(payload.descontoEmKwanza ?? 0))} para ${evento.entidadeTipo ?? "entidade"} ${evento.entidadeId ?? ""}.`;
  }
  if (evento.tipo === "DESCONTO_SOLICITADO") {
    return `Foi solicitado desconto de ${formatarKwanza(Number(payload.descontoEmKwanza ?? 0))} e aguarda aprovação.`;
  }
  if (evento.tipo === "AFILIACAO_SUSPEITA") {
    return `Atribuição de afiliado bloqueada por ${String(payload.motivo ?? "suspeita operacional")}.`;
  }
  if (evento.tipo === "SOCIAL_INBOX_CAPTURED") {
    return `Interação social capturada em ${nomeCanalSocial(String(payload.canal ?? "rede social"))} com intenção ${String(payload.intencao ?? "SEM_INTENCAO")}.`;
  }
  if (evento.tipo === "SOCIAL_INBOX_WHATSAPP_SENT") {
    return `Interação social levada para WhatsApp com categoria ${String(payload.categoriaWhatsApp ?? "service")}.`;
  }
  return `${evento.tipo} em ${evento.topico}${evento.entidadeTipo ? ` para ${evento.entidadeTipo}` : ""}.`;
}

function formatarKwanza(valor: number): string {
  return `${valor.toLocaleString("pt-AO")} Kz`;
}

function nomeCanalSocial(canal: string): string {
  const nomes: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    whatsapp: "WhatsApp"
  };
  return nomes[canal.toLowerCase()] ?? canal;
}
