import { requisitarApi } from "./api";

export interface MediaUploadResposta {
  url: string;
  thumbnailUrl?: string | null;
}

export function lerArquivoComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result ?? ""));
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    leitor.readAsDataURL(arquivo);
  });
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível processar a imagem selecionada."));
    img.src = src;
  });
}

export interface OpcoesCompressao {
  maxTamanhoBase64?: number;
  maxDimensao?: number;
  qualidadeMinima?: number;
}

export async function comprimirImagem(
  arquivo: File,
  opcoes: OpcoesCompressao = {}
): Promise<string> {
  const maxTamanho = opcoes.maxTamanhoBase64 ?? 500_000;
  const maxDim = opcoes.maxDimensao ?? 1200;
  const qualMin = opcoes.qualidadeMinima ?? 0.4;

  const objectUrl = URL.createObjectURL(arquivo);
  const img = await carregarImagem(objectUrl);
  const precisaRedimensionar = img.naturalWidth > maxDim || img.naturalHeight > maxDim;

  if (arquivo.size <= maxTamanho * 0.65 && !precisaRedimensionar) {
    URL.revokeObjectURL(objectUrl);
    return lerArquivoComoDataUrl(arquivo);
  }

  const escala = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const largura = Math.max(1, Math.round(img.naturalWidth * escala));
  const altura = Math.max(1, Math.round(img.naturalHeight * escala));

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem.");
  ctx.drawImage(img, 0, 0, largura, altura);
  URL.revokeObjectURL(objectUrl);

  let lo = qualMin;
  let hi = 0.82;
  let melhor: string | null = null;

  for (let i = 0; i < 4; i++) {
    const meio = (lo + hi) / 2;
    const resultado = canvas.toDataURL("image/jpeg", meio);
    if (resultado.length <= maxTamanho) {
      melhor = resultado;
      lo = meio;
    } else {
      hi = meio;
    }
  }

  if (melhor) return melhor;

  const ultimo = canvas.toDataURL("image/jpeg", qualMin);
  if (ultimo.length <= maxTamanho) return ultimo;

  throw new Error("A imagem é muito pesada. Escolhe uma mais pequena.");
}

export async function enviarMedia(
  arquivo: File,
  purpose: string,
  maxImageDimension = 1800
): Promise<MediaUploadResposta> {
  const dataUrl = await lerArquivoComoDataUrl(arquivo);
  return requisitarApi<MediaUploadResposta>("/media/upload", {
    method: "POST",
    body: { dataUrl, purpose, maxImageDimension }
  });
}
