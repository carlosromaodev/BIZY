import type { FastifyBaseLogger } from "fastify";
import { DespachadorEventos } from "../../dominio/eventos/DespachadorEventos.js";
import type { LiveCommentProvider } from "../../dominio/provedores/LiveCommentProvider.js";
import type { ProvedorWhatsApp } from "../../dominio/provedores/ProvedorWhatsApp.js";
import type {
  RepositorioAutenticacao,
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioComentarios,
  RepositorioInstanciasWhatsApp,
  RepositorioPecas,
  RepositorioReservas,
  RepositorioSessoesLive
} from "../../dominio/repositorios/contratos.js";
import { AutomacaoWhatsApp } from "../../dominio/servicos/AutomacaoWhatsApp.js";
import { InterpretadorComentario } from "../../dominio/servicos/InterpretadorComentario.js";
import { AuditoriaEventosUseCase } from "../../use-case/AuditoriaEventosUseCase.js";
import { AtendimentoCrmUseCase } from "../../use-case/AtendimentoCrmUseCase.js";
import { AutenticacaoEstudantilUseCase, UorConnectAuthProvider } from "../../use-case/AutenticacaoEstudantilUseCase.js";
import { AutenticacaoTelefoneUseCase } from "../../use-case/AutenticacaoTelefoneUseCase.js";
import { ConsultaAtendimentoN8n } from "../../use-case/ConsultaAtendimentoN8n.js";
import { ConsultaAtendimentoOperacionalUseCase } from "../../use-case/ConsultaAtendimentoOperacionalUseCase.js";
import { ConsultaIntegracoesUseCase } from "../../use-case/ConsultaIntegracoesUseCase.js";
import { ConsultaOperacionalUseCase } from "../../use-case/ConsultaOperacionalUseCase.js";
import { ConsultaPainelUseCase } from "../../use-case/ConsultaPainelUseCase.js";
import { GestaoPecasUseCase } from "../../use-case/GestaoPecasUseCase.js";
import { GestaoAtendimentoCrmUseCase } from "../../use-case/GestaoAtendimentoCrmUseCase.js";
import { GestaoWhatsAppEvolutionUseCase } from "../../use-case/GestaoWhatsAppEvolutionUseCase.js";
import { GerarReciboReservaUseCase } from "../../use-case/GerarReciboReservaUseCase.js";
import { LimparDadosComunicacaoUseCase } from "../../use-case/LimparDadosComunicacaoUseCase.js";
import { MonitorReservasUseCase } from "../../use-case/MonitorReservasUseCase.js";
import { OnboardingBizyUseCase } from "../../use-case/OnboardingBizyUseCase.js";
import { MotorReservas } from "../../use-case/MotorReservas.js";
import { ProcessadorComentarios } from "../../use-case/ProcessadorComentarios.js";
import { ReceberMensagemWhatsAppUseCase } from "../../use-case/ReceberMensagemWhatsAppUseCase.js";
import { RecuperacaoMensagensWhatsAppUseCase } from "../../use-case/RecuperacaoMensagensWhatsAppUseCase.js";
import { RevisaoComentariosUseCase } from "../../use-case/RevisaoComentariosUseCase.js";
import {
  RepositorioAutenticacaoMemoria,
  RepositorioAtendimentoMemoria,
  RepositorioAuditoriaMemoria,
  RepositorioComentariosMemoria,
  RepositorioInstanciasWhatsAppMemoria,
  RepositorioPecasMemoria,
  RepositorioReservasMemoria,
  RepositorioSessoesLiveMemoria
} from "../../use-case/repositorios/RepositorioMemoria.js";
import {
  RepositorioAutenticacaoPrisma,
  RepositorioAtendimentoPrisma,
  RepositorioAuditoriaPrisma,
  RepositorioComentariosPrisma,
  RepositorioInstanciasWhatsAppPrisma,
  RepositorioPecasPrisma,
  RepositorioReservasPrisma,
  RepositorioSessoesLivePrisma
} from "../../use-case/repositorios/RepositorioPrisma.js";
import { criarPrismaCliente } from "../banco/prismaCliente.js";
import { PublicadorEventosN8n } from "../n8n/PublicadorEventosN8n.js";
import { FutureInstagramProvider } from "../provedores/FutureInstagramProvider.js";
import { ManualProvider } from "../provedores/ManualProvider.js";
import { ProvedorSmsOmbala } from "../provedores/ProvedorSmsOmbala.js";
import { ProvedorWhatsAppCloudApi } from "../provedores/ProvedorWhatsAppCloudApi.js";
import { ProvedorWhatsAppEvolutionDinamico } from "../provedores/ProvedorWhatsAppEvolution.js";
import { TikTokLiveConnectorProvider } from "../provedores/TikTokLiveConnectorProvider.js";
import { TikTokLivePythonProvider } from "../provedores/TikTokLivePythonProvider.js";
import { WhatsAppConsoleProvider } from "../provedores/WhatsAppConsoleProvider.js";
import { HubTempoReal } from "./HubTempoReal.js";

