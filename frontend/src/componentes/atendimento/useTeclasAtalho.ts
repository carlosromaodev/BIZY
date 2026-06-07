import { useEffect } from "react";

type MapaAtalhos = Map<string, () => void>;

function construirChave(e: KeyboardEvent): string {
  return [
    e.ctrlKey || e.metaKey ? "mod" : "",
    e.shiftKey ? "shift" : "",
    e.altKey ? "alt" : "",
    e.key.toLowerCase()
  ].filter(Boolean).join("+");
}

export function useTeclasAtalho(atalhos: MapaAtalhos) {
  useEffect(() => {
    function lidar(e: KeyboardEvent) {
      const chave = construirChave(e);
      const acao = atalhos.get(chave);
      if (acao) {
        e.preventDefault();
        acao();
      }
    }
    window.addEventListener("keydown", lidar);
    return () => window.removeEventListener("keydown", lidar);
  }, [atalhos]);
}
