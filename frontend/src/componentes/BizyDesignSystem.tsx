/**
 * BizyDesignSystem.tsx — Componentes reutilizáveis da identidade visual v2
 *
 * Orgânico · amigável · comercial
 * Hierarquia de cor: green (marca), amber (pendente), blue (em curso),
 *                    rose (urgente), violet (VIP)
 */
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { type LucideIcon, ArrowUpRight, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Semantic color type ──────────────────────────────────────── */

export type CorSemantica = "green" | "amber" | "blue" | "rose" | "violet" | "mute";

/* ── KPI Card ─────────────────────────────────────────────────── */

export function KpiCard({
  icone: Icone,
  cor = "green",
  rotulo,
  valor,
  unidade,
  delta,
  deltaPositivo,
  rodape,
  hero = false,
}: {
  icone: LucideIcon;
  cor?: CorSemantica;
  rotulo: string;
  valor: ReactNode;
  unidade?: string;
  delta?: ReactNode;
  deltaPositivo?: boolean;
  rodape?: ReactNode;
  hero?: boolean;
}) {
  return (
    <div className={cn("bz-kpi", hero && "bz-kpi-hero")}>
      <div className={cn("bz-kpi-chip", !hero && `chip-${cor}`)}>
        <Icone size={19} />
      </div>
      <div className="bz-kpi-body">
        <span className="bz-kpi-label">{rotulo}</span>
        <strong className="bz-kpi-value">
          {valor}
          {unidade && <span className="bz-kpi-unit">{unidade}</span>}
        </strong>
        {delta && (
          <span className={cn(
            "bz-kpi-delta",
            deltaPositivo === true && "up",
            deltaPositivo === false && "warn",
            deltaPositivo === undefined && "flat",
          )}>
            {deltaPositivo === true && <ArrowUpRight size={12} />}
            {delta}
          </span>
        )}
        {rodape && <div className="bz-kpi-foot">{rodape}</div>}
      </div>
    </div>
  );
}

/* ── KPI Grid ─────────────────────────────────────────────────── */

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bz-kpi-grid", className)}>{children}</div>;
}

/* ── Panel Card ───────────────────────────────────────────────── */

