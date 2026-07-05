export type PassoAssistente = "identidade" | "produtos" | "experiencia" | "entrega" | "pagamentos" | "operacao" | "publicar";
export type SubpastaStudio = "visao" | "identidade" | "catalogos" | "produtos" | "entrega-pagamentos" | "links" | "market" | "seguidores" | "metricas";
export type ModoExperienciaLoja = "auto" | "moda" | "comida" | "servicos" | "geral";
export type CriterioCatalogoPersonalizado = "categoria" | "colecao" | "busca" | "todos";
export type AcessoLojaDigital = "aberto" | "telefone" | "login" | "membros";
export type AgrupamentoRelatorioLoja = "hora" | "produto" | "cliente";
export type PresencaPublicaBizy = "market" | "learning" | "ambos";

export interface ZonaEntregaOperacaoLoja {
  nome: string;
  precoEmKwanza: number;
  prazo: string | null;
}

export interface LinhaTabelaMedidasLoja {
  tamanho: string;
  busto?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  observacao?: string | null;
}

export interface CatalogoPersonalizadoLoja {
  id: string;
  nome: string;
  descricao?: string | null;
  criterio: CriterioCatalogoPersonalizado;
  valor?: string | null;
}

export interface LearningStudioPublicacao {
  ativa: boolean;
  publicada: boolean;
  slug: string | null;
  nomePublico: string | null;
  descricaoPublica: string | null;
  categorias: string[];
  canaisSuporte: string[];
  politicaSuporte: string | null;
}

export interface OperacaoLojaDigital {
  plano: {
    planoAtual: string;
    recursosBloqueados: string[];
    quotas: {
      encomendasMensais: number;
      imagens: number;
      whatsapp: number;
      email: number;
    };
    upgradeContextual: boolean;
  };
  checkout: {
    ignorarPaginaPagamento: boolean;
    manterRascunhoAtePago: boolean;
    confirmacaoAutomaticaPagamento: boolean;
    entradaAtiva: boolean;
    entradaPercentual: number;
    taxaServicoPercentual: number;
    taxaServicoFixaEmKwanza: number;
    prefixoPedido: string | null;
    sufixoPedido: string | null;
    exigirTelefoneCheckout: boolean;
    exigirLoginCheckout: boolean;
    mostrarNumeroEncomendaNaMensagem: boolean;
  };
  pagamentos: {
    dinheiroEntrega: boolean;
    transferenciaBancaria: boolean;
    cartaoAdyen: boolean;
    paypal: boolean;
    pagamentoPersonalizado: boolean;
    pagamentoComInstrucoes: boolean;
    creditoLoja: boolean;
    instrucoesPagamento: string | null;
  };
  entrega: {
    gerirDisponibilidade: boolean;
    adicionarMetodoEntrega: boolean;
    disponibilidadeSemanal: string[];
    zonas: ZonaEntregaOperacaoLoja[];
  };
  fidelizacao: {
    acessoLoja: AcessoLojaDigital;
    ofertaBoasVindasAtiva: boolean;
    cupomBoasVindas: string | null;
    recompensasAtivas: boolean;
    recompensasIndicacaoAtivas: boolean;
    creditoLojaAtivo: boolean;
  };
  automacoes: {
    perfilCliente: boolean;
    carrinhoAbandonado: boolean;
    pedidoAvaliacao: boolean;
    avaliacaoRecebida: boolean;
    pedidoNovamente: boolean;
    aniversarioCliente: boolean;
    pagamentoPendente: boolean;
    pagamentoConfirmado: boolean;
    creditoAtualizado: boolean;
    creditoReembolsado: boolean;
    pedidoSaiuEntrega: boolean;
    pedidoCancelado: boolean;
    produtoDigitalConfirmado: boolean;
    operacaoInternaPedidoCriado: boolean;
  };
  canais: {
    site: boolean;
    whatsapp: boolean;
    instagram: boolean;
    google: boolean;
    pos: boolean;
    transmissoes: boolean;
    chatbot: boolean;
    appMovelQr: boolean;
    caixaEntradaUnificada: boolean;
    broadcasts: boolean;
  };
  catalogo: {
    categoriasVisiveis: string[];
    categoriasOcultas: string[];
    sequenciaCategorias: string[];
    mensagensColecao: Record<string, string>;
    descontosAtivos: boolean;
    produtosPorColecao: boolean;
    produtosComEstatisticas: boolean;
  };
  clientes: {
    importar: boolean;
    exportar: boolean;
    edicaoMassa: boolean;
    adicionarManual: boolean;
    pesquisaAvancada: boolean;
    filtrosInteligentes: string[];
    transmissaoFiltrada: boolean;
  };
  encomendas: {
    criarManual: boolean;
    exportar: boolean;
    resumoAtivo: boolean;
    rascunhos: boolean;
    pagamentos: boolean;
    calendario: boolean;
    colunasOperacionais: string[];
  };
  relatorios: {
    metricas: string[];
    agruparPor: AgrupamentoRelatorioLoja;
    filtrosPedidos: string[];
    relatoriosProntos: string[];
  };
  siteSeo: {
    dominioPersonalizado: string | null;
    instrucoesDns: string | null;
    tituloSite: string | null;
    uploadLogotipo: boolean;
    imagemGeradaIa: boolean;
    categoriasDiretorio: string[];
  };
}