export interface RepositoriosAplicacao {
  pecas: RepositorioPecas;
  reservas: RepositorioReservas;
  comentarios: RepositorioComentarios;
  autenticacao: RepositorioAutenticacao;
  atendimento: RepositorioAtendimento;
  instanciasWhatsApp: RepositorioInstanciasWhatsApp;
  sessoesLive: RepositorioSessoesLive;
  auditoria: RepositorioAuditoria;
  verificarConexao?: () => Promise<void>;
  encerrar?: () => Promise<void>;
}

export interface SessaoLive {
  id: string;
  username: string;
  providerNome: string;
  provider: LiveCommentProvider;
  iniciadaEm: Date;
  status: "CONECTANDO" | "CONECTADA" | "ERRO" | "ENCERRADA";
  comentariosRecebidos: number;
  comentariosProcessados: number;
  comentariosComErro: number;
  ultimoComentarioEm: Date | null;
  ultimoErro: string | null;
}

export interface ContextoAplicacao {
  eventos: DespachadorEventos;
  hubTempoReal: HubTempoReal;
  repositorios: RepositoriosAplicacao;
  minutosReserva: number;
  n8nAssumeWhatsApp: boolean;
  interpretadorComentario: InterpretadorComentario;
  motorReservas: MotorReservas;
  automacaoWhatsApp: AutomacaoWhatsApp;
  provedorSms: ReturnType<typeof criarProvedorSms>;
  autenticacaoTelefone: AutenticacaoTelefoneUseCase;
  autenticacaoEstudantil: AutenticacaoEstudantilUseCase;
  onboardingBizy: OnboardingBizyUseCase;
  gestaoWhatsAppEvolution: GestaoWhatsAppEvolutionUseCase;
  monitorReservas: MonitorReservasUseCase;
  gestaoPecas: GestaoPecasUseCase;
  gestaoAtendimentoCrm: GestaoAtendimentoCrmUseCase;
  consultaIntegracoes: ConsultaIntegracoesUseCase;
  consultaPainel: ConsultaPainelUseCase;
  consultaAtendimentoN8n: ConsultaAtendimentoN8n;
  consultaOperacional: ConsultaOperacionalUseCase;
  consultaAtendimentoOperacional: ConsultaAtendimentoOperacionalUseCase;
  atendimentoCrm: AtendimentoCrmUseCase;
  receberMensagemWhatsApp: ReceberMensagemWhatsAppUseCase;
  processadorComentarios: ProcessadorComentarios;
  revisaoComentarios: RevisaoComentariosUseCase;
  gerarReciboReserva: GerarReciboReservaUseCase;
  publicadorEventosN8n: PublicadorEventosN8n;
  recuperacaoMensagensWhatsApp: RecuperacaoMensagensWhatsAppUseCase;
  limparDadosComunicacao: LimparDadosComunicacaoUseCase;
  sessoesLive: Map<string, SessaoLive>;
}

