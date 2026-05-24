import type {
  MensagemWhatsApp,
  ProvedorWhatsApp,
  ResultadoEnvioWhatsApp
} from "../../dominio/provedores/ProvedorWhatsApp.js";
import type { RepositorioInstanciasWhatsApp } from "../../dominio/repositorios/contratos.js";
import {
  ClienteEvolutionApi,
  extrairIdMensagemEvolution,
  extrairMensagemEvolution,
  normalizarMensagemWhatsApp,
  normalizarTelefoneWhatsApp,
  selecionarInstanciaWhatsAppPreferida,
  validarPoliticaMensagemWhatsApp
} from "./ClienteEvolutionApi.js";

interface OpcoesProvedorWhatsAppEvolution {
  baseUrl: string;
  apiKey: string;
  instancia: string;
  atrasoMs?: number;
  linkPreview?: boolean;
  tentativas?: number;
  intervaloRetryMs?: number;
}

interface OpcoesProvedorWhatsAppEvolutionDinamico {
  repositorioInstancias: RepositorioInstanciasWhatsApp;
  baseUrl: string;
  apiKey: string;
  instanciaFallback?: string | null;
  atrasoMs?: number;
  linkPreview?: boolean;
  tentativas?: number;
  intervaloRetryMs?: number;
}

export class ProvedorWhatsAppEvolution implements ProvedorWhatsApp {
  private readonly instancia: string;
  private readonly atrasoMs: number;
  private readonly linkPreview: boolean;
  private readonly tentativas: number;
  private readonly intervaloRetryMs: number;
  private readonly cliente: ClienteEvolutionApi;

  constructor(opcoes: OpcoesProvedorWhatsAppEvolution) {
    this.instancia = opcoes.instancia;
    this.atrasoMs = opcoes.atrasoMs ?? 800;
    this.linkPreview = opcoes.linkPreview ?? false;
    this.tentativas = Math.max(1, Math.min(opcoes.tentativas ?? 3, 5));
    this.intervaloRetryMs = Math.max(0, opcoes.intervaloRetryMs ?? 600);
    this.cliente = new ClienteEvolutionApi({
      baseUrl: opcoes.baseUrl,
      apiKey: opcoes.apiKey
    });
  }

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    const conteudo = normalizarMensagemWhatsApp(mensagem.conteudo);
    const erroPolitica = validarPoliticaMensagemWhatsApp(conteudo);

    if (erroPolitica) {
      throw new Error(erroPolitica);
    }

    const destino = normalizarTelefoneWhatsApp(mensagem.telefone);
    if (!destino) {
      throw new Error("Telefone WhatsApp angolano inválido.");
    }

    const resposta = await this.enviarComRetry(() =>
      this.cliente.enviarTexto(this.instancia, {
        number: destino.providerTo,
        text: conteudo,
        delay: this.atrasoMs,
        linkPreview: this.linkPreview
      })
    );

    if (!resposta.ok) {
      const detalhe = extrairMensagemEvolution(resposta.payload) ?? JSON.stringify(resposta.payload);
      throw new Error(`Evolution rejeitou envio WhatsApp: ${resposta.status} ${detalhe}`.trim());
    }

    return {
      idExterno: extrairIdMensagemEvolution(resposta.payload) ?? `evolution_${Date.now()}`,
      provider: "evolution",
      enviadoEm: new Date()
    };
  }

  private async enviarComRetry<T extends { ok: boolean }>(operacao: () => Promise<T>): Promise<T> {
    let ultimoResultado: T | null = null;

    for (let tentativa = 0; tentativa < this.tentativas; tentativa += 1) {
      ultimoResultado = await operacao();
      if (ultimoResultado.ok || tentativa === this.tentativas - 1) return ultimoResultado;
      await aguardar(this.intervaloRetryMs * 2 ** tentativa);
    }

    return ultimoResultado as T;
  }
}

export class ProvedorWhatsAppEvolutionDinamico implements ProvedorWhatsApp {
  private readonly atrasoMs: number;
  private readonly linkPreview: boolean;
  private readonly tentativas: number;
  private readonly intervaloRetryMs: number;

  constructor(private readonly opcoes: OpcoesProvedorWhatsAppEvolutionDinamico) {
    this.atrasoMs = opcoes.atrasoMs ?? 800;
    this.linkPreview = opcoes.linkPreview ?? false;
    this.tentativas = Math.max(1, Math.min(opcoes.tentativas ?? 3, 5));
    this.intervaloRetryMs = Math.max(0, opcoes.intervaloRetryMs ?? 600);
  }

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    const destino = await this.resolverDestino();
    const provedor = new ProvedorWhatsAppEvolution({
      baseUrl: destino.baseUrl,
      apiKey: destino.apiKey,
      instancia: destino.instancia,
      atrasoMs: this.atrasoMs,
      linkPreview: this.linkPreview,
      tentativas: this.tentativas,
      intervaloRetryMs: this.intervaloRetryMs
    });

    return provedor.enviarMensagem(mensagem);
  }

  private async resolverDestino() {
    const instancias = await this.opcoes.repositorioInstancias.listarAtivas();
    const selecionada = selecionarInstanciaWhatsAppPreferida(instancias);
    const instancia = selecionada?.nome?.trim() || this.opcoes.instanciaFallback?.trim();
    const baseUrl = selecionada?.baseUrl?.trim() || this.opcoes.baseUrl.trim();
    const apiKey = selecionada?.apiKey?.trim() || this.opcoes.apiKey.trim();

    if (!instancia) {
      throw new Error("Nenhuma instância WhatsApp configurada para envio.");
    }

    if (!baseUrl || !apiKey) {
      throw new Error("Configure EVOLUTION_API_URL e EVOLUTION_API_KEY para enviar WhatsApp.");
    }

    return { instancia, baseUrl, apiKey };
  }
}

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
