/**
 * Use Case de Assistente IA — encapsula a lógica de conversação com modelos
 * de linguagem via ProvedorIA, adicionando contexto de negócio e prompts de sistema.
 *
 * Fornece métodos de alto nível para o ÉMeu/Bizy utilizar IA em:
 * - Atendimento automatizado ao cliente
 * - Geração de descrições de peças/produtos
 * - Resumo de conversas de atendimento
 * - Análise de sentimento de clientes
 * - Respostas genéricas via chat
 */

import type {
  MensagemIA,
  OpcoesChatIA,
  ProvedorIA,
  RespostaChatIA,
} from "../dominio/provedores/ProvedorIA.js";

export interface ConfiguracaoAssistenteIA {
  provedorIA: ProvedorIA;
  modeloPadrao?: string;
}

export class AssistenteIAUseCase {
  private readonly provedor: ProvedorIA;
  private readonly modeloPadrao: string;

  constructor(config: ConfiguracaoAssistenteIA) {
    this.provedor = config.provedorIA;
    this.modeloPadrao = config.modeloPadrao ?? "~openai/gpt-latest";
  }

  /**
   * Chat livre — envia mensagens e obtém uma resposta completa.
   */
  async chat(mensagens: MensagemIA[], opcoes?: OpcoesChatIA): Promise<RespostaChatIA> {
    return this.provedor.chat(mensagens, {
      modelo: this.modeloPadrao,
      ...opcoes,
    });
  }

  /**
   * Chat com streaming — retorna um ReadableStream de chunks de texto.
   */
  async chatStream(
    mensagens: MensagemIA[],
    opcoes?: OpcoesChatIA
  ): Promise<ReadableStream<string>> {
    return this.provedor.chatStream(mensagens, {
      modelo: this.modeloPadrao,
      ...opcoes,
    });
  }

  /**
   * Gera descrição de produto/peça a partir de informações básicas.
   */
  async gerarDescricaoProduto(dados: {
    nome: string;
    categoria?: string;
    preco?: number;
    detalhes?: string;
  }): Promise<string> {
    const mensagens: MensagemIA[] = [
      {
        role: "system",
        content:
          "És um assistente especializado em e-commerce e live commerce. " +
          "Gera descrições de produto atrativas, concisas e profissionais em português. " +
          "Mantém um tom convidativo e destaca os benefícios para o comprador. " +
          "Responde APENAS com a descrição, sem introduções ou explicações.",
      },
      {
        role: "user",
        content: [
          `Nome do produto: ${dados.nome}`,
          dados.categoria ? `Categoria: ${dados.categoria}` : null,
          dados.preco ? `Preço: ${dados.preco} Kz` : null,
          dados.detalhes ? `Detalhes adicionais: ${dados.detalhes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];

    const resposta = await this.provedor.chat(mensagens, {
      modelo: this.modeloPadrao,
      temperatura: 0.8,
      maxTokens: 500,
    });

    return resposta.conteudo;
  }

  /**
   * Resume uma conversa de atendimento para contexto rápido do operador.
   */
  async resumirConversa(mensagens: Array<{ remetente: string; texto: string }>): Promise<string> {
    const historicoFormatado = mensagens
      .map((m) => `[${m.remetente}]: ${m.texto}`)
      .join("\n");

    const prompt: MensagemIA[] = [
      {
        role: "system",
        content:
          "Resume a conversa de atendimento abaixo em 2-3 frases curtas em português. " +
          "Foca nos pontos-chave: qual é o assunto, o que o cliente precisa e o estado actual.",
      },
      {
        role: "user",
        content: historicoFormatado,
      },
    ];

    const resposta = await this.provedor.chat(prompt, {
      modelo: this.modeloPadrao,
      temperatura: 0.3,
      maxTokens: 300,
    });

    return resposta.conteudo;
  }

  /**
   * Sugere uma resposta automática para o atendimento ao cliente.
   */
  async sugerirRespostaAtendimento(contexto: {
    nomeCliente: string;
    mensagemCliente: string;
    historicoResumo?: string;
    nomeNegocio?: string;
  }): Promise<string> {
    const mensagens: MensagemIA[] = [
      {
        role: "system",
        content:
          `És o assistente de atendimento de ${contexto.nomeNegocio ?? "uma loja online"}. ` +
          "Responde de forma profissional, empática e concisa em português. " +
          "O objectivo é ajudar o cliente da melhor forma possível. " +
          "Responde APENAS com a mensagem sugerida, sem explicações adicionais.",
      },
      ...(contexto.historicoResumo
        ? [
            {
              role: "system" as const,
              content: `Resumo do histórico: ${contexto.historicoResumo}`,
            },
          ]
        : []),
      {
        role: "user",
        content: `Mensagem do cliente ${contexto.nomeCliente}: "${contexto.mensagemCliente}"`,
      },
    ];

    const resposta = await this.provedor.chat(mensagens, {
      modelo: this.modeloPadrao,
      temperatura: 0.5,
      maxTokens: 400,
    });

    return resposta.conteudo;
  }
}
