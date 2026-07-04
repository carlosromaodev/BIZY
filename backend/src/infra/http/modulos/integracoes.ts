import { CriarInstanciaWhatsAppSchema, EnviarMensagemWhatsAppManualSchema } from "../../../dominio/esquemas.js";
import type { FiltrosTemplatesWhatsApp } from "../../../dominio/servicos/AutomacaoWhatsApp.js";
import type { TemplateWhatsAppNegocio } from "../../../dominio/tipos.js";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { compararTokenSeguro } from "../criarAplicacao.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import { exigirUsuarioAutenticado } from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const mensagemWhatsAppProtegido = "Faça login para gerir o WhatsApp.";

export const moduloIntegracoes: ModuloHttp = {
  nome: "integracoes",
  descricao: "Status operacional, Evolution API, QR Code e webhooks WhatsApp.",
  registrar(app, contexto) {
    app.get("/integracoes/status", async (request, reply) => {
      const ctx = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para consultar integrações.",
        mensagemModulo: "Integrações desativadas para este negócio."
      });
      if (!ctx) return;
      return contexto.consultaIntegracoes.listarStatus();
    });

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

      const filtros = normalizarFiltrosTemplates(request.query);
      const templatesPadrao = contexto.automacaoWhatsApp
        .listarTemplates(filtros)
        .map((template) => ({ ...template, origem: "sistema" as const }));
      const templatesNegocio = (await contexto.gestaoCampanhasCrm.listarTemplates(contextoComercial.negocio.id))
        .filter((template) => templateNegocioAtendeFiltros(template, filtros))
        .map((template) => ({
          ...template,
          tipo: "NEGOCIO",
          descricao: "Template configurado pelo negócio.",
          origem: "negocio" as const
        }));

      return { templates: [...templatesPadrao, ...templatesNegocio] };
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

    app.post("/webhooks/instagram", async (request, reply) => {
      const tokenConfigurado = process.env.INSTAGRAM_WEBHOOK_TOKEN;
      const tokenRecebido = request.headers["x-instagram-webhook-token"];

      if (tokenConfigurado && !compararTokenSeguro(tokenRecebido, tokenConfigurado)) {
        return reply.code(401).send({ erro: "NAO_AUTORIZADO", mensagem: "Token do Instagram inválido." });
      }

      const payloadRecebido = request.body as Record<string, unknown>;
      const dados = obterObjeto(payloadRecebido.data ?? payloadRecebido);
      const negocioId = obterString(dados.negocioId) ?? await resolverNegocioWebhookInstagram(contexto, dados);
      const payload = negocioId ? { ...payloadRecebido, data: { ...dados, negocioId } } : payloadRecebido;
      const idempotencyKey = contexto.receberMensagemInstagram.gerarChaveIdempotencia(payload);

      if (idempotencyKey && negocioId) {
        const registro = await contexto.repositorios.eventosOperacionais.registrar({
          negocioId,
          topico: "webhook:instagram",
          tipo: "WEBHOOK_INSTAGRAM_RECEIVED",
          entidadeTipo: "instagram_dm",
          entidadeId: obterString(dados.messageId),
          idempotencyKey,
          payloadVersion: "v1",
          payload,
          estado: "PROCESSADO"
        });

        if (registro.duplicado) {
          return reply.code(202).send({ ok: true, duplicado: true, idempotencyKey, mensagem: null });
        }
      }

      const mensagem = contexto.receberMensagemInstagram.processarWebhook(payload);
      return reply.code(202).send({ ok: true, duplicado: mensagem.duplicado, idempotencyKey, mensagem });
    });

    app.get("/instagram/status", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply);
      if (!usuario) return;

      try {
        const status = await contexto.provedorInstagram.consultarStatus();
        return status;
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : "Instagram Bridge indisponível.";
        app.log.warn({ err: erro }, "Instagram Bridge status falhou: %s", mensagem);
        return { instancias: [], erro: mensagem };
      }
    });

    app.get("/instagram/instancias", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "conversas:ler",
        modulo: "instagram",
        mensagemPermissao: "Sem permissão para consultar Instagram.",
        mensagemModulo: "Instagram desativado para este negócio."
      });
      if (!contextoComercial) return;

      const instanciasDb = await contexto.repositorios.instanciasInstagram.listarAtivas();
      const instanciasNegocio = instanciasDb.filter((i) => i.negocioId === contextoComercial.negocio.id);

      let statusBridge: Record<string, { status: string; ultimoErro: string | null; ultimaPollEm: string | null }> = {};
      let bridgeOffline = false;
      try {
        const bridgeStatus = await contexto.provedorInstagram.consultarStatus();
        for (const inst of bridgeStatus.instancias ?? []) {
          statusBridge[inst.instancia] = { status: inst.status, ultimoErro: inst.ultimoErro, ultimaPollEm: inst.ultimaPollEm };
        }
      } catch (erro) {
        bridgeOffline = true;
        app.log.warn({ err: erro }, "Instagram Bridge offline ao listar instâncias");
      }

      const instancias = instanciasNegocio.map((inst) => {
        const bridge = statusBridge[inst.nome];
        return {
          ...inst,
          statusBridge: bridge?.status ?? null,
          ultimoErroBridge: bridge?.ultimoErro ?? null,
          ultimaPollEmBridge: bridge?.ultimaPollEm ?? null
        };
      });

      return { instancias, bridgeOffline };
    });

    app.post("/instagram/login", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "instagram",
        mensagemPermissao: "Sem permissão para configurar Instagram.",
        mensagemModulo: "Instagram desativado para este negócio."
      });
      if (!contextoComercial) return;

      const body = request.body as {
        instancia?: string;
        username?: string;
        password?: string;
        verificationCode?: string;
      };

      const instancia = body.instancia?.trim();
      const username = body.username?.trim();
      const password = body.password;

      if (!instancia || !username || !password) {
        return reply.code(400).send({ erro: "DADOS_INVALIDOS", mensagem: "Forneça instancia, username e password." });
      }

      if (!/^[a-zA-Z0-9_-]{1,50}$/.test(instancia)) {
        return reply.code(400).send({ erro: "DADOS_INVALIDOS", mensagem: "Nome da instância inválido. Apenas letras, números, _ e - (máx 50 chars)." });
      }

      try {
        const resultado = await contexto.provedorInstagram.login({
          instancia,
          username,
          password,
          negocioId: contextoComercial.negocio.id,
          verificationCode: body.verificationCode ?? null
        });

        const existente = await contexto.repositorios.instanciasInstagram.buscarPorNome(
          contextoComercial.negocio.id,
          instancia
        );

        if (existente) {
          await contexto.repositorios.instanciasInstagram.atualizar(existente.id, {
            username,
            status: resultado.status,
            ultimoErro: null,
            ultimaConexaoEm: new Date()
          });
        } else {
          await contexto.repositorios.instanciasInstagram.criar({
            negocioId: contextoComercial.negocio.id,
            nome: instancia,
            username,
            status: resultado.status,
            padrao: true,
            ativa: true
          });
        }

        return reply.code(200).send(resultado);
      } catch (erro) {
        const statusCode = (erro as { statusCode?: number }).statusCode;
        const mensagem = erro instanceof Error ? erro.message : "Erro de login no Instagram.";
        const isBridgeInacessivel = mensagem.includes("inacessível") || mensagem.includes("fetch failed");

        app.log.warn({ err: erro, instancia, username }, "Instagram login falhou: %s", mensagem);

        if (statusCode === 428) {
          const isChallenge = mensagem.includes("segurança") || mensagem.includes("challenge") || mensagem.includes("Cooldown");
          const statusDb = isChallenge ? "CHALLENGE" : "AGUARDANDO_2FA";
          const codigoErro = isChallenge ? "CHALLENGE_NECESSARIO" : "2FA_NECESSARIO";

          const existente = await contexto.repositorios.instanciasInstagram.buscarPorNome(
            contextoComercial.negocio.id,
            instancia
          );
          if (existente) {
            await contexto.repositorios.instanciasInstagram.atualizar(existente.id, { status: statusDb, ultimoErro: mensagem });
          } else {
            await contexto.repositorios.instanciasInstagram.criar({
              negocioId: contextoComercial.negocio.id,
              nome: instancia,
              username,
              status: statusDb,
              padrao: true,
              ativa: true
            });
          }
          return reply.code(428).send({ erro: codigoErro, mensagem });
        }

        if (isBridgeInacessivel) {
          return reply.code(502).send({ erro: "BRIDGE_OFFLINE", mensagem: "O serviço Instagram Bridge não está a responder. Verifique se o container instagrapi-bridge está em execução." });
        }

        return reply.code(statusCode ?? 500).send({ erro: "FALHA_LOGIN", mensagem });
      }
    });

    app.post("/instagram/instancias/:id/desconectar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "instagram",
        mensagemPermissao: "Sem permissão para configurar Instagram.",
        mensagemModulo: "Instagram desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const instancia = await contexto.repositorios.instanciasInstagram.buscarPorId(id);

      if (!instancia || instancia.negocioId !== contextoComercial.negocio.id) {
        return reply.code(404).send({ erro: "NAO_ENCONTRADA", mensagem: "Instância não encontrada." });
      }

      try {
        await contexto.provedorInstagram.logout(instancia.nome);
      } catch (erro) {
        app.log.warn({ err: erro, instancia: instancia.nome }, "Instagram logout no bridge falhou, a desativar apenas no BD");
      }

      await contexto.repositorios.instanciasInstagram.desativar(id);
      return { ok: true, instancia: instancia.nome };
    });

    app.post("/webhooks/evolution", async (request, reply) => {
      const tokenConfigurado = process.env.EVOLUTION_WEBHOOK_TOKEN;
      const tokenRecebido = request.headers["x-emeu-evolution-token"];

      if (tokenConfigurado && !compararTokenSeguro(tokenRecebido, tokenConfigurado)) {
        return reply.code(401).send({ erro: "NAO_AUTORIZADO", mensagem: "Token da Evolution inválido." });
      }

      const payloadRecebido = request.body as Record<string, unknown>;
      const negocioId = await resolverNegocioWebhookEvolution(contexto, payloadRecebido);
      const payload = negocioId ? incluirNegocioIdNoPayload(payloadRecebido, negocioId) : payloadRecebido;
      const idempotencyKey = contexto.receberMensagemWhatsApp.gerarChaveIdempotenciaEvolution(payload);

      if (idempotencyKey && negocioId) {
        const registro = await contexto.repositorios.eventosOperacionais.registrar({
          negocioId,
          topico: "webhook:evolution",
          tipo: "WEBHOOK_EVOLUTION_RECEIVED",
          entidadeTipo: "whatsapp_message",
          entidadeId: extrairIdMensagemEvolution(payload),
          idempotencyKey,
          payloadVersion: "v1",
          payload,
          estado: "PROCESSADO"
        });

        if (registro.duplicado) {
          return reply.code(202).send({ ok: true, duplicado: true, idempotencyKey, mensagem: null });
        }
      }

      const mensagem = contexto.receberMensagemWhatsApp.processarWebhookEvolution(payload);
      const comandoTurno = !mensagem.duplicado && mensagem.direcao === "INBOUND" && mensagem.telefone && mensagem.texto
        ? await contexto.gestaoEquipa.registarPresencaViaWhatsApp({
          negocioId: negocioId ?? undefined,
          telefone: mensagem.telefone,
          texto: mensagem.texto
        })
        : null;

      return reply.code(202).send({ ok: true, duplicado: mensagem.duplicado, idempotencyKey, mensagem, comandoTurno });
    });
  }
};

