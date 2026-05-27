import type {
  RepositorioAutenticacao,
  RepositorioAtendimento,
  RepositorioEventosOperacionais,
  RepositorioFunilComercial,
  RepositorioOportunidadesRecuperacao,
  RepositorioSocialInbox,
  RepositorioTarefasOperacionais
} from "../dominio/repositorios/contratos.js";
import {
  estadosSocialInbox,
  intencoesSocialInbox,
  tiposSocialInbox,
  type EtapaFunilComercial,
  type EstadoSocialInbox,
  type FiltrosSocialInbox,
  type IntencaoSocialInbox,
  type TarefaOperacional,
  type NegocioBizy,
  type NovoSocialInboxItem,
  type SocialInboxItem,
  type TipoSocialInbox
} from "../dominio/tipos.js";
import { lerBooleano, lerLista, parseCsv } from "./utils/csv.js";

const LIMIAR_TAREFA_LEAD = 0.7;
const CHAVES_SENSIVEIS_CONTA_SOCIAL = new Set([
  "token",
  "accesstoken",
  "refreshtoken",
  "clientsecret",
  "secret",
  "apikey",
  "password",
  "senha",
  "appsecret"
]);

const PROVIDERS_SOCIAIS_AUTORIZADOS: ProviderSocialAutorizado[] = [
  {
    codigo: "instagram_graph",
    canal: "instagram",
    nome: "Instagram Graph API",
    tipo: "OFICIAL",
    autorizado: true,
    permissoesObrigatorias: ["comments.read", "profile.read"],
    capacidades: ["comentarios", "mensagens", "perfil", "avatar", "webhooks"],
    observacao: "Usar apenas contas Business/Creator ligadas ao Meta Business com consentimento do gestor."
  },
  {
    codigo: "facebook_graph",
    canal: "facebook",
    nome: "Facebook Graph API",
    tipo: "OFICIAL",
    autorizado: true,
    permissoesObrigatorias: ["pages_read_engagement", "pages_manage_metadata"],
    capacidades: ["comentarios", "mensagens", "perfil", "avatar", "webhooks"],
    observacao: "Requer página administrada pelo negócio e revisão de permissões quando aplicável."
  },
  {
    codigo: "tiktok_business",
    canal: "tiktok",
    nome: "TikTok Business API",
    tipo: "OFICIAL",
    autorizado: true,
    permissoesObrigatorias: ["comments.read", "profile.read"],
    capacidades: ["comentarios", "perfil", "avatar", "sincronizacao"],
    observacao: "Usar quando a conta do negócio permitir acesso oficial a comentários e metadados."
  },
  {
    codigo: "manual_csv",
    canal: "multi",
    nome: "Importação manual auditada",
    tipo: "CONECTOR_AUTORIZADO",
    autorizado: true,
    permissoesObrigatorias: [],
    capacidades: ["csv", "auditoria", "normalizacao"],
    observacao: "Fallback operacional para fontes autorizadas sem integração em tempo real."
  }
];

interface ProviderSocialAutorizado {
  codigo: string;
  canal: string;
  nome: string;
  tipo: "OFICIAL" | "CONECTOR_AUTORIZADO";
  autorizado: true;
  permissoesObrigatorias: string[];
  capacidades: string[];
  observacao: string;
}

export interface DadosConexaoContaSocial {
  canal: string;
  provider: string;
  identificador: string;
  username: string | null;
  nomePublico: string | null;
  avatarUrl: string | null;
  permissoes: string[];
  credencialRef: string | null;
  webhookAtivo: boolean;
  [chave: string]: unknown;
}

export interface DadosCapturaProviderSocial {
  canal: string;
  provider: string;
  contaIdentificador: string;
  providerItemId: string;
  tipo: TipoSocialInbox;
  mediaTipo: "FOTO" | "VIDEO" | "POST" | "LIVE" | "REEL" | "STORY";
  postId: string | null;
  postUrl: string | null;
  autor: {
    id?: string | null;
    username?: string | null;
    nome?: string | null;
    avatarUrl?: string | null;
  };
  texto: string;
  intencao: IntencaoSocialInbox;
  confianca: number;
  clienteTelefone: string | null;
  clienteId: string | null;
  entidades: Record<string, unknown>;
  contexto: Record<string, unknown>;
  capturadoEm: string | null;
}

