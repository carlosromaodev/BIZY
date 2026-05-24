import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex w-full items-stretch gap-2 group-[.toaster]:w-[var(--width)] shadow-[0_18px_54px_rgba(0,0,0,0.22)] backdrop-blur-xl",
  {
    variants: {
      variant: {
        secondary: "",
        primary: "",
        destructive: "",
        success: "",
        info: "",
        mono: "",
        warning: ""
      },
      icon: {
        primary: "",
        destructive: "",
        success: "",
        info: "",
        warning: ""
      },
      appearance: {
        solid: "",
        outline: "",
        light: "",
        stroke: "text-foreground"
      },
      size: {
        lg: "rounded-lg p-4 gap-3 text-base [&>[data-slot=alert-icon]>svg]:size-6 *:data-slot=alert-icon:mt-0.5 [&_[data-slot=alert-close]]:mt-1",
        md: "rounded-lg p-3.5 gap-2.5 text-sm [&>[data-slot=alert-icon]>svg]:size-5 *:data-slot=alert-icon:mt-0 [&_[data-slot=alert-close]]:mt-0.5",
        sm: "rounded-md px-3 py-2.5 gap-2 text-xs [&>[data-slot=alert-icon]>svg]:size-4 *:data-slot=alert-icon:mt-0.5 [&_[data-slot=alert-close]]:mt-0.25 [&_[data-slot=alert-close]_svg]:size-3.5"
      }
    },
    compoundVariants: [
      {
        variant: "secondary",
        appearance: "solid",
        className: "bg-[#050706] text-white"
      },
      {
        variant: "primary",
        appearance: "solid",
        className: "bg-[#d8ff72] text-[#050706]"
      },
      {
        variant: "destructive",
        appearance: "solid",
        className: "bg-destructive text-destructive-foreground"
      },
      {
        variant: "success",
        appearance: "solid",
        className: "bg-[#18733a] text-white"
      },
      {
        variant: "info",
        appearance: "solid",
        className: "bg-[#0f64d8] text-white"
      },
      {
        variant: "warning",
        appearance: "solid",
        className: "bg-[#f59e0b] text-[#050706]"
      },
      {
        variant: "mono",
        appearance: "solid",
        className: "bg-zinc-950 text-white dark:bg-zinc-300 dark:text-black"
      },
      {
        variant: "secondary",
        appearance: "outline",
        className: "border border-white/12 bg-[#050706] text-white [&_[data-slot=alert-close]]:text-white"
      },
      {
        variant: "primary",
        appearance: "outline",
        className: "border border-white/12 bg-[#050706] text-[#d8ff72] [&_[data-slot=alert-close]]:text-white"
      },
      {
        variant: "destructive",
        appearance: "outline",
        className: "border border-white/12 bg-[#050706] text-destructive [&_[data-slot=alert-close]]:text-white"
      },
      {
        variant: "success",
        appearance: "outline",
        className: "border border-white/12 bg-[#050706] text-[#d8ff72] [&_[data-slot=alert-close]]:text-white"
      },
      {
        variant: "info",
        appearance: "outline",
        className: "border border-white/12 bg-[#050706] text-[#8ec5ff] [&_[data-slot=alert-close]]:text-white"
      },
      {
        variant: "warning",
        appearance: "outline",
        className: "border border-white/12 bg-[#050706] text-[#fbbf24] [&_[data-slot=alert-close]]:text-white"
      },
      {
        variant: "mono",
        appearance: "outline",
        className: "border border-white/12 bg-[#050706] text-white [&_[data-slot=alert-close]]:text-white"
      },
      {
        variant: "secondary",
        appearance: "light",
        className: "border border-white/12 bg-[#050706]/92 text-white"
      },
      {
        variant: "primary",
        appearance: "light",
        className: "border border-white/12 bg-[#d8ff72]/12 text-white [&_[data-slot=alert-icon]]:text-[#d8ff72]"
      },
      {
        variant: "destructive",
        appearance: "light",
        className: "border border-red-300/20 bg-red-500/12 text-white [&_[data-slot=alert-icon]]:text-red-300"
      },
      {
        variant: "success",
        appearance: "light",
        className: "border border-white/12 bg-[#d8ff72]/12 text-white [&_[data-slot=alert-icon]]:text-[#d8ff72]"
      },
      {
        variant: "info",
        appearance: "light",
        className: "border border-blue-300/20 bg-blue-500/12 text-white [&_[data-slot=alert-icon]]:text-blue-200"
      },
      {
        variant: "warning",
        appearance: "light",
        className: "border border-amber-300/20 bg-amber-400/12 text-white [&_[data-slot=alert-icon]]:text-amber-200"
      },
      {
        variant: "mono",
        icon: "primary",
        className: "[&_[data-slot=alert-icon]]:text-[#d8ff72]"
      },
      {
        variant: "mono",
        icon: "warning",
        className: "[&_[data-slot=alert-icon]]:text-amber-300"
      },
      {
        variant: "mono",
        icon: "success",
        className: "[&_[data-slot=alert-icon]]:text-[#d8ff72]"
      },
      {
        variant: "mono",
        icon: "destructive",
        className: "[&_[data-slot=alert-icon]]:text-destructive"
      },
      {
        variant: "mono",
        icon: "info",
        className: "[&_[data-slot=alert-icon]]:text-blue-300"
      }
    ],
    defaultVariants: {
      variant: "secondary",
      appearance: "solid",
      size: "md"
    }
  }
);

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  close?: boolean;
  onClose?: () => void;
}

interface AlertIconProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

function Alert({ className, variant, size, icon, appearance, close = false, onClose, children, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, size, icon, appearance }), className)}
      {...props}
    >
      {children}
      {close ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificação"
          data-slot="alert-close"
          className="group grid size-7 shrink-0 place-items-center rounded-full text-current/70 transition hover:bg-white/10 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8ff72]/50"
        >
          <X className="size-4 opacity-70 group-hover:opacity-100" />
        </button>
      ) : null}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <div data-slot="alert-title" className={cn("grow tracking-tight", className)} {...props} />;
}

function AlertIcon({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-icon" className={cn("shrink-0", className)} {...props}>
      {children}
    </div>
  );
}

function AlertToolbar({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-toolbar" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm text-white/68 [&_p]:mb-2 [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

function AlertContent({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-content"
      className={cn("space-y-1 [&_[data-slot=alert-title]]:font-semibold", className)}
      {...props}
    />
  );
}

export { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle, AlertToolbar };
