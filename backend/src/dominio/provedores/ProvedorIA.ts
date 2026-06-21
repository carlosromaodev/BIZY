/**
 * Contrato para provedores de Inteligência Artificial.
 * Abstrai a comunicação com modelos de linguagem (LLMs),
 * permitindo trocar de provedor sem alterar a lógica de negócio.
 */

export interface MensagemIA {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpcoesChatIA {
  /** Slug do modelo (ex.: "~openai/gpt-latest", "~anthropic/claude-sonnet-latest") */
  modelo?: string;
  /** Temperatura de amostragem (0–2). Padrão: 0.7 */
  temperatura?: number;
  /** Número máximo de tokens na resposta */
  maxTokens?: number;
  /** Se true, retorna a resposta como stream (SSE) */
  stream?: boolean;
}

export interface RespostaChatIA {
  conteudo: string;
  modelo: string;
  tokensUsados: {
    prompt: number;
    resposta: number;
    total: number;
  };
}

export interface ProvedorIA {
  /** Envia mensagens e obtém uma resposta completa */
  chat(mensagens: MensagemIA[], opcoes?: OpcoesChatIA): Promise<RespostaChatIA>;

  /** Envia mensagens e retorna um ReadableStream de chunks (SSE) */
  chatStream(
    mensagens: MensagemIA[],
    opcoes?: OpcoesChatIA
  ): Promise<ReadableStream<string>>;
}
