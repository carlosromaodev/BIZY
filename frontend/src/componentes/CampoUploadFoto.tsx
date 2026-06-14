import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { resolverUrlMedia } from "../api";
import { enviarMedia } from "../media";
import { Button } from "@/components/ui/button";

interface CampoUploadFotoProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  purpose?: string;
  maxImageDimension?: number;
  aspecto?: "quadrado" | "paisagem";
}

export function CampoUploadFoto({
  id,
  label,
  value,
  onChange,
  purpose = "lojas",
  maxImageDimension = 1200,
  aspecto = "quadrado"
}: CampoUploadFotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const urlResolvida = resolverUrlMedia(value);

  async function tratarFicheiro(ficheiros: FileList | null) {
    const ficheiro = ficheiros?.[0];
    if (!ficheiro) return;

    setEnviando(true);
    try {
      const resultado = await enviarMedia(ficheiro, purpose, maxImageDimension);
      onChange(resultado.url);
    } catch (erro) {
      console.error("Erro ao enviar imagem:", erro);
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const alturaPreview = aspecto === "paisagem" ? "h-32" : "h-28";

  return (
    <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={id}>
      {label}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={enviando}
        onChange={(e) => void tratarFicheiro(e.currentTarget.files)}
      />
      {urlResolvida ? (
        <div className={`relative overflow-hidden rounded-lg border border-input bg-muted/30 ${alturaPreview}`}>
          <img
            src={urlResolvida}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={enviando}
              onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }}
            >
              {enviando ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              Trocar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={(e) => { e.preventDefault(); onChange(""); }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
          className={`flex ${alturaPreview} w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {enviando ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              A enviar...
            </>
          ) : (
            <>
              <ImagePlus size={18} />
              Clique para escolher imagem
            </>
          )}
        </button>
      )}
    </label>
  );
}
