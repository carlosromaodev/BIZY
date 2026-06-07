import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";
import {
  isPrivateStoredMediaUrl,
  persistirValorMedia,
  resolverFicheiroMedia,
  salvarMediaDataUrl
} from "../infra/media/MediaStorage.js";

const ambienteOriginal = { ...process.env };
const png1x1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const pdfTiny = "data:application/pdf;base64,JVBERi0xLjQKJUVPRgo=";

describe("MediaStorage", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "emeu-media-"));
    process.env = {
      ...ambienteOriginal,
      MEDIA_STORAGE_DIR: dir,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      N8N_BACKEND_TOKEN: ""
    };
  });

  afterEach(async () => {
    process.env = { ...ambienteOriginal };
    await rm(dir, { recursive: true, force: true });
  });

  it("otimiza imagem e resolve ficheiro armazenado", async () => {
    const stored = await salvarMediaDataUrl(png1x1, { purpose: "catalogo" });

    expect(stored.url).toMatch(/^\/media\/files\/catalogo\/\d{4}\/\d{2}\/.+\.webp$/);
    expect(stored.thumbnailUrl).toMatch(/\.thumb\.webp$/);
    expect(stored.mimeType).toBe("image/webp");
    expect(stored.originalMimeType).toBe("image/png");
    expect(stored.width).toBe(1);
    expect(stored.height).toBe(1);

    const ficheiro = await resolverFicheiroMedia(stored.url);
    expect(ficheiro?.mimeType).toBe("image/webp");
    ficheiro?.stream.destroy();
  });

  it("guarda PDF de comprovativo como media privada quando documentos são permitidos", async () => {
    const stored = await salvarMediaDataUrl(pdfTiny, {
      purpose: "comprovativos-pagamento",
      allowDocuments: true
    });

    expect(stored.url).toMatch(/\.pdf$/);
    expect(stored.thumbnailUrl).toBeNull();
    expect(stored.mimeType).toBe("application/pdf");
    expect(isPrivateStoredMediaUrl(stored.url)).toBe(true);
  });

  it("persiste data URL e preserva URL externa já existente", async () => {
    expect(await persistirValorMedia("https://exemplo.com/comprovativo.jpg", { purpose: "comprovativos-pagamento" }))
      .toBe("https://exemplo.com/comprovativo.jpg");

    const storedUrl = await persistirValorMedia(pdfTiny, {
      purpose: "comprovativos-pagamento",
      allowDocuments: true
    });
    expect(storedUrl).toMatch(/^\/media\/files\/comprovativos-pagamento\//);
  });

  it("serve media de catálogo sem sessão e mantém comprovativos privados", async () => {
    const app = await criarAplicacao();

    try {
      const imagemCatalogo = await salvarMediaDataUrl(png1x1, { purpose: "catalogo" });
      const comprovativo = await salvarMediaDataUrl(pdfTiny, {
        purpose: "comprovativos-pagamento",
        allowDocuments: true
      });

      const respostaPublica = await app.inject({
        method: "GET",
        url: imagemCatalogo.url
      });
      expect(respostaPublica.statusCode).toBe(200);
      expect(respostaPublica.headers["content-type"]).toContain("image/webp");

      const respostaPrivada = await app.inject({
        method: "GET",
        url: comprovativo.url
      });
      expect(respostaPrivada.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("expõe upload autenticado por HTTP", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      const resposta = await app.inject({
        method: "POST",
        url: "/media/upload",
        headers,
        payload: {
          dataUrl: pdfTiny,
          purpose: "comprovativos-pagamento",
          allowDocuments: true
        }
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json()).toEqual(
        expect.objectContaining({
          mimeType: "application/pdf",
          thumbnailUrl: null
        })
      );
    } finally {
      await app.close();
    }
  });

  it("registra comprovativo em data URL na reserva e grava URL interna", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);
      await app.inject({
        method: "POST",
        url: "/pecas",
        headers,
        payload: {
          codigo: "7",
          nome: "Bolsa teste",
          descricao: "Peça piloto",
          precoEmKwanza: 9000,
          quantidade: 1,
          fotos: []
        }
      });

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_media",
          username: "cliente_media",
          displayName: "Cliente Media",
          commentText: "quero peça 7 923456789"
        }
      });
      const reservaId = comentario.json().reserva.id as string;

      const resposta = await app.inject({
        method: "POST",
        url: `/n8n/payments/${reservaId}/proof-received`,
        payload: {
          comprovativoPagamentoUrl: pdfTiny
        }
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json().reserva.estadoPagamento).toBe("COMPROVATIVO_RECEBIDO");
      expect(resposta.json().reserva.comprovativoPagamentoUrl).toMatch(
        /^\/media\/files\/comprovativos-pagamento\//
      );
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const telefone = "923000020";
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone, nome: "Vendedor Media" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone, codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