export function criarContextoAplicacao(logger: FastifyBaseLogger): ContextoAplicacao {
  const eventos = new DespachadorEventos();
  const hubTempoReal = new HubTempoReal(eventos);
  const repositorios = criarRepositorios();
  new AuditoriaEventosUseCase(eventos, repositorios.auditoria, logger);
  const minutosReserva = Number(process.env.MINUTOS_RESERVA ?? 15);
  const n8nAssumeWhatsApp = process.env.N8N_ASSUME_WHATSAPP === "true";
  const interpretadorComentario = new InterpretadorComentario();
  const motorReservas = new MotorReservas(repositorios.pecas, repositorios.reservas, eventos, { minutosReserva });
  const provedorSms = criarProvedorSms();
  const provedorWhatsApp = criarProvedorWhatsApp(repositorios.instanciasWhatsApp);
  const automacaoWhatsApp = new AutomacaoWhatsApp(provedorWhatsApp, eventos, minutosReserva, {
    ativo: !n8nAssumeWhatsApp
  });
  const recuperacaoMensagensWhatsApp = new RecuperacaoMensagensWhatsAppUseCase(
    eventos,
    repositorios.auditoria,
    provedorWhatsApp,
    {
      ativo: !n8nAssumeWhatsApp,
      maxTentativas: Number(process.env.WHATSAPP_OUTBOX_MAX_TENTATIVAS ?? 5),
      limitePorCiclo: Number(process.env.WHATSAPP_OUTBOX_LIMITE_POR_CICLO ?? 25),
      atrasoInicialMs: Number(process.env.WHATSAPP_OUTBOX_ATRASO_INICIAL_MS ?? 60_000),
      atrasoMaximoMs: Number(process.env.WHATSAPP_OUTBOX_ATRASO_MAXIMO_MS ?? 30 * 60_000),
      intervaloReprocessamentoMs: Number(process.env.WHATSAPP_OUTBOX_INTERVALO_MS ?? 30_000),
      logger
    }
  );
  const autenticacaoTelefone = new AutenticacaoTelefoneUseCase(repositorios.autenticacao, provedorSms, {
    segredo: process.env.AUTH_SECRET ?? process.env.N8N_WEBHOOK_SECRET ?? "emeu-dev-secret",
    remetenteSms: process.env.OMBALA_SMS_DEFAULT_SENDER ?? "BIZY",
    minutosExpiracaoCodigo: Number(process.env.LOGIN_SMS_MINUTOS_EXPIRACAO ?? 10),
    diasExpiracaoSessao: Number(process.env.LOGIN_SESSAO_DIAS_EXPIRACAO ?? 7),
    permitirSmsDev: process.env.LOGIN_SMS_DEV_MODE === "true" || process.env.NODE_ENV !== "production",
    exporCodigoDev: process.env.LOGIN_SMS_EXPOR_CODIGO_DEV === "true" || process.env.NODE_ENV !== "production"
  });
  const autenticacaoEstudantil = new AutenticacaoEstudantilUseCase(
    repositorios.autenticacao,
    new UorConnectAuthProvider({
      baseUrl: process.env.UORCONNECT_API_URL ?? process.env.UOR_CONNECT_API_URL,
      timeoutMs: Number(process.env.UORCONNECT_AUTH_TIMEOUT_MS ?? 25_000),
      permitirDev: process.env.LOGIN_ESTUDANTIL_DEV_MODE === "true" || process.env.NODE_ENV !== "production"
    }),
    autenticacaoTelefone
  );
  const gestaoWhatsAppEvolution = new GestaoWhatsAppEvolutionUseCase(repositorios.instanciasWhatsApp, {
    baseUrl: process.env.EVOLUTION_API_URL ?? "http://localhost:8080",
    apiKey: process.env.EVOLUTION_API_KEY ?? "",
    managerUrl: process.env.EVOLUTION_MANAGER_PUBLIC_URL ?? process.env.EVOLUTION_MANAGER_URL ?? "http://localhost:3000"
  });
  const monitorReservas = new MonitorReservasUseCase(
    motorReservas,
    automacaoWhatsApp,
    repositorios.reservas,
    repositorios.pecas,
    eventos,
    Number(process.env.N8N_MINUTOS_ANTES_EXPIRAR ?? 2)
  );
  const gestaoPecas = new GestaoPecasUseCase(repositorios.pecas, eventos);
  const onboardingBizy = new OnboardingBizyUseCase(repositorios.autenticacao, gestaoPecas);
  const gestaoAtendimentoCrm = new GestaoAtendimentoCrmUseCase(repositorios.atendimento);
  const consultaIntegracoes = new ConsultaIntegracoesUseCase();
  const consultaPainel = new ConsultaPainelUseCase(repositorios.pecas, repositorios.reservas, repositorios.comentarios);
  const consultaAtendimentoN8n = new ConsultaAtendimentoN8n(
    repositorios.pecas,
    repositorios.reservas,
    repositorios.comentarios
  );
  const consultaOperacional = new ConsultaOperacionalUseCase(
    repositorios.pecas,
    repositorios.reservas,
    repositorios.comentarios,
    repositorios.auditoria,
    repositorios.atendimento
  );
  const consultaAtendimentoOperacional = new ConsultaAtendimentoOperacionalUseCase(
    repositorios.pecas,
    repositorios.reservas,
    repositorios.comentarios,
    repositorios.atendimento
  );
  const atendimentoCrm = new AtendimentoCrmUseCase(eventos, repositorios.atendimento, repositorios.auditoria, logger);
  const receberMensagemWhatsApp = new ReceberMensagemWhatsAppUseCase(eventos);
  const processadorComentarios = new ProcessadorComentarios(
    interpretadorComentario,
    motorReservas,
    automacaoWhatsApp,
    repositorios.comentarios,
    eventos
  );
  const revisaoComentarios = new RevisaoComentariosUseCase(
    repositorios.comentarios,
    motorReservas,
    automacaoWhatsApp,
    eventos
  );
  const gerarReciboReserva = new GerarReciboReservaUseCase(repositorios.reservas, repositorios.pecas);
  const limparDadosComunicacao = new LimparDadosComunicacaoUseCase(
    repositorios.comentarios,
    repositorios.atendimento,
    repositorios.auditoria,
    repositorios.autenticacao
  );

  const publicadorEventosN8n = new PublicadorEventosN8n(eventos, {
    webhookUrl: process.env.N8N_WEBHOOK_EVENTOS_URL,
    segredo: process.env.N8N_WEBHOOK_SECRET,
    ativo: process.env.N8N_EVENTOS_ATIVOS !== "false",
    repositorioAuditoria: repositorios.auditoria,
    logger
  });

  return {
    eventos,
    hubTempoReal,
    repositorios,
    minutosReserva,
    n8nAssumeWhatsApp,
    interpretadorComentario,
    motorReservas,
    automacaoWhatsApp,
    provedorSms,
    autenticacaoTelefone,
    autenticacaoEstudantil,
    onboardingBizy,
    gestaoWhatsAppEvolution,
    monitorReservas,
    gestaoPecas,
    gestaoAtendimentoCrm,
    consultaIntegracoes,
    consultaPainel,
    consultaAtendimentoN8n,
    consultaOperacional,
    consultaAtendimentoOperacional,
    atendimentoCrm,
    receberMensagemWhatsApp,
    processadorComentarios,
    revisaoComentarios,
    gerarReciboReserva,
    publicadorEventosN8n,
    recuperacaoMensagensWhatsApp,
    limparDadosComunicacao,
    sessoesLive: new Map()
  };
}