function normalizarFiltrosTemplates(query: unknown): FiltrosTemplatesWhatsApp {
  const dados = (query ?? {}) as Record<string, string | undefined>;

  return {
    categoria: dados.categoria as FiltrosTemplatesWhatsApp["categoria"],
    evento: dados.evento?.trim() || undefined,
    provider: dados.provider as FiltrosTemplatesWhatsApp["provider"],
    apenasAprovados: dados.apenasAprovados === "true",
    estadoAprovacao: dados.estadoAprovacao as FiltrosTemplatesWhatsApp["estadoAprovacao"]
  };
}

function templateNegocioAtendeFiltros(template: TemplateWhatsAppNegocio, filtros: FiltrosTemplatesWhatsApp): boolean {
  if (filtros.categoria && template.categoria !== filtros.categoria) return false;
  if (filtros.provider && template.provider !== filtros.provider) return false;
  if (filtros.apenasAprovados && template.estadoAprovacao !== "aprovado") return false;
  if (filtros.estadoAprovacao && template.estadoAprovacao !== filtros.estadoAprovacao) return false;
  if (filtros.evento && !template.eventosCompativeis.includes(filtros.evento)) return false;
  return true;
}

function incluirNegocioIdNoPayload(payload: Record<string, unknown>, negocioId: string): Record<string, unknown> {
  if (obterString(payload.negocioId)) return payload;

  return {
    ...payload,
    negocioId
  };
}

