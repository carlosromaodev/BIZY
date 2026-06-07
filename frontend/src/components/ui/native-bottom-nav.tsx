import type { ElementType } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type NativeBottomNavVariant = "default" | "primary" | "cta";

export interface NativeBottomNavItem {
  id: string;
  label: string;
  icon: ElementType<{ className?: string }>;
  active?: boolean;
  ariaExpanded?: boolean;
  ariaLabel?: string;
  badgeCount?: number;
  iconClassName?: string;
  onClick?: () => void;
  path?: string;
  variant?: NativeBottomNavVariant;
}

export interface NativeBottomNavProps {
  activeIndex?: number;
  activePillId?: string;
  className?: string;
  items: NativeBottomNavItem[];
  label: string;
  onItemClick?: (index: number, item: NativeBottomNavItem) => void;
}

const springTransition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.72,
} as const;

const quietTransition = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1],
} as const;

export function NativeBottomNav({
  activeIndex,
  activePillId = "native-bottom-nav",
  className,
  items,
  label,
  onItemClick,
}: NativeBottomNavProps) {
  const reduceMotion = useReducedMotion();
  const fallbackActiveIndex = items.findIndex((item) => item.active);
  const resolvedActiveIndex = activeIndex ?? (fallbackActiveIndex >= 0 ? fallbackActiveIndex : 0);
  const pillTransition = reduceMotion ? { duration: 0 } : springTransition;
  const pressMotion = reduceMotion ? undefined : { scale: 0.94 };

  if (items.length === 0) return null;

  return (
    <div className={cn("native-bottom-nav-shell", className)}>
      <LayoutGroup id={activePillId}>
        <nav className="native-bottom-nav" aria-label={label}>
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === resolvedActiveIndex;
            const variant = item.variant ?? "default";
            const isCta = variant === "cta";
            const showsActivePill = isActive && !isCta;

            return (
              <motion.button
                key={item.id}
                layout
                type="button"
                className="native-bottom-nav__item"
                data-active={isActive || undefined}
                data-variant={variant}
                aria-current={showsActivePill ? "page" : undefined}
                aria-expanded={item.ariaExpanded}
                aria-label={item.ariaLabel}
                onClick={() => {
                  item.onClick?.();
                  onItemClick?.(index, item);
                }}
                whileTap={pressMotion}
                transition={quietTransition}
              >
                {showsActivePill && (
                  <motion.span
                    className="native-bottom-nav__active-pill"
                    layoutId={`${activePillId}-active-pill`}
                    transition={pillTransition}
                    aria-hidden="true"
                  />
                )}
                <span className="native-bottom-nav__content">
                  <span className="native-bottom-nav__icon-wrap">
                    <Icon className={cn("native-bottom-nav__icon", item.iconClassName)} />
                    {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                      <span className="native-bottom-nav__badge" aria-label={`${item.badgeCount} itens`}>
                        {item.badgeCount > 9 ? "9+" : item.badgeCount}
                      </span>
                    )}
                  </span>
                  <span className="native-bottom-nav__label">{item.label}</span>
                </span>
              </motion.button>
            );
          })}
        </nav>
      </LayoutGroup>
    </div>
  );
}