export function criarProviderLive(nome: string): LiveCommentProvider {
  const factories: Record<string, () => LiveCommentProvider> = {
    "tiktok-live-connector": () => new TikTokLiveConnectorProvider(),
    "tiktok-live-python": () => new TikTokLivePythonProvider(),
    "future-instagram": () => new FutureInstagramProvider(),
    manual: () => new ManualProvider()
  };

  return (factories[nome] ?? factories.manual)();
}

function criarRepositorios(): RepositoriosAplicacao {
  if ((process.env.MODO_ARMAZENAMENTO ?? "prisma") === "memoria") {
    const pecas = new RepositorioPecasMemoria();
    return {
      pecas,
      reservas: new RepositorioReservasMemoria(pecas),
      comentarios: new RepositorioComentariosMemoria(),
      autenticacao: new RepositorioAutenticacaoMemoria(),
      atendimento: new RepositorioAtendimentoMemoria(),
      instanciasWhatsApp: new RepositorioInstanciasWhatsAppMemoria(),
      sessoesLive: new RepositorioSessoesLiveMemoria(),
      auditoria: new RepositorioAuditoriaMemoria(),
      verificarConexao: async () => undefined
    };
  }

  const prisma = criarPrismaCliente();

  return {
    pecas: new RepositorioPecasPrisma(prisma),
    reservas: new RepositorioReservasPrisma(prisma),
    comentarios: new RepositorioComentariosPrisma(prisma),
    autenticacao: new RepositorioAutenticacaoPrisma(prisma),
    atendimento: new RepositorioAtendimentoPrisma(prisma),
    instanciasWhatsApp: new RepositorioInstanciasWhatsAppPrisma(prisma),
    sessoesLive: new RepositorioSessoesLivePrisma(prisma),
    auditoria: new RepositorioAuditoriaPrisma(prisma),
    verificarConexao: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
    encerrar: () => prisma.$disconnect()
  };
}

