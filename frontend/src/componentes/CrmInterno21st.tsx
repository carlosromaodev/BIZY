import { type ReactNode } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TomCrm = "neutro" | "principal" | "sucesso" | "atencao" | "perigo" | "info";

const tonsItem = {
  neutro: "text-muted-foreground",
  principal: "text-primary",
  sucesso: "text-success",
  atencao: "text-warning",
  perigo: "text-destructive",
  info: "text-info"
} satisfies Record<TomCrm, string>;

const tonsItemBg = {
  neutro: "",
  principal: "bg-black/[0.03]",
  sucesso: "bg-emerald-50",
  atencao: "bg-amber-50",
  perigo: "bg-red-50",
  info: "bg-blue-50"
} satisfies Record<TomCrm, string>;

export function CrmPageMotion({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("crm-market-page crm-cal-shell grid gap-5", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.8 }}
    >
      {children}
    </motion.div>
  );
}

export function CrmSection({
  children,
  className,
  description,
  icon,
  title,
  actions
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  icon?: ReactNode;
  title?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("crm21-section grid gap-4", className)}>
      {(title || description || actions) && (
        <div className="crm21-section-header flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <span className="crm21-section-icon text-primary">{icon}</span>}
            <div className="min-w-0">
              {title && <h2 className="crm21-section-title font-heading text-base font-semibold leading-tight text-foreground">{title}</h2>}
              {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
        </div>
      )}
      <div className="grid gap-0">{children}</div>
    </section>
  );
}

export function CrmFilterDock({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("crm-market-filter-dock grid gap-2", className)} {...props}>
      {children}
    </div>
  );
}

export function CrmCommandPanel({
  actions,
  children,
  className,
  description,
  eyebrow,
  title
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className={cn("crm-command-panel", className)}>
      <div className="crm-command-panel-copy">
        {eyebrow && <p className="crm-command-panel-eyebrow">{eyebrow}</p>}
        <h2 className="crm-command-panel-title">{title}</h2>
        {description && <p className="crm-command-panel-description">{description}</p>}
      </div>
      <div className="crm-command-panel-body">{children}</div>
      {actions && <div className="crm-command-panel-actions">{actions}</div>}
    </section>
  );
}

export function CrmCommandMetric({
  detail,
  icon,
  label,
  tone = "neutro",
  value
}: {
  detail?: ReactNode;
  icon?: ReactNode;
  label: string;
  tone?: TomCrm;
  value: ReactNode;
}) {
  return (
    <div className={cn("crm-command-metric", `crm-command-metric-${tone}`)}>
      {icon && <span className="crm-command-metric-icon">{icon}</span>}
      <span className="crm-command-metric-label">{label}</span>
      <strong className="crm-command-metric-value">{value}</strong>
      {detail && <small className="crm-command-metric-detail">{detail}</small>}
    </div>
  );
}

export function CrmList({
  children,
  className,
  columns = "one",
  ...props
}: React.ComponentProps<"div"> & {
  columns?: "one" | "two" | "three";
}) {
  return (
    <div
      className={cn(
        "crm21-list",
        columns === "two" && "grid gap-4 lg:grid-cols-2",
        columns === "three" && "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
        columns === "one" && "grid gap-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CrmListItem({
  actions,
  badges,
  children,
  className,
  description,
  media,
  meta,
  title,
  tone = "neutro"
}: {
  actions?: ReactNode;
  badges?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  media?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
  tone?: TomCrm;
}) {
  return (
    <div className={cn("crm21-item flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0 rounded-lg px-2 -mx-2 transition-colors", tonsItemBg[tone], className)}>
      {media && (
        <span className={cn("crm21-item-media mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-(--color-surface-warm)", tonsItem[tone])}>
          {media}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="crm21-item-title truncate text-sm font-medium text-foreground">{title}</span>
          {meta && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{meta}</span>}
        </div>
        {description && <p className="crm21-item-description mt-0.5 truncate text-xs text-muted-foreground">{description}</p>}
        {badges && <div className="mt-1.5 flex flex-wrap gap-1">{badges}</div>}
        {children && <div className="mt-2">{children}</div>}
      </div>
      {actions && <div className="crm21-item-actions flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
    </div>
  );
}

export function CrmMetricMini({
  label,
  value,
  tone = "neutro"
}: {
  label: string;
  value: ReactNode;
  tone?: TomCrm;
}) {
  return (
    <span className={cn("crm21-mini-metric", `crm21-mini-metric-${tone}`)}>
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  );
}

export function CrmStatusBadge({
  children,
  tone = "neutro"
}: {
  children: ReactNode;
  tone?: TomCrm;
}) {
  const variantByTone = {
    neutro: "secondary",
    principal: "default",
    sucesso: "success",
    atencao: "warning",
    perigo: "destructive",
    info: "info"
  } as const;

  return <Badge variant={variantByTone[tone]}>{children}</Badge>;
}
