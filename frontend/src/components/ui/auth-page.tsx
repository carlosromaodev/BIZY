"use client";

import React from "react";
import { ChevronLeftIcon, Grid2x2PlusIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type AuthPageProps = {
  brand?: React.ReactNode;
  brandName?: string;
  children: React.ReactNode;
  className?: string;
  description: string;
  homeAction?: React.ReactNode;
  homeHref?: string;
  homeLabel?: string;
  title: string;
  visualImage?: string;
  visualImageAlt?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function AuthPage({
  brand,
  brandName = "Bizy",
  children,
  className,
  description,
  homeAction,
  homeHref = "/",
  homeLabel = "Home",
  title,
  visualImage = "/bizy-live-commerce-hero.png",
  visualImageAlt = "Vendedora em live commerce apresentando roupa no estúdio da loja"
}: AuthPageProps) {
  const rm = useReducedMotion();

  return (
    <main
      className={cn(
        "bizy-public bizy-auth relative min-h-dvh overflow-hidden",
        className
      )}
    >
      <aside className="bizy-auth-photo">
        <motion.img
          alt={visualImageAlt}
          className="bizy-auth-photo-img"
          src={visualImage}
          initial={rm ? false : { scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <div className="bizy-auth-photo-scrim" />
        <div className="bizy-auth-photo-grain" />

        <motion.div
          className="bizy-auth-photo-brand"
          initial={rm ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          {brand ?? <Grid2x2PlusIcon className="size-6" />}
          {!brand ? <p className="text-xl font-semibold">{brandName}</p> : null}
        </motion.div>

        <motion.span
          className="bizy-auth-live"
          initial={rm ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: EASE }}
        >
          <span />Ao vivo agora
        </motion.span>

        <motion.div
          className="bizy-auth-proof"
          initial={rm ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35, ease: EASE }}
        >
          <h2>O teu comércio social começa aqui.</h2>
          <p className="bizy-auth-proof-sub">Lives, loja digital, conversas e pagamentos — tudo ligado num único painel.</p>
          <div className="bizy-auth-stats">
            <div><strong>+2 400</strong><span>negócios ativos</span></div>
            <div><strong>98%</strong><span>pedidos sem perda</span></div>
            <div><strong>5 canais</strong><span>num só inbox</span></div>
          </div>
        </motion.div>
      </aside>

      <section className="bizy-auth-form">
        <motion.div
          className="bizy-auth-form-top"
          initial={rm ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
        >
          <span className="bizy-auth-mobile-wordmark">bizy<span>.</span></span>
          <div className="bizy-auth-top-actions">
            {homeAction ?? (
              <Button variant="ghost" className="bizy-auth-home-link" asChild>
                <a href={homeHref}>
                  <ChevronLeftIcon className="me-2 size-4" />
                  {homeLabel}
                </a>
              </Button>
            )}
          </div>
          <span className="bizy-auth-help">Precisas de ajuda?</span>
        </motion.div>

        <div className="bizy-auth-body">
          <motion.h1
            initial={rm ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          >
            {title.replace("Bizy", "bizy")}
            <span>.</span>
          </motion.h1>
          <motion.p
            initial={rm ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: EASE }}
          >
            {description}
          </motion.p>
          <motion.div
            initial={rm ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
          >
            {children}
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.479 14.265v-3.279h11.049c.108.571.164 1.247.164 1.979 0 2.46-.672 5.502-2.84 7.669C18.744 22.829 16.051 24 12.483 24 5.869 24 .308 18.613.308 12S5.869 0 12.483 0c3.659 0 6.265 1.436 8.223 3.307L18.392 5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65 3.279 3.873 7.171 3.873 12s3.777 8.721 8.606 8.721c3.132 0 4.916-1.258 6.059-2.401.927-.927 1.537-2.251 1.777-4.059l-7.836.004z" />
  </svg>
);

export function AuthSeparator({ label = "ou" }: { label?: string }) {
  return (
    <div className="bizy-auth-separator">
      <div />
      <span>{label}</span>
      <div />
    </div>
  );
}
