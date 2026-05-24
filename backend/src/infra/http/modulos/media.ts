import { z } from "zod";
import { resolverFicheiroMedia, salvarMediaDataUrl } from "../../media/MediaStorage.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const UploadMediaSchema = z.object({
  dataUrl: z.string().trim().min(20).max(12_000_000),
  purpose: z.string().trim().min(2).max(60).default("geral"),
  allowDocuments: z.boolean().default(false),
  maxImageDimension: z.coerce.number().int().min(128).max(2400).optional()
});

export const moduloMedia: ModuloHttp = {
  nome: "media",
  descricao: "Upload e leitura segura de imagens e comprovativos.",
  registrar(app) {
    app.post(
      "/media/upload",
      {
        bodyLimit: Number(process.env.MEDIA_UPLOAD_MAX_BYTES ?? 12_000_000) + 1024
      },
      async (request, reply) => {
        const dados = UploadMediaSchema.parse(request.body ?? {});

        try {
          return await salvarMediaDataUrl(dados.dataUrl, {
            purpose: dados.purpose,
            allowDocuments: dados.allowDocuments,
            maxImageDimension: dados.maxImageDimension
          });
        } catch (erro) {
          return reply.code(400).send({
            erro: "MEDIA_INVALIDA",
            mensagem: erro instanceof Error ? erro.message : "Não foi possível guardar o ficheiro."
          });
        }
      }
    );

    app.get("/media/files/*", async (request, reply) => {
      const wildcardPath = (request.params as { "*": string })["*"];
      const media = await resolverFicheiroMedia(`/media/files/${wildcardPath}`).catch(() => null);

      if (!media) {
        return reply.code(404).send({ erro: "MEDIA_NAO_ENCONTRADA", mensagem: "Ficheiro não encontrado." });
      }

      reply.header("Content-Type", media.mimeType);
      reply.header("Cache-Control", "private, max-age=3600");
      if (media.size) reply.header("Content-Length", String(media.size));
      return reply.send(media.stream);
    });
  }
};
