import {
  BadgeDollarSign,
  BookOpenCheck,
  Brain,
  Calendar,
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Inbox,
  Kanban,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Package,
  Radio,
  ReceiptText,
  Repeat2,
  Settings,
  Shield,
  Smartphone,
  Store,
  Target,
  Users,
  UsersRound,
  Wallet,
  Workflow
} from "lucide-react";
import { lazy, type ComponentType, type ReactNode } from "react";
import { temSubdominioLojaPublica } from "./projetos/market/dominio/lojaSubdominio";
import { temDominioMarketPublico } from "./projetos/market/dominio/marketDominio";

function paginaLazy(loader: () => Promise<Record<string, unknown>>, nome: string) {
  return lazy(async () => ({ default: (await loader())[nome] as ComponentType }));
}

const PaginaActividades = paginaLazy(() => import("./paginas/Actividades"), "PaginaActividades");
const PaginaAdministracao = paginaLazy(() => import("./paginas/Administracao"), "PaginaAdministracao");
const PaginaAfiliados = paginaLazy(() => import("./paginas/Afiliados"), "PaginaAfiliados");
const PaginaAgenda = paginaLazy(() => import("./paginas/Agenda"), "PaginaAgenda");
const PaginaAnaniGovernance = paginaLazy(() => import("./paginas/AnaniGovernance"), "PaginaAnaniGovernance");
const PaginaCatalogo = paginaLazy(() => import("./paginas/Catalogo"), "PaginaCatalogo");
const PaginaClientes = paginaLazy(() => import("./paginas/Clientes"), "PaginaClientes");
const PaginaComentarios = paginaLazy(() => import("./paginas/Comentarios"), "PaginaComentarios");
const PaginaConversas = paginaLazy(() => import("./paginas/Conversas"), "PaginaConversas");
const PaginaCotacoes = paginaLazy(() => import("./paginas/Cotacoes"), "PaginaCotacoes");
const PaginaCheckoutBizy = paginaLazy(() => import("./projetos/market/paginas/CheckoutBizy"), "PaginaCheckoutBizy");
const PaginaCompraUnificada = paginaLazy(() => import("./projetos/market/paginas/CompraUnificada"), "PaginaCompraUnificada");
const PaginaPortalComprador = paginaLazy(() => import("./projetos/market/paginas/PortalComprador"), "PaginaPortalComprador");
const PaginaFormularioLeadPublico = paginaLazy(() => import("./projetos/market/paginas/FormularioLeadPublico"), "PaginaFormularioLeadPublico");
const PaginaFormularios = paginaLazy(() => import("./paginas/Formularios"), "PaginaFormularios");
const PaginaHome = paginaLazy(() => import("./paginas/Home"), "PaginaHome");
const PaginaLive = paginaLazy(() => import("./paginas/Live"), "PaginaLive");
const PaginaLearning = paginaLazy(() => import("./projetos/learning/paginas/Learning"), "PaginaLearning");
const PaginaLearningTeam = paginaLazy(() => import("./projetos/learning/paginas/Learning"), "PaginaLearningTeam");
const PaginaPerfilLearning = paginaLazy(() => import("./projetos/learning/paginas/Learning"), "PaginaPerfilLearning");
const PaginaProdutoLearning = paginaLazy(() => import("./projetos/learning/paginas/ProdutoLearning"), "PaginaProdutoLearning");
const PaginaPortalProdutorLearning = paginaLazy(() => import("./projetos/learning/paginas/PortalProdutor"), "PaginaPortalProdutorLearning");
const PaginaLogin = paginaLazy(() => import("./paginas/Login"), "PaginaLogin");
const PaginaCatalogoPublico = paginaLazy(() => import("./projetos/market/paginas/CatalogoPublico"), "PaginaCatalogoPublico");
const PaginaLojaDigitalPublica = paginaLazy(() => import("./projetos/market/paginas/LojaDigitalPublica"), "PaginaLojaDigitalPublica");
const PaginaLojaPublica = paginaLazy(() => import("./projetos/market/paginas/StudioLoja"), "PaginaLojaPublica");
const PaginaDiretorioLojasMarket = paginaLazy(() => import("./projetos/market/paginas/Market"), "PaginaDiretorioLojasMarket");
const PaginaLojaMarket = paginaLazy(() => import("./projetos/market/paginas/Market"), "PaginaLojaMarket");
const PaginaMarket = paginaLazy(() => import("./projetos/market/paginas/Market"), "PaginaMarket");
const PaginaMetas = paginaLazy(() => import("./paginas/Metas"), "PaginaMetas");
const PaginaOnboarding = paginaLazy(() => import("./paginas/Onboarding"), "PaginaOnboarding");
const PaginaPainel = paginaLazy(() => import("./paginas/Painel"), "PaginaPainel");
const PaginaPipeline = paginaLazy(() => import("./paginas/Pipeline"), "PaginaPipeline");
const PaginaProdutoMarket = paginaLazy(() => import("./projetos/market/paginas/ProdutoMarket"), "PaginaProdutoMarket");
const PaginaPortalSeller = paginaLazy(() => import("./projetos/market/paginas/PortalSeller"), "PaginaPortalSeller");
const PaginaProjectos = paginaLazy(() => import("./projetos/team/paginas/Projectos"), "PaginaProjectos");
const PaginaRecuperacao = paginaLazy(() => import("./paginas/Recuperacao"), "PaginaRecuperacao");
const PaginaRelatorios = paginaLazy(() => import("./paginas/Relatorios"), "PaginaRelatorios");
const PaginaRespostasRapidas = paginaLazy(() => import("./paginas/RespostasRapidas"), "PaginaRespostasRapidas");
const PaginaReservas = paginaLazy(() => import("./paginas/Reservas"), "PaginaReservas");
const PaginaTarefas = paginaLazy(() => import("./paginas/Tarefas"), "PaginaTarefas");
const PaginaSequencias = paginaLazy(() => import("./paginas/Sequencias"), "PaginaSequencias");
const PaginaCampanhas = paginaLazy(() => import("./paginas/Campanhas"), "PaginaCampanhas");
const PaginaEquipa = paginaLazy(() => import("./projetos/team/paginas/Equipa"), "PaginaEquipa");
const PaginaFinancas = paginaLazy(() => import("./paginas/Financas"), "PaginaFinancas");
const PaginaInteligencia = paginaLazy(() => import("./paginas/Inteligencia"), "PaginaInteligencia");
const PaginaSocialInbox = paginaLazy(() => import("./paginas/SocialInbox"), "PaginaSocialInbox");
const PaginaDiagnosticos = paginaLazy(() => import("./paginas/Diagnosticos"), "PaginaDiagnosticos");
const PaginaAuditoria = paginaLazy(() => import("./paginas/Auditoria"), "PaginaAuditoria");
const PaginaPagamentos = paginaLazy(() => import("./paginas/Pagamentos"), "PaginaPagamentos");

