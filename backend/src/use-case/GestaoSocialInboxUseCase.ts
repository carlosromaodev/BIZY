import type {
  RepositorioSocialInbox,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import type { FiltrosSocialInbox, NovoSocialInboxItem, SocialInboxItem } from "../dominio/tipos.js";

const LIMIAR_TAREFA_LEAD = 0.7;

export class GestaoSocialInboxUseCase {
  constructor(
    private readonly socialInbox: RepositorioSocialInbox,
    private readonly tarefas: RepositorioTarefasOperacionais
  ) {}

  async criarItem(dados: NovoSocialInboxItem): Promise<SocialInboxItem> {
    const item = await this.socialInbox.criar({
      ...dados,
      estado: dados.estado ?? "NOVO",
      intencao: dados.intencao ?? "SEM_INTENCAO",
      confianca: dados.confianca ?? 0,
      entidades: dados.entidades ?? {},
      contexto: dados.contexto ?? {}
    });

    if (this.deveCriarTarefaLead(item)) {
      await this.tarefas.criar({
        negocioId: item.negocioId,
        tipo: "SOCIAL_LEAD_REVIEW",
        titulo: `Responder lead do ${this.nomeCanal(item.canal)}`,
        descricao: item.texto,
        prioridade: item.confianca >= 0.9 ? "ALTA" : "NORMAL",
        origem: "social_inbox",
        entidadeTipo: "social_inbox_item",
        entidadeId: item.id,
        clienteTelefone: item.clienteTelefone,
        contexto: {
          social: {
            canal: item.canal,
            provider: item.provider,
            postId: item.postId,
            autorUsername: item.autorUsername,
            intencao: item.intencao,
            confianca: item.confianca,
            entidades: item.entidades
          }
        }
      });
    }

    return item;
  }

  listarItens(negocioId: string, filtros: FiltrosSocialInbox = {}) {
    return this.socialInbox.listar(negocioId, filtros);
  }

  obterItem(id: string, negocioId: string) {
    return this.socialInbox.buscarPorId(id, negocioId);
  }

  private deveCriarTarefaLead(item: SocialInboxItem): boolean {
    return item.intencao === "COMPRA" && item.confianca >= LIMIAR_TAREFA_LEAD;
  }

  private nomeCanal(canal: string): string {
    const normalizado = canal.trim().toLowerCase();
    if (normalizado === "instagram") return "Instagram";
    if (normalizado === "tiktok") return "TikTok";
    if (normalizado === "facebook") return "Facebook";
    if (normalizado === "whatsapp") return "WhatsApp";
    return canal;
  }
}
