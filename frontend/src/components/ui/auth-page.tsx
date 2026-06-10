"use client";

import React from "react";
import { ChevronLeftIcon, Grid2x2PlusIcon } from "lucide-react";
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
  return (
    <main
      className={cn(
        "bizy-public bizy-auth relative min-h-dvh overflow-hidden",
        className
      )}
    >
      <aside className="bizy-auth-photo">
        <img
          alt={visualImageAlt}
          className="bizy-auth-photo-img"
          src={visualImage}
        />
        <div className="bizy-auth-photo-scrim" />

        <div className="bizy-auth-photo-brand">
          {brand ?? <Grid2x2PlusIcon className="size-6" />}
          {!brand ? <p className="text-xl font-semibold">{brandName}</p> : null}
        </div>

        <span className="bizy-auth-live"><span />Ao vivo agora</span>

        <div className="bizy-auth-proof">
          <h2>Reservas no comentário, pagamento confirmado em segundos.</h2>
          <div className="bizy-auth-stats">
            <div><strong>+2 400</strong><span>lojas ativas</span></div>
            <div><strong>98%</strong><span>pedidos sem perda</span></div>
            <div><strong>24h</strong><span>para lançar</span></div>
          </div>
        </div>
      </aside>

      <section className="bizy-auth-form">
        <div className="bizy-auth-form-top">
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
        </div>

        <div className="bizy-auth-body">
          <h1>
            {title.replace("Bizy", "bizy")}
            <span>.</span>
          </h1>
          <p>{description}</p>
          {children}
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
    <div className="flex w-full items-center justify-center">
      <div className="h-px w-full bg-border" />
      <span className="px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="h-px w-full bg-border" />
    </div>
  );
}