export type SecaoNavegacao = "Hoje" | "Vendas" | "Comercial" | "Vitrine" | "Gestão" | "Admin/Sistema";

export interface RotaPublica {
  caminho: string;
  elemento: ReactNode;
}

export interface RotaPrivada {
  caminho: string;
  rotulo: string;
  secao: SecaoNavegacao;
  icone: ReactNode;
  elemento: ReactNode;
  fim?: boolean;
  requerAdminSistema?: boolean;
  requerGovernancaAnani?: boolean;
  modulo?: string;
}

export interface RotaPrivadaOculta extends RotaPublica {
  modulo?: string;
  requerGovernancaAnani?: boolean;
}

function PaginaEntradaPublica() {
  if (temDominioMarketPublico()) return <PaginaMarket />;
  return temSubdominioLojaPublica() ? <PaginaLojaDigitalPublica /> : <PaginaHome />;
}

export const rotasPublicas: RotaPublica[] = [
  { caminho: "/", elemento: <PaginaEntradaPublica /> },
  { caminho: "/login", elemento: <PaginaLogin /> },
  { caminho: "/checkout", elemento: <PaginaCheckoutBizy /> },
  { caminho: "/compras", elemento: <PaginaPortalComprador /> },
  { caminho: "/compras/:id", elemento: <PaginaCompraUnificada /> },
  { caminho: "/f/:slug/lead", elemento: <PaginaFormularioLeadPublico /> },
  { caminho: "/produtos/:codigo", elemento: <PaginaProdutoMarket /> },
  { caminho: "/lojas", elemento: <PaginaDiretorioLojasMarket /> },
  { caminho: "/categorias/:categoria", elemento: <PaginaMarket /> },
  { caminho: "/market/produtos/:codigo", elemento: <PaginaProdutoMarket /> },
  { caminho: "/market/lojas/:slug", elemento: <PaginaLojaMarket /> },
  { caminho: "/market/lojas", elemento: <PaginaDiretorioLojasMarket /> },
  { caminho: "/lojas-market/:slug", elemento: <PaginaLojaMarket /> },
  { caminho: "/market/categorias/:categoria", elemento: <PaginaMarket /> },
  { caminho: "/market", elemento: <PaginaMarket /> },
  { caminho: "/learning", elemento: <PaginaLearning /> },
  { caminho: "/learning/produtos/:slug", elemento: <PaginaProdutoLearning /> },
  { caminho: "/learning/:slug", elemento: <PaginaPerfilLearning /> },
  { caminho: "/lojas/:slug/catalogos/:catalogo", elemento: <PaginaCatalogoPublico /> },
  { caminho: "/lojas/:slug/produtos/:codigo", elemento: <PaginaLojaDigitalPublica /> },
  { caminho: "/lojas/:slug", elemento: <PaginaLojaDigitalPublica /> }
];

