import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useState } from "react";
import { resolverUrlMedia } from "../api";

interface GaleriaFotosProps {
  fotos: string[];
  alt?: string;
  className?: string;
  alturaHero?: string;
  alturaThumbnail?: string;
  maxThumbnails?: number;
}

export function GaleriaFotos({
  fotos,
  alt = "",
  className = "",
  alturaHero = "aspect-square",
  alturaThumbnail = "h-14",
  maxThumbnails = 6
}: GaleriaFotosProps) {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const fotosVisiveis = fotos.slice(0, maxThumbnails);
  const total = fotosVisiveis.length;

  if (total === 0) {
    return (
      <div className={`grid place-items-center bg-muted/40 text-muted-foreground ${alturaHero} ${className}`}>
        <Package size={32} />
      </div>
    );
  }

  const indice = Math.min(indiceAtivo, total - 1);
  const urlAtiva = resolverUrlMedia(fotosVisiveis[indice]);

  function anterior() {
    setIndiceAtivo((i) => (i <= 0 ? total - 1 : i - 1));
  }

  function proximo() {
    setIndiceAtivo((i) => (i >= total - 1 ? 0 : i + 1));
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className={`relative overflow-hidden rounded-lg bg-muted/30 ${alturaHero}`}>
        {urlAtiva ? (
          <img src={urlAtiva} alt={alt} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Package size={32} />
          </div>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={proximo}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
              aria-label="Foto seguinte"
            >
              <ChevronRight size={16} />
            </button>
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
              {indice + 1}/{total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-1.5">
          {fotosVisiveis.map((foto, i) => {
            const url = resolverUrlMedia(foto);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIndiceAtivo(i)}
                aria-current={i === indice || undefined}
                className={`overflow-hidden rounded-md ${alturaThumbnail} flex-1 transition-opacity ${i === indice ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}
              >
                {url ? (
                  <img src={url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center bg-muted/40 text-muted-foreground">
                    <Package size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
