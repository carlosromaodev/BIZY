import {
  eventosEnviadosAoN8n,
  tiposEventoSistema,
  tiposEventoTrackingComercial
} from "../dominio/tipos.js";

type TipoContratoPlataforma = "api_interna" | "api_publica" | "webhook" | "evento_automacao";

interface ContratoPlataforma {
  id: string;
  nome: string;
  tipo: TipoContratoPlataforma;
  versao: string;
  estado: "ativo" | "deprecated";
  estabilidade: "estavel" | "beta";
  dono: string;
  descricao: string;
  paths?: string[];
  eventos?: string[];
  requisitos: Record<string, string>;
  payloadVersion: string;
  alteracoes: Array<{
    versao: string;
    data: string;
    resumo: string;
  }>;
}

export class ContratosPlataformaUseCase {
  listar() {
    return {
      versao: "v1",
      publicadoEm: "2026-05-26",
      politica: {
        compatibilidadeMinima: "90 dias para contratos estáveis antes de remoção ou quebra",
        idempotenciaObrigatoriaEm: ["webhooks", "jobs", "eventos-publicos"],
        versionamentoPayload: "Todo payload externo ou usado por automação deve expor payloadVersion.",
        breakingChange: "Mudanças incompatíveis exigem novo path, novo id de contrato ou nova versão explícita."
      },
      contratos: this.contratos()
    };
  }

  private contratos(): ContratoPlataforma[] {
    return [
      {
        id: "api-interna-crm-v1",
        nome: "API interna CRM+",
        tipo: "api_interna",
        versao: "v1",
        estado: "ativo",
        estabilidade: "beta",
        dono: "backend",
        descricao: "Rotas autenticadas usadas pela administração Bizy para clientes, produtos, pedidos, campanhas e governança.",
        paths: [
          "/clientes",
          "/pedidos",
          "/pecas",
          "/campanhas",
          "/eventos-operacionais",
          "/jobs/importacao/clientes",
          "/jobs/exportacao/clientes",
          "/jobs/importacao/produtos",
          "/jobs/exportacao/produtos"
        ],
        requisitos: {
          autenticacao: "bearer-session",
          tenant: "negocioId resolvido pela sessão",
          permissoes: "papel e módulos ativos validados antes da ação",
          idempotencia: "idempotencyKey obrigatória em jobs e recomendada em ações críticas"
        },
        payloadVersion: "v1",
        alteracoes: [
          {
            versao: "v1",
            data: "2026-05-26",
            resumo: "Contrato inicial para rotas internas do CRM+ com jobs idempotentes."
          }
        ]
      },
      {
        id: "api-publica-loja-v1",
        nome: "API pública da loja e tracking",
        tipo: "api_publica",
        versao: "v1",
        estado: "ativo",
        estabilidade: "beta",
        dono: "backend",
        descricao: "Rotas públicas para loja, produtos, checkout, WhatsApp click e eventos de tracking sem dados sensíveis em URL.",
        paths: [
          "/publico/lojas/:slug",
          "/publico/lojas/:slug/produtos/:codigo",
          "/publico/lojas/:slug/checkout",
          "/publico/lojas/:slug/whatsapp",
          "/publico/tracking/eventos"
        ],
        eventos: [...tiposEventoTrackingComercial],
        requisitos: {
          autenticacao: "publica",
          tenant: "slugLoja público resolvido para negocioId",
          privacidade: "telefone, email, nome, endereço e chaves sensíveis não podem ir em query string",
          idempotencia: "idempotencyKey, eventoId ou combinação trackingId/tipo/entidade quando aplicável"
        },
        payloadVersion: "v1",
        alteracoes: [
          {
            versao: "v1",
            data: "2026-05-26",
            resumo: "Contrato inicial para loja pública, checkout e tracking comercial."
          }
        ]
      },
      {
        id: "webhook-evolution-v1",
        nome: "Webhook Evolution WhatsApp",
        tipo: "webhook",
        versao: "v1",
        estado: "ativo",
        estabilidade: "beta",
        dono: "integracoes",
        descricao: "Entrada de eventos do Evolution para mensagens recebidas, enviadas, status e conexão WhatsApp.",
        paths: ["/webhooks/evolution"],
        eventos: ["WHATSAPP_MESSAGE_RECEIVED", "WHATSAPP_MESSAGE_SENT", "WHATSAPP_MESSAGE_STATUS", "WHATSAPP_MESSAGE_FAILED"],
        requisitos: {
          autenticacao: "token configurado do provider quando disponível",
          idempotencia: "providerMessageId ou chave técnica equivalente",
          recuperacao: "falha deve virar estado explícito, retry ou tarefa humana",
          privacidade: "logs não devem expor conteúdo sensível além do necessário para atendimento"
        },
        payloadVersion: "v1",
        alteracoes: [
          {
            versao: "v1",
            data: "2026-05-26",
            resumo: "Contrato inicial para entrada Evolution e normalização de status WhatsApp."
          }
        ]
      },
      {
        id: "evento-automacao-operacional-v1",
        nome: "Eventos de automação operacional",
        tipo: "evento_automacao",
        versao: "v1",
        estado: "ativo",
        estabilidade: "beta",
        dono: "automacoes",
        descricao: "Eventos internos que podem alimentar n8n, auditoria, WhatsApp Policy, funil, relatórios e tarefas humanas.",
        eventos: [...tiposEventoSistema],
        requisitos: {
          autenticacao: "somente backend e rotas autenticadas podem registrar eventos operacionais",
          idempotencia: "idempotencyKey por negócio quando o evento vier de fonte externa ou job",
          topico: "todo evento operacional deve ter tópico de negócio legível",
          n8n: `somente eventos permitidos no contrato n8n: ${eventosEnviadosAoN8n.join(", ")}`
        },
        payloadVersion: "v1",
        alteracoes: [
          {
            versao: "v1",
            data: "2026-05-26",
            resumo: "Contrato inicial para payloads de automação com versionamento formal."
          }
        ]
      }
    ];
  }
}
