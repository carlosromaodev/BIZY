"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROMPT_FONT_FAMILY } from "@/lib/prompt-font";

type VerticalMarqueeProps = {
  children: ReactNode;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
  speed?: number;
};

function VerticalMarquee({
  children,
  className,
  pauseOnHover = false,
  reverse = false,
  speed = 30
}: VerticalMarqueeProps) {
  return (
    <div
      className={cn("group flex flex-col overflow-hidden [--gap:0px]", className)}
      style={{ "--duration": `${speed}s` } as CSSProperties}
    >
      {[0, 1].map((index) => (
        <div
          aria-hidden={index > 0}
          className={cn(
            "flex shrink-0 flex-col animate-marquee-vertical",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          key={index}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

const marqueeItems = [
  "Loja online",
  "Catálogo digital",
  "WhatsApp oficial",
  "Pedidos acompanhados",
  "Stock atualizado",
  "Entrega calculada",
  "Afiliados",
  "Links rastreáveis",
  "Clientes com histórico",
  "Relatórios de venda"
];

export default function CTAWithTextMarquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    const marqueeContainer = marqueeRef.current;
    if (!marqueeContainer) return undefined;

    const updateOpacity = () => {
      const items = marqueeContainer.querySelectorAll<HTMLElement>(".marquee-item");
      const containerRect = marqueeContainer.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height / 2;

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterY = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(centerY - itemCenterY);
        const maxDistance = containerRect.height / 2;
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        item.style.opacity = String(1 - normalizedDistance * 0.72);
      });
    };

    const animationFrame = () => {
      updateOpacity();
      frameRef.current = requestAnimationFrame(animationFrame);
    };

    frameRef.current = requestAnimationFrame(animationFrame);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-[#050706] px-6 py-16 text-white lg:min-h-[86svh]" style={{ fontFamily: PROMPT_FONT_FAMILY }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(216,255,114,0.14),transparent_28%),radial-gradient(circle_at_82%_72%,rgba(22,101,52,0.16),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#d8ff72]/30" />
      <div className="relative z-10 w-full max-w-7xl animate-fade-in-up">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex rounded-none border border-[#d8ff72]/30 bg-[#d8ff72]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#d8ff72]">
              Pronto para operar
            </div>
            <h2
              className="text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-6xl"
              style={{ color: "#ffffff", fontFamily: PROMPT_FONT_FAMILY }}
            >
              Transforma conversas em pedidos e pedidos em <span className="text-[#d8ff72]">clientes</span>.
            </h2>
            <p className="text-lg leading-relaxed text-white/72 md:text-xl">
              Começa com uma loja organizada e cresce com WhatsApp, catálogo, afiliados, automação e relatórios no mesmo lugar.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                className="group relative inline-flex h-12 items-center overflow-hidden rounded-none bg-[#d8ff72] px-6 text-sm font-medium uppercase tracking-[0.08em] text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_42px_rgba(216,255,114,0.22)]"
                href="/login"
                style={{ color: "#000000", fontFamily: PROMPT_FONT_FAMILY }}
              >
                <span className="relative z-10" style={{ color: "#000000" }}>Começar agora</span>
                <span className="relative z-10 ml-4 grid h-12 w-12 place-items-center border-l border-black/20" style={{ color: "#000000" }}>
                  <ArrowRight size={18} />
                </span>
                <span className="absolute inset-0 translate-x-[-200%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]" />
              </a>
              <a
                className="group relative inline-flex h-12 items-center overflow-hidden rounded-none border border-[#d8ff72]/25 bg-white/5 px-6 text-sm font-medium uppercase tracking-[0.08em] text-white transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)]"
                href="#onboarding"
              >
                <span className="relative z-10">Ver como funciona</span>
                <span className="absolute inset-0 translate-x-[-200%] bg-gradient-to-r from-transparent via-[#d8ff72]/20 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]" />
              </a>
            </div>
          </div>

          <div
            className="relative flex h-[360px] items-center justify-center md:h-[560px] lg:h-[680px]"
            ref={marqueeRef}
          >
            <div className="relative h-full w-full">
              <VerticalMarquee className="h-full" pauseOnHover speed={22}>
                {marqueeItems.map((item) => (
                  <div
                    className="marquee-item py-7 text-3xl font-light tracking-tight text-white md:text-4xl lg:text-5xl"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </VerticalMarquee>

              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-[#050706] via-[#050706]/70 to-transparent md:h-64" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#050706] via-[#050706]/70 to-transparent md:h-64" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[#d8ff72]/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
