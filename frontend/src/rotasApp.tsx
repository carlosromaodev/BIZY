import {
  BadgeDollarSign,
  Calendar,
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
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
  Workflow
} from "lucide-react";
import type { ReactNode } from "react";
import { PaginaActividades } from "./paginas/Actividades";
import { PaginaAdministracao } from "./paginas/Administracao";
import { PaginaAfiliados } from "./paginas/Afiliados";
import { PaginaAgenda } from "./paginas/Agenda";
import { PaginaCatalogo } from "./paginas/Catalogo";
import { PaginaClientes } from "./paginas/Clientes";
import { PaginaComentarios } from "./paginas/Comentarios";
import { PaginaConversas } from "./paginas/Conversas";
import { PaginaCotacoes } from "./paginas/Cotacoes";
import { PaginaFormularios } from "./paginas/Formularios";
import { PaginaHome } from "./paginas/Home";
import { PaginaLive } from "./paginas/Live";
import { PaginaLogin } from "./paginas/Login";
import { PaginaLojaDigitalPublica } from "./paginas/LojaDigitalPublica";
import { PaginaLojaPublica } from "./paginas/LojaPublica";
import { PaginaMetas } from "./paginas/Metas";
import { PaginaOnboarding } from "./paginas/Onboarding";
import { PaginaPainel } from "./paginas/Painel";
import { PaginaPipeline } from "./paginas/Pipeline";
import { PaginaRecuperacao } from "./paginas/Recuperacao";
import { PaginaRelatorios } from "./paginas/Relatorios";
import { PaginaRespostasRapidas } from "./paginas/RespostasRapidas";
import { PaginaReservas } from "./paginas/Reservas";
import { PaginaTarefas } from "./paginas/Tarefas";
import { PaginaSequencias } from "./paginas/Sequencias";
import { PaginaCampanhas } from "./paginas/Campanhas";
import { PaginaEquipa } from "./paginas/Equipa";
import { PaginaSocialInbox } from "./paginas/SocialInbox";
import { PaginaDiagnosticos } from "./paginas/Diagnosticos";
import { PaginaAuditoria } from "./paginas/Auditoria";
import { PaginaPagamentos } from "./paginas/Pagamentos";
import { temSubdominioLojaPublica } from "./lojaSubdominio";

export type SecaoNavegacao = "Hoje" | "Vendas" | "CRM" | "Vitrine" | "Gestão" | "Admin/Sistema";

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
  modulo?: string;
}

function PaginaEntradaPublica() {
  return temSubdominioLojaPublica() ? <PaginaLojaDigitalPublica /> : <PaginaHome />;
}

