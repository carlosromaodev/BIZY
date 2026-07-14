import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Boxes,
  CalendarDays,
  CreditCard,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  Library,
  MessageCircle,
  Settings,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

export type AreaLearningTeam =
  | "visao-geral"
  | "programas"
  | "conteudos"
  | "pessoas"
  | "avaliacoes"
  | "certificados"
  | "turmas"
  | "comunidade"
  | "biblioteca"
  | "relatorios"
  | "chat"
  | "compras"
  | "configuracoes";

type ItemLearningTeam = {
  area: AreaLearningTeam;
  caminho: string;
  rotulo: string;
  icone: LucideIcon;
};

export const ITENS_LEARNING_TEAM: ItemLearningTeam[] = [
  { area: "visao-geral", caminho: "/app/learning", rotulo: "Visão geral", icone: LayoutDashboard },
  { area: "programas", caminho: "/app/learning/programas", rotulo: "Programas", icone: GraduationCap },
  { area: "conteudos", caminho: "/app/learning/conteudos", rotulo: "Conteúdos", icone: BookOpen },
  { area: "pessoas", caminho: "/app/learning/pessoas", rotulo: "Pessoas", icone: Users },
  { area: "avaliacoes", caminho: "/app/learning/avaliacoes", rotulo: "Avaliações", icone: FileQuestion },
  { area: "certificados", caminho: "/app/learning/certificados", rotulo: "Certificados", icone: BadgeCheck },
  { area: "turmas", caminho: "/app/learning/turmas", rotulo: "Turmas", icone: CalendarDays },
  { area: "comunidade", caminho: "/app/learning/comunidade", rotulo: "Comunidade", icone: Boxes },
  { area: "biblioteca", caminho: "/app/learning/biblioteca", rotulo: "Biblioteca", icone: Library },
  { area: "relatorios", caminho: "/app/learning/relatorios", rotulo: "Relatórios", icone: BarChart3 },
  { area: "chat", caminho: "/app/learning/chat", rotulo: "Chat", icone: MessageCircle },
  { area: "compras", caminho: "/app/learning/compras", rotulo: "Compras", icone: CreditCard },
  { area: "configuracoes", caminho: "/app/learning/configuracoes", rotulo: "Configurações", icone: Settings }
];

export function resolverAreaLearningTeam(pathname: string): AreaLearningTeam {
  const item = ITENS_LEARNING_TEAM.find(({ caminho }) => caminho !== "/app/learning" && pathname.startsWith(caminho));
  return item?.area ?? "visao-geral";
}

export function NavegacaoLearningTeam() {
  return (
    <nav className="learning-team-nav" aria-label="Áreas do Learning">
      {ITENS_LEARNING_TEAM.map(({ caminho, rotulo, icone: Icone }) => (
        <NavLink
          key={caminho}
          to={caminho}
          end={caminho === "/app/learning"}
          className={({ isActive }) => `learning-team-nav-item${isActive ? " is-active" : ""}`}
        >
          <Icone size={16} aria-hidden="true" />
          <span>{rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AtalhosLearningTeam() {
  return (
    <section className="learning-team-shortcuts" aria-labelledby="learning-team-shortcuts-title">
      <div>
        <h2 id="learning-team-shortcuts-title">Operações Learning</h2>
        <p>Escolha uma área para gerir o trabalho sem misturar contextos na mesma página.</p>
      </div>
      <div className="learning-team-shortcuts-grid">
        {ITENS_LEARNING_TEAM.filter(({ area }) => area !== "visao-geral").map(({ caminho, rotulo, icone: Icone }) => (
          <NavLink key={caminho} to={caminho} className="learning-team-shortcut">
            <Icone size={18} aria-hidden="true" />
            <span>{rotulo}</span>
          </NavLink>
        ))}
      </div>
    </section>
  );
}
