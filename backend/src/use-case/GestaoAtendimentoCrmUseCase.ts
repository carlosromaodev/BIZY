import type { RepositorioAtendimento } from "../dominio/repositorios/contratos.js";
import type {
  AtualizacaoConversaAtendimento,
  ConversaAtendimentoComMensagens,
  MensagemAtendimento,
  PoliticaAutomacaoAtendimento
} from "../dominio/tipos.js";

const prefixoPolitica = "politica:";

export class GestaoAtendimentoCrmUseCase {
  constructor(private readonly repositorioAtendimento: RepositorioAtendimento) {}

  async atualizarConversa(id: string, dados: AtualizacaoConversaAtendimento): Promise<ConversaAtendimentoComMensagens> {
    const atualizada = await this.repositorioAtendimento.atualizarConversa(id, {
      ...dados,
      tags: dados.tags ? this.normalizarTags(dados.tags) : undefined
    });

    if (!atualizada) throw new Error(`Conversa de atendimento ${id} não encontrada.`);
    return atualizada;
  }

  async definirPoliticaAutomacao(
    id: string,
    politica: PoliticaAutomacaoAtendimento
  ): Promise<{ conversa: ConversaAtendimentoComMensagens; politicaAutomacao: PoliticaAutomacaoAtendimento }> {
    const atual = await this.exigirConversa(id);
    const tags = [
      ...atual.conversa.tags.filter((tag) => !tag.startsWith(prefixoPolitica)),
      `${prefixoPolitica}${politica}`
    ];
    const conversa = await this.atualizarConversa(id, {
      estado: politica === "EXIGIR_HUMANO" || politica === "BLOQUEAR_IA" ? "AGUARDANDO_HUMANO" : atual.conversa.estado,
      tags
    });

    return { conversa, politicaAutomacao: politica };
  }

  async registrarNotaInterna(
    id: string,
    dados: { texto: string; autorId?: string | null; autorNome?: string | null }
  ): Promise<MensagemAtendimento> {
    const conversa = await this.exigirConversa(id);

    return this.repositorioAtendimento.registrarMensagem({
      conversaId: conversa.conversa.id,
      telefone: conversa.conversa.telefone,
      direcao: "OUTBOUND",
      remetente: "agente",
      canal: "interno",
      tipo: "NOTA_INTERNA",
      conteudo: dados.texto,
      status: "SENT",
      origem: "nota_interna",
      contexto: {
        visibilidade: "interna",
        autorId: dados.autorId ?? null,
        autorNome: dados.autorNome ?? null
      }
    });
  }

  async registrarSugestaoIa(
    id: string,
    dados: {
      texto: string;
      regra: string;
      confianca: number;
      dadosConsultados: Record<string, unknown>;
    }
  ): Promise<MensagemAtendimento> {
    const conversa = await this.exigirConversa(id);

    await this.atualizarConversa(id, { estado: "AGUARDANDO_HUMANO" });

    return this.repositorioAtendimento.registrarMensagem({
      conversaId: conversa.conversa.id,
      telefone: conversa.conversa.telefone,
      direcao: "OUTBOUND",
      remetente: "sistema",
      canal: "interno",
      tipo: "SUGESTAO_IA",
      conteudo: dados.texto,
      status: "QUEUED",
      origem: "ia_sugestao",
      contexto: {
        exigeAprovacaoHumana: true,
        decisaoAutomatica: {
          acao: "SUGERIR_RESPOSTA",
          regra: dados.regra,
          confianca: dados.confianca,
          dadosConsultados: dados.dadosConsultados
        }
      }
    });
  }

  private async exigirConversa(id: string): Promise<ConversaAtendimentoComMensagens> {
    const conversa = await this.repositorioAtendimento.buscarConversaComMensagensPorId(id);
    if (!conversa) throw new Error(`Conversa de atendimento ${id} não encontrada.`);
    return conversa;
  }

  private normalizarTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }
}