export const rotasPublicas: RotaPublica[] = [
  { caminho: "/", elemento: <PaginaEntradaPublica /> },
  { caminho: "/login", elemento: <PaginaLogin /> },
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
  { caminho: "/app/social-inbox", icone: <Inbox size={20} />, rotulo: "Social Inbox", secao: "Vendas", elemento: <PaginaSocialInbox /> },

  // ── CRM (Camada 2 — requer módulo activo) ──
  { caminho: "/app/pipeline", icone: <Kanban size={20} />, rotulo: "Pipeline", secao: "CRM", elemento: <PaginaPipeline />, modulo: "funil" },
  { caminho: "/app/cotacoes", icone: <FileText size={20} />, rotulo: "Cotações", secao: "CRM", elemento: <PaginaCotacoes />, modulo: "funil" },
  { caminho: "/app/agenda", icone: <Calendar size={20} />, rotulo: "Agenda", secao: "CRM", elemento: <PaginaAgenda />, modulo: "funil" },
  { caminho: "/app/metas", icone: <Target size={20} />, rotulo: "Metas", secao: "CRM", elemento: <PaginaMetas />, modulo: "funil" },
  { caminho: "/app/respostas-rapidas", icone: <MessageSquareText size={20} />, rotulo: "Respostas rápidas", secao: "CRM", elemento: <PaginaRespostasRapidas />, modulo: "funil" },
  { caminho: "/app/actividades", icone: <MessageSquare size={20} />, rotulo: "Notas", secao: "CRM", elemento: <PaginaActividades />, modulo: "funil" },
  { caminho: "/app/formularios", icone: <ClipboardList size={20} />, rotulo: "Formulários", secao: "CRM", elemento: <PaginaFormularios />, modulo: "funil" },
  { caminho: "/app/sequencias", icone: <Workflow size={20} />, rotulo: "Sequências", secao: "CRM", elemento: <PaginaSequencias />, modulo: "automacoes" },

  // ── Vitrine (Camada 1 parcial + Camada 2) ──
  { caminho: "/app/catalogo", icone: <Package size={20} />, rotulo: "Produtos", secao: "Vitrine", elemento: <PaginaCatalogo /> },
  { caminho: "/app/loja-publica", icone: <Store size={20} />, rotulo: "Loja Digital", secao: "Vitrine", elemento: <PaginaLojaPublica />, modulo: "loja-publica" },
  { caminho: "/app/afiliados", icone: <BadgeDollarSign size={20} />, rotulo: "Afiliados", secao: "Vitrine", elemento: <PaginaAfiliados />, modulo: "afiliados" },

  // ── Gestão ──
  { caminho: "/app/relatorios", icone: <LineChart size={20} />, rotulo: "Desempenho", secao: "Gestão", elemento: <PaginaRelatorios /> },
  { caminho: "/app/equipa", icone: <UsersRound size={20} />, rotulo: "Equipa", secao: "Gestão", elemento: <PaginaEquipa /> },
  { caminho: "/app/pagamentos", icone: <CreditCard size={20} />, rotulo: "Pagamentos", secao: "Gestão", elemento: <PaginaPagamentos /> },
  { caminho: "/app/administracao", icone: <Settings size={20} />, rotulo: "Administração", secao: "Gestão", elemento: <PaginaAdministracao /> }
];

export const rotasAdminSistema: RotaPrivada[] = [
  { caminho: "/app/comentarios", icone: <MessageSquareText size={20} />, rotulo: "Live monitor", secao: "Admin/Sistema", elemento: <PaginaComentarios />, requerAdminSistema: true },
  { caminho: "/app/diagnosticos", icone: <Smartphone size={20} />, rotulo: "Diagnósticos SMS", secao: "Admin/Sistema", elemento: <PaginaDiagnosticos />, requerAdminSistema: true },
  { caminho: "/app/auditoria", icone: <Shield size={20} />, rotulo: "Auditoria", secao: "Admin/Sistema", elemento: <PaginaAuditoria />, requerAdminSistema: true },
];

export const rotasPrivadas: RotaPrivada[] = [...rotasComerciais, ...rotasAdminSistema];

export const rotasPrivadasOcultas: RotaPublica[] = [
  { caminho: "/onboarding", elemento: <PaginaOnboarding /> }
];

export const secoesNavegacao: SecaoNavegacao[] = ["Hoje", "Vendas", "CRM", "Vitrine", "Gestão", "Admin/Sistema"];
export const secoesComerciais: SecaoNavegacao[] = ["Hoje", "Vendas", "CRM", "Vitrine", "Gestão"];

export function usuarioPodeVerAdminSistema(papel?: string | null): boolean {
  const normalizado = papel?.trim().toUpperCase() ?? "";
  return normalizado.includes("ADMIN") || normalizado.includes("DONO") || normalizado.includes("OWNER");
}

export function filtrarRotasPorModulos(rotas: RotaPrivada[], modulosAtivos: string[]): RotaPrivada[] {
  if (modulosAtivos.length === 0) return rotas;
  return rotas.filter((rota) => !rota.modulo || modulosAtivos.includes(rota.modulo));
}

export function secoesVisiveis(rotas: RotaPrivada[]): SecaoNavegacao[] {
  const secoes = new Set(rotas.map((r) => r.secao));
  return secoesNavegacao.filter((s) => secoes.has(s));
}