interface ContaSocialConectada {
  id: string;
  canal: string;
  provider: string;
  providerTipo: ProviderSocialAutorizado["tipo"];
  identificador: string;
  username: string | null;
  nomePublico: string | null;
  avatarUrl: string | null;
  permissoes: string[];
  credencialRef: string | null;
  webhookAtivo: boolean;
  status: "CONECTADA" | "PENDENTE" | "ERRO" | "DESCONECTADA";
  conectadoEm: string;
  atualizadoEm: string;
}

interface ConfiguracaoContasSociais {
  versao: 1;
  atualizadoEm: string;
  contas: ContaSocialConectada[];
  providersAutorizados: string[];
}

interface ClassificacaoInteracaoSocial {
  intencao: IntencaoSocialInbox;
  confianca: number;
  automatica: boolean;
  regra?: string;
  sinais?: string[];
}

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
    private readonly tarefas: RepositorioTarefasOperacionais,
    private readonly autenticacao: RepositorioAutenticacao,
    private readonly atendimento: RepositorioAtendimento,
    private readonly oportunidades: RepositorioOportunidadesRecuperacao,
    private readonly eventos: RepositorioEventosOperacionais,
    private readonly funil: RepositorioFunilComercial
  ) {}

  listarProvidersAutorizados() {
    return PROVIDERS_SOCIAIS_AUTORIZADOS.map((provider) => ({ ...provider }));
  }

  listarContasSociais(negocio: NegocioBizy): ContaSocialConectada[] {
    return this.normalizarConfiguracaoContasSociais(negocio.contasSociais).contas;
  }

  async conectarContaSocial(
    negocio: NegocioBizy,
    dados: DadosConexaoContaSocial,
    payloadBruto: unknown = dados
  ): Promise<ContaSocialConectada> {
    const chaveSensivel = this.encontrarChaveSensivel(payloadBruto);
    if (chaveSensivel) {
      throw new Error(
        `Não envie tokens brutos no cadastro social: ${chaveSensivel} não pode ser persistido. Use credencialRef.`
      );
    }

    const provider = this.validarProvider(dados);
    const permissoes = [...new Set(dados.permissoes.map((permissao) => permissao.trim().toLowerCase()).filter(Boolean))];
    const ausentes = provider.permissoesObrigatorias.filter((permissao) => !permissoes.includes(permissao));
    if (ausentes.length) {
      throw new Error(`Permissões inválidas para ${provider.nome}: faltam ${ausentes.join(", ")}.`);
    }

    const agora = new Date().toISOString();
    const configuracaoAtual = this.normalizarConfiguracaoContasSociais(negocio.contasSociais);
    const conta: ContaSocialConectada = {
      id: `${dados.canal}:${dados.identificador}`,
      canal: dados.canal,
      provider: provider.codigo,
      providerTipo: provider.tipo,
      identificador: dados.identificador,
      username: dados.username,
      nomePublico: dados.nomePublico,
      avatarUrl: dados.avatarUrl,
      permissoes,
      credencialRef: dados.credencialRef,
      webhookAtivo: dados.webhookAtivo,
      status: "CONECTADA",
      conectadoEm: configuracaoAtual.contas.find((item) => item.id === `${dados.canal}:${dados.identificador}`)?.conectadoEm ?? agora,
      atualizadoEm: agora
    };
    const atualizado: ConfiguracaoContasSociais = {
      ...configuracaoAtual,
      atualizadoEm: agora,
      providersAutorizados: PROVIDERS_SOCIAIS_AUTORIZADOS.map((item) => item.codigo),
      contas: [...configuracaoAtual.contas.filter((item) => item.id !== conta.id), conta]
    };

    await this.autenticacao.atualizarContasSociaisNegocio(negocio.id, atualizado as unknown as Record<string, unknown>);
    return conta;
  }

  async capturarItemProvider(negocio: NegocioBizy, dados: DadosCapturaProviderSocial): Promise<SocialInboxItem> {
    const provider = this.validarProvider({
      canal: dados.canal,
      provider: dados.provider,
      identificador: dados.contaIdentificador,
      username: null,
      nomePublico: null,
      avatarUrl: null,
      permissoes: [],
      credencialRef: null,
      webhookAtivo: false
    });
    const conta = this.buscarContaSocialConectada(negocio, dados.canal, provider.codigo, dados.contaIdentificador);

    if (!conta.permissoes.includes("comments.read")) {
      throw new Error(`Permissão inválida para capturar comentários em ${provider.nome}: falta comments.read.`);
    }

    return this.criarItem({
      negocioId: negocio.id,
      canal: dados.canal,
      provider: provider.codigo,
      tipo: dados.tipo,
      estado: "NOVO",
      postId: dados.postId,
      postUrl: dados.postUrl,
      autorId: dados.autor.id ?? null,
      autorUsername: dados.autor.username ?? null,
      autorNome: dados.autor.nome ?? null,
      autorAvatarUrl: dados.autor.avatarUrl ?? null,
      texto: dados.texto,
      intencao: dados.intencao,
      confianca: dados.confianca,
      clienteTelefone: dados.clienteTelefone,
      clienteId: dados.clienteId,
      entidades: dados.entidades,
      contexto: {
        ...dados.contexto,
        origemCaptura: "provider",
        mediaTipo: dados.mediaTipo,
        providerItemId: dados.providerItemId,
        providerContaId: conta.id,
        providerPermissoes: conta.permissoes,
        providerTipo: conta.providerTipo,
        capturedAt: dados.capturadoEm ?? new Date().toISOString()
      }
    });
  }

  async criarItem(dados: NovoSocialInboxItem): Promise<SocialInboxItem> {
    const duplicado = await this.buscarDuplicado(dados);
    if (duplicado) return duplicado;
    const classificacao = this.classificarInteracao(dados.texto, dados.intencao, dados.confianca);
    const contexto = {
      ...(dados.contexto ?? {}),
      ...(classificacao.automatica
        ? {
            classificacao: {
              origem: "automatica",
              regra: classificacao.regra,
              sinais: classificacao.sinais,
              versao: 1
            }
          }
        : {})
    };

    const item = await this.socialInbox.criar({
      ...dados,
      estado: dados.estado ?? "NOVO",
      intencao: classificacao.intencao,
      confianca: classificacao.confianca,
      entidades: dados.entidades ?? {},
      contexto
    });

    await this.registrarAuditoriaCapturaSocial(item);

    let tarefaLead: TarefaOperacional | null = null;

    if (this.deveCriarTarefaLead(item)) {
      tarefaLead = await this.tarefas.criar({
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

    if (this.deveCriarOportunidadeSocial(item)) {
      await this.registrarMovimentoFunilSocial(item, "LEAD", "Comentário social classificado como intenção comercial.");
    }

    await this.sincronizarAtendimentoSocial(item);

    if (item.clienteTelefone && item.intencao !== "SPAM") {
      await this.registrarMovimentoFunilSocial(item, "CONVERSA", "Comentário social com telefone abriu conversa no atendimento.");
    }

    await this.criarOportunidadeSocial(item, tarefaLead);

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

  private async registrarAuditoriaCapturaSocial(item: SocialInboxItem): Promise<void> {
    await this.eventos.registrar({
      negocioId: item.negocioId,
      topico: "social_inbox",
      tipo: "SOCIAL_INBOX_CAPTURED",
      entidadeTipo: "social_inbox_item",
      entidadeId: item.id,
      idempotencyKey: `social-inbox:${item.id}:captured`,
      estado: "PROCESSADO",
      payload: {
        canal: item.canal,
        provider: item.provider,
        tipo: item.tipo,
        estado: item.estado,
        postId: item.postId,
        postUrl: item.postUrl,
        autorId: item.autorId,
        autorUsername: item.autorUsername,
        autorNome: item.autorNome,
        intencao: item.intencao,
        confianca: item.confianca,
        clienteTelefone: item.clienteTelefone,
        clienteId: item.clienteId,
        entidades: item.entidades,
        origemCaptura: String(item.contexto.origemCaptura ?? "manual"),
        providerItemId: this.extrairIdentificadorProvider(item.contexto),
        providerContaId: this.valorTextoContexto(item.contexto.providerContaId),
        providerPermissoes: this.obterPermissoesProvider(item.contexto),
        mediaTipo: this.valorTextoContexto(item.contexto.mediaTipo),
        campanha: this.valorTextoContexto(item.contexto.campanha ?? item.contexto.campanhaId),
        capturadoEm: this.valorTextoContexto(item.contexto.capturedAt) ?? item.criadoEm.toISOString()
      }
    });
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

  private async sincronizarAtendimentoSocial(item: SocialInboxItem): Promise<void> {
    if (!item.clienteTelefone) return;

    await this.atendimento.registrarMensagem({
      negocioId: item.negocioId,
      telefone: item.clienteTelefone,
      nomeCliente: item.autorNome,
      usernameCliente: item.autorUsername,
      userIdCliente: item.autorId,
      avatarUrlCliente: item.autorAvatarUrl,
      direcao: "INBOUND",
      remetente: "cliente",
      canal: item.canal,
      tipo: "SOCIAL_INBOX",
      conteudo: item.texto,
      provider: item.provider,
      providerMessageId: this.extrairIdentificadorProvider(item.contexto) ?? item.id,
      status: "RECEIVED",
      origem: "social_inbox",
      contexto: {
        socialInboxItemId: item.id,
        nomeCliente: item.autorNome,
        postId: item.postId,
        postUrl: item.postUrl,
        intencao: item.intencao,
        confianca: item.confianca,
        autorId: item.autorId,
        autorUsername: item.autorUsername,
        entidades: item.entidades,
        contextoSocial: item.contexto
      },
      enviadaEm: item.criadoEm
    });
  }

  private async criarOportunidadeSocial(item: SocialInboxItem, tarefaLead: TarefaOperacional | null): Promise<void> {
    if (!this.deveCriarOportunidadeSocial(item)) return;

    await this.oportunidades.criar({
      negocioId: item.negocioId,
      gatilho: "SOCIAL_LEAD",
      estado: "ABERTA",
      entidadeTipo: "social_inbox_item",
      entidadeId: item.id,
      clienteTelefone: item.clienteTelefone,
      tarefaId: tarefaLead?.id ?? null,
      motivo: "Lead social com intenção comercial exige acompanhamento.",
      contexto: {
        canal: item.canal,
        provider: item.provider,
        postId: item.postId,
        postUrl: item.postUrl,
        intencao: item.intencao,
        confianca: item.confianca,
        autorUsername: item.autorUsername,
        entidades: item.entidades
      }
    });
  }

  private async registrarMovimentoFunilSocial(
    item: SocialInboxItem,
    etapaNova: EtapaFunilComercial,
    motivo: string
  ): Promise<void> {
    const [ultimoMovimento] = await this.funil.listarMovimentos(item.negocioId, {
      entidadeTipo: "social_inbox_item",
      entidadeId: item.id,
      limite: 1
    });

    await this.funil.registrarMovimento({
      negocioId: item.negocioId,
      entidadeTipo: "social_inbox_item",
      entidadeId: item.id,
      etapaAnterior: ultimoMovimento?.etapaNova ?? null,
      etapaNova,
      motivo,
      origem: "social_inbox",
      contexto: {
        canal: item.canal,
        provider: item.provider,
        postId: item.postId,
        postUrl: item.postUrl,
        intencao: item.intencao,
        confianca: item.confianca,
        clienteTelefone: item.clienteTelefone,
        autorId: item.autorId,
        autorUsername: item.autorUsername,
        entidades: item.entidades
      }
    });
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

  private classificarInteracao(
    textoOriginal: string,
    intencaoInformada: IntencaoSocialInbox | undefined,
    confiancaInformada: number | undefined
  ): ClassificacaoInteracaoSocial {
    if (intencaoInformada && intencaoInformada !== "SEM_INTENCAO") {
      return {
        intencao: intencaoInformada,
        confianca: confiancaInformada ?? 0,
        automatica: false
      };
    }
    if ((confiancaInformada ?? 0) > 0) {
      return {
        intencao: intencaoInformada ?? "SEM_INTENCAO",
        confianca: confiancaInformada ?? 0,
        automatica: false
      };
    }

    const texto = this.normalizarTextoAnalise(textoOriginal);
    const regras: Array<{
      regra: string;
      intencao: IntencaoSocialInbox;
      confianca: number;
      sinais: string[];
      padrao: RegExp;
    }> = [
      {
        regra: "spam",
        intencao: "SPAM",
        confianca: 0.9,
        sinais: ["link suspeito", "ganho facil"],
        padrao: /\b(ganhe seguidores|seguidores gratis|clique aqui|http:\/\/|https:\/\/|bit\.ly|t\.me\/|cripto|forex)\b/u
      },
      {
        regra: "reclamacao",
        intencao: "RECLAMACAO",
        confianca: 0.86,
        sinais: ["problema", "troca", "devolucao"],
        padrao: /\b(problema|reclamacao|troca|devolucao|devolver|cancelar|reembolso|nao recebi|veio errado)\b/u
      },
      {
        regra: "compra",
        intencao: "COMPRA",
        confianca: 0.82,
        sinais: ["quero comprar", "reservar", "vou levar"],
        padrao: /\b(quero comprar|vou levar|reserva|reservar|manda na dm|chama no whatsapp|fechar pedido)\b/u
      },
      {
        regra: "preco",
        intencao: "PRECO",
        confianca: 0.74,
        sinais: ["preco", "valor", "quanto custa"],
        padrao: /\b(preco|valor|quanto custa|quanto e|custa quanto|qual e o preco|preç)\b/u
      },
      {
        regra: "tamanho_cor",
        intencao: "TAMANHO_COR",
        confianca: 0.76,
        sinais: ["tamanho", "cor", "numero"],
        padrao: /\b(tamanho|tam\.?|cor|cores|numero|nº|calca|veste|p\b|m\b|g\b|gg\b|verde|preto|branco|azul)\b/u
      },
      {
        regra: "entrega",
        intencao: "ENTREGA",
        confianca: 0.78,
        sinais: ["entrega", "delivery", "taxa"],
        padrao: /\b(entrega|delivery|taxa de entrega|envio|motoqueiro|retirada|levam|entregam)\b/u
      },
      {
        regra: "disponibilidade",
        intencao: "DISPONIBILIDADE",
        confianca: 0.72,
        sinais: ["tem", "disponivel", "ainda ha"],
        padrao: /\b(tem|disponivel|ainda tem|ainda ha|tem stock|esgotou|disponibilidade)\b/u
      },
      {
        regra: "lead_quente",
        intencao: "LEAD_QUENTE",
        confianca: 0.8,
        sinais: ["telefone", "whatsapp", "dm"],
        padrao: /\b(whatsapp|zap|me chama|manda mensagem|9\d{8})\b/u
      },
      {
        regra: "duvida_geral",
        intencao: "DUVIDA",
        confianca: 0.58,
        sinais: ["como", "quando", "onde"],
        padrao: /\b(como funciona|quando chega|onde fica|pode explicar|mais informacao|tenho duvida)\b/u
      },
      {
        regra: "lead_frio",
        intencao: "LEAD_FRIO",
        confianca: 0.62,
        sinais: ["gostei", "info", "detalhes"],
        padrao: /\b(gostei|lindo|bonito|info|informacoes|detalhes|interessante)\b/u
      }
    ];

    const encontrada = regras.find((regra) => regra.padrao.test(texto));
    if (!encontrada) {
      return {
        intencao: "SEM_INTENCAO",
        confianca: 0,
        automatica: false
      };
    }

    return {
      intencao: encontrada.intencao,
      confianca: encontrada.confianca,
      automatica: true,
      regra: encontrada.regra,
      sinais: encontrada.sinais
    };
  }

  private normalizarTextoAnalise(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  private deveCriarTarefaLead(item: SocialInboxItem): boolean {
    return item.intencao === "COMPRA" && item.confianca >= LIMIAR_TAREFA_LEAD;
  }

  private deveCriarOportunidadeSocial(item: SocialInboxItem): boolean {
    if (item.intencao === "SPAM" || item.intencao === "SEM_INTENCAO") return false;
    const intencoesComerciais: IntencaoSocialInbox[] = [
      "COMPRA",
      "PRECO",
      "DISPONIBILIDADE",
      "TAMANHO_COR",
      "ENTREGA",
      "LEAD_QUENTE"
    ];
    return intencoesComerciais.includes(item.intencao) && Boolean(item.clienteTelefone || item.confianca >= 0.8);
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

  private valorTextoContexto(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
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

  private validarProvider(dados: DadosConexaoContaSocial): ProviderSocialAutorizado {
    const provider = PROVIDERS_SOCIAIS_AUTORIZADOS.find(
      (item) => item.codigo === dados.provider && (item.canal === dados.canal || item.canal === "multi")
    );
    if (!provider) {
      throw new Error(`Provider social não autorizado ou inválido para ${dados.canal}: ${dados.provider}.`);
    }
    return provider;
  }

  private buscarContaSocialConectada(
    negocio: NegocioBizy,
    canal: string,
    provider: string,
    identificador: string
  ): ContaSocialConectada {
    const contaId = `${canal}:${identificador}`;
    const conta = this.normalizarConfiguracaoContasSociais(negocio.contasSociais).contas.find(
      (item) => item.id === contaId && item.provider === provider
    );
    if (!conta) {
      throw new Error(`Conta social não encontrada para captura: ${contaId}.`);
    }
    if (conta.status !== "CONECTADA") {
      throw new Error(`Conta social não está conectada para captura: ${contaId}.`);
    }
    return conta;
  }

  private normalizarConfiguracaoContasSociais(valor: Record<string, unknown> | undefined): ConfiguracaoContasSociais {
    const bruto = this.ehRegistro(valor) ? valor : {};
    const contasBrutas = Array.isArray(bruto.contas) ? bruto.contas : [];
    const contas = contasBrutas
      .map((conta) => this.normalizarContaSocial(conta))
      .filter((conta): conta is ContaSocialConectada => Boolean(conta));

    return {
      versao: 1,
      atualizadoEm: typeof bruto.atualizadoEm === "string" ? bruto.atualizadoEm : new Date(0).toISOString(),
      providersAutorizados: Array.isArray(bruto.providersAutorizados)
        ? bruto.providersAutorizados.filter((item): item is string => typeof item === "string")
        : PROVIDERS_SOCIAIS_AUTORIZADOS.map((item) => item.codigo),
      contas
    };
  }

  private normalizarContaSocial(valor: unknown): ContaSocialConectada | null {
    if (!this.ehRegistro(valor)) return null;
    const canal = this.textoRegistro(valor, "canal");
    const provider = this.textoRegistro(valor, "provider");
    const identificador = this.textoRegistro(valor, "identificador");
    const id = this.textoRegistro(valor, "id") ?? (canal && identificador ? `${canal}:${identificador}` : null);
    if (!id || !canal || !provider || !identificador) return null;

    return {
      id,
      canal,
      provider,
      providerTipo: valor.providerTipo === "CONECTOR_AUTORIZADO" ? "CONECTOR_AUTORIZADO" : "OFICIAL",
      identificador,
      username: this.textoRegistro(valor, "username"),
      nomePublico: this.textoRegistro(valor, "nomePublico"),
      avatarUrl: this.textoRegistro(valor, "avatarUrl"),
      permissoes: Array.isArray(valor.permissoes)
        ? valor.permissoes.filter((item): item is string => typeof item === "string")
        : [],
      credencialRef: this.textoRegistro(valor, "credencialRef"),
      webhookAtivo: valor.webhookAtivo === true,
      status: this.statusContaSocial(valor.status),
      conectadoEm: this.textoRegistro(valor, "conectadoEm") ?? new Date(0).toISOString(),
      atualizadoEm: this.textoRegistro(valor, "atualizadoEm") ?? new Date(0).toISOString()
    };
  }

  private statusContaSocial(valor: unknown): ContaSocialConectada["status"] {
    if (valor === "PENDENTE" || valor === "ERRO" || valor === "DESCONECTADA") return valor;
    return "CONECTADA";
  }

  private encontrarChaveSensivel(valor: unknown): string | null {
    if (Array.isArray(valor)) {
      for (const item of valor) {
        const chave = this.encontrarChaveSensivel(item);
        if (chave) return chave;
      }
      return null;
    }

    if (!this.ehRegistro(valor)) return null;

    for (const [chave, conteudo] of Object.entries(valor)) {
      const normalizada = chave.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (CHAVES_SENSIVEIS_CONTA_SOCIAL.has(normalizada)) return chave;
      const chaveInterna = this.encontrarChaveSensivel(conteudo);
      if (chaveInterna) return `${chave}.${chaveInterna}`;
    }

    return null;
  }

  private ehRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === "object" && valor !== null && !Array.isArray(valor);
  }

  private textoRegistro(registro: Record<string, unknown>, chave: string): string | null {
    const valor = registro[chave];
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
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
