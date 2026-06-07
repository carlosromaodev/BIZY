import { type ReactNode, useEffect } from "react";

const STORAGE_KEY = "bizy_native_sounds";
const PRESS_CLASS = "native-is-pressing";
const SELECTOR_INTERATIVO = [
  "button",
  "a[href]",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='checkbox']",
  "input[type='radio']",
  "[data-native-feedback]"
].join(",");

type TipoSomNativo = "tap" | "success" | "soft";

export function NativeFeedbackProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let audioContext: AudioContext | null = null;
    let ultimoSom = 0;
    const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    document.documentElement.classList.add("native-feedback-ready");

    function obterAlvoInterativo(event: Event): HTMLElement | null {
      const alvo = event.target instanceof Element ? event.target.closest<HTMLElement>(SELECTOR_INTERATIVO) : null;
      if (!alvo) return null;
      if (alvo.dataset.nativeFeedback === "off") return null;
      if (alvo.hasAttribute("disabled") || alvo.getAttribute("aria-disabled") === "true") return null;
      return alvo;
    }

    function sonsAtivos() {
      return window.localStorage.getItem(STORAGE_KEY) !== "off";
    }

    function obterAudioContext() {
      if (audioContext) return audioContext;
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
      return audioContext;
    }

    function tocarSom(tipo: TipoSomNativo) {
      if (!sonsAtivos()) return;
      const agora = performance.now();
      if (agora - ultimoSom < 80) return;
      ultimoSom = agora;

      const contexto = obterAudioContext();
      if (!contexto) return;

      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();
      const duracao = tipo === "success" ? 0.09 : 0.045;
      const frequencia = tipo === "success" ? 760 : tipo === "soft" ? 420 : 540;

      oscilador.type = "sine";
      oscilador.frequency.setValueAtTime(frequencia, contexto.currentTime);
      ganho.gain.setValueAtTime(0.0001, contexto.currentTime);
      ganho.gain.exponentialRampToValueAtTime(tipo === "success" ? 0.045 : 0.028, contexto.currentTime + 0.008);
      ganho.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + duracao);
      oscilador.connect(ganho);
      ganho.connect(contexto.destination);
      oscilador.start();
      oscilador.stop(contexto.currentTime + duracao + 0.015);
    }

    function tipoSomParaAlvo(alvo: HTMLElement): TipoSomNativo {
      const explicito = alvo.dataset.nativeSound as TipoSomNativo | undefined;
      if (explicito) return explicito;
      if (alvo.matches(".lp-add, .lp-foot-add, .lp-co-btn, .lp-cf-wa, [type='submit']")) return "success";
      if (alvo.matches("a[href]")) return "soft";
      return "tap";
    }

    function onPointerDown(event: PointerEvent) {
      const alvo = obterAlvoInterativo(event);
      if (!alvo) return;

      alvo.classList.add(PRESS_CLASS);
      window.setTimeout(() => alvo.classList.remove(PRESS_CLASS), reduzirMovimento ? 60 : 180);

      if (!reduzirMovimento && "vibrate" in navigator) {
        navigator.vibrate?.(8);
      }

      tocarSom(tipoSomParaAlvo(alvo));
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        audioContext?.suspend().catch(() => undefined);
      }
    }

    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.documentElement.classList.remove("native-feedback-ready");
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      audioContext?.close().catch(() => undefined);
    };
  }, []);

  return <>{children}</>;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