async function resolverNegocioWebhookEvolution(
  contexto: ContextoAplicacao,
  payload: Record<string, unknown>
): Promise<string | null> {
  const negocioDireto = obterString(payload.negocioId) ?? obterString(obterObjeto(payload.data).negocioId);
  if (negocioDireto) return negocioDireto;

  const nomeInstancia = obterString(payload.instance) ?? obterString(payload.instanceName);
  if (!nomeInstancia) return null;

  const nomeNormalizado = nomeInstancia.trim().toLowerCase();
  const instancias = await contexto.repositorios.instanciasWhatsApp.listarAtivas();
  const instancia = instancias.find(
    (item) => item.nome.toLowerCase() === nomeNormalizado || item.etiqueta?.toLowerCase() === nomeNormalizado
  );

  return instancia?.negocioId ?? null;
}

function extrairIdMensagemEvolution(payload: Record<string, unknown>): string | null {
  const dados = obterObjeto(payload.data);
  const chave = obterObjeto(dados.key);
  return (
    obterString(chave.id) ??
    obterString(dados.keyId) ??
    obterString(dados.messageId) ??
    obterString(dados.id)
  );
}

function obterObjeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
}

function obterString(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim().length > 0 ? valor.trim() : null;
}

async function resolverNegocioWebhookInstagram(
  contexto: ContextoAplicacao,
  dados: Record<string, unknown>
): Promise<string | null> {
  const negocioDireto = obterString(dados.negocioId);
  if (negocioDireto) return negocioDireto;

  const nomeInstancia = obterString(dados.instancia);
  if (!nomeInstancia) return null;

  try {
    const instancias = await contexto.repositorios.instanciasInstagram?.listarAtivas();
    const instancia = instancias?.find(
      (item: { nome: string }) => item.nome.toLowerCase() === nomeInstancia.toLowerCase()
    );
    return instancia?.negocioId ?? null;
  } catch {
    return null;
  }
}