export function PanelCard({
  titulo,
  linkTexto,
  linkRota,
  children,
  className,
}: {
  titulo: string;
  linkTexto?: string;
  linkRota?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bz-panel", className)}>
      <div className="bz-panel-head">
        <span className="bz-panel-title">{titulo}</span>
        {linkTexto && linkRota && (
          <Link to={linkRota} className="bz-panel-link">
            {linkTexto} <ArrowUpRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Icon Chip ────────────────────────────────────────────────── */

export function IconChip({
  icone: Icone,
  cor = "green",
  tamanho = 38,
}: {
  icone: LucideIcon;
  cor?: CorSemantica;
  tamanho?: number;
}) {
  return (
    <span
      className={cn("bz-icon-chip", `chip-${cor}`)}
      style={{ width: tamanho, height: tamanho }}
    >
      <Icone size={Math.round(tamanho * 0.47)} />
    </span>
  );
}

/* ── Status Badge ─────────────────────────────────────────────── */

export function StatusBadge({
  cor = "mute",
  children,
}: {
  cor?: CorSemantica;
  children: ReactNode;
}) {
  return (
    <span className={cn("bz-badge", `b-${cor}`)}>
      <span className="bz-badge-dot" />
      {children}
    </span>
  );
}

/* ── Avatar ────────────────────────────────────────────────────── */

export function AvatarBizy({
  iniciais,
  cor = "green",
  tamanho = 36,
  src,
  alt,
  className,
}: {
  iniciais: string;
  cor?: CorSemantica;
  tamanho?: number;
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("bz-avatar", `av-${cor}`, className)}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
    >
      {src ? (
        <img className="bz-avatar-img" src={src} alt={alt ?? iniciais} loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        iniciais.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

export function obterCorAvatar(nome: string): CorSemantica {
  const cores: CorSemantica[] = ["green", "violet", "amber", "blue", "rose"];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  return cores[Math.abs(hash) % cores.length];
}

export function obterIniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* ── Attention Row ────────────────────────────────────────────── */

export function AttentionRow({
  icone: Icone,
  cor = "amber",
  titulo,
  detalhe,
  valor,
}: {
  icone: LucideIcon;
  cor?: CorSemantica;
  titulo: string;
  detalhe?: string;
  valor: ReactNode;
}) {
  return (
    <div className="bz-att-row">
      <span className={cn("bz-att-icon", `chip-${cor}`)}>
        <Icone size={18} />
      </span>
      <div className="bz-att-body">
        <div className="bz-att-title">{titulo}</div>
        {detalhe && <div className="bz-att-detail">{detalhe}</div>}
      </div>
      <span className="bz-att-value">{valor}</span>
    </div>
  );
}

/* ── Gauge Bar ────────────────────────────────────────────────── */

export function GaugeBar({
  titulo,
  valor,
  percentagem,
  rodapeEsq,
  rodapeDir,
}: {
  titulo: string;
  valor: ReactNode;
  percentagem: number;
  rodapeEsq?: ReactNode;
  rodapeDir?: ReactNode;
}) {
  return (
    <div className="bz-gauge">
      <div className="bz-gauge-head">
        <span className="bz-gauge-title">{titulo}</span>
        <span className="bz-gauge-value">{valor}</span>
      </div>
      <div className="bz-gauge-track">
        <div className="bz-gauge-fill" style={{ width: `${Math.min(100, percentagem)}%` }} />
      </div>
      {(rodapeEsq || rodapeDir) && (
        <div className="bz-gauge-foot">
          <span>{rodapeEsq}</span>
          <span>{rodapeDir}</span>
        </div>
      )}
    </div>
  );
}

/* ── Filter Chips ─────────────────────────────────────────────── */

export function FilterChips({
  opcoes,
  activo,
  onChange,
}: {
  opcoes: { id: string; rotulo: string; contagem?: number; cor?: string }[];
  activo: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="bz-chips">
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          className={cn("bz-chip-f", activo === o.id && "active")}
          onClick={() => onChange(o.id)}
        >
          {o.cor && <span className="bz-chip-led" style={{ background: o.cor }} />}
          {o.rotulo}
          {o.contagem !== undefined && <span className="bz-chip-count">{o.contagem}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────── */

export function TabsBizy({
  tabs,
  activo,
  onChange,
}: {
  tabs: { id: string; rotulo: string; contagem?: number }[];
  activo: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="bz-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={cn("bz-tab", activo === t.id && "active")}
          onClick={() => onChange(t.id)}
        >
          {t.rotulo}
          {t.contagem !== undefined && <span className="bz-tab-count">{t.contagem}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Toolbar ──────────────────────────────────────────────────── */

export function ToolbarBizy({
  placeholder = "Buscar…",
  valorBusca,
  onBuscaChange,
  selectOpcoes,
  selectValor,
  onSelectChange,
}: {
  placeholder?: string;
  valorBusca: string;
  onBuscaChange: (v: string) => void;
  selectOpcoes?: { id: string; rotulo: string }[];
  selectValor?: string;
  onSelectChange?: (v: string) => void;
}) {
  return (
    <div className="bz-toolbar">
      <div className="bz-toolbar-search">
        <Search size={16} />
        <input
          type="text"
          className="bz-toolbar-input"
          placeholder={placeholder}
          value={valorBusca}
          onChange={(e) => onBuscaChange(e.target.value)}
        />
      </div>
      {selectOpcoes && onSelectChange && (
        <div className="bz-toolbar-select">
          <select
            className="bz-toolbar-select-input"
            value={selectValor}
            onChange={(e) => onSelectChange(e.target.value)}
          >
            {selectOpcoes.map((o) => (
              <option key={o.id} value={o.id}>{o.rotulo}</option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>
      )}
    </div>
  );
}

/* ── Data Table ───────────────────────────────────────────────── */

export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bz-tablecard", className)}>{children}</div>;
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="bz-tbl">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: boolean;
  className?: string;
}) {
  return <th className={cn(right && "bz-tbl-right", className)}>{children}</th>;
}

export function Td({
  children,
  right,
  className,
}: {
  children?: ReactNode;
  right?: boolean;
  className?: string;
}) {
  return <td className={cn(right && "bz-tbl-right", className)}>{children}</td>;
}

/* ── Button ───────────────────────────────────────────────────── */

export function BotaoBizy({
  children,
  variante = "primary",
  icone: Icone,
  onClick,
  className,
  tipo = "button",
}: {
  children: ReactNode;
  variante?: "primary" | "ghost";
  icone?: LucideIcon;
  onClick?: () => void;
  className?: string;
  tipo?: "button" | "submit";
}) {
  return (
    <button
      type={tipo}
      className={cn("bz-btn", variante === "ghost" && "bz-btn-ghost", className)}
      onClick={onClick}
    >
      {Icone && <Icone size={16} />}
      {children}
    </button>
  );
}

/* ── Pill ──────────────────────────────────────────────────────── */

export function PillBizy({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("bz-pill", className)}>{children}</span>;
}

/* ── Icon Button ──────────────────────────────────────────────── */

export function IconButton({
  icone: Icone,
  solid,
  onClick,
  titulo,
}: {
  icone: LucideIcon;
  solid?: boolean;
  onClick?: () => void;
  titulo?: string;
}) {
  return (
    <button
      type="button"
      className={cn("bz-iconbtn", solid && "bz-iconbtn-solid")}
      onClick={onClick}
      title={titulo}
    >
      <Icone size={16} />
    </button>
  );
}

/* ── Two Column Layout ────────────────────────────────────────── */

export function TwoUp({
  children,
  ratio = "1.4fr 1fr",
  className,
}: {
  children: ReactNode;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("bz-two", className)}
      style={{ "--bz-two-cols": ratio } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* ── Page Head ────────────────────────────────────────────────── */

export function PageHead({
  eyebrow,
  titulo,
  tamanhoTitulo = "normal",
  children,
}: {
  eyebrow: string;
  titulo: string;
  tamanhoTitulo?: "normal" | "sm";
  children?: ReactNode;
}) {
  return (
    <div className="bz-page-head">
      <div>
        <p className="bz-eyebrow"><span className="bz-pip" />{eyebrow}</p>
        <h1 className={cn("bz-title", tamanhoTitulo === "sm" && "bz-title-sm")}>{titulo}</h1>
      </div>
      {children && <div className="bz-head-aside">{children}</div>}
    </div>
  );
}

/* ── Money Format ─────────────────────────────────────────────── */

export function Money({
  valor,
  muted,
}: {
  valor: number;
  muted?: boolean;
}) {
  const formatado = new Intl.NumberFormat("pt-AO", { useGrouping: true }).format(valor);
  return (
    <span className={cn("bz-money", muted && "bz-money-muted")}>
      {formatado} Kz
    </span>
  );
}
