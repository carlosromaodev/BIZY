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
    const duplicado = await this.buscarDuplicado(dados);
    if (duplicado) return duplicado;

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

    if (this.deveCriarTarefaHumana(item)) {
      await this.tarefas.criar({
        negocioId: item.negocioId,
        tipo: "SOCIAL_HUMAN_REVIEW",
        titulo: `Rever ${this.nomeIntencao(item.intencao)} do ${this.nomeCanal(item.canal)}`,
        descricao: item.texto,
        prioridade: item.confianca >= 0.8 || item.intencao === "RECLAMACAO" ? "ALTA" : "NORMAL",
        origem: "social_inbox",
        entidadeTipo: "social_inbox_item",
        entidadeId: item.id,
        clienteTelefone: item.clienteTelefone,
        contexto: {
          social: {
            canal: item.canal,
            provider: item.provider,
            postId: item.postId,
            postUrl: item.postUrl,
            autorId: item.autorId,
            autorUsername: item.autorUsername,
            intencao: item.intencao,
            confianca: item.confianca,
            providerPermissoes: this.obterPermissoesProvider(item.contexto),
            capturadoEm: item.contexto.capturedAt ?? item.criadoEm.toISOString()
          },
          motivo: "Caso sensível exige atendimento humano antes de automação."
        }
      });
    }

    return item;
  }

  listarItens(negocioId: string, filtros: FiltrosSocialInbox = {}) {
    return this.listarComFiltrosComerciais(negocioId, filtros);
  }

  obterItem(id: string, negocioId: string) {
    return this.socialInbox.buscarPorId(id, negocioId);
  }

  private deveCriarTarefaLead(item: SocialInboxItem): boolean {
    return item.intencao === "COMPRA" && item.confianca >= LIMIAR_TAREFA_LEAD;
  }

  private deveCriarTarefaHumana(item: SocialInboxItem): boolean {
    if (item.intencao === "RECLAMACAO") return true;
    const texto = item.texto.toLowerCase();
    return /\b(desconto|troca|devolu[cç][aã]o|cancelar|cancelamento|problema|conflito|reembolso)\b/u.test(texto);
  }

  private async buscarDuplicado(dados: NovoSocialInboxItem): Promise<SocialInboxItem | null> {
    const candidatos = await this.socialInbox.listar(dados.negocioId, {
      canal: dados.canal,
      limite: 500
    });
    const providerItemId = this.extrairIdentificadorProvider(dados.contexto ?? {});
    const texto = dados.texto.trim().toLowerCase();

    return (
      candidatos.find((item) => {
        if (item.provider !== dados.provider) return false;
        const mesmoProviderId =
          providerItemId && providerItemId === this.extrairIdentificadorProvider(item.contexto ?? {});
        const mesmoAutorPostTexto =
          dados.postId &&
          item.postId === dados.postId &&
          item.autorId &&
          item.autorId === (dados.autorId ?? null) &&
          item.texto.trim().toLowerCase() === texto;
        return Boolean(mesmoProviderId || mesmoAutorPostTexto);
      }) ?? null
    );
  }

  private async listarComFiltrosComerciais(negocioId: string, filtros: FiltrosSocialInbox): Promise<SocialInboxItem[]> {
    const limite = Math.max(1, Math.min(filtros.limite ?? 100, 500));
    const itens = await this.socialInbox.listar(negocioId, {
      canal: filtros.canal,
      estado: filtros.estado,
      intencao: filtros.intencao,
      autorUsername: filtros.autorUsername,
      clienteTelefone: filtros.clienteTelefone,
      limite: this.temFiltroAvancado(filtros) ? 500 : limite
    });

    return itens
      .filter((item) => !filtros.provider || item.provider === filtros.provider)
      .filter((item) => !filtros.postId || item.postId === filtros.postId)
      .filter((item) => !filtros.campanhaId || this.valorComercial(item, "campanhaId") === filtros.campanhaId)
      .filter((item) => !filtros.produtoCodigo || this.valorComercial(item, "produtoCodigo", "codigoPeca") === filtros.produtoCodigo)
      .filter((item) => !filtros.responsavelId || this.valorComercial(item, "responsavelId") === filtros.responsavelId)
      .filter((item) => !filtros.urgencia || this.valorComercial(item, "urgencia", "prioridade") === filtros.urgencia)
      .filter((item) => filtros.respondido === undefined || this.itemRespondido(item) === filtros.respondido)
      .slice(0, limite);
  }

  private temFiltroAvancado(filtros: FiltrosSocialInbox): boolean {
    return Boolean(
      filtros.provider ||
        filtros.postId ||
        filtros.campanhaId ||
        filtros.produtoCodigo ||
        filtros.responsavelId ||
        filtros.urgencia ||
        filtros.respondido !== undefined
    );
  }

  private valorComercial(item: SocialInboxItem, chave: string, alternativa?: string): string | null {
    const valor =
      item.contexto[chave] ??
      item.entidades[chave] ??
      (alternativa ? item.contexto[alternativa] ?? item.entidades[alternativa] : null);
    return typeof valor === "string" ? valor : null;
  }

  private itemRespondido(item: SocialInboxItem): boolean {
    const respondido = item.contexto.respondido ?? item.entidades.respondido;
    if (typeof respondido === "boolean") return respondido;
    return item.estado === "CONVERTIDO";
  }

  private extrairIdentificadorProvider(contexto: Record<string, unknown>): string | null {
    for (const chave of ["providerItemId", "commentId", "comentarioId", "messageId", "eventId", "id"]) {
      const valor = contexto[chave];
      if (typeof valor === "string" && valor.trim()) return valor.trim();
    }
    return null;
  }

  private obterPermissoesProvider(contexto: Record<string, unknown>): unknown {
    return contexto.providerPermissoes ?? contexto.permissions ?? contexto.permissoes ?? [];
  }

  private nomeIntencao(intencao: string): string {
    const normalizado = intencao.trim().toLowerCase();
    if (normalizado === "reclamacao") return "reclamação";
    if (normalizado === "compra") return "intenção de compra";
    if (normalizado === "duvida") return "dúvida";
    return "interação social";
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
