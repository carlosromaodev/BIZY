"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
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
        "relative min-h-dvh overflow-hidden bg-[#050706] text-white lg:grid lg:grid-cols-2",
        className
      )}
    >
      <div aria-hidden="true" className="absolute inset-0 lg:hidden">
        <img
          alt=""
          className="h-full w-full object-cover opacity-58"
          src={visualImage}
        />
        <div className="absolute inset-0 bg-black/62" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(216,255,114,0.07),transparent_28%),linear-gradient(180deg,rgba(5,7,6,0.46)_0%,rgba(5,7,6,0.9)_72%)]" />
        <FloatingPaths position={1} />
      </div>

      <aside className="relative hidden min-h-dvh flex-col overflow-hidden border-r border-white/10 p-10 lg:flex">
        <img
          alt={visualImageAlt}
          className="absolute inset-0 h-full w-full object-cover"
          src={visualImage}
        />
        <div className="absolute inset-0 bg-black/32" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.44)_0%,rgba(5,7,6,0.08)_48%,rgba(5,7,6,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,7,6,0.62)_0%,rgba(5,7,6,0.02)_56%,rgba(5,7,6,0.42)_100%)]" />
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="relative z-20 flex items-center gap-2 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          {brand ?? <Grid2x2PlusIcon className="size-6" />}
          {!brand ? <p className="text-xl font-semibold">{brandName}</p> : null}
        </div>
      </aside>

      <section className="relative z-10 flex min-h-dvh flex-col justify-center bg-[#050706] px-4 py-6 text-white sm:px-6">
        <div aria-hidden className="absolute inset-0 -z-10 isolate opacity-75">
          <div className="absolute right-0 top-0 h-[44rem] w-[20rem] -translate-y-48 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,.07)_0,rgba(216,255,114,.035)_48%,rgba(5,7,6,.01)_80%)]" />
          <div className="absolute bottom-0 left-0 h-[32rem] w-[18rem] translate-y-28 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,.05)_0,rgba(216,255,114,.03)_72%,transparent_100%)]" />
          <FloatingPaths position={-1} />
        </div>

        <div className="mx-auto w-full max-w-md space-y-5">
          <div className="flex min-h-9 items-center justify-between gap-3">
            <div className="flex items-center gap-2 lg:pointer-events-none lg:opacity-0">
              {brand ?? <Grid2x2PlusIcon className="size-6" />}
              {!brand ? <p className="text-xl font-semibold">{brandName}</p> : null}
            </div>
            {homeAction ?? (
              <Button variant="ghost" className="w-fit text-white/82 hover:bg-white/10 hover:text-white" asChild>
                <a href={homeHref}>
                  <ChevronLeftIcon className="me-2 size-4" />
                  {homeLabel}
                </a>
              </Button>
            )}
          </div>
          <div className="flex flex-col space-y-1">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight !text-white">
              {title}
            </h1>
            <p className="text-base leading-7 !text-white/72">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

function FloatingPaths({ position }: { position: number }) {
  const reduzirMovimento = useReducedMotion();
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="h-full w-full text-[#d8ff72]" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth={path.width}
            strokeOpacity={0.035 + path.id * 0.004}
            initial={reduzirMovimento ? false : { pathLength: 0.28, opacity: 0.2 }}
            animate={
              reduzirMovimento
                ? { pathLength: 1, opacity: 0.12 }
                : {
                    pathLength: 1,
                    opacity: [0.1, 0.22, 0.1],
                    pathOffset: [0, 1, 0]
                  }
            }
            transition={{
              duration: 18 + (path.id % 8) * 1.4,
              repeat: reduzirMovimento ? 0 : Number.POSITIVE_INFINITY,
              ease: "linear"
            }}
          />
        ))}
      </svg>
    </div>
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