export const rotasComerciais: RotaPrivada[] = [
  // ── Hoje (Camada 1 — sempre visível) ──
  { caminho: "/app", icone: <LayoutDashboard size={20} />, rotulo: "Comando do dia", secao: "Hoje", elemento: <PaginaPainel />, fim: true },
  { caminho: "/app/live", icone: <Radio size={20} />, rotulo: "Central de live", secao: "Hoje", elemento: <PaginaLive /> },

  // ── Vendas (Camada 1 — sempre visível) ──
  { caminho: "/app/reservas", icone: <ReceiptText size={20} />, rotulo: "Pedidos", secao: "Vendas", elemento: <PaginaReservas /> },
  { caminho: "/app/tarefas", icone: <CheckSquare size={20} />, rotulo: "Tarefas", secao: "Vendas", elemento: <PaginaTarefas /> },
  { caminho: "/app/conversas", icone: <MessageCircle size={20} />, rotulo: "Atendimento", secao: "Vendas", elemento: <PaginaConversas /> },
  { caminho: "/app/clientes", icone: <Users size={20} />, rotulo: "Clientes", secao: "Vendas", elemento: <PaginaClientes /> },
  { caminho: "/app/recuperacao", icone: <Repeat2 size={20} />, rotulo: "Recuperação", secao: "Vendas", elemento: <PaginaRecuperacao />, modulo: "automacoes" },
  { caminho: "/app/campanhas", icone: <Megaphone size={20} />, rotulo: "Campanhas", secao: "Vendas", elemento: <PaginaCampanhas />, modulo: "automacoes" },
  { caminho: "/app/social-inbox", icone: <Inbox size={20} />, rotulo: "Social Inbox", secao: "Vendas", elemento: <PaginaSocialInbox />, modulo: "social-inbox" },

  // ── Comercial (Camada 2 — requer módulo activo) ──
  { caminho: "/app/pipeline", icone: <Kanban size={20} />, rotulo: "Fluxo", secao: "Comercial", elemento: <PaginaPipeline />, modulo: "funil" },
  { caminho: "/app/cotacoes", icone: <FileText size={20} />, rotulo: "Cotações", secao: "Comercial", elemento: <PaginaCotacoes />, modulo: "funil" },
  { caminho: "/app/agenda", icone: <Calendar size={20} />, rotulo: "Agenda", secao: "Comercial", elemento: <PaginaAgenda />, modulo: "funil" },
  { caminho: "/app/metas", icone: <Target size={20} />, rotulo: "Metas", secao: "Comercial", elemento: <PaginaMetas />, modulo: "funil" },
  { caminho: "/app/respostas-rapidas", icone: <MessageSquareText size={20} />, rotulo: "Respostas rápidas", secao: "Comercial", elemento: <PaginaRespostasRapidas />, modulo: "funil" },
  { caminho: "/app/actividades", icone: <MessageSquare size={20} />, rotulo: "Notas", secao: "Comercial", elemento: <PaginaActividades />, modulo: "funil" },
  { caminho: "/app/formularios", icone: <ClipboardList size={20} />, rotulo: "Formulários", secao: "Comercial", elemento: <PaginaFormularios />, modulo: "funil" },
  { caminho: "/app/sequencias", icone: <Workflow size={20} />, rotulo: "Sequências", secao: "Comercial", elemento: <PaginaSequencias />, modulo: "automacoes" },

  // ── Vitrine (Camada 1 parcial + Camada 2) ──
  { caminho: "/app/catalogo", icone: <Package size={20} />, rotulo: "Produtos", secao: "Vitrine", elemento: <PaginaCatalogo /> },
  { caminho: "/app/loja", icone: <Store size={20} />, rotulo: "Bizy Studio", secao: "Vitrine", elemento: <PaginaLojaPublica />, modulo: "loja-publica" },
  { caminho: "/app/market/seller", icone: <Package size={20} />, rotulo: "Portal seller", secao: "Vitrine", elemento: <PaginaPortalSeller />, modulo: "market" },
  { caminho: "/app/afiliados", icone: <BadgeDollarSign size={20} />, rotulo: "Afiliados", secao: "Vitrine", elemento: <PaginaAfiliados />, modulo: "afiliados" },

  // ── Gestão ──
  { caminho: "/app/relatorios", icone: <LineChart size={20} />, rotulo: "Desempenho", secao: "Gestão", elemento: <PaginaRelatorios /> },
  { caminho: "/app/equipa", icone: <UsersRound size={20} />, rotulo: "Equipa", secao: "Gestão", elemento: <PaginaEquipa /> },
  { caminho: "/app/learning", icone: <GraduationCap size={20} />, rotulo: "Learning", secao: "Gestão", elemento: <PaginaLearningTeam /> },
  { caminho: "/app/learning/produtor", icone: <BookOpenCheck size={20} />, rotulo: "Produtor Learning", secao: "Gestão", elemento: <PaginaPortalProdutorLearning /> },
  { caminho: "/app/projectos", icone: <Workflow size={20} />, rotulo: "Projectos", secao: "Gestão", elemento: <PaginaProjectos /> },
  { caminho: "/app/financas", icone: <Wallet size={20} />, rotulo: "Finanças", secao: "Gestão", elemento: <PaginaFinancas /> },
  { caminho: "/app/pagamentos", icone: <CreditCard size={20} />, rotulo: "Pagamentos", secao: "Gestão", elemento: <PaginaPagamentos /> },
  { caminho: "/app/administracao", icone: <Settings size={20} />, rotulo: "Administração", secao: "Gestão", elemento: <PaginaAdministracao /> }
];

