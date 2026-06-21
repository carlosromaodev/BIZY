import { QueryDiagnosticosSmsSchema, TestarSmsSchema } from "../../../dominio/esquemas.js";
import { NormalizadorTelefone } from "../../../dominio/servicos/NormalizadorTelefone.js";
import {
  extractCredits,
  extractProviderMessage,
  extractProviderMessageId,
  extractSenderNames,
  normalizeSmsSender,
  OmbalaClient,
  validateSmsMessagePolicy
} from "../../provedores/OmbalaClient.js";
import { exigirUsuarioAutenticado } from "../seguranca.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const normalizadorTelefone = new NormalizadorTelefone();

export const moduloDiagnosticos: ModuloHttp = {
  nome: "diagnosticos",
  descricao: "Diagnósticos operacionais de integrações sem dependência da interface.",
  registrar(app, contexto) {
    app.get("/diagnosticos/sms/overview", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para diagnosticar SMS.");
      if (!usuario) return;

      const client = criarOmbalaClient();
      let remetentesAprovados: string[] = [];
      let creditos: number | null = null;
      let providerStatus = client.isConfigured ? "partial" : "not_configured";
      let providerMessage: string | null = client.isConfigured ? null : "OMBALA_API_TOKEN não configurado.";

      if (client.isConfigured) {
        const [remetentes, saldo] = await Promise.all([client.getApprovedSenders(), client.getCredits()]);
        remetentesAprovados = remetentes.ok ? extractSenderNames(remetentes.payload) : [];
        creditos = saldo.ok ? extractCredits(saldo.payload) : null;
        providerStatus = remetentes.ok && saldo.ok && creditos !== null ? "ok" : remetentes.ok || saldo.ok ? "partial" : "error";
        providerMessage =
          !remetentes.ok || !saldo.ok
            ? extractProviderMessage(remetentes.payload) ?? extractProviderMessage(saldo.payload)
            : creditos === null
              ? "O provedor respondeu à consulta de créditos, mas o formato não foi reconhecido."
              : null;
      }

      return {
        configurado: client.isConfigured,
        baseUrl: process.env.OMBALA_API_BASE_URL ?? "https://api.ombala.ao",
        remetentePadrao: normalizeSmsSender(process.env.OMBALA_SMS_DEFAULT_SENDER ?? "EMEU"),
        remetentesAprovados,
        creditos,
        providerStatus,
        providerMessage
      };
    });

    app.get("/diagnosticos/sms/remetentes", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para diagnosticar SMS.");
      if (!usuario) return;
      return criarOmbalaClient().getSenders();
    });

    app.get("/diagnosticos/sms/mensagens", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para diagnosticar SMS.");
      if (!usuario) return;
      const query = QueryDiagnosticosSmsSchema.parse(request.query ?? {});
      const page = query.page;

      return query.telefone
        ? criarOmbalaClient().listMessagesByRecipient(query.telefone, page)
        : criarOmbalaClient().listMessages(page);
    });

    app.post("/diagnosticos/sms/testar", async (request, reply) => {
      const usuario = await exigirUsuarioAutenticado(contexto, request, reply, "Faça login para testar SMS.");
      if (!usuario) return;

      const dados = TestarSmsSchema.parse(request.body ?? {});
      const telefone = normalizadorTelefone.normalizar(dados.telefone);

      if (!telefone) {
        return reply.code(400).send({ erro: "TELEFONE_INVALIDO", mensagem: "Número de telefone angolano inválido." });
      }

      const remetente = normalizeSmsSender(dados.remetente);
      const erroPolitica = validateSmsMessagePolicy(dados.mensagem);

      if (erroPolitica) {
        return reply.code(400).send({ erro: "SMS_POLITICA", mensagem: erroPolitica });
      }

      if (!dados.enviarReal) {
        return {
          ok: true,
          provider: "ombala",
          configurado: contexto.provedorSms.configurado,
          envioReal: false,
          telefone,
          remetente,
          mensagem: dados.mensagem
        };
      }

      const resultado = await criarOmbalaClient().sendMessage({
        to: telefone,
        message: dados.mensagem,
        from: remetente,
        schedule: dados.schedule
      });

      return {
        ok: resultado.ok,
        provider: "ombala",
        configurado: contexto.provedorSms.configurado,
        envioReal: true,
        telefone,
        remetente,
        status: resultado.status,
        idExterno: extractProviderMessageId(resultado.payload),
        erro: resultado.ok ? null : extractProviderMessage(resultado.payload),
        resposta: resultado.payload
      };
    });
  }
};

function criarOmbalaClient() {
  return new OmbalaClient({
    baseUrl: process.env.OMBALA_API_BASE_URL ?? "https://api.ombala.ao",
    token: process.env.OMBALA_API_TOKEN
  });
}
