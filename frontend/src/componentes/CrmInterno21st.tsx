import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TomCrm = "neutro" | "principal" | "sucesso" | "atencao" | "perigo" | "info";

const tonsItem = {
  neutro: "bg-background text-foreground",
  principal: "bg-primary/10 text-primary",
  sucesso: "bg-success/10 text-success",
  atencao: "bg-warning/10 text-warning",
  perigo: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info"
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
      className={cn("crm-market-page grid gap-5", className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
    <Card className={cn("crm21-section", className)}>
      {(title || description || actions) && (
        <CardHeader className="crm21-section-header flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <div className="crm21-section-icon">{icon}</div>}
            <div className="min-w-0">
              {title && <h2 className="crm21-section-title text-base font-semibold leading-tight text-foreground">{title}</h2>}
              {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
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
        <div className="grid gap-2">
          <h2 className="crm-command-panel-title">{title}</h2>
          {description && <p className="crm-command-panel-description">{description}</p>}
        </div>
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
        "crm21-list grid gap-3",
        columns === "two" && "lg:grid-cols-2",
        columns === "three" && "md:grid-cols-2 xl:grid-cols-3",
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
    <Item className={cn("crm21-item", className)}>
      <ItemMedia className={cn("crm21-item-media", tonsItem[tone])}>
        {media}
      </ItemMedia>
      <ItemContent>
        <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <ItemTitle className="crm21-item-title truncate">{title}</ItemTitle>
            {description && <ItemDescription className="crm21-item-description line-clamp-2">{description}</ItemDescription>}
          </div>
          {meta && <div className="text-sm font-semibold text-muted-foreground sm:text-right">{meta}</div>}
        </div>
        {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
        {children && <div className="mt-3">{children}</div>}
      </ItemContent>
      {actions && <ItemActions className="crm21-item-actions">{actions}</ItemActions>}
    </Item>
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