export const rotasAdminSistema: RotaPrivada[] = [
  { caminho: "/app/comentarios", icone: <MessageSquareText size={20} />, rotulo: "Live monitor", secao: "Admin/Sistema", elemento: <PaginaComentarios />, requerAdminSistema: true },
  { caminho: "/app/diagnosticos", icone: <Smartphone size={20} />, rotulo: "Diagnósticos SMS", secao: "Admin/Sistema", elemento: <PaginaDiagnosticos />, requerAdminSistema: true },
  { caminho: "/app/auditoria", icone: <Shield size={20} />, rotulo: "Auditoria", secao: "Admin/Sistema", elemento: <PaginaAuditoria />, requerAdminSistema: true },
  { caminho: "/app/inteligencia", icone: <Brain size={20} />, rotulo: "Inteligência", secao: "Admin/Sistema", elemento: <PaginaInteligencia />, requerAdminSistema: true }
];

export const caminhosCrmV3Principais = ["/app", "/app/reservas", "/app/conversas", "/app/tarefas", "/app/clientes", "/app/metas", "/app/equipa", "/app/learning", "/app/projectos", "/app/financas", "/app/live", "/app/loja", "/app/relatorios"] as const;
export const rotulosCrmV3Principais = ["Início", "Pedidos", "Atendimento", "Tarefas", "Clientes", "Metas", "Equipa", "Learning", "Projectos", "Finanças", "Live", "Studio", "Relatórios"] as const;

export const rotasCrmV3Principais: RotaPrivada[] = caminhosCrmV3Principais.reduce<RotaPrivada[]>((rotas, caminho, indice) => {
  const rota = rotasComerciais.find((item) => item.caminho === caminho);
  if (rota) rotas.push({ ...rota, rotulo: rotulosCrmV3Principais[indice] });
  return rotas;
}, []);

export const rotasPrivadas: RotaPrivada[] = [...rotasComerciais, ...rotasAdminSistema];

export const rotasPrivadasOcultas: RotaPrivadaOculta[] = [
  { caminho: "/onboarding", elemento: <PaginaOnboarding /> },
  { caminho: "/app/governance/anani", elemento: <PaginaAnaniGovernance />, requerGovernancaAnani: true },
  { caminho: "/app/loja-publica", elemento: <PaginaLojaPublica />, modulo: "loja-publica" }
];

export const secoesNavegacao: SecaoNavegacao[] = ["Hoje", "Vendas", "Comercial", "Vitrine", "Gestão", "Admin/Sistema"];
export const secoesComerciais: SecaoNavegacao[] = ["Hoje", "Vendas", "Comercial", "Vitrine", "Gestão"];

export function usuarioPodeVerAdminSistema(papel?: string | null): boolean {
  const normalizado = papel?.trim().toUpperCase() ?? "";
  return normalizado.includes("ADMIN") || normalizado.includes("DONO") || normalizado.includes("OWNER");
}

export function usuarioPodeGovernarAnani(papel?: string | null): boolean {
  const normalizado = papel?.trim().toUpperCase() ?? "";
  return ["GOVERNANTE_BIZY", "ADMIN_GERAL", "SUPER_ADMIN_PLATFORM"].includes(normalizado);
}

export function filtrarRotasPorModulos(rotas: RotaPrivada[], modulosAtivos: string[]): RotaPrivada[] {
  return rotas.filter((rota) => !rota.modulo || modulosAtivos.includes(rota.modulo));
}

export function secoesVisiveis(rotas: RotaPrivada[]): SecaoNavegacao[] {
  const secoes = new Set(rotas.map((r) => r.secao));
  return secoesNavegacao.filter((s) => secoes.has(s));
}
