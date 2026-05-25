import {
  BarChart3,
  GitBranch,
  LineChart,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  Package,
  ReceiptText,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import { PaginaAgentes } from "./paginas/Agentes";
import { PaginaCampanhas } from "./paginas/Campanhas";
import { PaginaCatalogo } from "./paginas/Catalogo";
import { PaginaClientes } from "./paginas/Clientes";
import { PaginaComentarios } from "./paginas/Comentarios";
import { PaginaConexaoWhatsApp } from "./paginas/ConexaoWhatsApp";
import { PaginaConfiguracoes } from "./paginas/Configuracoes";
import { PaginaConversas } from "./paginas/Conversas";
import { PaginaHome } from "./paginas/Home";
import { PaginaIntegracaoN8n } from "./paginas/IntegracaoN8n";
import { PaginaLogin } from "./paginas/Login";
import { PaginaOnboarding } from "./paginas/Onboarding";
import { PaginaPainel } from "./paginas/Painel";
import { PaginaRelatorios } from "./paginas/Relatorios";
import { PaginaReservas } from "./paginas/Reservas";

export type SecaoNavegacao = "CRM" | "Loja" | "Admin/Sistema";

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
}

export const rotasPublicas: RotaPublica[] = [
  { caminho: "/", elemento: <PaginaHome /> },
  { caminho: "/login", elemento: <PaginaLogin /> }
];

export const rotasComerciais: RotaPrivada[] = [
  { caminho: "/app", icone: <BarChart3 size={20} />, rotulo: "Painel", secao: "CRM", elemento: <PaginaPainel />, fim: true },
  { caminho: "/app/reservas", icone: <ReceiptText size={20} />, rotulo: "Pedidos", secao: "CRM", elemento: <PaginaReservas /> },
  { caminho: "/app/catalogo", icone: <Package size={20} />, rotulo: "Produtos", secao: "Loja", elemento: <PaginaCatalogo /> },
  { caminho: "/app/clientes", icone: <Users size={20} />, rotulo: "Clientes", secao: "CRM", elemento: <PaginaClientes /> },
  { caminho: "/app/conversas", icone: <MessageCircle size={20} />, rotulo: "Conversas", secao: "CRM", elemento: <PaginaConversas /> },
  { caminho: "/app/campanhas", icone: <Megaphone size={20} />, rotulo: "Campanhas", secao: "Loja", elemento: <PaginaCampanhas /> },
  { caminho: "/app/relatorios", icone: <LineChart size={20} />, rotulo: "Relatórios", secao: "Loja", elemento: <PaginaRelatorios /> },
  { caminho: "/app/configuracoes", icone: <Settings size={20} />, rotulo: "Config. Loja", secao: "Loja", elemento: <PaginaConfiguracoes /> }
];

export const rotasAdminSistema: RotaPrivada[] = [
  { caminho: "/app/comentarios", icone: <MessageSquareText size={20} />, rotulo: "Live", secao: "Admin/Sistema", elemento: <PaginaComentarios />, requerAdminSistema: true },
  { caminho: "/app/whatsapp", icone: <Smartphone size={20} />, rotulo: "WhatsApp técnico", secao: "Admin/Sistema", elemento: <PaginaConexaoWhatsApp />, requerAdminSistema: true },
  { caminho: "/app/agentes", icone: <SlidersHorizontal size={20} />, rotulo: "Saúde", secao: "Admin/Sistema", elemento: <PaginaAgentes />, requerAdminSistema: true },
  { caminho: "/app/n8n", icone: <GitBranch size={20} />, rotulo: "n8n", secao: "Admin/Sistema", elemento: <PaginaIntegracaoN8n />, requerAdminSistema: true }
];

export const rotasPrivadas: RotaPrivada[] = [...rotasComerciais, ...rotasAdminSistema];

export const rotasPrivadasOcultas: RotaPublica[] = [
  { caminho: "/onboarding", elemento: <PaginaOnboarding /> }
];

export const secoesNavegacao: SecaoNavegacao[] = ["CRM", "Loja", "Admin/Sistema"];
export const secoesComerciais: SecaoNavegacao[] = ["CRM", "Loja"];

export function usuarioPodeVerAdminSistema(papel?: string | null): boolean {
  const normalizado = papel?.trim().toUpperCase() ?? "";
  return normalizado.includes("ADMIN") || normalizado.includes("DONO") || normalizado.includes("OWNER");
}
