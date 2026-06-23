import { Package } from "lucide-react";
import { useState } from "react";
import { resolverUrlMedia } from "../api";

interface ExibidorImagemProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackIcone?: React.ReactNode;
  fallbackClasse?: string;
  arredondado?: boolean;
}

export function ExibidorImagem({
  src,
  alt = "",
  className = "size-full object-cover",
  fallbackIcone,
  fallbackClasse = "grid size-full place-items-center bg-muted/40 text-muted-foreground",
  arredondado = false
}: ExibidorImagemProps) {
  const [erro, setErro] = useState(false);
  const urlResolvida = resolverUrlMedia(src);

  if (!urlResolvida || erro) {
    return (
      <div className={`${fallbackClasse} ${arredondado ? "rounded-full" : ""}`}>
        {fallbackIcone ?? <Package size={18} />}
      </div>
    );
  }

  return (
    <img
      src={urlResolvida}
      alt={alt}
      loading="lazy"
      className={`${className} ${arredondado ? "rounded-full" : ""}`}
      onError={() => setErro(true)}
    />
  );
}
