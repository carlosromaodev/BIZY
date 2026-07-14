/**
 * BizyDesignSystem.tsx — Componentes reutilizáveis da identidade visual Bizy
 *
 * Base operacional inspirada em Carbon Design System:
 * layers planas, comandos claros, tabelas operaveis e estados com proxima acao.
 */
import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type LucideIcon, ArrowRight, ArrowUpRight, Search, ChevronDown } from "lucide-react";
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
  acaoTexto,
  acaoRota,
  onAcao,
  className,
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
  acaoTexto?: string;
  acaoRota?: string;
  onAcao?: () => void;
  className?: string;
}) {
  const accao = acaoTexto && (acaoRota || onAcao);

  return (
    <div className={cn("bz-kpi", hero && "bz-kpi-hero", accao && "bz-kpi-actionable", className)}>
      <div className={cn("bz-kpi-chip", !hero && `chip-${cor}`)}>
        <Icone size={19} aria-hidden="true" />
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
        {accao && (
          acaoRota ? (
            <Link className="bz-kpi-action" to={acaoRota}>
              {acaoTexto} <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" className="bz-kpi-action" onClick={onAcao}>
              {acaoTexto} <ArrowRight size={14} aria-hidden="true" />
            </button>
          )
        )}
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
  descricao,
  linkTexto,
  linkRota,
  acaoTexto,
  acaoRota,
  onAcao,
  acaoIcone: AcaoIcone,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  linkTexto?: string;
  linkRota?: string;
  acaoTexto?: string;
  acaoRota?: string;
  onAcao?: () => void;
  acaoIcone?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const temAcao = acaoTexto && (acaoRota || onAcao);

  return (
    <div className={cn("bz-panel", className)}>
      <div className="bz-panel-head">
        <div className="bz-panel-heading">
          <span className="bz-panel-title">{titulo}</span>
          {descricao && <span className="bz-panel-desc">{descricao}</span>}
        </div>
        <div className="bz-panel-actions">
          {linkTexto && linkRota && (
            <Link to={linkRota} className="bz-panel-link">
              {linkTexto} <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          )}
          {temAcao && (
            acaoRota ? (
              <Link to={acaoRota} className="bz-panel-action">
                {AcaoIcone && <AcaoIcone size={14} aria-hidden="true" />}
                {acaoTexto}
              </Link>
            ) : (
              <button type="button" className="bz-panel-action" onClick={onAcao}>
                {AcaoIcone && <AcaoIcone size={14} aria-hidden="true" />}
                {acaoTexto}
              </button>
            )
          )}
        </div>
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
      <Icone size={Math.round(tamanho * 0.47)} aria-hidden="true" />
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
  const [imgErro, setImgErro] = useState(false);
  const mostrarImg = Boolean(src) && !imgErro;

  return (
    <span
      className={cn("bz-avatar", `av-${cor}`, className)}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
    >
      {mostrarImg ? (
        <img className="bz-avatar-img" src={src!} alt={alt ?? iniciais} loading="lazy" referrerPolicy="no-referrer" onError={() => setImgErro(true)} />
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
        <Icone size={18} aria-hidden="true" />
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
    <div className="bz-tabs" role="tablist" aria-label="Secoes">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={activo === t.id}
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
  children,
}: {
  placeholder?: string;
  valorBusca: string;
  onBuscaChange: (v: string) => void;
  selectOpcoes?: { id: string; rotulo: string }[];
  selectValor?: string;
  onSelectChange?: (v: string) => void;
  children?: ReactNode;
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
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      )}
      {children && <div className="bz-toolbar-actions">{children}</div>}
    </div>
  );
}

/* ── Data Table ───────────────────────────────────────────────── */

export function TableCard({
  children,
  className,
  titulo,
  descricao,
  acoes,
}: {
  children: ReactNode;
  className?: string;
  titulo?: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className={cn("bz-tablecard", className)}>
      {(titulo || descricao || acoes) && (
        <div className="bz-tablecard-head">
          <div>
            {titulo && <h2 className="bz-tablecard-title">{titulo}</h2>}
            {descricao && <p className="bz-tablecard-desc">{descricao}</p>}
          </div>
          {acoes && <div className="bz-tablecard-actions">{acoes}</div>}
        </div>
      )}
      {children}
    </div>
  );
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
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  variante?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";
  icone?: LucideIcon;
  onClick?: () => void;
  className?: string;
  tipo?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type={tipo}
      className={cn(
        "bz-btn",
        variante !== "primary" && `bz-btn-${variante}`,
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {Icone && <Icone size={16} aria-hidden="true" />}
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
  disabled,
}: {
  icone: LucideIcon;
  solid?: boolean;
  onClick?: () => void;
  titulo?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn("bz-iconbtn", solid && "bz-iconbtn-solid")}
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      disabled={disabled}
    >
      <Icone size={16} aria-hidden="true" />
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
  descricao,
  tamanhoTitulo = "normal",
  children,
}: {
  eyebrow: string;
  titulo: string;
  descricao?: string;
  tamanhoTitulo?: "normal" | "sm";
  children?: ReactNode;
}) {
  return (
    <div className="bz-page-head">
      <div className="bz-page-head-copy">
        <p className="bz-eyebrow"><span className="bz-pip" />{eyebrow}</p>
        <h1 className={cn("bz-title", tamanhoTitulo === "sm" && "bz-title-sm")}>{titulo}</h1>
        {descricao && <p className="bz-page-desc">{descricao}</p>}
      </div>
      {children && <div className="bz-head-aside">{children}</div>}
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────── */

export function EmptyStateBizy({
  icone,
  titulo,
  detalhe,
  acaoTexto,
  acaoRota,
  onAcao,
  className,
}: {
  icone: ReactNode;
  titulo: string;
  detalhe: string;
  acaoTexto?: string;
  acaoRota?: string;
  onAcao?: () => void;
  className?: string;
}) {
  const temAcao = acaoTexto && (acaoRota || onAcao);

  return (
    <div className={cn("bz-empty-state", className)}>
      <span className="bz-empty-icon" aria-hidden="true">{icone}</span>
      <div className="bz-empty-copy">
        <strong>{titulo}</strong>
        <span>{detalhe}</span>
      </div>
      {temAcao && (
        acaoRota ? (
          <Link className="bz-empty-action" to={acaoRota}>
            {acaoTexto} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" className="bz-empty-action" onClick={onAcao}>
            {acaoTexto} <ArrowRight size={14} aria-hidden="true" />
          </button>
        )
      )}
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

export function AvisoPrivacidade({
  escopo = "publico",
  texto,
}: {
  escopo?: string;
  texto?: string | null;
}) {
  const chave = `bizy_privacidade_aceite_${escopo.replace(/[^a-z0-9_-]/gi, "_")}`;
  const [aceite, setAceite] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(chave) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAceite(window.localStorage.getItem(chave) === "1");
  }, [chave]);

  if (aceite) return null;

  function aceitar() {
    window.localStorage.setItem(chave, "1");
    setAceite(true);
  }

  const textoBase =
    "Esta experiencia usa tracking anonimo para medir origem, produtos vistos e compras iniciadas. Dados pessoais so entram quando ajudam a finalizar a compra; eventos de marketing dependem de consentimento explicito.";

  return (
    <div
      role="alert"
      className="bz-privacy-notice"
    >
      <div className="bz-privacy-notice-inner">
        <p>
          {texto ? `${texto} ${textoBase}` : textoBase}
        </p>
        <button
          type="button"
          onClick={aceitar}
          className="bz-privacy-notice-action"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