export interface ExperienciaLojaDigital {
  modoNegocio: ModoExperienciaLoja;
  ordemVitrines: string[];
  catalogosEditaveis: boolean;
  leadCaptureAtivo: boolean;
  leadCaptureTitulo: string | null;
  cupomDestaque: string | null;
  politicaTroca: string | null;
  politicaEntrega: string | null;
  politicaPrivacidade: string | null;
  catalogosPersonalizados: CatalogoPersonalizadoLoja[];
  operacao?: OperacaoLojaDigital;
  tabelaMedidas: LinhaTabelaMedidasLoja[];
}

export interface ConfiguracaoLojaDigital {
  configuracao: {
    identidade: {
      nomeComercial: string;
      telefone: string | null;
      whatsapp: string | null;
      email: string | null;
      provincia: string | null;
      municipio: string | null;
      endereco: string | null;
      descricaoPublica: string | null;
    };
    publicacao: {
      slug: string | null;
      descricaoPublica: string | null;
      publicada: boolean;
      participaNoMarket?: boolean;
      participaNoLearning?: boolean;
      learning?: LearningStudioPublicacao;
      publicadaEm: string | null;
      urlPublica: string | null;
    };
    tema: {
      corPrimaria: string;
      logoUrl: string | null;
      capaUrl: string | null;
    };
    entrega: {
      entregaAtiva: boolean;
      retiradaAtiva: boolean;
      consumoLocalAtivo: boolean;
      taxaPadraoEmKwanza: number;
      entregaGratisAcimaDeKwanza: number | null;
      prazoPadrao: string | null;
      enderecoRetirada: string | null;
      instrucoesEntrega: string | null;
    };
    pagamentos: {
      metodosPagamento: string[];
      instrucoesCobranca: string | null;
      mensagemComprovativoPendente: string | null;
      mensagemPagamentoConfirmado: string | null;
    };
    experiencia: ExperienciaLojaDigital;
  };
  publicacao: {
    slug: string | null;
    publicada: boolean;
    urlPublica: string | null;
  };
  criacao?: {
    concluida: boolean;
    criadaEm: string | null;
    origem: string | null;
  };
  catalogo: {
    totalProdutos: number;
    produtosVendaveis: number;
    produtosSemStock: number;
    produtosBaixoStock: number;
    valorPotencialEmKwanza: number;
  };
  prontidao: {
    prontaParaPublicar: boolean;
    pendencias: string[];
    progresso: number;
  };
}

export interface FormLoja {
  identidade: {
    nomeComercial: string;
    telefone: string;
    whatsapp: string;
    email: string;
    provincia: string;
    municipio: string;
    endereco: string;
    descricaoPublica: string;
  };
  publicacao: {
    slug: string;
    descricaoPublica: string;
    publicada: boolean;
    participaNoMarket: boolean;
    participaNoLearning: boolean;
    learning: {
      ativa: boolean;
      publicada: boolean;
      slug: string;
      nomePublico: string;
      descricaoPublica: string;
      categoriasTexto: string;
      canaisSuporteTexto: string;
      politicaSuporte: string;
    };
  };
  tema: {
    corPrimaria: string;
    logoUrl: string;
    capaUrl: string;
  };
  entrega: {
    entregaAtiva: boolean;
    retiradaAtiva: boolean;
    consumoLocalAtivo: boolean;
    taxaPadraoEmKwanza: number;
    entregaGratisAcimaDeKwanza: string;
    prazoPadrao: string;
    enderecoRetirada: string;
    instrucoesEntrega: string;
  };
  pagamentos: {
    metodosPagamento: string[];
    instrucoesCobranca: string;
    mensagemComprovativoPendente: string;
    mensagemPagamentoConfirmado: string;
  };
  experiencia: {
    modoNegocio: ModoExperienciaLoja;
    ordemVitrines: string[];
    catalogosEditaveis: boolean;
    leadCaptureAtivo: boolean;
    leadCaptureTitulo: string;
    cupomDestaque: string;
    politicaTroca: string;
    politicaEntrega: string;
    politicaPrivacidade: string;
    catalogosPersonalizadosTexto: string;
    tabelaMedidasTexto: string;
  };
  operacao: OperacaoLojaDigital;
}

export type AtualizarSecaoLoja = <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
