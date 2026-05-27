import type {
  RepositorioSocialInbox,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import {
  estadosSocialInbox,
  intencoesSocialInbox,
  tiposSocialInbox,
  type EstadoSocialInbox,
  type FiltrosSocialInbox,
  type IntencaoSocialInbox,
  type NovoSocialInboxItem,
  type SocialInboxItem,
  type TipoSocialInbox
} from "../dominio/tipos.js";
import { lerBooleano, lerLista, parseCsv } from "./utils/csv.js";

const LIMIAR_TAREFA_LEAD = 0.7;

interface ResultadoLinhaImportacaoSocial {
  linha: number;
  status: "CRIADO" | "DUPLICADO" | "ERRO";
  itemId?: string;
  providerItemId?: string;
  erro?: string;
}

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

  async importarCsv(negocioId: string, conteudo: string) {
    const linhasCsv = parseCsv(conteudo);
    const linhas: ResultadoLinhaImportacaoSocial[] = [];

    for (const linhaCsv of linhasCsv) {
      try {
        const dados = this.mapearLinhaImportacao(negocioId, linhaCsv.dados);
        const providerItemId = this.extrairIdentificadorProvider(dados.contexto ?? {}) ?? undefined;
        const duplicado = await this.buscarDuplicado(dados);
        const item = await this.criarItem(dados);
        linhas.push({
          linha: linhaCsv.numero,
          status: duplicado ? "DUPLICADO" : "CRIADO",
          itemId: item.id,
          providerItemId
        });
      } catch (erro) {
        linhas.push({
          linha: linhaCsv.numero,
          status: "ERRO",
          erro: erro instanceof Error ? erro.message : "Linha inválida."
        });
      }
    }

    return {
      total: linhasCsv.length,
      criados: linhas.filter((linha) => linha.status === "CRIADO").length,
      duplicados: linhas.filter((linha) => linha.status === "DUPLICADO").length,
      erros: linhas.filter((linha) => linha.status === "ERRO").length,
      linhas
    };
  }

  private mapearLinhaImportacao(negocioId: string, linha: Record<string, string>): NovoSocialInboxItem {
    const canal = this.textoObrigatorio(linha.canal, "canal");
    const provider = this.textoObrigatorio(linha.provider, "provider");
    const texto = this.textoObrigatorio(linha.texto || linha.comentario || linha.mensagem, "texto");
    const tipo = this.valorEnum<TipoSocialInbox>(linha.tipo, tiposSocialInbox, "tipo") ?? "COMENTARIO";
    const estado = this.valorEnum<EstadoSocialInbox>(linha.estado, estadosSocialInbox, "estado") ?? "NOVO";
    const intencao =
      this.valorEnum<IntencaoSocialInbox>(linha.intencao || linha.intencao_compra, intencoesSocialInbox, "intencao") ??
      "SEM_INTENCAO";
    const confianca = this.numeroEntreZeroEUm(linha.confianca);
    const respondido = lerBooleano(linha.respondido);
    const providerPermissoes = lerLista(linha.provider_permissoes || linha.providerpermissoes || linha.permissoes);
    const providerItemId = this.texto(
      linha.provider_item_id ||
        linha.provideritemid ||
        linha.comment_id ||
        linha.commentid ||
        linha.comentario_id ||
        linha.message_id ||
        linha.messageid
    );
    const campanhaId = this.texto(linha.campanha_id || linha.campanhaid || linha.campanha);
    const produtoCodigo = this.texto(
      linha.produto_codigo ||
        linha.produtocodigo ||
        linha.codigo_produto ||
        linha.codigoproduto ||
        linha.codigo_peca ||
        linha.codigopeca
    );
    const capturadoEm = this.texto(linha.capturado_em || linha.capturadoem || linha.captured_at || linha.data_captura);

    return {
      negocioId,
      canal: canal.toLowerCase(),
      provider: provider.toLowerCase(),
      tipo,
      estado,
      postId: this.texto(linha.post_id || linha.postid),
      postUrl: this.texto(linha.post_url || linha.posturl),
      autorId: this.texto(linha.autor_id || linha.autorid || linha.user_id || linha.userid),
      autorUsername: this.texto(linha.autor_username || linha.autorusername || linha.username || linha.user_name),
      autorNome: this.texto(linha.autor_nome || linha.autornome || linha.nome || linha.name),
      autorAvatarUrl: this.texto(
        linha.autor_avatar_url || linha.autoravatarurl || linha.avatar_url || linha.avatarurl || linha.foto || linha.foto_perfil
      ),
      texto,
      intencao,
      confianca,
      clienteTelefone: this.texto(linha.cliente_telefone || linha.clientetelefone || linha.telefone || linha.whatsapp),
      entidades: {
        ...(produtoCodigo ? { produtoCodigo } : {}),
        ...(this.texto(linha.urgencia || linha.prioridade) ? { urgencia: this.texto(linha.urgencia || linha.prioridade) } : {})
      },
      contexto: {
        origemImportacao: "csv",
        ...(providerItemId ? { providerItemId } : {}),
        ...(campanhaId ? { campanhaId } : {}),
        ...(capturadoEm ? { capturedAt: capturadoEm } : {}),
        ...(providerPermissoes.length ? { providerPermissoes } : {}),
        ...(respondido !== undefined ? { respondido } : {})
      }
    };
  }

  private textoObrigatorio(valor: string | undefined, campo: string): string {
    const texto = this.texto(valor);
    if (!texto) throw new Error(`Campo obrigatório ausente na importação social: ${campo}.`);
    return texto;
  }

  private texto(valor: string | undefined | null): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  }

  private valorEnum<T extends string>(valor: string | undefined, permitidos: readonly T[], campo: string): T | null {
    const texto = this.texto(valor);
    if (!texto) return null;
    const normalizado = texto.toUpperCase();
    const encontrado = permitidos.find((permitido) => permitido === normalizado);
    if (!encontrado) throw new Error(`Valor inválido para ${campo}: ${texto}.`);
    return encontrado;
  }

  private numeroEntreZeroEUm(valor: string | undefined): number {
    const texto = this.texto(valor);
    if (!texto) return 0;
    const numero = Number(texto.replace(",", "."));
    if (!Number.isFinite(numero) || numero < 0 || numero > 1) {
      throw new Error(`Confiança inválida na importação social: ${texto}.`);
    }
    return numero;
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
