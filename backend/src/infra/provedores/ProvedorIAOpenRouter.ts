/**
 * Implementação concreta do ProvedorIA utilizando a API do OpenRouter.
 *
 * Comunica-se com o endpoint /api/v1/chat/completions, compatível com o
 * formato OpenAI, adicionando os headers opcionais de atribuição do app.
 *
 * @see https://openrouter.ai/docs/quickstart
 */

import type {
  MensagemIA,
  OpcoesChatIA,
  ProvedorIA,
  RespostaChatIA,
} from "../../dominio/provedores/ProvedorIA.js";

export interface ConfiguracaoOpenRouter {
  apiKey: string;
  /** URL base do OpenRouter. Padrão: https://openrouter.ai */
  baseUrl?: string;
  /** Modelo padrão quando nenhum for especificado. Padrão: ~openai/gpt-latest */
  modeloPadrao?: string;
  /** URL do site para rankings no OpenRouter (header HTTP-Referer) */
  siteUrl?: string;
  /** Nome do site para rankings no OpenRouter (header X-OpenRouter-Title) */
  siteNome?: string;
  /** Timeout em ms para requests. Padrão: 60 000 */
  timeoutMs?: number;
}

export class ProvedorIAOpenRouter implements ProvedorIA {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modeloPadrao: string;
  private readonly siteUrl: string;
  private readonly siteNome: string;
  private readonly timeoutMs: number;

  constructor(config: ConfiguracaoOpenRouter) {
    if (!config.apiKey) {
      throw new Error("OPENROUTER_API_KEY é obrigatória para o ProvedorIAOpenRouter.");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? "https://openrouter.ai").replace(/\/+$/, "");
    this.modeloPadrao = config.modeloPadrao ?? "~openai/gpt-latest";
    this.siteUrl = config.siteUrl ?? "https://usebizy.space";
    this.siteNome = config.siteNome ?? "Bizy – ÉMeu";
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  async chat(mensagens: MensagemIA[], opcoes?: OpcoesChatIA): Promise<RespostaChatIA> {
    const corpo = this.montarCorpo(mensagens, { ...opcoes, stream: false });
    const resposta = await this.fazerRequest(corpo);
    const dados = await resposta.json() as OpenRouterChatResponse;

    if (!resposta.ok) {
      const erro = dados as unknown as { error?: { message?: string } };
      throw new Error(
        `OpenRouter erro ${resposta.status}: ${erro.error?.message ?? resposta.statusText}`
      );
    }

    const escolha = dados.choices?.[0];
    if (!escolha) {
      throw new Error("OpenRouter retornou resposta sem choices.");
    }

    return {
      conteudo: escolha.message?.content ?? "",
      modelo: dados.model ?? corpo.model,
      tokensUsados: {
        prompt: dados.usage?.prompt_tokens ?? 0,
        resposta: dados.usage?.completion_tokens ?? 0,
        total: dados.usage?.total_tokens ?? 0,
      },
    };
  }

  async chatStream(
    mensagens: MensagemIA[],
    opcoes?: OpcoesChatIA
  ): Promise<ReadableStream<string>> {
    const corpo = this.montarCorpo(mensagens, { ...opcoes, stream: true });
    const resposta = await this.fazerRequest(corpo);

    if (!resposta.ok) {
      const textoErro = await resposta.text();
      throw new Error(`OpenRouter stream erro ${resposta.status}: ${textoErro}`);
    }

    const body = resposta.body;
    if (!body) {
      throw new Error("OpenRouter não retornou body para stream.");
    }

    const decoder = new TextDecoder();

    return new ReadableStream<string>({
      async start(controller) {
        const reader = body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const linhas = buffer.split("\n");
            buffer = linhas.pop() ?? "";

            for (const linha of linhas) {
              const limpa = linha.replace(/^data:\s*/, "").trim();
              if (!limpa || limpa === "[DONE]") continue;

              try {
                const chunk = JSON.parse(limpa) as OpenRouterStreamChunk;
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(delta);
                }
              } catch {
                // Ignora linhas que não são JSON válido (ex.: comentários SSE)
              }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });
  }

  // ────────────────────────────── Internos ──────────────────────────────

  private montarCorpo(
    mensagens: MensagemIA[],
    opcoes?: OpcoesChatIA
  ): OpenRouterRequestBody {
    return {
      model: opcoes?.modelo ?? this.modeloPadrao,
      messages: mensagens.map((m) => ({ role: m.role, content: m.content })),
      temperature: opcoes?.temperatura ?? 0.7,
      max_tokens: opcoes?.maxTokens,
      stream: opcoes?.stream ?? false,
    };
  }

  private async fazerRequest(corpo: OpenRouterRequestBody): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": this.siteUrl,
      "X-OpenRouter-Title": this.siteNome,
    };

    return fetch(`${this.baseUrl}/api/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
  }
}

// ────────────────────────────── Tipos internos ──────────────────────────────

interface OpenRouterRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenRouterChatResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: { role?: string; content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
}