function criarProvedorWhatsApp(repositorioInstancias: RepositorioInstanciasWhatsApp): ProvedorWhatsApp {
  const provider = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();

  if (provider === "evolution") {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instancia = process.env.EVOLUTION_INSTANCE;

    if (!baseUrl || !apiKey) {
      throw new Error("Configure EVOLUTION_API_URL e EVOLUTION_API_KEY para usar Evolution.");
    }

    return new ProvedorWhatsAppEvolutionDinamico({
      repositorioInstancias,
      baseUrl,
      apiKey,
      instanciaFallback: instancia,
      atrasoMs: Number(process.env.EVOLUTION_DELAY_MS ?? 800),
      linkPreview: process.env.EVOLUTION_LINK_PREVIEW === "true",
      tentativas: Number(process.env.EVOLUTION_RETRY_ATTEMPTS ?? 3),
      intervaloRetryMs: Number(process.env.EVOLUTION_RETRY_INTERVAL_MS ?? 600)
    });
  }

  if (provider === "cloud-api" || provider === "whatsapp-cloud-api") {
    const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID ?? "";
    const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN ?? "";

    if (!phoneNumberId || !accessToken) {
      throw new Error("Configure WHATSAPP_CLOUD_PHONE_NUMBER_ID e WHATSAPP_CLOUD_ACCESS_TOKEN para usar WhatsApp Cloud API.");
    }

    return new ProvedorWhatsAppCloudApi({
      phoneNumberId,
      accessToken,
      apiVersion: process.env.WHATSAPP_CLOUD_API_VERSION ?? "v25.0",
      baseUrl: process.env.WHATSAPP_CLOUD_API_BASE_URL ?? "https://graph.facebook.com",
      linkPreview: process.env.WHATSAPP_CLOUD_LINK_PREVIEW === "true",
      defaultTemplateName: process.env.WHATSAPP_CLOUD_DEFAULT_TEMPLATE_NAME ?? null,
      defaultTemplateLanguage: process.env.WHATSAPP_CLOUD_DEFAULT_TEMPLATE_LANGUAGE ?? "pt_PT"
    });
  }

  return new WhatsAppConsoleProvider();
}

function criarProvedorSms() {
  return new ProvedorSmsOmbala({
    baseUrl: process.env.OMBALA_API_BASE_URL ?? "https://api.ombala.ao",
    token: process.env.OMBALA_API_TOKEN
  });
}
