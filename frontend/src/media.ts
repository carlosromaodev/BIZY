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
