export interface ResultadoScanMedia {
  seguro: boolean;
  provider: string;
  nivel: "BASICO" | "EXTERNO";
  motivo: string | null;
}

export interface ProvedorScanMedia {
  analisar(buffer: Buffer, mimeType: string): Promise<ResultadoScanMedia>;
}

export class ScannerMediaLocal implements ProvedorScanMedia {
  async analisar(buffer: Buffer, mimeType: string): Promise<ResultadoScanMedia> {
    if (mimeType === "application/pdf") {
      if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) return this.rejeitar("Assinatura PDF inválida.");
      const conteudo = buffer.toString("latin1").toLowerCase();
      const marcador = ["/javascript", "/launch", "/embeddedfile", "/openaction"].find((valor) => conteudo.includes(valor));
      if (marcador) return this.rejeitar(`PDF contém acção activa não permitida: ${marcador}.`);
    }
    return { seguro: true, provider: "local-conservador", nivel: "BASICO", motivo: null };
  }

  private rejeitar(motivo: string): ResultadoScanMedia {
    return { seguro: false, provider: "local-conservador", nivel: "BASICO", motivo };
  }
}

// Integração futura: configurar um provider externo (por exemplo, ClamAV) sem alterar o contrato de upload.
export function criarScannerMedia(): ProvedorScanMedia {
  const provider = process.env.MEDIA_SCAN_PROVIDER?.trim().toLowerCase() || "local";
  if (provider !== "local") {
    throw new Error(`Provider de scan "${provider}" configurado, mas a integração externa ainda não está disponível.`);
  }
  return new ScannerMediaLocal();
}
