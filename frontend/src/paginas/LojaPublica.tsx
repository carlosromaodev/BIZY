import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Globe2,
  LayoutGrid,
  Link2,
  Loader2,
  MessageCircle,
  MousePointerClick,
  Package,
  PackageCheck,
  PackageSearch,
  Palette,
  PlusCircle,
  RefreshCcw,
  Ruler,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  WalletCards,
  XCircle
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { obterBaseApiUrl, requisitarApi, resolverUrlMedia } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import {
  CrmCommandMetric,
  CrmCommandPanel,
  CrmList,
  CrmListItem,
  CrmPageMotion,
  CrmSection
} from "../componentes/CrmInterno21st";
import {
  PageHead,
  BotaoBizy,
  IconChip,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { montarUrlPublicaLoja, obterDominioPublicoLojaConfigurado } from "../lojaSubdominio";
import type { Peca, ResumoTrackingComercial } from "../tipos";
import { formatarKwanza } from "../utilidades";

type PassoAssistente = "identidade" | "produtos" | "experiencia" | "entrega" | "pagamentos" | "operacao" | "publicar";
type ModoExperienciaLoja = "auto" | "moda" | "comida" | "servicos" | "geral";
type CriterioCatalogoPersonalizado = "categoria" | "colecao" | "busca" | "todos";
type AcessoLojaDigital = "aberto" | "telefone" | "login" | "membros";
type AgrupamentoRelatorioLoja = "hora" | "produto" | "cliente";

interface ZonaEntregaOperacaoLoja {
  nome: string;
  precoEmKwanza: number;
  prazo: string | null;
}

interface LinhaTabelaMedidasLoja {
  tamanho: string;
  busto?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  observacao?: string | null;
}

interface CatalogoPersonalizadoLoja {
  id: string;
  nome: string;
  descricao?: string | null;
  criterio: CriterioCatalogoPersonalizado;
  valor?: string | null;
}

interface OperacaoLojaDigital {
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

interface ExperienciaLojaDigital {
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

interface ConfiguracaoLojaDigital {
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

interface FormLoja {
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

const passosAssistente: Array<{
  id: PassoAssistente;
  titulo: string;
  detalhe: string;
  icone: ReactNode;
}> = [
  { id: "identidade", titulo: "Identidade", detalhe: "Nome, link e visual", icone: <Store size={16} /> },
  { id: "produtos", titulo: "Produtos", detalhe: "Catálogo e stock", icone: <PackageSearch size={16} /> },
  { id: "experiencia", titulo: "Experiência", detalhe: "Vitrines e confiança", icone: <LayoutGrid size={16} /> },
  { id: "entrega", titulo: "Entrega", detalhe: "Modalidades e taxa", icone: <Truck size={16} /> },
  { id: "pagamentos", titulo: "Pagamentos", detalhe: "Métodos e mensagens", icone: <WalletCards size={16} /> },
  { id: "operacao", titulo: "Operação", detalhe: "CRM e automações", icone: <Settings2 size={16} /> },
  { id: "publicar", titulo: "Publicar", detalhe: "Checklist e link", icone: <Globe2 size={16} /> }
];

const vitrinesEditaveis = [
  { id: "destaques", titulo: "Destaques", detalhe: "Produtos que devem abrir a loja." },
  { id: "promocoes", titulo: "Promoções", detalhe: "Ofertas e cupões em evidência." },
  { id: "novidades", titulo: "Novidades", detalhe: "Itens recém-chegados." },
  { id: "maisVendidos", titulo: "Mais vendidos", detalhe: "Prova social para decidir rápido." },
  { id: "kits", titulo: "Kits", detalhe: "Combinações prontas." },
  { id: "reposicoes", titulo: "Reposições", detalhe: "Produtos que voltaram ao stock." }
];

const modosExperienciaLoja: Array<{ id: ModoExperienciaLoja; titulo: string; detalhe: string }> = [
  { id: "auto", titulo: "Auto", detalhe: "Bizy adapta pelo catálogo." },
  { id: "moda", titulo: "Moda", detalhe: "Tamanhos, troca e caimento." },
  { id: "comida", titulo: "Comida", detalhe: "Prazo, retirada e preparo." },
  { id: "servicos", titulo: "Serviços", detalhe: "Agenda e orçamento." },
  { id: "geral", titulo: "Geral", detalhe: "Loja multiproduto." }
];

const paletasTemaLoja = [
  { id: "noir", nome: "Noir", detalhe: "Minimal, editorial", primaria: "#111111", secundaria: "#f5f5f0", acento: "#d6b56d" },
  { id: "jade", nome: "Jade", detalhe: "Natural e premium", primaria: "#0f766e", secundaria: "#ecfdf5", acento: "#f59e0b" },
  { id: "atlantic", nome: "Atlantic", detalhe: "Tecnologia limpa", primaria: "#1d4ed8", secundaria: "#eff6ff", acento: "#06b6d4" },
  { id: "rose", nome: "Rose", detalhe: "Moda e beleza", primaria: "#be123c", secundaria: "#fff1f2", acento: "#fb7185" },
  { id: "terracotta", nome: "Terracotta", detalhe: "Comida e artesanal", primaria: "#c2410c", secundaria: "#fff7ed", acento: "#84cc16" },
  { id: "violet", nome: "Violet", detalhe: "Criativo sem excesso", primaria: "#6d28d9", secundaria: "#f5f3ff", acento: "#14b8a6" }
];

const metodosPagamento = [
  { id: "transferencia", titulo: "Transferência", detalhe: "IBAN, titular ou banco" },
  { id: "multicaixa", titulo: "Multicaixa Express", detalhe: "Confirmação por comprovativo" },
  { id: "referencia", titulo: "Referência", detalhe: "Pagamento por entidade/referência" },
  { id: "cash", titulo: "Dinheiro na entrega", detalhe: "Entrega, levantamento ou consumo local" },
  { id: "adyen", titulo: "Cartão/Adyen", detalhe: "Pagamento por cartão quando ativo no plano" },
  { id: "paypal", titulo: "PayPal", detalhe: "Útil para clientes internacionais" },
  { id: "credito-loja", titulo: "Crédito na loja", detalhe: "Saldo para trocas, campanhas e compensações" },
  { id: "personalizado", titulo: "Pagamento personalizado", detalhe: "Instruções próprias da operação" }
];

const operacaoLojaDigital: OperacaoLojaDigital = {
  plano: {
    planoAtual: "starter",
    recursosBloqueados: ["cartao-adyen", "email-broadcast"],
    quotas: {
      encomendasMensais: 100,
      imagens: 60,
      whatsapp: 500,
      email: 200
    },
    upgradeContextual: true
  },
  checkout: {
    ignorarPaginaPagamento: false,
    manterRascunhoAtePago: true,
    confirmacaoAutomaticaPagamento: false,
    entradaAtiva: false,
    entradaPercentual: 0,
    taxaServicoPercentual: 0,
    taxaServicoFixaEmKwanza: 0,
    prefixoPedido: "BIZY",
    sufixoPedido: "",
    exigirTelefoneCheckout: true,
    exigirLoginCheckout: false,
    mostrarNumeroEncomendaNaMensagem: true
  },
  pagamentos: {
    dinheiroEntrega: true,
    transferenciaBancaria: true,
    cartaoAdyen: false,
    paypal: false,
    pagamentoPersonalizado: false,
    pagamentoComInstrucoes: true,
    creditoLoja: false,
    instrucoesPagamento: ""
  },
  entrega: {
    gerirDisponibilidade: true,
    adicionarMetodoEntrega: true,
    disponibilidadeSemanal: ["Segunda a sexta | 09:00-18:00", "Sábado | 10:00-14:00"],
    zonas: [
      { nome: "Centro", precoEmKwanza: 1000, prazo: "Hoje" },
      { nome: "Fora do centro", precoEmKwanza: 2500, prazo: "24h" }
    ]
  },
  fidelizacao: {
    acessoLoja: "aberto",
    ofertaBoasVindasAtiva: true,
    cupomBoasVindas: "",
    recompensasAtivas: false,
    recompensasIndicacaoAtivas: false,
    creditoLojaAtivo: false
  },
  automacoes: {
    perfilCliente: true,
    carrinhoAbandonado: true,
    pedidoAvaliacao: true,
    avaliacaoRecebida: true,
    pedidoNovamente: true,
    aniversarioCliente: false,
    pagamentoPendente: true,
    pagamentoConfirmado: true,
    creditoAtualizado: false,
    creditoReembolsado: false,
    pedidoSaiuEntrega: true,
    pedidoCancelado: true,
    produtoDigitalConfirmado: false,
    operacaoInternaPedidoCriado: true
  },
  canais: {
    site: true,
    whatsapp: true,
    instagram: false,
    google: false,
    pos: false,
    transmissoes: false,
    chatbot: true,
    appMovelQr: false,
    caixaEntradaUnificada: true,
    broadcasts: false
  },
  catalogo: {
    categoriasVisiveis: [],
    categoriasOcultas: [],
    sequenciaCategorias: [],
    descontosAtivos: true,
    produtosPorColecao: true,
    produtosComEstatisticas: true
  },
  clientes: {
    importar: true,
    exportar: true,
    edicaoMassa: true,
    adicionarManual: true,
    pesquisaAvancada: true,
    filtrosInteligentes: ["todos", "inativos", "primeiro-pedido", "nunca-comprou"],
    transmissaoFiltrada: true
  },
  encomendas: {
    criarManual: true,
    exportar: true,
    resumoAtivo: true,
    rascunhos: true,
    pagamentos: true,
    calendario: true,
    colunasOperacionais: ["cliente", "total", "estado", "pagamento", "cumprimento", "artigos", "nota interna", "entrega", "data de envio", "transportador", "equipa", "criado em"]
  },
  relatorios: {
    metricas: ["pedidos", "vendas", "conversao", "lucro"],
    agruparPor: "produto",
    filtrosPedidos: ["PENDENTE", "PAGO", "CONCLUIDA"],
    relatoriosProntos: ["pedidos-tempo", "clientes-pedidos", "produtos-lucro", "ticket-medio", "referenciadores"]
  },
  siteSeo: {
    dominioPersonalizado: "",
    instrucoesDns: "Criar CNAME para lojas.usebizy.space e aguardar a propagação.",
    tituloSite: "",
    uploadLogotipo: true,
    imagemGeradaIa: false,
    categoriasDiretorio: []
  }
};

const opcoesAcessoLoja: Array<{ id: AcessoLojaDigital; titulo: string; detalhe: string }> = [
  { id: "aberto", titulo: "Aberto", detalhe: "Cliente navega sem bloqueio." },
  { id: "telefone", titulo: "Telefone", detalhe: "Número antes de finalizar." },
  { id: "login", titulo: "Login", detalhe: "Conta para histórico e favoritos." },
  { id: "membros", titulo: "Membros", detalhe: "Acesso por aprovação." }
];

const pagamentosAvancadosLoja: Array<{ id: Exclude<keyof OperacaoLojaDigital["pagamentos"], "instrucoesPagamento">; titulo: string; detalhe: string }> = [
  { id: "dinheiroEntrega", titulo: "Dinheiro na entrega", detalhe: "Aceitar cobrança na entrega, levantamento ou consumo local." },
  { id: "transferenciaBancaria", titulo: "Transferência bancária", detalhe: "Usar IBAN, titular e validação de comprovativo." },
  { id: "cartaoAdyen", titulo: "Cartão/Adyen", detalhe: "Bloquear ou libertar quando o plano e a conta estiverem prontos." },
  { id: "paypal", titulo: "PayPal", detalhe: "Opção para clientes fora do mercado local." },
  { id: "pagamentoPersonalizado", titulo: "Pagamento personalizado", detalhe: "Permite instruções próprias por loja ou negócio." },
  { id: "pagamentoComInstrucoes", titulo: "Pagamento com instruções", detalhe: "Mostra orientação clara antes de enviar comprovativo." },
  { id: "creditoLoja", titulo: "Crédito na loja", detalhe: "Usar saldo em trocas, campanhas e recompensas." }
];

const automacoesLojaDigital: Array<{ id: keyof OperacaoLojaDigital["automacoes"]; titulo: string; detalhe: string }> = [
  { id: "perfilCliente", titulo: "Perfil do cliente", detalhe: "Atualiza histórico, preferências e origem." },
  { id: "carrinhoAbandonado", titulo: "Carrinho abandonado", detalhe: "Lembra o cliente pelo atendimento." },
  { id: "pedidoAvaliacao", titulo: "Avaliação pós-compra", detalhe: "Pede feedback quando entrega termina." },
  { id: "avaliacaoRecebida", titulo: "Avaliação recebida", detalhe: "Regista prova social e próximo contacto." },
  { id: "pedidoNovamente", titulo: "Comprar novamente", detalhe: "Sugere reposição pelo histórico." },
  { id: "aniversarioCliente", titulo: "Aniversário", detalhe: "Cria abordagem comercial pessoal." },
  { id: "pagamentoPendente", titulo: "Pagamento pendente", detalhe: "Avisa a equipa e o cliente." },
  { id: "pagamentoConfirmado", titulo: "Pagamento confirmado", detalhe: "Move pedido para preparação." },
  { id: "creditoAtualizado", titulo: "Crédito atualizado", detalhe: "Notifica saldo novo no perfil do cliente." },
  { id: "creditoReembolsado", titulo: "Crédito reembolsado", detalhe: "Regista devolução ou compensação." },
  { id: "pedidoSaiuEntrega", titulo: "Saiu para entrega", detalhe: "Atualiza cliente e agenda." },
  { id: "pedidoCancelado", titulo: "Pedido cancelado", detalhe: "Regista motivo e oportunidade." },
  { id: "produtoDigitalConfirmado", titulo: "Produto digital confirmado", detalhe: "Envia acesso quando o pagamento fecha." },
  { id: "operacaoInternaPedidoCriado", titulo: "Operação interna", detalhe: "Cria tarefas quando uma encomenda nasce." }
];

const canaisLojaDigital: Array<{ id: keyof OperacaoLojaDigital["canais"]; titulo: string; detalhe: string; destino: string }> = [
  { id: "site", titulo: "Site", detalhe: "Loja pública e tracking.", destino: "/app/loja-publica" },
  { id: "whatsapp", titulo: "WhatsApp", detalhe: "Atendimento e checkout.", destino: "/app/conversas" },
  { id: "instagram", titulo: "Instagram", detalhe: "Origem social e catálogo.", destino: "/app/clientes" },
  { id: "google", titulo: "Google", detalhe: "Origem por pesquisa.", destino: "/app/relatorios" },
  { id: "pos", titulo: "POS", detalhe: "Vendas presenciais ligadas.", destino: "/app/reservas" },
  { id: "transmissoes", titulo: "Live commerce", detalhe: "Comentários e pedidos em live.", destino: "/app/live" },
  { id: "chatbot", titulo: "Chatbot", detalhe: "Respostas rápidas e triagem.", destino: "/app/respostas-rapidas" },
  { id: "appMovelQr", titulo: "App móvel com QR code", detalhe: "Compra rápida presencial ou em embalagem.", destino: "/app/loja-publica" },
  { id: "caixaEntradaUnificada", titulo: "Caixa de entrada unificada", detalhe: "Junta loja, WhatsApp e social inbox.", destino: "/app/conversas" },
  { id: "broadcasts", titulo: "Transmissões/broadcasts", detalhe: "Campanhas para segmentos de clientes.", destino: "/app/clientes" }
];

const metricasRelatorioLoja = [
  { id: "pedidos", titulo: "Pedidos" },
  { id: "artigos", titulo: "Artigos" },
  { id: "vendas", titulo: "Vendas" },
  { id: "custo-itens", titulo: "Custo dos itens" },
  { id: "conversao", titulo: "Conversão" },
  { id: "lucro", titulo: "Lucro" },
  { id: "imposto", titulo: "Imposto" },
  { id: "vendas-liquidas", titulo: "Vendas líquidas" },
  { id: "entrega", titulo: "Entrega" },
  { id: "clientes", titulo: "Clientes" },
  { id: "ticket-medio", titulo: "Ticket médio" },
  { id: "referenciadores", titulo: "Referenciadores" }
];

const filtrosPedidoRelatorioLoja = ["TODOS", "UNPAID", "CONFIRMANDO_PAGAMENTO", "PENDENTE", "PAGO", "CONCLUIDA", "CANCELADA", "EM_ENTREGA"];

const relatoriosProntosLoja = [
  { id: "pedidos-tempo", titulo: "Pedidos ao longo do tempo" },
  { id: "clientes-pedidos", titulo: "Clientes por pedidos" },
  { id: "produtos-pedidos", titulo: "Produtos por pedidos" },
  { id: "produtos-lucro", titulo: "Produtos por lucro" },
  { id: "ticket-medio", titulo: "Valor médio por encomenda" },
  { id: "dinheiro-arrecadado", titulo: "Dinheiro arrecadado" },
  { id: "categorias-pedidos", titulo: "Categorias por pedidos" },
  { id: "novos-clientes", titulo: "Novos clientes" },
  { id: "clientes-inativos", titulo: "Clientes inativos" },
  { id: "maiores-descontos", titulo: "Maiores descontos" },
  { id: "visualizacoes-pagina", titulo: "Visualizações de página" },
  { id: "metodos-pagamento", titulo: "Métodos de pagamento" },
  { id: "referenciadores", titulo: "Principais referenciadores" },
  { id: "entrega-pedidos", titulo: "Entrega por pedidos" }
];

export function PaginaLojaPublica() {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoLojaDigital | null>(null);
  const [tracking, setTracking] = useState<ResumoTrackingComercial | null>(null);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [form, setForm] = useState<FormLoja>(() => criarFormVazio());
  const [passo, setPasso] = useState<PassoAssistente>("identidade");
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false);
  const [modalCriacaoInicialExibido, setModalCriacaoInicialExibido] = useState(false);
  const [produtosConfirmados, setProdutosConfirmados] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const [dadosConfiguracao, dadosTracking, dadosPecas] = await Promise.all([
        requisitarApi<ConfiguracaoLojaDigital>("/loja-publica/configuracao"),
        requisitarApi<ResumoTrackingComercial>("/loja-publica/tracking/resumo").catch(() => null),
        requisitarApi<Peca[]>("/pecas").catch(() => [])
      ]);

      setConfiguracao(dadosConfiguracao);
      setTracking(dadosTracking);
      setPecas(dadosPecas);
      setForm(criarFormAPartirConfiguracao(dadosConfiguracao));
      setMensagem("");
    } catch (erro) {
      setConfiguracao(null);
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar a loja digital.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const catalogo = configuracao?.catalogo ?? resumirCatalogoLocal(pecas);
  const prontidao = configuracao?.prontidao ?? {
    pendencias: ["Carregar configuração da loja."],
    prontaParaPublicar: false,
    progresso: 0
  };
  const funil = tracking?.funil;
  const slugAtual = normalizarSlug(form.publicacao.slug || configuracao?.publicacao.slug || "");
  const dominioPublicoLoja = obterDominioPublicoLojaConfigurado();
  const urlPublica = slugAtual ? montarUrlPublicaLoja(slugAtual) : "";
  const produtosCriticos = useMemo(() => selecionarProdutosCriticos(pecas), [pecas]);
  const produtosDestaque = useMemo(() => selecionarProdutosDestaque(pecas), [pecas]);
  const taxaConversao = calcularTaxa(funil?.pedidosCriados ?? 0, funil?.visitas ?? 0);
  const lojaCriadaPeloAssistente = Boolean(configuracao?.criacao?.concluida);
  const lojaConfigurada = Boolean(lojaCriadaPeloAssistente && configuracao?.publicacao.slug);
  const lojaPublicada = Boolean(configuracao?.publicacao.publicada);
  const temTracking = Boolean(tracking && tracking.totalEventos > 0);

  useEffect(() => {
    if (!configuracao) return;
    setProdutosConfirmados(false);
    if (!lojaConfigurada && !modalCriacaoInicialExibido) {
      setModalCriacaoAberto(true);
      setModalCriacaoInicialExibido(true);
    }
  }, [configuracao, lojaConfigurada, modalCriacaoInicialExibido]);

  function atualizarSecao<Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) {
    setForm((atual) => ({
      ...atual,
      [secao]: {
        ...atual[secao],
        ...valores
      }
    }));
  }

  function abrirAssistente(novoPasso: PassoAssistente = "identidade") {
    setPasso(novoPasso);
    setAssistenteAberto(true);
  }

  function iniciarCriacaoLoja() {
    const slugSugerido = normalizarSlug(form.publicacao.slug || form.identidade.nomeComercial || "minha-loja");
    setForm((atual) => ({
      ...atual,
      publicacao: {
        ...atual.publicacao,
        slug: atual.publicacao.slug || slugSugerido,
        publicada: false
      }
    }));
    setProdutosConfirmados(catalogo.produtosVendaveis > 0);
    setModalCriacaoAberto(false);
    setPasso(catalogo.produtosVendaveis > 0 ? "produtos" : "identidade");
    setAssistenteAberto(true);
  }

  async function guardarConfiguracao(publicar = form.publicacao.publicada) {
    const slugNormalizado = normalizarSlug(form.publicacao.slug);
    if (publicar && !slugNormalizado) {
      setMensagem("Define um link público antes de publicar.");
      setPasso("identidade");
      setAssistenteAberto(true);
      return;
    }

    setSalvando(true);
    setMensagem(publicar ? "A publicar loja digital..." : "A guardar rascunho da loja...");
    try {
      await requisitarApi("/loja-publica/configuracao", {
        method: "PUT",
        body: criarPayloadConfiguracao({
          ...form,
          publicacao: {
            ...form.publicacao,
            slug: slugNormalizado,
            publicada: publicar
          }
        })
      });

      await carregar();
      setMensagem(publicar ? "Loja digital publicada." : "Configuração guardada como rascunho.");
      if (publicar) setPasso("publicar");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível guardar a loja digital.");
    } finally {
      setSalvando(false);
    }
  }

  async function copiarLink() {
    if (!urlPublica) return;
    try {
      await navigator.clipboard.writeText(urlPublica);
      setMensagem("Link da loja copiado.");
    } catch {
      setMensagem("Não foi possível copiar o link automaticamente.");
    }
  }

  function irParaProximoPasso() {
    const indiceAtual = passosAssistente.findIndex((item) => item.id === passo);
    const proximo = passosAssistente[Math.min(indiceAtual + 1, passosAssistente.length - 1)];
    setPasso(proximo.id);
  }

  function irParaPassoAnterior() {
    const indiceAtual = passosAssistente.findIndex((item) => item.id === passo);
    const anterior = passosAssistente[Math.max(indiceAtual - 1, 0)];
    setPasso(anterior.id);
  }

  return (
    <CrmPageMotion className="loja-admin-shell">
      <PageHead eyebrow="A sua vitrine 24/7" titulo="Loja Digital" tamanhoTitulo="sm">
        {lojaConfigurada && urlPublica && (
          <a href={urlPublica} target="_blank" rel="noreferrer" className="bz-btn bz-btn-ghost">
            <ExternalLink size={16} />
            Ver loja
          </a>
        )}
        {lojaConfigurada ? (
          <>
            <button type="button" className="bz-btn bz-btn-ghost" onClick={() => abrirAssistente("identidade")}>
              <Settings2 size={16} />
              Configurar
            </button>
            <BotaoBizy icone={salvando ? Loader2 : Globe2} onClick={() => void guardarConfiguracao(true)}>
              Publicar
            </BotaoBizy>
          </>
        ) : (
          <BotaoBizy icone={PlusCircle} onClick={() => setModalCriacaoAberto(true)}>
            Criar loja online
          </BotaoBizy>
        )}
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando || salvando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      {lojaConfigurada ? (
        <>
          {/* ── Store grid: info panel + browser mockup ── */}
          <div className="bz-store-grid">
            <div className="bz-store-panel">
              {/* Published status card */}
              <div className="bz-pubcard">
                <div className="bz-pub-st">
                  <span className={`bz-pub-dot${lojaPublicada ? " on" : ""}`} />
                  {lojaPublicada ? "Loja publicada" : "Rascunho"}
                </div>
                {urlPublica && (
                  <div className="bz-pub-url">
                    <Link2 size={14} style={{ color: "var(--ink-3)" }} />
                    <span>{urlPublica.replace(/^https?:\/\//, "")}</span>
                    <button type="button" className="bz-pub-copy" onClick={() => void navigator.clipboard.writeText(urlPublica)}>Copiar</button>
                  </div>
                )}
              </div>
              {/* Store stats */}
              <div className="bz-pubcard">
                <div className="bz-store-stats">
                  <div className="bz-store-stat">
                    <span className="bz-store-stat-l"><IconChip icone={MousePointerClick} cor="blue" tamanho={28} />Visitas (7 dias)</span>
                    <span className="bz-store-stat-v bz-tnum">{funil?.visitas ?? 0}</span>
                  </div>
                  <div className="bz-store-stat">
                    <span className="bz-store-stat-l"><IconChip icone={ShoppingCart} cor="green" tamanho={28} />Pedidos da loja</span>
                    <span className="bz-store-stat-v bz-tnum">{funil?.pedidosCriados ?? 0}</span>
                  </div>
                  <div className="bz-store-stat">
                    <span className="bz-store-stat-l"><IconChip icone={ArrowUpRight} cor="violet" tamanho={28} />Conversão</span>
                    <span className="bz-store-stat-v bz-tnum">{taxaConversao}%</span>
                  </div>
                  <div className="bz-store-stat">
                    <span className="bz-store-stat-l"><IconChip icone={Store} cor="amber" tamanho={28} />Ticket médio</span>
                    <span className="bz-store-stat-v bz-tnum">{formatarKwanza(Math.round((funil?.receitaAtribuidaEmKwanza ?? 0) / Math.max(1, funil?.pedidosCriados ?? 1)))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Browser mockup */}
            <div className="bz-browser">
              <div className="bz-browser-bar">
                <span className="bz-browser-dots"><i style={{ background: "#f0625a" }} /><i style={{ background: "#f6bd3b" }} /><i style={{ background: "#4cc555" }} /></span>
                <span className="bz-browser-addr">{urlPublica ? urlPublica.replace(/^https?:\/\//, "") : "loja.bizy.store"}</span>
              </div>
              <div className="bz-store-view">
                <div className="bz-store-hero-mock">
                  <div className="bz-store-mk">BIZY · Moda</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "8px 0" }}>{form.identidade.nomeComercial || "Minha Loja"}</h2>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{form.identidade.descricaoPublica || "Peças selecionadas, entregas em toda a cidade."}</p>
                </div>
                <div className="bz-store-body-mock">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Novidades</span>
                    <span style={{ fontSize: 12, color: "var(--green-ink)", fontWeight: 600 }}>Ver tudo →</span>
                  </div>
                  <div className="bz-store-prod-grid">
                    {pecas.slice(0, 3).map((p) => (
                      <div key={p.id} className="bz-store-prod-item">
                        <div className="bz-store-prod-ph">
                          {p.fotos[0] ? (
                            <img src={resolverUrlMedia(p.fotos[0])} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Package size={24} style={{ color: "rgba(255,255,255,0.3)" }} />
                          )}
                        </div>
                        <div className="bz-store-prod-nm">{p.nome}</div>
                        <div className="bz-store-prod-pr bz-tnum">{formatarKwanza(p.precoEmKwanza)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

      <CrmCommandPanel
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Badge variant={lojaPublicada ? "success" : "warning"}>{lojaPublicada ? "Publicada" : "Rascunho"}</Badge>
            <span>Loja ligada ao CRM</span>
          </span>
        }
        title="Centro de comando da loja"
        description="Produto, entrega, pagamento, WhatsApp e tracking ficam no mesmo fluxo para reduzir passos manuais na venda."
        actions={
          <div className="hidden flex-wrap gap-2 sm:flex">
            <Button variant="outline" onClick={() => abrirAssistente("publicar")} disabled={!urlPublica}>
              <Link2 size={16} />
              Ver link
            </Button>
            {urlPublica && (
              <Button asChild variant="outline">
                <a href={urlPublica} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  Abrir loja
                </a>
              </Button>
            )}
          </div>
        }
      >
        <div className="loja-admin-command-grid grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-3 sm:gap-4">
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-medium text-foreground">Prontidão</span>
                <span className="text-xs sm:text-sm tabular-nums text-muted-foreground">{prontidao.progresso}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, prontidao.progresso))}%` }}
                />
              </div>
              <div className="mt-3 grid gap-2">
                {prontidao.pendencias.length ? (
                  prontidao.pendencias.map((pendencia) => (
                    <StatusLinha key={pendencia} pronto={false} texto={pendencia} />
                  ))
                ) : (
                  <StatusLinha pronto texto="Pronta para receber clientes." />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
              <CrmCommandMetric
                icon={<Package size={16} />}
                label="Produtos vendáveis"
                value={catalogo.produtosVendaveis}
                detail={`${catalogo.produtosSemStock} sem stock`}
                tone={catalogo.produtosVendaveis ? "sucesso" : "atencao"}
              />
              <CrmCommandMetric
                icon={<Truck size={16} />}
                label="Entrega padrão"
                value={formatarKwanza(form.entrega.taxaPadraoEmKwanza || 0)}
                detail={form.entrega.prazoPadrao || "Prazo por definir"}
                tone="principal"
              />
              <CrmCommandMetric
                icon={<MessageCircle size={16} />}
                label="WhatsApp"
                value={form.identidade.whatsapp || form.identidade.telefone || "Pendente"}
                detail="Canal de compra"
                tone={form.identidade.whatsapp || form.identidade.telefone ? "sucesso" : "atencao"}
              />
              <CrmCommandMetric
                icon={<WalletCards size={16} />}
                label="Pagamentos"
                value={form.pagamentos.metodosPagamento.length}
                detail="métodos ativos"
                tone={form.pagamentos.metodosPagamento.length ? "sucesso" : "atencao"}
              />
            </div>
          </div>

          <PreviewLojaMobile
            form={form}
            produtos={produtosDestaque}
            urlPublica={urlPublica}
            compacta
          />
        </div>
        <div className="loja-admin-mobile-actions grid grid-cols-1 gap-2 sm:hidden">
          <Button variant="outline" onClick={() => abrirAssistente("publicar")} disabled={!urlPublica}>
            <Link2 size={16} />
            Ver link
          </Button>
          {urlPublica && (
            <Button asChild variant="outline">
              <a href={urlPublica} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Abrir loja
              </a>
            </Button>
          )}
        </div>
      </CrmCommandPanel>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_.92fr]">
        <CrmSection
          icon={<PackageSearch size={18} className="sm:size-5" />}
          title="Catálogo conectado"
          description="Mostra o que a loja consegue vender agora e onde a equipa precisa agir antes de partilhar o link."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/app/catalogo">
                Gerir produtos
                <ArrowRight size={14} />
              </Link>
            </Button>
          }
        >
          <div className="grid gap-2 xs:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ResumoCompacto titulo="Vendáveis" valor={catalogo.produtosVendaveis} detalhe="aparecem na loja" tom="sucesso" />
            <ResumoCompacto titulo="Stock baixo" valor={catalogo.produtosBaixoStock} detalhe="pedem reposição" tom={catalogo.produtosBaixoStock ? "atencao" : "neutro"} />
            <ResumoCompacto titulo="Potencial" valor={formatarKwanza(catalogo.valorPotencialEmKwanza)} detalhe="stock disponível" tom="principal" />
          </div>

          <div className="mt-4">
            {produtosCriticos.length ? (
              <CrmList>
                {produtosCriticos.map((peca) => (
                  <CrmListItem
                    key={peca.id}
                    media={<Package size={18} />}
                    title={peca.nome}
                    description={`#${peca.codigo} · ${formatarKwanza(peca.precoEmKwanza)}`}
                    tone={peca.quantidade <= 0 || peca.estado === "ESGOTADA" ? "perigo" : "atencao"}
                    meta={`${peca.quantidade} un.`}
                    badges={
                      <>
                        {peca.categoria && <Badge variant="outline">{peca.categoria}</Badge>}
                        <Badge variant={peca.quantidade <= 0 || peca.estado === "ESGOTADA" ? "destructive" : "warning"}>
                          {peca.quantidade <= 0 || peca.estado === "ESGOTADA" ? "Sem stock" : "Stock baixo"}
                        </Badge>
                      </>
                    }
                  />
                ))}
              </CrmList>
            ) : (
              <EstadoVazio
                icone={<PackageCheck />}
                titulo={catalogo.produtosVendaveis ? "Catálogo saudável" : "Sem produtos vendáveis"}
                detalhe={catalogo.produtosVendaveis ? "Não há alerta crítico de stock neste momento." : "Adicione produtos com preço, stock e estado disponível."}
              />
            )}
          </div>
        </CrmSection>

        <CrmSection
          icon={<ClipboardCheck size={20} />}
          title="Atalhos operacionais"
          description="Ações que ligam loja, atendimento, pedidos, agenda e CRM sem dispersar a equipa."
        >
          <div className="grid gap-2">
            <AtalhoOperacional to="/app/conversas" icon={<MessageCircle size={16} />} title="Abrir atendimento" detail="Responder clientes vindos da loja." />
            <AtalhoOperacional to="/app/reservas" icon={<ShoppingCart size={16} />} title="Pedidos do site" detail="Acompanhar checkout e pagamento." />
            <AtalhoOperacional to="/app/agenda" icon={<Truck size={16} />} title="Agenda de entregas" detail="Organizar entregas, recolhas e follow-up." />
            <AtalhoOperacional to="/app/afiliados" icon={<Send size={16} />} title="Links de afiliados" detail="Medir criadores e campanhas." />
          </div>
        </CrmSection>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[.95fr_1.05fr]">
        <CrmSection
          icon={<PackageSearch size={18} className="sm:size-5" />}
          title="Funil do site"
          description="Acompanha a passagem de visita para checkout, WhatsApp, pedido e pagamento."
        >
          {tracking ? (
            <CrmList columns="two">
              <CrmListItem media={<Store size={16} className="sm:size-4.5" />} title="Visitas" description="Entradas na loja." tone="principal" meta={funil?.visitas ?? 0} />
              <CrmListItem media={<PackageSearch size={16} className="sm:size-4.5" />} title="Produto visto" description="Visualizações de produto." tone="info" meta={funil?.produtosVistos ?? 0} />
              <CrmListItem media={<Send size={16} className="sm:size-4.5" />} title="WhatsApp" description="Cliques para comprar ou tirar dúvida." tone="sucesso" meta={funil?.cliquesWhatsApp ?? 0} />
              <CrmListItem media={<ShoppingCart size={16} className="sm:size-4.5" />} title="Checkout" description="Checkouts iniciados." tone="atencao" meta={funil?.checkoutsIniciados ?? 0} />
              <CrmListItem media={<CheckCircle2 size={16} className="sm:size-4.5" />} title="Pagamento" description="Pagamentos confirmados." tone="sucesso" meta={funil?.pagamentosConfirmados ?? 0} />
              <CrmListItem media={<Truck size={16} className="sm:size-4.5" />} title="Entregues" description="Compras entregues." tone="sucesso" meta={funil?.comprasEntregues ?? 0} />
            </CrmList>
          ) : (
            <EstadoVazio icone={<Store />} titulo={carregando ? "A carregar tracking" : "Sem tracking"} detalhe="Publique a loja e partilhe links para começar a medir o funil." />
          )}
        </CrmSection>

        <CrmSection
          icon={<MousePointerClick size={18} className="sm:size-5" />}
          title="Origem dos resultados"
          description="Canal, origem e campanha ajudam a perceber onde o link público está a vender melhor."
        >
          <CrmList columns="three">
            {tracking && Object.entries(tracking.porCanal).length ? (
              Object.entries(tracking.porCanal).map(([canal, total]) => (
                <CrmListItem key={canal} media={<Send size={18} />} title={canal} description="Eventos por canal." tone="principal" meta={total} />
              ))
            ) : (
              <EstadoVazio icone={<MousePointerClick />} titulo={temTracking ? "Sem canal registado" : "Sem origem registada"} detalhe="Os eventos públicos guardam canal, origem e UTM sem dados pessoais sensíveis." />
            )}
          </CrmList>
        </CrmSection>
      </div>
        </>
      ) : (
        <TelaInicioCriacaoLoja
          abrirModal={() => setModalCriacaoAberto(true)}
          carregando={carregando}
          catalogo={catalogo}
          produtosDestaque={produtosDestaque}
        />
      )}

      <ModalInicioCriacao
        aberto={modalCriacaoAberto}
        catalogo={catalogo}
        produtosConfirmados={produtosConfirmados}
        produtosDestaque={produtosDestaque}
        fechar={() => setModalCriacaoAberto(false)}
        confirmarProdutos={() => setProdutosConfirmados(true)}
        iniciarCriacao={iniciarCriacaoLoja}
      />

      <Sheet open={assistenteAberto} onOpenChange={setAssistenteAberto}>
        <SheetContent side="right" className="loja-assistente-sheet w-full max-w-full overflow-hidden p-0 data-[side=right]:!w-full data-[side=right]:!max-w-full data-[side=right]:sm:!max-w-6xl">
          <SheetHeader className="border-b border-border/60 px-4 py-4 text-left sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
              <div>
                <SheetTitle className="text-lg">Configurar Loja Digital</SheetTitle>
                <SheetDescription>Fluxo guiado para publicar sem perder ligação ao catálogo, atendimento e tracking.</SheetDescription>
              </div>
              <Badge variant={prontidao.prontaParaPublicar ? "success" : "warning"}>{prontidao.progresso}% pronta</Badge>
            </div>
          </SheetHeader>

          <div className="loja-assistente-layout grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[16rem_minmax(0,1fr)_20rem] lg:grid-rows-none">
            <aside className="border-b border-border/60 p-2 lg:border-b-0 lg:border-r lg:p-3">
              <nav className="loja-assistente-nav flex min-w-0 gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0">
                {passosAssistente.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPasso(item.id)}
                    className={`flex min-w-[5.75rem] shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center transition-colors lg:min-w-0 lg:flex-row lg:items-start lg:gap-3 lg:px-3 lg:text-left ${
                      passo === item.id
                        ? "border-neutral-950 bg-white text-neutral-950 shadow-sm"
                        : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <span className="lg:mt-0.5">{item.icone}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.65rem] font-medium sm:text-xs lg:text-sm">{item.titulo}</span>
                      <span className="hidden truncate text-xs opacity-75 lg:block">{item.detalhe}</span>
                    </span>
                  </button>
                ))}
              </nav>
            </aside>

            <main className="grid min-w-0 content-start gap-5 overflow-y-auto p-3 pb-28 sm:p-6 sm:pb-6">
              {passo === "identidade" && (
                <PassoIdentidade
                  form={form}
                  atualizarSecao={atualizarSecao}
                  urlPublica={urlPublica}
                  dominioPublicoLoja={dominioPublicoLoja}
                  copiarLink={copiarLink}
                />
              )}

              {passo === "produtos" && (
                <PassoProdutos
                  catalogo={catalogo}
                  produtosCriticos={produtosCriticos}
                  produtosDestaque={produtosDestaque}
                />
              )}

              {passo === "experiencia" && (
                <PassoExperienciaLoja form={form} atualizarSecao={atualizarSecao} />
              )}

              {passo === "entrega" && (
                <PassoEntrega form={form} atualizarSecao={atualizarSecao} />
              )}

              {passo === "pagamentos" && (
                <PassoPagamentos form={form} atualizarSecao={atualizarSecao} />
              )}

              {passo === "operacao" && (
                <PassoOperacaoLoja form={form} atualizarSecao={atualizarSecao} />
              )}

              {passo === "publicar" && (
                <PassoPublicar
                  prontidao={prontidao}
                  urlPublica={urlPublica}
                  publicada={form.publicacao.publicada}
                  salvando={salvando}
                  copiarLink={copiarLink}
                  guardarConfiguracao={guardarConfiguracao}
                  atualizarSecao={atualizarSecao}
                />
              )}
            </main>

            <aside className="hidden border-l border-border/60 bg-muted/20 p-4 lg:block">
              <PreviewLojaMobile form={form} produtos={produtosDestaque} urlPublica={urlPublica} />
            </aside>
          </div>

          <SheetFooter className="loja-assistente-footer border-t border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="button" variant="outline" onClick={irParaPassoAnterior} disabled={passo === "identidade" || salvando}>
                Anterior
              </Button>
              <Button type="button" variant="outline" onClick={irParaProximoPasso} disabled={passo === "publicar" || salvando}>
                Seguinte
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
              <Button type="button" variant="outline" onClick={() => void guardarConfiguracao(false)} disabled={salvando}>
                Guardar rascunho
              </Button>
              <Button type="button" onClick={() => void guardarConfiguracao(true)} disabled={salvando}>
                {salvando ? <Loader2 className="animate-spin" size={16} /> : <Globe2 size={16} />}
                Publicar loja
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {mensagem && (
        <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
          {mensagem}
        </footer>
      )}
    </CrmPageMotion>
  );
}

function TelaInicioCriacaoLoja({
  abrirModal,
  carregando,
  catalogo,
  produtosDestaque
}: {
  abrirModal: () => void;
  carregando: boolean;
  catalogo: ConfiguracaoLojaDigital["catalogo"];
  produtosDestaque: Peca[];
}) {
  return (
    <section className="grid min-h-[min(34rem,calc(100vh-12rem))] place-items-center rounded-xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(17,17,17,0.08),transparent_34%),linear-gradient(180deg,#ffffff,#f6f6f4)] px-4 py-8 text-center">
      <div className="mx-auto grid max-w-2xl gap-5">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-950 text-white shadow-sm">
          <Store size={22} />
        </span>
        <div className="space-y-2">
          <Badge variant="outline" className="mx-auto w-fit bg-white">Criação manual</Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Vamos criar sua loja digital</h2>
          <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
            A loja só fica criada depois de passar pelo assistente e guardar o rascunho ou publicar. Antes disso, vamos verificar o catálogo e escolher quais produtos entram.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-lg grid-cols-1 xs:grid-cols-3 gap-2 text-left">
          <ResumoCompacto titulo="No sistema" valor={carregando ? "..." : catalogo.totalProdutos} detalhe="produtos" tom={catalogo.totalProdutos ? "principal" : "neutro"} />
          <ResumoCompacto titulo="Entram" valor={carregando ? "..." : catalogo.produtosVendaveis} detalhe="vendáveis" tom={catalogo.produtosVendaveis ? "sucesso" : "atencao"} />
          <ResumoCompacto titulo="A rever" valor={carregando ? "..." : catalogo.produtosSemStock + catalogo.produtosBaixoStock} detalhe="stock" tom={catalogo.produtosSemStock || catalogo.produtosBaixoStock ? "atencao" : "neutro"} />
        </div>

        {produtosDestaque.length > 0 && (
          <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-2">
            {produtosDestaque.slice(0, 4).map((produto) => (
              <span key={produto.id} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700">
                <Package size={13} />
                {produto.nome}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <Button size="lg" onClick={abrirModal} disabled={carregando}>
            <PlusCircle size={18} />
            Começar criação
          </Button>
        </div>
      </div>
    </section>
  );
}

function AbaCriarLoja({
  abrirModal,
  catalogo,
  configurarExistente,
  lojaConfigurada,
  produtosCriticos,
  produtosDestaque
}: {
  abrirModal: () => void;
  catalogo: ConfiguracaoLojaDigital["catalogo"];
  configurarExistente: () => void;
  lojaConfigurada: boolean;
  produtosCriticos: Peca[];
  produtosDestaque: Peca[];
}) {
  const temProdutos = catalogo.totalProdutos > 0;
  const temVendaveis = catalogo.produtosVendaveis > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
      <CrmCommandPanel
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Badge variant={lojaConfigurada ? "info" : "outline"}>{lojaConfigurada ? "Loja existente" : "Criação manual"}</Badge>
            <span>Nenhuma loja nasce automaticamente</span>
          </span>
        }
        title={lojaConfigurada ? "Criar outra loja exige um fluxo próprio" : "Criar loja online"}
        description={
          lojaConfigurada
            ? "Este negócio já tem uma loja digital. Por agora, o CRM gere uma loja principal por negócio; use a configuração para ajustar a loja ativa."
            : "Comece por validar o catálogo. Só depois de confirmar o fluxo é que a loja vira rascunho ou publicação."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {lojaConfigurada ? (
              <Button onClick={configurarExistente}>
                <Settings2 size={16} />
                Configurar existente
              </Button>
            ) : (
              <Button onClick={abrirModal}>
                <PlusCircle size={16} />
                Iniciar criação
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/app/catalogo">
                <Package size={16} />
                Gerir produtos
              </Link>
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 lg:gap-3">
          <ResumoCompacto titulo="Produtos no sistema" valor={catalogo.totalProdutos} detalhe={temProdutos ? "catálogo encontrado" : "catálogo vazio"} tom={temProdutos ? "principal" : "neutro"} />
          <ResumoCompacto titulo="Entram na loja" valor={catalogo.produtosVendaveis} detalhe="disponíveis com stock" tom={temVendaveis ? "sucesso" : "atencao"} />
          <ResumoCompacto titulo="A rever" valor={catalogo.produtosSemStock + catalogo.produtosBaixoStock} detalhe="stock ou estado" tom={catalogo.produtosSemStock || catalogo.produtosBaixoStock ? "atencao" : "neutro"} />
        </div>

        <div className="mt-4 grid gap-3 rounded-lg border border-border/60 bg-background p-3">
          <StatusLinha
            pronto={temVendaveis}
            texto={temVendaveis ? "Produtos vendáveis entram automaticamente quando a loja for criada." : "Ainda não há produtos prontos para aparecer na loja."}
          />
          <StatusLinha
            pronto={!produtosCriticos.length}
            texto={produtosCriticos.length ? "Há produtos com stock baixo ou esgotado para rever antes da publicação." : "Catálogo sem alertas críticos de stock."}
          />
        </div>
      </CrmCommandPanel>

      <CrmSection
        icon={<PackageSearch size={20} />}
        title="Produtos para colocar na loja"
        description="O sistema verifica o catálogo existente e mostra o que entrará na loja online."
      >
        {produtosDestaque.length ? (
          <CrmList>
            {produtosDestaque.map((peca) => (
              <CrmListItem
                key={peca.id}
                media={peca.fotos?.[0] ? <img src={resolverUrlMedia(peca.fotos[0])} alt="" className="size-9 rounded-lg object-cover" /> : <Package size={18} />}
                title={peca.nome}
                description={`#${peca.codigo} · ${formatarKwanza(peca.precoEmKwanza)}`}
                meta={`${peca.quantidade} un.`}
                tone="sucesso"
                badges={<Badge variant="success">Pronto para loja</Badge>}
              />
            ))}
          </CrmList>
        ) : (
          <EstadoVazio
            icone={<Package />}
            titulo={temProdutos ? "Produtos precisam revisão" : "Sem produtos no sistema"}
            detalhe={temProdutos ? "Ajuste stock e estado dos produtos para colocá-los na loja." : "Cadastre produtos primeiro ou inicie a loja e volte ao catálogo depois."}
          />
        )}
      </CrmSection>
    </div>
  );
}

function ModalInicioCriacao({
  aberto,
  catalogo,
  confirmarProdutos,
  fechar,
  iniciarCriacao,
  produtosConfirmados,
  produtosDestaque
}: {
  aberto: boolean;
  catalogo: ConfiguracaoLojaDigital["catalogo"];
  confirmarProdutos: () => void;
  fechar: () => void;
  iniciarCriacao: () => void;
  produtosConfirmados: boolean;
  produtosDestaque: Peca[];
}) {
  const temVendaveis = catalogo.produtosVendaveis > 0;

  return (
    <Dialog open={aberto} onOpenChange={(valor) => { if (!valor) fechar(); }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <Badge variant="outline" className="w-fit">Criação guiada</Badge>
          <DialogTitle className="text-xl">Vamos criar sua loja digital</DialogTitle>
          <DialogDescription>
            A loja só será criada quando guardar o rascunho ou publicar no assistente. Primeiro vamos conferir os produtos disponíveis no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResumoCompacto titulo="No sistema" valor={catalogo.totalProdutos} detalhe="produtos cadastrados" tom={catalogo.totalProdutos ? "principal" : "neutro"} />
            <ResumoCompacto titulo="Para entrar" valor={catalogo.produtosVendaveis} detalhe="vendáveis agora" tom={temVendaveis ? "sucesso" : "atencao"} />
            <ResumoCompacto titulo="Bloqueados" valor={catalogo.produtosSemStock} detalhe="sem stock" tom={catalogo.produtosSemStock ? "perigo" : "neutro"} />
          </div>

          <section className="grid gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-background text-foreground">
                <PackageCheck size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">Produtos da loja</h3>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  Produtos disponíveis e com stock entram automaticamente na loja criada. Produtos esgotados ficam fora até serem corrigidos.
                </p>
              </div>
            </div>

            {produtosDestaque.length ? (
              <div className="grid gap-2">
                {produtosDestaque.slice(0, 3).map((peca) => (
                  <div key={peca.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-2">
                    <span className="grid size-10 place-items-center overflow-hidden rounded-lg bg-muted">
                      {peca.fotos?.[0] ? <img src={resolverUrlMedia(peca.fotos[0])} alt="" className="h-full w-full object-cover" /> : <Package size={16} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm text-foreground">{peca.nome}</strong>
                      <small className="block truncate text-xs text-muted-foreground">{formatarKwanza(peca.precoEmKwanza)} · {peca.quantidade} un.</small>
                    </span>
                    <Badge variant="success">Entra</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EstadoVazio
                icone={<Package />}
                titulo="Nada pronto para entrar"
                detalhe="Pode criar a loja como rascunho, mas o ideal é corrigir ou cadastrar produtos antes de publicar."
              />
            )}

            <Button
              variant={produtosConfirmados ? "success" : "outline"}
              onClick={confirmarProdutos}
              disabled={!temVendaveis}
              className="w-fit"
            >
              <PackageCheck size={16} />
              {produtosConfirmados ? "Produtos confirmados" : "Colocar produtos vendáveis na loja"}
            </Button>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Cancelar</Button>
          <Button onClick={iniciarCriacao}>
            <ArrowRight size={16} />
            Vamos começar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PassoIdentidade({
  copiarLink,
  dominioPublicoLoja,
  form,
  atualizarSecao,
  urlPublica
}: {
  copiarLink: () => void;
  dominioPublicoLoja: string | null;
  form: FormLoja;
  atualizarSecao: <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
  urlPublica: string;
}) {
  const paletaAtual = paletasTemaLoja.find((paleta) => paleta.primaria.toLowerCase() === form.tema.corPrimaria.toLowerCase()) ?? paletasTemaLoja[0];
  const prefixoLinkPublico = dominioPublicoLoja ? "https://" : "/lojas/";
  const sufixoLinkPublico = dominioPublicoLoja ? `.${dominioPublicoLoja}` : undefined;

  return (
    <section className="grid gap-5">
      <BlocoFormulario
        icon={<Store size={18} />}
        title="Perfil da loja"
        detail="Nome, link e texto curto. Use como um cartão de visita: direto, memorável e fácil de partilhar."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <CampoTexto id="nomeComercial" label="Nome da loja" value={form.identidade.nomeComercial} onChange={(valor) => atualizarSecao("identidade", { nomeComercial: valor })} />
          <CampoTexto id="slug" label="Link público" value={form.publicacao.slug} onChange={(valor) => atualizarSecao("publicacao", { slug: normalizarSlug(valor) })} prefixo={prefixoLinkPublico} sufixo={sufixoLinkPublico} />
          <CampoTexto id="whatsapp" label="WhatsApp de vendas" value={form.identidade.whatsapp} onChange={(valor) => atualizarSecao("identidade", { whatsapp: valor })} />
          <CampoTexto id="telefone" label="Telefone alternativo" value={form.identidade.telefone} onChange={(valor) => atualizarSecao("identidade", { telefone: valor })} />
          <CampoTexto id="email" label="Email" value={form.identidade.email} onChange={(valor) => atualizarSecao("identidade", { email: valor })} />
          <CampoTexto id="municipio" label="Município" value={form.identidade.municipio} onChange={(valor) => atualizarSecao("identidade", { municipio: valor })} />
        </div>
        <CampoArea id="descricaoPublica" label="Descrição curta" value={form.identidade.descricaoPublica} onChange={(valor) => {
          atualizarSecao("identidade", { descricaoPublica: valor });
          atualizarSecao("publicacao", { descricaoPublica: valor });
        }} rows={3} />
      </BlocoFormulario>

      <BlocoFormulario
        icon={<Palette size={18} />}
        title="Paletas de marca"
        detail="Escolha uma combinação pronta. A loja mantém a sua personalidade sem parecer um tema genérico."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {paletasTemaLoja.map((paleta) => {
            const ativa = paleta.primaria.toLowerCase() === form.tema.corPrimaria.toLowerCase();
            return (
              <button
                key={paleta.id}
                type="button"
                onClick={() => atualizarSecao("tema", { corPrimaria: paleta.primaria })}
                className={`rounded-xl border p-3 text-left transition-all ${
                  ativa ? "border-foreground bg-foreground text-background shadow-sm" : "border-border/70 bg-background hover:bg-muted/50"
                }`}
              >
                <span className="flex gap-1.5">
                  {[paleta.primaria, paleta.secundaria, paleta.acento].map((cor) => (
                    <span key={cor} className="size-6 rounded-full border border-black/10" style={{ backgroundColor: cor }} />
                  ))}
                </span>
                <strong className="mt-3 block text-sm">{paleta.nome}</strong>
                <span className={`mt-1 block text-xs ${ativa ? "text-background/70" : "text-muted-foreground"}`}>{paleta.detalhe}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-xl border border-border/60 p-3">
            <span className="text-sm font-medium text-foreground">Paleta selecionada</span>
            <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
              <div className="h-16" style={{ background: `linear-gradient(135deg, ${paletaAtual.primaria}, ${paletaAtual.acento})` }} />
              <div className="grid gap-2 p-3" style={{ backgroundColor: paletaAtual.secundaria }}>
                <strong className="text-sm text-foreground">{form.identidade.nomeComercial || "Nome da loja"}</strong>
                <span className="h-2 w-2/3 rounded-full bg-black/15" />
                <span className="h-2 w-1/2 rounded-full bg-black/10" />
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            <CampoTexto id="endereco" label="Endereço base" value={form.identidade.endereco} onChange={(valor) => atualizarSecao("identidade", { endereco: valor })} />
            <CampoTexto id="corPrimaria" label="Cor manual" value={form.tema.corPrimaria} onChange={(valor) => atualizarSecao("tema", { corPrimaria: valor })} />
          </div>
        </div>
      </BlocoFormulario>

      <BlocoFormulario
        icon={<Store size={18} />}
        title="Perfil e capa"
        detail="A foto de perfil identifica a loja; a capa cria contexto visual sem precisar de textos longos."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <CampoTexto id="logoUrl" label="Foto de perfil ou logo" value={form.tema.logoUrl} onChange={(valor) => atualizarSecao("tema", { logoUrl: valor })} />
          <CampoTexto id="capaUrl" label="Imagem de capa" value={form.tema.capaUrl} onChange={(valor) => atualizarSecao("tema", { capaUrl: valor })} />
        </div>
        {urlPublica && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/40 p-3">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{urlPublica}</span>
            <Button variant="outline" size="sm" onClick={copiarLink}>
              <Copy size={14} />
              Copiar
            </Button>
          </div>
        )}
      </BlocoFormulario>
    </section>
  );
}

function PassoProdutos({
  catalogo,
  produtosCriticos,
  produtosDestaque
}: {
  catalogo: ConfiguracaoLojaDigital["catalogo"];
  produtosCriticos: Peca[];
  produtosDestaque: Peca[];
}) {
  return (
    <section className="grid gap-5">
      <BlocoFormulario icon={<PackageSearch size={18} />} title="Estado do catálogo" detail="A loja só deve ser divulgada quando o produto vendável estiver claro.">
        <div className="grid gap-3 md:grid-cols-3">
          <ResumoCompacto titulo="Vendáveis" valor={catalogo.produtosVendaveis} detalhe="prontos para compra" tom="sucesso" />
          <ResumoCompacto titulo="Sem stock" valor={catalogo.produtosSemStock} detalhe="não devem prometer venda" tom={catalogo.produtosSemStock ? "perigo" : "neutro"} />
          <ResumoCompacto titulo="Potencial" valor={formatarKwanza(catalogo.valorPotencialEmKwanza)} detalhe="preço x stock" tom="principal" />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<PackageCheck size={18} />} title="Produtos em destaque" detail="Prévia do que aparece primeiro para o cliente.">
        {produtosDestaque.length ? (
          <CrmList>
            {produtosDestaque.map((peca) => (
              <CrmListItem
                key={peca.id}
                media={peca.fotos?.[0] ? <img src={resolverUrlMedia(peca.fotos[0])} alt="" className="size-9 rounded-lg object-cover" /> : <Package size={18} />}
                title={peca.nome}
                description={`#${peca.codigo} · ${formatarKwanza(peca.precoEmKwanza)}`}
                meta={`${peca.quantidade} un.`}
                tone={peca.quantidade > 0 ? "sucesso" : "perigo"}
              />
            ))}
          </CrmList>
        ) : (
          <EstadoVazio icone={<Package />} titulo="Nenhum produto pronto" detalhe="Cadastre produtos com preço, foto e stock para preencher a loja." />
        )}
      </BlocoFormulario>

      <BlocoFormulario icon={<ClipboardCheck size={18} />} title="Atenção antes de publicar" detail="Itens que podem gerar atendimento manual desnecessário.">
        {produtosCriticos.length ? (
          <CrmList>
            {produtosCriticos.map((peca) => (
              <CrmListItem
                key={peca.id}
                media={<Package size={18} />}
                title={peca.nome}
                description={`#${peca.codigo}`}
                meta={`${peca.quantidade} un.`}
                tone={peca.quantidade <= 0 ? "perigo" : "atencao"}
              />
            ))}
          </CrmList>
        ) : (
          <StatusLinha pronto texto="Sem alerta crítico de stock." />
        )}
        <Button asChild variant="outline" className="mt-3 w-fit">
          <Link to="/app/catalogo">
            Ajustar catálogo
            <ArrowRight size={14} />
          </Link>
        </Button>
      </BlocoFormulario>
    </section>
  );
}

function PassoExperienciaLoja({
  atualizarSecao,
  form
}: {
  form: FormLoja;
  atualizarSecao: <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
}) {
  return <EditorExperienciaLoja form={form} atualizarSecao={atualizarSecao} />;
}

function EditorExperienciaLoja({
  atualizarSecao,
  form
}: {
  form: FormLoja;
  atualizarSecao: <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
}) {
  const linhasMedidas = parseTabelaMedidasTexto(form.experiencia.tabelaMedidasTexto);

  function atualizarExperiencia(valores: Partial<FormLoja["experiencia"]>) {
    atualizarSecao("experiencia", valores);
  }

  function alternarVitrine(id: string, checked: boolean) {
    const atuais = form.experiencia.ordemVitrines;
    const proxima = checked ? [...atuais, id] : atuais.filter((item) => item !== id);
    atualizarExperiencia({ ordemVitrines: [...new Set(proxima)] });
  }

  return (
    <section className="grid gap-5">
      <BlocoFormulario icon={<LayoutGrid size={18} />} title="Vitrines e catálogos" detail="Escolha quais blocos aparecem primeiro na loja pública. A ordem abaixo guia a experiência inicial.">
        <div className="grid gap-3 md:grid-cols-5">
          {modosExperienciaLoja.map((modo) => (
            <button
              key={modo.id}
              type="button"
              onClick={() => atualizarExperiencia({ modoNegocio: modo.id })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                form.experiencia.modoNegocio === modo.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/70 bg-background hover:bg-muted/60"
              }`}
            >
              <strong className="block text-sm">{modo.titulo}</strong>
              <span className={`mt-1 block text-xs leading-5 ${form.experiencia.modoNegocio === modo.id ? "text-background/70" : "text-muted-foreground"}`}>
                {modo.detalhe}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {vitrinesEditaveis.map((vitrine) => (
            <OpcaoMarcavel
              key={vitrine.id}
              checked={form.experiencia.ordemVitrines.includes(vitrine.id)}
              title={vitrine.titulo}
              detail={vitrine.detalhe}
              onChange={(checked) => alternarVitrine(vitrine.id, checked)}
            />
          ))}
        </div>

        <OpcaoMarcavel
          checked={form.experiencia.catalogosEditaveis}
          title="Catalogos editáveis"
          detail="Mostra blocos por coleção/categoria para o cliente navegar sem pesquisar."
          onChange={(checked) => atualizarExperiencia({ catalogosEditaveis: checked })}
        />

        <EditorCatalogosPersonalizados
          texto={form.experiencia.catalogosPersonalizadosTexto}
          onChange={(valor) => atualizarExperiencia({ catalogosPersonalizadosTexto: valor })}
        />
      </BlocoFormulario>

      <BlocoFormulario icon={<MousePointerClick size={18} />} title="Captura progressiva" detail="Peça dados no momento certo, sem travar a navegação.">
        <div className="grid gap-3 md:grid-cols-[.8fr_1.2fr]">
          <OpcaoMarcavel
            checked={form.experiencia.leadCaptureAtivo}
            title="Captura de lead ativa"
            detail="Abre convite depois de interesse real em produtos."
            onChange={(checked) => atualizarExperiencia({ leadCaptureAtivo: checked })}
          />
          <CampoTexto
            id="leadCaptureTitulo"
            label="Mensagem do modal"
            value={form.experiencia.leadCaptureTitulo}
            onChange={(valor) => atualizarExperiencia({ leadCaptureTitulo: valor })}
          />
          <CampoTexto
            id="cupomDestaque"
            label="Cupão ou incentivo opcional"
            value={form.experiencia.cupomDestaque}
            onChange={(valor) => atualizarExperiencia({ cupomDestaque: valor })}
          />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<ShieldCheck size={18} />} title="Confiança e políticas" detail="Textos curtos que reduzem dúvidas antes do WhatsApp.">
        <div className="grid gap-3 md:grid-cols-3">
          <CampoArea id="politicaTroca" label="Política de troca" value={form.experiencia.politicaTroca} onChange={(valor) => atualizarExperiencia({ politicaTroca: valor })} rows={4} />
          <CampoArea id="politicaEntrega" label="Política de entrega" value={form.experiencia.politicaEntrega} onChange={(valor) => atualizarExperiencia({ politicaEntrega: valor })} rows={4} />
          <CampoArea id="politicaPrivacidade" label="Uso de dados" value={form.experiencia.politicaPrivacidade} onChange={(valor) => atualizarExperiencia({ politicaPrivacidade: valor })} rows={4} />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<Ruler size={18} />} title="Tabela de medidas" detail="Uma linha por tamanho. Formato sugerido: P | 84-88 | 66-70 | 90-94 | Forma normal.">
        <CampoArea
          id="tabelaMedidasTexto"
          label="Linhas da tabela"
          value={form.experiencia.tabelaMedidasTexto}
          onChange={(valor) => atualizarExperiencia({ tabelaMedidasTexto: valor })}
          rows={5}
        />
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prévia interpretada</span>
          {linhasMedidas.length ? (
            <div className="mt-3 grid gap-2">
              {linhasMedidas.slice(0, 4).map((linha) => (
                <div key={linha.tamanho} className="grid grid-cols-4 gap-2 rounded-lg bg-background px-3 py-2 text-xs">
                  <strong>{linha.tamanho}</strong>
                  <span>{linha.busto || "-"}</span>
                  <span>{linha.cintura || "-"}</span>
                  <span className="truncate">{linha.observacao || linha.quadril || "-"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sem tabela definida; a loja usa os tamanhos cadastrados no produto.</p>
          )}
        </div>
      </BlocoFormulario>
    </section>
  );
}

function PassoEntrega({
  form,
  atualizarSecao
}: {
  form: FormLoja;
  atualizarSecao: <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
}) {
  return (
    <section className="grid gap-5">
      <BlocoFormulario icon={<Truck size={18} />} title="Modalidades" detail="Estas opções aparecem no checkout e reduzem perguntas repetidas no WhatsApp.">
        <div className="grid gap-3 md:grid-cols-3">
          <OpcaoMarcavel
            checked={form.entrega.entregaAtiva}
            title="Entrega"
            detail="Cliente informa morada."
            onChange={(checked) => atualizarSecao("entrega", { entregaAtiva: checked })}
          />
          <OpcaoMarcavel
            checked={form.entrega.retiradaAtiva}
            title="Levantamento"
            detail="Cliente recolhe na loja."
            onChange={(checked) => atualizarSecao("entrega", { retiradaAtiva: checked })}
          />
          <OpcaoMarcavel
            checked={form.entrega.consumoLocalAtivo}
            title="Consumo local"
            detail="Útil para serviços ou loja física."
            onChange={(checked) => atualizarSecao("entrega", { consumoLocalAtivo: checked })}
          />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<Settings2 size={18} />} title="Regras de entrega" detail="Valores usados no cálculo automático do checkout.">
        <div className="grid gap-3 md:grid-cols-2">
          <CampoNumero id="taxaEntrega" label="Taxa padrão (Kz)" value={form.entrega.taxaPadraoEmKwanza} onChange={(valor) => atualizarSecao("entrega", { taxaPadraoEmKwanza: valor })} />
          <CampoTexto id="entregaGratis" label="Entrega grátis acima de (Kz)" value={form.entrega.entregaGratisAcimaDeKwanza} onChange={(valor) => atualizarSecao("entrega", { entregaGratisAcimaDeKwanza: valor })} />
          <CampoTexto id="prazoPadrao" label="Prazo padrão" value={form.entrega.prazoPadrao} onChange={(valor) => atualizarSecao("entrega", { prazoPadrao: valor })} />
          <CampoTexto id="enderecoRetirada" label="Endereço de levantamento" value={form.entrega.enderecoRetirada} onChange={(valor) => atualizarSecao("entrega", { enderecoRetirada: valor })} />
        </div>
        <CampoArea id="instrucoesEntrega" label="Instruções de entrega" value={form.entrega.instrucoesEntrega} onChange={(valor) => atualizarSecao("entrega", { instrucoesEntrega: valor })} rows={3} />
      </BlocoFormulario>
    </section>
  );
}

function EditorCatalogosPersonalizados({
  onChange,
  texto
}: {
  onChange: (valor: string) => void;
  texto: string;
}) {
  const catalogos = parseCatalogosPersonalizadosTexto(texto);

  function adicionarCatalogo() {
    const linha = "Nova seleção | categoria | Vestidos | Produtos escolhidos para esta vitrine.";
    onChange([texto.trim(), linha].filter(Boolean).join("\n"));
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-foreground">Catálogos personalizados</span>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Crie blocos manuais por categoria, coleção, busca ou todos os produtos.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={adicionarCatalogo}>
          <PlusCircle size={14} />
          Adicionar catálogo
        </Button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_.9fr]">
        <CampoArea
          id="catalogosPersonalizadosTexto"
          label="Uma linha por catálogo: Nome | critério | valor | descrição"
          value={texto}
          onChange={onChange}
          rows={5}
        />
        <div className="rounded-lg border border-border/60 bg-background p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prévia dos blocos</span>
          {catalogos.length ? (
            <div className="mt-3 grid gap-2">
              {catalogos.slice(0, 5).map((catalogo) => (
                <div key={catalogo.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm text-foreground">{catalogo.nome}</strong>
                    <Badge variant="outline" className="rounded-md">{catalogo.criterio}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {catalogo.valor ? `${catalogo.valor} · ` : ""}{catalogo.descricao || "Sem descrição"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Sem catálogo manual. A loja usa categorias e coleções dos produtos.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PassoPagamentos({
  form,
  atualizarSecao
}: {
  form: FormLoja;
  atualizarSecao: <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
}) {
  function alternarMetodo(metodo: string, checked: boolean) {
    const atuais = new Set(form.pagamentos.metodosPagamento);
    if (checked) {
      atuais.add(metodo);
    } else {
      atuais.delete(metodo);
    }
    atualizarSecao("pagamentos", { metodosPagamento: Array.from(atuais) });
  }

  return (
    <section className="grid gap-5">
      <BlocoFormulario icon={<WalletCards size={18} />} title="Métodos de pagamento" detail="O checkout apresenta só o que está operacional.">
        <div className="grid gap-3 md:grid-cols-2">
          {metodosPagamento.map((metodo) => (
            <OpcaoMarcavel
              key={metodo.id}
              checked={form.pagamentos.metodosPagamento.includes(metodo.id)}
              title={metodo.titulo}
              detail={metodo.detalhe}
              onChange={(checked) => alternarMetodo(metodo.id, checked)}
            />
          ))}
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<MessageCircle size={18} />} title="Mensagens operacionais" detail="Textos curtos que ajudam a equipa a manter a mesma linha no atendimento.">
        <CampoArea id="instrucoesCobranca" label="Instruções de cobrança" value={form.pagamentos.instrucoesCobranca} onChange={(valor) => atualizarSecao("pagamentos", { instrucoesCobranca: valor })} rows={3} />
        <div className="grid gap-3 md:grid-cols-2">
          <CampoArea id="mensagemPendente" label="Comprovativo pendente" value={form.pagamentos.mensagemComprovativoPendente} onChange={(valor) => atualizarSecao("pagamentos", { mensagemComprovativoPendente: valor })} rows={3} />
          <CampoArea id="mensagemConfirmado" label="Pagamento confirmado" value={form.pagamentos.mensagemPagamentoConfirmado} onChange={(valor) => atualizarSecao("pagamentos", { mensagemPagamentoConfirmado: valor })} rows={3} />
        </div>
      </BlocoFormulario>
    </section>
  );
}

function PassoOperacaoLoja({
  atualizarSecao,
  form
}: {
  form: FormLoja;
  atualizarSecao: <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
}) {
  function atualizarOperacao<Secao extends keyof OperacaoLojaDigital>(
    secao: Secao,
    valores: Partial<OperacaoLojaDigital[Secao]>
  ) {
    atualizarSecao("operacao", {
      [secao]: {
        ...form.operacao[secao],
        ...valores
      }
    } as Partial<FormLoja["operacao"]>);
  }

  function alternarMetrica(id: string, checked: boolean) {
    const atuais = new Set(form.operacao.relatorios.metricas);
    if (checked) atuais.add(id);
    else atuais.delete(id);
    atualizarOperacao("relatorios", { metricas: Array.from(atuais) });
  }

  function alternarFiltroPedido(id: string, checked: boolean) {
    const atuais = new Set(form.operacao.relatorios.filtrosPedidos);
    if (checked) atuais.add(id);
    else atuais.delete(id);
    atualizarOperacao("relatorios", { filtrosPedidos: Array.from(atuais) });
  }

  function alternarRelatorioPronto(id: string, checked: boolean) {
    const atuais = new Set(form.operacao.relatorios.relatoriosProntos);
    if (checked) atuais.add(id);
    else atuais.delete(id);
    atualizarOperacao("relatorios", { relatoriosProntos: Array.from(atuais) });
  }

  return (
    <section className="grid gap-5">
      <BlocoFormulario
        icon={<Settings2 size={18} />}
        title="Fluxos operacionais"
        detail="Defina como a loja passa da navegação para pedido, atendimento, entrega e relatório sem criar trabalho manual desnecessário."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <ResumoCompacto
            titulo="Checkout"
            valor={form.operacao.checkout.exigirTelefoneCheckout ? "Com contacto" : "Livre"}
            detalhe={form.operacao.checkout.manterRascunhoAtePago ? "rascunho até pagamento" : "gera pedido direto"}
            tom="principal"
          />
          <ResumoCompacto
            titulo="Acesso"
            valor={opcoesAcessoLoja.find((item) => item.id === form.operacao.fidelizacao.acessoLoja)?.titulo ?? "Aberto"}
            detalhe={form.operacao.fidelizacao.ofertaBoasVindasAtiva ? "incentivo ativo" : "sem oferta"}
            tom="sucesso"
          />
          <ResumoCompacto
            titulo="Automações"
            valor={Object.values(form.operacao.automacoes).filter(Boolean).length}
            detalhe="gatilhos ligados"
            tom="atencao"
          />
          <ResumoCompacto
            titulo="Canais"
            valor={Object.values(form.operacao.canais).filter(Boolean).length}
            detalhe="origens conectadas"
            tom="principal"
          />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<ShieldCheck size={18} />} title="Gestão de plano" detail="Mostre limites, recursos bloqueados e upgrade contextual sem impedir a equipa de entender o próximo passo.">
        <div className="grid gap-3 md:grid-cols-[.8fr_1.2fr]">
          <CampoTexto
            id="planoAtual"
            label="Plano atual"
            value={form.operacao.plano.planoAtual}
            onChange={(valor) => atualizarOperacao("plano", { planoAtual: valor })}
          />
          <CampoArea
            id="recursosBloqueados"
            label="Recursos bloqueados por plano"
            value={formatarListaTexto(form.operacao.plano.recursosBloqueados)}
            onChange={(valor) => atualizarOperacao("plano", { recursosBloqueados: parseListaTexto(valor).slice(0, 40) })}
            rows={3}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <CampoNumero id="quotaEncomendas" label="Quota encomendas" value={form.operacao.plano.quotas.encomendasMensais} onChange={(valor) => atualizarOperacao("plano", { quotas: { ...form.operacao.plano.quotas, encomendasMensais: valor } })} />
          <CampoNumero id="quotaImagens" label="Quota imagens" value={form.operacao.plano.quotas.imagens} onChange={(valor) => atualizarOperacao("plano", { quotas: { ...form.operacao.plano.quotas, imagens: valor } })} />
          <CampoNumero id="quotaWhatsapp" label="Quota WhatsApp" value={form.operacao.plano.quotas.whatsapp} onChange={(valor) => atualizarOperacao("plano", { quotas: { ...form.operacao.plano.quotas, whatsapp: valor } })} />
          <CampoNumero id="quotaEmail" label="Quota email" value={form.operacao.plano.quotas.email} onChange={(valor) => atualizarOperacao("plano", { quotas: { ...form.operacao.plano.quotas, email: valor } })} />
        </div>
        <OpcaoMarcavel
          checked={form.operacao.plano.upgradeContextual}
          title="Upgrade contextual"
          detail="Quando uma função estiver bloqueada, o admin explica o benefício e leva ao plano certo."
          onChange={(checked) => atualizarOperacao("plano", { upgradeContextual: checked })}
        />
        <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <span className="text-sm font-semibold text-foreground">Quotas de uso</span>
          <p className="text-xs leading-5 text-muted-foreground">Encomendas, imagens, WhatsApp e email ficam visíveis para o dono da loja antes de chegar ao limite.</p>
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<ShoppingCart size={18} />} title="Checkout inteligente" detail="Regras que organizam o pedido antes de abrir o WhatsApp ou criar tarefa para a equipa.">
        <div className="grid gap-3 md:grid-cols-2">
          <OpcaoMarcavel
            checked={form.operacao.checkout.manterRascunhoAtePago}
            title="Manter rascunho até pagamento"
            detail="Pedido fica em acompanhamento até comprovativo ou confirmação."
            onChange={(checked) => atualizarOperacao("checkout", { manterRascunhoAtePago: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.checkout.confirmacaoAutomaticaPagamento}
            title="Confirmar pagamento automaticamente"
            detail="Usar apenas quando o método de pagamento permitir confiança operacional."
            onChange={(checked) => atualizarOperacao("checkout", { confirmacaoAutomaticaPagamento: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.checkout.exigirTelefoneCheckout}
            title="Telefone obrigatório"
            detail="Garante contacto para entrega, alterações e recuperação."
            onChange={(checked) => atualizarOperacao("checkout", { exigirTelefoneCheckout: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.checkout.exigirLoginCheckout}
            title="Login para finalizar"
            detail="Útil quando a loja usa histórico, favoritos e crédito."
            onChange={(checked) => atualizarOperacao("checkout", { exigirLoginCheckout: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.checkout.ignorarPaginaPagamento}
            title="Pular página de pagamento"
            detail="Leva o cliente ao WhatsApp quando a cobrança é sempre manual."
            onChange={(checked) => atualizarOperacao("checkout", { ignorarPaginaPagamento: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.checkout.entradaAtiva}
            title="Sinal/entrada"
            detail="Mostra entrada mínima em compras com reserva ou produção."
            onChange={(checked) => atualizarOperacao("checkout", { entradaAtiva: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.checkout.mostrarNumeroEncomendaNaMensagem}
            title="Mostrar número da encomenda"
            detail="Inclui prefixo/sufixo na fatura, mensagem e acompanhamento no atendimento."
            onChange={(checked) => atualizarOperacao("checkout", { mostrarNumeroEncomendaNaMensagem: checked })}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <CampoNumero id="entradaPercentual" label="Entrada (%)" value={form.operacao.checkout.entradaPercentual} onChange={(valor) => atualizarOperacao("checkout", { entradaPercentual: valor })} />
          <CampoNumero id="taxaServicoPercentual" label="Taxa serviço (%)" value={form.operacao.checkout.taxaServicoPercentual} onChange={(valor) => atualizarOperacao("checkout", { taxaServicoPercentual: valor })} />
          <CampoNumero id="taxaServicoFixa" label="Taxa fixa (Kz)" value={form.operacao.checkout.taxaServicoFixaEmKwanza} onChange={(valor) => atualizarOperacao("checkout", { taxaServicoFixaEmKwanza: valor })} />
          <CampoTexto id="prefixoPedido" label="Prefixo pedido" value={form.operacao.checkout.prefixoPedido ?? ""} onChange={(valor) => atualizarOperacao("checkout", { prefixoPedido: valor })} />
          <CampoTexto id="sufixoPedido" label="Sufixo pedido" value={form.operacao.checkout.sufixoPedido ?? ""} onChange={(valor) => atualizarOperacao("checkout", { sufixoPedido: valor })} />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<WalletCards size={18} />} title="Pagamentos avançados" detail="Ative métodos conforme o plano, a conta financeira e o fluxo real de cobrança.">
        <div className="grid gap-3 md:grid-cols-2">
          {pagamentosAvancadosLoja.map((pagamento) => (
            <OpcaoMarcavel
              key={pagamento.id}
              checked={form.operacao.pagamentos[pagamento.id] === true}
              title={pagamento.titulo}
              detail={pagamento.detalhe}
              onChange={(checked) => atualizarOperacao("pagamentos", { [pagamento.id]: checked } as Partial<OperacaoLojaDigital["pagamentos"]>)}
            />
          ))}
        </div>
        <CampoArea
          id="instrucoesPagamento"
          label="Instruções de pagamento"
          value={form.operacao.pagamentos.instrucoesPagamento ?? ""}
          onChange={(valor) => atualizarOperacao("pagamentos", { instrucoesPagamento: valor })}
          rows={3}
        />
      </BlocoFormulario>

      <BlocoFormulario icon={<Truck size={18} />} title="Disponibilidade e zonas" detail="Organize entrega ao domicílio, levantamento, consumo local, horário e preço por zona.">
        <div className="grid gap-3 md:grid-cols-2">
          <OpcaoMarcavel
            checked={form.operacao.entrega.gerirDisponibilidade}
            title="Gerir disponibilidade"
            detail="Controla quando pedidos e entregas podem ser aceites."
            onChange={(checked) => atualizarOperacao("entrega", { gerirDisponibilidade: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.entrega.adicionarMetodoEntrega}
            title="Adicionar método de entrega"
            detail="Permite criar modalidades por loja, zona ou operação."
            onChange={(checked) => atualizarOperacao("entrega", { adicionarMetodoEntrega: checked })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <CampoArea
            id="disponibilidadeSemanal"
            label="Disponibilidade semanal"
            value={formatarListaTexto(form.operacao.entrega.disponibilidadeSemanal)}
            onChange={(valor) => atualizarOperacao("entrega", { disponibilidadeSemanal: parseListaTexto(valor).slice(0, 21) })}
            rows={4}
          />
          <CampoArea
            id="zonasEntrega"
            label="Preço por zona: nome | preço | prazo"
            value={formatarZonasEntregaTexto(form.operacao.entrega.zonas)}
            onChange={(valor) => atualizarOperacao("entrega", { zonas: parseZonasEntregaTexto(valor) })}
            rows={4}
          />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<ShieldCheck size={18} />} title="Acesso e fidelização" detail="Escolha como captar dados sem quebrar a navegação e quais incentivos ficam disponíveis para recompra.">
        <div className="grid gap-3 md:grid-cols-4">
          {opcoesAcessoLoja.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => atualizarOperacao("fidelizacao", { acessoLoja: opcao.id })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                form.operacao.fidelizacao.acessoLoja === opcao.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/70 bg-background hover:bg-muted/60"
              }`}
            >
              <strong className="block text-sm">{opcao.titulo}</strong>
              <span className={`mt-1 block text-xs leading-5 ${form.operacao.fidelizacao.acessoLoja === opcao.id ? "text-background/70" : "text-muted-foreground"}`}>
                {opcao.detalhe}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <OpcaoMarcavel
            checked={form.operacao.fidelizacao.ofertaBoasVindasAtiva}
            title="Oferta de boas-vindas"
            detail="Incentivo após o primeiro contacto identificado."
            onChange={(checked) => atualizarOperacao("fidelizacao", { ofertaBoasVindasAtiva: checked })}
          />
          <CampoTexto
            id="cupomBoasVindas"
            label="Cupão de boas-vindas"
            value={form.operacao.fidelizacao.cupomBoasVindas ?? ""}
            onChange={(valor) => atualizarOperacao("fidelizacao", { cupomBoasVindas: valor })}
          />
          <OpcaoMarcavel
            checked={form.operacao.fidelizacao.recompensasAtivas}
            title="Recompensas"
            detail="Marca clientes por frequência ou valor acumulado."
            onChange={(checked) => atualizarOperacao("fidelizacao", { recompensasAtivas: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.fidelizacao.recompensasIndicacaoAtivas}
            title="Indicação premiada"
            detail="Regista clientes que trazem novos compradores."
            onChange={(checked) => atualizarOperacao("fidelizacao", { recompensasIndicacaoAtivas: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.fidelizacao.creditoLojaAtivo}
            title="Crédito em loja"
            detail="Guarda saldo para trocas, campanhas e compensações."
            onChange={(checked) => atualizarOperacao("fidelizacao", { creditoLojaAtivo: checked })}
          />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<PackageSearch size={18} />} title="Categorias e descontos" detail="Define como categorias aparecem, quais ficam ocultas e como descontos entram no catálogo público.">
        <div className="grid gap-3 md:grid-cols-3">
          <CampoArea id="categoriasVisiveis" label="Categorias visíveis" value={formatarListaTexto(form.operacao.catalogo.categoriasVisiveis)} onChange={(valor) => atualizarOperacao("catalogo", { categoriasVisiveis: parseListaTexto(valor).slice(0, 60) })} rows={4} />
          <CampoArea id="categoriasOcultas" label="Categorias ocultas" value={formatarListaTexto(form.operacao.catalogo.categoriasOcultas)} onChange={(valor) => atualizarOperacao("catalogo", { categoriasOcultas: parseListaTexto(valor).slice(0, 60) })} rows={4} />
          <CampoArea id="sequenciaCategorias" label="Sequência das categorias" value={formatarListaTexto(form.operacao.catalogo.sequenciaCategorias)} onChange={(valor) => atualizarOperacao("catalogo", { sequenciaCategorias: parseListaTexto(valor).slice(0, 60) })} rows={4} />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <OpcaoMarcavel checked={form.operacao.catalogo.descontosAtivos} title="Descontos ativos" detail="Permite promoções e maiores descontos nos relatórios." onChange={(checked) => atualizarOperacao("catalogo", { descontosAtivos: checked })} />
          <OpcaoMarcavel checked={form.operacao.catalogo.produtosPorColecao} title="Produtos por coleção" detail="Organiza vitrine por coleção/categoria." onChange={(checked) => atualizarOperacao("catalogo", { produtosPorColecao: checked })} />
          <OpcaoMarcavel checked={form.operacao.catalogo.produtosComEstatisticas} title="Produtos com estatísticas" detail="Liga cliques, encomendas e lucro ao produto." onChange={(checked) => atualizarOperacao("catalogo", { produtosComEstatisticas: checked })} />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<MousePointerClick size={18} />} title="Clientes e segmentação" detail="Ferramentas para importar, filtrar, editar e falar com clientes certos sem sair do CRM.">
        <div className="grid gap-3 md:grid-cols-3">
          <OpcaoMarcavel checked={form.operacao.clientes.importar} title="Importar clientes" detail="Entrada por CSV ou base migrada." onChange={(checked) => atualizarOperacao("clientes", { importar: checked })} />
          <OpcaoMarcavel checked={form.operacao.clientes.exportar} title="Exportar clientes" detail="Gera base filtrada para análise ou operação." onChange={(checked) => atualizarOperacao("clientes", { exportar: checked })} />
          <OpcaoMarcavel checked={form.operacao.clientes.edicaoMassa} title="Edição em massa" detail="Atualiza tags, estado ou consentimento em lote." onChange={(checked) => atualizarOperacao("clientes", { edicaoMassa: checked })} />
          <OpcaoMarcavel checked={form.operacao.clientes.adicionarManual} title="Adicionar cliente manualmente" detail="Cria perfil quando o cliente chega fora da loja." onChange={(checked) => atualizarOperacao("clientes", { adicionarManual: checked })} />
          <OpcaoMarcavel checked={form.operacao.clientes.pesquisaAvancada} title="Pesquisa por nome, telefone, email ou notas" detail="Encontra clientes pelo que a equipa lembra." onChange={(checked) => atualizarOperacao("clientes", { pesquisaAvancada: checked })} />
          <OpcaoMarcavel checked={form.operacao.clientes.transmissaoFiltrada} title="Enviar transmissão filtrada" detail="Campanhas só para clientes selecionados." onChange={(checked) => atualizarOperacao("clientes", { transmissaoFiltrada: checked })} />
        </div>
        <CampoArea
          id="filtrosInteligentes"
          label="Filtros: todos, inativos, primeiro pedido, nunca fez pedido"
          value={formatarListaTexto(form.operacao.clientes.filtrosInteligentes)}
          onChange={(valor) => atualizarOperacao("clientes", { filtrosInteligentes: parseListaTexto(valor).slice(0, 20) })}
          rows={3}
        />
      </BlocoFormulario>

      <BlocoFormulario icon={<ShoppingCart size={18} />} title="Encomendas operacionais" detail="Padronize criação manual, rascunhos, pagamentos, calendário e colunas que a equipa usa todos os dias.">
        <div className="grid gap-3 md:grid-cols-3">
          <OpcaoMarcavel checked={form.operacao.encomendas.criarManual} title="Criar pedido manual" detail="Pedido criado por telefone, DM ou balcão." onChange={(checked) => atualizarOperacao("encomendas", { criarManual: checked })} />
          <OpcaoMarcavel checked={form.operacao.encomendas.exportar} title="Exportar encomendas" detail="CSV operacional por período ou filtro." onChange={(checked) => atualizarOperacao("encomendas", { exportar: checked })} />
          <OpcaoMarcavel checked={form.operacao.encomendas.resumoAtivo} title="Resumo" detail="Mostra totais, pagamento e cumprimento." onChange={(checked) => atualizarOperacao("encomendas", { resumoAtivo: checked })} />
          <OpcaoMarcavel checked={form.operacao.encomendas.rascunhos} title="Rascunhos" detail="Mantém pedidos sem pagamento confirmável." onChange={(checked) => atualizarOperacao("encomendas", { rascunhos: checked })} />
          <OpcaoMarcavel checked={form.operacao.encomendas.pagamentos} title="Pagamentos" detail="Acompanha unpaid, confirmando e pago." onChange={(checked) => atualizarOperacao("encomendas", { pagamentos: checked })} />
          <OpcaoMarcavel checked={form.operacao.encomendas.calendario} title="Calendário de encomendas" detail="Vista semana/mês para entrega e follow-up." onChange={(checked) => atualizarOperacao("encomendas", { calendario: checked })} />
        </div>
        <CampoArea
          id="colunasOperacionais"
          label="Colunas operacionais"
          value={formatarListaTexto(form.operacao.encomendas.colunasOperacionais)}
          onChange={(valor) => atualizarOperacao("encomendas", { colunasOperacionais: parseListaTexto(valor).slice(0, 30) })}
          rows={4}
        />
      </BlocoFormulario>

      <BlocoFormulario icon={<MessageCircle size={18} />} title="Automações comerciais" detail="Gatilhos ligados ao pedido, atendimento, agenda e histórico do cliente.">
        <div className="grid gap-3 md:grid-cols-2">
          {automacoesLojaDigital.map((automacao) => (
            <OpcaoMarcavel
              key={automacao.id}
              checked={form.operacao.automacoes[automacao.id]}
              title={automacao.titulo}
              detail={automacao.detalhe}
              onChange={(checked) => atualizarOperacao("automacoes", { [automacao.id]: checked } as Partial<OperacaoLojaDigital["automacoes"]>)}
            />
          ))}
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<Link2 size={18} />} title="Canais conectados" detail="Selecione as origens que a loja deve medir e encaminhar para as áreas certas do CRM.">
        <div className="grid gap-3 md:grid-cols-2">
          {canaisLojaDigital.map((canal) => (
            <div key={canal.id} className="grid gap-2 rounded-lg border border-border/70 bg-background p-3">
              <OpcaoMarcavel
                checked={form.operacao.canais[canal.id]}
                title={canal.titulo}
                detail={canal.detalhe}
                onChange={(checked) => atualizarOperacao("canais", { [canal.id]: checked } as Partial<OperacaoLojaDigital["canais"]>)}
              />
              <Button asChild variant="ghost" size="sm" className="w-fit">
                <Link to={canal.destino}>
                  Abrir área
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <AtalhoOperacional to="/app/clientes" icon={<MousePointerClick size={16} />} title="Clientes" detail="Perfis captados na loja." />
          <AtalhoOperacional to="/app/agenda" icon={<Truck size={16} />} title="Agenda" detail="Entregas e follow-up." />
          <AtalhoOperacional to="/app/reservas" icon={<ShoppingCart size={16} />} title="Pedidos" detail="Checkout e pagamento." />
          <AtalhoOperacional to="/app/relatorios" icon={<ClipboardCheck size={16} />} title="Relatórios" detail="Funil e resultados." />
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<ClipboardCheck size={18} />} title="Relatórios guiados" detail="Determine o que a equipa vai acompanhar para decidir reposição, campanha e atendimento.">
        <div className="grid gap-3 md:grid-cols-3">
          {metricasRelatorioLoja.map((metrica) => (
            <OpcaoMarcavel
              key={metrica.id}
              checked={form.operacao.relatorios.metricas.includes(metrica.id)}
              title={metrica.titulo}
              detail="Aparece nos relatórios da loja."
              onChange={(checked) => alternarMetrica(metrica.id, checked)}
            />
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[.85fr_1.15fr]">
          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Agrupar por</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["produto", "cliente", "hora"] as AgrupamentoRelatorioLoja[]).map((grupo) => (
                <Button
                  key={grupo}
                  type="button"
                  variant={form.operacao.relatorios.agruparPor === grupo ? "default" : "outline"}
                  onClick={() => atualizarOperacao("relatorios", { agruparPor: grupo })}
                >
                  {grupo}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Estados de pedido</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {filtrosPedidoRelatorioLoja.map((estado) => (
                <OpcaoMarcavel
                  key={estado}
                  checked={form.operacao.relatorios.filtrosPedidos.includes(estado)}
                  title={estado}
                  detail="Incluído no painel de leitura."
                  onChange={(checked) => alternarFiltroPedido(estado, checked)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <span className="text-sm font-medium text-foreground">Relatórios prontos</span>
          <div className="grid gap-3 md:grid-cols-2">
            {relatoriosProntosLoja.map((relatorio) => (
              <OpcaoMarcavel
                key={relatorio.id}
                checked={form.operacao.relatorios.relatoriosProntos.includes(relatorio.id)}
                title={relatorio.titulo}
                detail="Fica disponível como leitura rápida da loja."
                onChange={(checked) => alternarRelatorioPronto(relatorio.id, checked)}
              />
            ))}
          </div>
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<Globe2 size={18} />} title="Site, domínio e SEO" detail="Prepare domínio próprio, instruções DNS, título do site, logotipo e categorias de diretório.">
        <div className="grid gap-3 md:grid-cols-2">
          <CampoTexto
            id="dominioPersonalizado"
            label="Domínio personalizado"
            value={form.operacao.siteSeo.dominioPersonalizado ?? ""}
            onChange={(valor) => atualizarOperacao("siteSeo", { dominioPersonalizado: valor })}
          />
          <CampoTexto
            id="tituloSite"
            label="Título do site"
            value={form.operacao.siteSeo.tituloSite ?? ""}
            onChange={(valor) => atualizarOperacao("siteSeo", { tituloSite: valor })}
          />
          <CampoArea
            id="instrucoesDns"
            label="Instruções DNS"
            value={form.operacao.siteSeo.instrucoesDns ?? ""}
            onChange={(valor) => atualizarOperacao("siteSeo", { instrucoesDns: valor })}
            rows={3}
          />
          <CampoArea
            id="categoriasDiretorio"
            label="Categorias de diretório"
            value={formatarListaTexto(form.operacao.siteSeo.categoriasDiretorio)}
            onChange={(valor) => atualizarOperacao("siteSeo", { categoriasDiretorio: parseListaTexto(valor).slice(0, 12) })}
            rows={3}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <OpcaoMarcavel
            checked={form.operacao.siteSeo.uploadLogotipo}
            title="Upload de logotipo"
            detail="A loja usa a imagem enviada no perfil e na prévia pública."
            onChange={(checked) => atualizarOperacao("siteSeo", { uploadLogotipo: checked })}
          />
          <OpcaoMarcavel
            checked={form.operacao.siteSeo.imagemGeradaIa}
            title="Imagem gerada por IA"
            detail="Só ativa quando o dono escolher gerar capa ou imagem auxiliar."
            onChange={(checked) => atualizarOperacao("siteSeo", { imagemGeradaIa: checked })}
          />
        </div>
      </BlocoFormulario>
    </section>
  );
}

function PassoPublicar({
  copiarLink,
  guardarConfiguracao,
  prontaParaPublicar,
  prontidao,
  publicada,
  salvando,
  atualizarSecao,
  urlPublica
}: {
  copiarLink: () => void;
  guardarConfiguracao: (publicar?: boolean) => Promise<void>;
  prontaParaPublicar?: boolean;
  prontidao: ConfiguracaoLojaDigital["prontidao"];
  publicada: boolean;
  salvando: boolean;
  atualizarSecao: <Secao extends keyof FormLoja>(secao: Secao, valores: Partial<FormLoja[Secao]>) => void;
  urlPublica: string;
}) {
  const pronto = prontaParaPublicar ?? prontidao.prontaParaPublicar;

  return (
    <section className="grid gap-5">
      <BlocoFormulario icon={<ClipboardCheck size={18} />} title="Checklist final" detail="A loja deve sair do rascunho quando compra, entrega e pagamento estiverem claros.">
        <div className="grid gap-2">
          {prontidao.pendencias.length ? (
            prontidao.pendencias.map((pendencia) => <StatusLinha key={pendencia} pronto={false} texto={pendencia} />)
          ) : (
            <>
              <StatusLinha pronto texto="Link público definido." />
              <StatusLinha pronto texto="Canal de compra configurado." />
              <StatusLinha pronto texto="Catálogo com produtos vendáveis." />
              <StatusLinha pronto texto="Métodos de pagamento configurados." />
            </>
          )}
        </div>
      </BlocoFormulario>

      <BlocoFormulario icon={<Globe2 size={18} />} title="Publicação" detail="A publicação fica ligada ao tracking e pode ser pausada sem apagar a configuração.">
        <OpcaoMarcavel
          checked={publicada}
          title="Loja online"
          detail={publicada ? "Clientes conseguem aceder ao link." : "Configuração guardada sem abrir a loja."}
          onChange={(checked) => atualizarSecao("publicacao", { publicada: checked })}
        />

        {urlPublica ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/40 p-3">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{urlPublica}</span>
            <Button variant="outline" size="sm" onClick={copiarLink}>
              <Copy size={14} />
              Copiar
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={urlPublica} target="_blank" rel="noreferrer">
                <ArrowUpRight size={14} />
                Abrir
              </a>
            </Button>
          </div>
        ) : (
          <EstadoVazio icone={<Link2 />} titulo="Link por definir" detalhe="Volte a Identidade e defina o slug público." />
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void guardarConfiguracao(true)} disabled={!pronto || salvando}>
            {salvando ? <Loader2 className="animate-spin" size={16} /> : <Globe2 size={16} />}
            Publicar agora
          </Button>
          <Button variant="outline" onClick={() => void guardarConfiguracao(false)} disabled={salvando}>
            Guardar rascunho
          </Button>
        </div>
      </BlocoFormulario>
    </section>
  );
}

function PreviewLojaMobile({
  compacta = false,
  form,
  produtos,
  urlPublica
}: {
  compacta?: boolean;
  form: FormLoja;
  produtos: Peca[];
  urlPublica: string;
}) {
  const cor = form.tema.corPrimaria || "#111111";
  return (
    <div className={compacta ? "hidden lg:block" : ""}>
      <div className="mx-auto w-full max-w-[20rem] rounded-[2rem] border border-neutral-900 bg-neutral-950 p-2 shadow-sm">
        <div className="overflow-hidden rounded-[1.5rem] bg-white text-neutral-950">
          <div className="relative h-28 bg-neutral-100">
            {form.tema.capaUrl ? (
              <img src={form.tema.capaUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${cor}, #f4f4f5)` }} />
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="grid size-12 place-items-center overflow-hidden rounded-xl border border-white/70 bg-white shadow-sm">
                {form.tema.logoUrl ? <img src={form.tema.logoUrl} alt="" className="h-full w-full object-cover" /> : <Store size={20} />}
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm">{form.identidade.nomeComercial || "A tua loja"}</strong>
                <span className="block truncate text-xs text-neutral-600">{form.identidade.municipio || form.identidade.provincia || "Online"}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-3">
            <p className="line-clamp-2 text-xs text-neutral-600">
              {form.identidade.descricaoPublica || "Produtos selecionados, checkout simples e atendimento pelo WhatsApp."}
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniPreview label="Entrega" value={form.entrega.entregaAtiva ? formatarKwanza(form.entrega.taxaPadraoEmKwanza || 0) : "Off"} />
              <MiniPreview label="Prazo" value={form.entrega.prazoPadrao || "A combinar"} />
              <MiniPreview label="WhatsApp" value={form.identidade.whatsapp ? "Ativo" : "Pendente"} />
            </div>

            <div className="grid gap-2">
              {(produtos.length ? produtos : []).slice(0, 3).map((peca) => (
                <div key={peca.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2 rounded-xl border border-neutral-200 p-2">
                  <div className="overflow-hidden rounded-lg bg-neutral-100">
                    {peca.fotos?.[0] ? <img src={resolverUrlMedia(peca.fotos[0])} alt="" className="size-11 object-cover" /> : <div className="grid size-11 place-items-center"><Package size={16} /></div>}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-xs">{peca.nome}</strong>
                    <span className="block text-xs text-neutral-500">{formatarKwanza(peca.precoEmKwanza)}</span>
                    <span className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.62rem] text-white" style={{ backgroundColor: cor }}>Comprar</span>
                  </div>
                </div>
              ))}
              {!produtos.length && (
                <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">
                  Produtos aparecem aqui quando estiverem vendáveis.
                </div>
              )}
            </div>

            <div className="rounded-xl px-3 py-2 text-center text-xs font-semibold text-white" style={{ backgroundColor: cor }}>
              {urlPublica ? "Ver loja publicada" : "Prévia interna"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-100 px-1.5 py-2">
      <span className="block truncate text-[0.62rem] text-neutral-500">{label}</span>
      <strong className="block truncate text-[0.68rem]">{value}</strong>
    </div>
  );
}

function BlocoFormulario({
  children,
  detail,
  icon,
  title
}: {
  children: ReactNode;
  detail: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-4 rounded-xl border border-border/60 bg-card p-4">
      <header className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-muted text-foreground">{icon}</span>
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </header>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function CampoTexto({
  id,
  label,
  onChange,
  prefixo,
  sufixo,
  value
}: {
  id: string;
  label: string;
  onChange: (valor: string) => void;
  prefixo?: string;
  sufixo?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={id}>
      {label}
      <div className="flex overflow-hidden rounded-lg border border-input bg-background focus-within:ring-3 focus-within:ring-ring/30">
        {prefixo && <span className="hidden items-center border-r bg-muted px-3 text-xs text-muted-foreground sm:flex">{prefixo}</span>}
        <Input
          id={id}
          value={value}
          onChange={(evento) => onChange(evento.target.value)}
          className="border-0 focus-visible:ring-0"
        />
        {sufixo && <span className="hidden items-center border-l bg-muted px-3 text-xs text-muted-foreground sm:flex">{sufixo}</span>}
      </div>
    </label>
  );
}

function CampoNumero({
  id,
  label,
  onChange,
  value
}: {
  id: string;
  label: string;
  onChange: (valor: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={id}>
      {label}
      <Input
        id={id}
        min={0}
        type="number"
        value={value}
        onChange={(evento) => onChange(Number(evento.target.value))}
      />
    </label>
  );
}

function CampoArea({
  id,
  label,
  onChange,
  rows,
  value
}: {
  id: string;
  label: string;
  onChange: (valor: string) => void;
  rows: number;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={id}>
      {label}
      <Textarea id={id} value={value} onChange={(evento) => onChange(evento.target.value)} rows={rows} />
    </label>
  );
}

function OpcaoMarcavel({
  checked,
  detail,
  onChange,
  title
}: {
  checked: boolean;
  detail: string;
  onChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${checked ? "border-foreground bg-foreground text-background" : "border-border/70 bg-background hover:bg-muted/60"}`}>
      <Checkbox checked={checked} onCheckedChange={(valor) => onChange(valor === true)} className={checked ? "border-background data-checked:bg-background data-checked:text-foreground" : ""} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className={`block text-xs leading-5 ${checked ? "text-background/70" : "text-muted-foreground"}`}>{detail}</span>
      </span>
    </label>
  );
}

function ResumoCompacto({
  detalhe,
  titulo,
  tom,
  valor
}: {
  detalhe: string;
  titulo: string;
  tom: "neutro" | "principal" | "sucesso" | "atencao" | "perigo";
  valor: ReactNode;
}) {
  const classes = {
    neutro: "border-border/60 bg-background text-muted-foreground",
    principal: "border-primary/20 bg-primary/5 text-primary",
    sucesso: "border-success/20 bg-success/5 text-success",
    atencao: "border-warning/20 bg-warning/5 text-warning",
    perigo: "border-destructive/20 bg-destructive/5 text-destructive"
  } satisfies Record<typeof tom, string>;

  return (
    <div className={`rounded-lg border p-3 ${classes[tom]}`}>
      <span className="block text-xs font-medium opacity-80">{titulo}</span>
      <strong className="mt-1 block truncate text-xl font-semibold tabular-nums text-foreground">{valor}</strong>
      <small className="mt-1 block truncate text-xs opacity-80">{detalhe}</small>
    </div>
  );
}

function StatusLinha({ pronto, texto }: { pronto: boolean; texto: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
      {pronto ? <CheckCircle2 className="text-success" size={16} /> : <XCircle className="text-warning" size={16} />}
      <span className="min-w-0 flex-1 text-foreground">{texto}</span>
    </div>
  );
}

function AtalhoOperacional({
  detail,
  icon,
  title,
  to
}: {
  detail: string;
  icon: ReactNode;
  title: string;
  to: string;
}) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 transition-colors hover:border-foreground/40 hover:bg-muted/50">
      <span className="grid size-9 place-items-center rounded-lg bg-muted text-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="text-muted-foreground transition-transform group-hover:translate-x-0.5" size={16} />
    </Link>
  );
}

function criarFormVazio(): FormLoja {
  return {
    identidade: {
      nomeComercial: "",
      telefone: "",
      whatsapp: "",
      email: "",
      provincia: "",
      municipio: "",
      endereco: "",
      descricaoPublica: ""
    },
    publicacao: {
      slug: "",
      descricaoPublica: "",
      publicada: false
    },
    tema: {
      corPrimaria: "#111111",
      logoUrl: "",
      capaUrl: ""
    },
    entrega: {
      entregaAtiva: true,
      retiradaAtiva: false,
      consumoLocalAtivo: false,
      taxaPadraoEmKwanza: 0,
      entregaGratisAcimaDeKwanza: "",
      prazoPadrao: "",
      enderecoRetirada: "",
      instrucoesEntrega: ""
    },
    pagamentos: {
      metodosPagamento: [],
      instrucoesCobranca: "",
      mensagemComprovativoPendente: "",
      mensagemPagamentoConfirmado: ""
    },
    experiencia: {
      modoNegocio: "auto",
      ordemVitrines: vitrinesEditaveis.map((vitrine) => vitrine.id),
      catalogosEditaveis: true,
      leadCaptureAtivo: true,
      leadCaptureTitulo: "Receba novidades, reposições e disponibilidade pelo WhatsApp.",
      cupomDestaque: "",
      politicaTroca: "",
      politicaEntrega: "",
      politicaPrivacidade: "",
      catalogosPersonalizadosTexto: "",
      tabelaMedidasTexto: ""
    },
    operacao: clonarOperacaoLoja(operacaoLojaDigital)
  };
}

function criarFormAPartirConfiguracao(dados: ConfiguracaoLojaDigital): FormLoja {
  return {
    identidade: {
      nomeComercial: dados.configuracao.identidade.nomeComercial ?? "",
      telefone: dados.configuracao.identidade.telefone ?? "",
      whatsapp: dados.configuracao.identidade.whatsapp ?? "",
      email: dados.configuracao.identidade.email ?? "",
      provincia: dados.configuracao.identidade.provincia ?? "",
      municipio: dados.configuracao.identidade.municipio ?? "",
      endereco: dados.configuracao.identidade.endereco ?? "",
      descricaoPublica: dados.configuracao.identidade.descricaoPublica ?? ""
    },
    publicacao: {
      slug: dados.configuracao.publicacao.slug ?? "",
      descricaoPublica: dados.configuracao.publicacao.descricaoPublica ?? dados.configuracao.identidade.descricaoPublica ?? "",
      publicada: dados.configuracao.publicacao.publicada
    },
    tema: {
      corPrimaria: dados.configuracao.tema.corPrimaria || "#111111",
      logoUrl: dados.configuracao.tema.logoUrl ?? "",
      capaUrl: dados.configuracao.tema.capaUrl ?? ""
    },
    entrega: {
      entregaAtiva: dados.configuracao.entrega.entregaAtiva,
      retiradaAtiva: dados.configuracao.entrega.retiradaAtiva,
      consumoLocalAtivo: dados.configuracao.entrega.consumoLocalAtivo,
      taxaPadraoEmKwanza: dados.configuracao.entrega.taxaPadraoEmKwanza,
      entregaGratisAcimaDeKwanza: dados.configuracao.entrega.entregaGratisAcimaDeKwanza?.toString() ?? "",
      prazoPadrao: dados.configuracao.entrega.prazoPadrao ?? "",
      enderecoRetirada: dados.configuracao.entrega.enderecoRetirada ?? "",
      instrucoesEntrega: dados.configuracao.entrega.instrucoesEntrega ?? ""
    },
    pagamentos: {
      metodosPagamento: dados.configuracao.pagamentos.metodosPagamento ?? [],
      instrucoesCobranca: dados.configuracao.pagamentos.instrucoesCobranca ?? "",
      mensagemComprovativoPendente: dados.configuracao.pagamentos.mensagemComprovativoPendente ?? "",
      mensagemPagamentoConfirmado: dados.configuracao.pagamentos.mensagemPagamentoConfirmado ?? ""
    },
    experiencia: {
      modoNegocio: dados.configuracao.experiencia?.modoNegocio ?? "auto",
      ordemVitrines: dados.configuracao.experiencia?.ordemVitrines?.length
        ? dados.configuracao.experiencia.ordemVitrines
        : vitrinesEditaveis.map((vitrine) => vitrine.id),
      catalogosEditaveis: dados.configuracao.experiencia?.catalogosEditaveis ?? true,
      leadCaptureAtivo: dados.configuracao.experiencia?.leadCaptureAtivo ?? true,
      leadCaptureTitulo: dados.configuracao.experiencia?.leadCaptureTitulo ?? "",
      cupomDestaque: dados.configuracao.experiencia?.cupomDestaque ?? "",
      politicaTroca: dados.configuracao.experiencia?.politicaTroca ?? "",
      politicaEntrega: dados.configuracao.experiencia?.politicaEntrega ?? "",
      politicaPrivacidade: dados.configuracao.experiencia?.politicaPrivacidade ?? "",
      catalogosPersonalizadosTexto: formatarCatalogosPersonalizadosTexto(dados.configuracao.experiencia?.catalogosPersonalizados ?? []),
      tabelaMedidasTexto: formatarTabelaMedidasTexto(dados.configuracao.experiencia?.tabelaMedidas ?? [])
    },
    operacao: normalizarOperacaoLoja(dados.configuracao.experiencia?.operacao)
  };
}

function criarPayloadConfiguracao(form: FormLoja) {
  return {
    slug: form.publicacao.slug || undefined,
    descricaoPublica: textoOuNull(form.publicacao.descricaoPublica || form.identidade.descricaoPublica),
    publicada: form.publicacao.publicada,
    criacao: {
      confirmar: true
    },
    identidade: {
      nomeComercial: textoOuUndefined(form.identidade.nomeComercial),
      telefone: textoOuNull(form.identidade.telefone),
      whatsapp: textoOuNull(form.identidade.whatsapp),
      email: textoOuNull(form.identidade.email),
      provincia: textoOuNull(form.identidade.provincia),
      municipio: textoOuNull(form.identidade.municipio),
      endereco: textoOuNull(form.identidade.endereco),
      descricaoPublica: textoOuNull(form.identidade.descricaoPublica)
    },
    publicacao: {
      slug: form.publicacao.slug || undefined,
      descricaoPublica: textoOuNull(form.publicacao.descricaoPublica || form.identidade.descricaoPublica),
      publicada: form.publicacao.publicada
    },
    tema: {
      corPrimaria: form.tema.corPrimaria,
      logoUrl: textoOuNull(form.tema.logoUrl),
      capaUrl: textoOuNull(form.tema.capaUrl)
    },
    entrega: {
      entregaAtiva: form.entrega.entregaAtiva,
      retiradaAtiva: form.entrega.retiradaAtiva,
      consumoLocalAtivo: form.entrega.consumoLocalAtivo,
      taxaPadraoEmKwanza: form.entrega.taxaPadraoEmKwanza,
      entregaGratisAcimaDeKwanza: form.entrega.entregaGratisAcimaDeKwanza.trim()
        ? Number(form.entrega.entregaGratisAcimaDeKwanza)
        : null,
      prazoPadrao: textoOuNull(form.entrega.prazoPadrao),
      enderecoRetirada: textoOuNull(form.entrega.enderecoRetirada),
      instrucoesEntrega: textoOuNull(form.entrega.instrucoesEntrega)
    },
    pagamentos: {
      metodosPagamento: form.pagamentos.metodosPagamento,
      instrucoesCobranca: textoOuNull(form.pagamentos.instrucoesCobranca),
      mensagemComprovativoPendente: textoOuNull(form.pagamentos.mensagemComprovativoPendente),
      mensagemPagamentoConfirmado: textoOuNull(form.pagamentos.mensagemPagamentoConfirmado)
    },
    experiencia: {
      modoNegocio: form.experiencia.modoNegocio,
      ordemVitrines: form.experiencia.ordemVitrines,
      catalogosEditaveis: form.experiencia.catalogosEditaveis,
      leadCaptureAtivo: form.experiencia.leadCaptureAtivo,
      leadCaptureTitulo: textoOuNull(form.experiencia.leadCaptureTitulo),
      cupomDestaque: textoOuNull(form.experiencia.cupomDestaque),
      politicaTroca: textoOuNull(form.experiencia.politicaTroca),
      politicaEntrega: textoOuNull(form.experiencia.politicaEntrega),
      politicaPrivacidade: textoOuNull(form.experiencia.politicaPrivacidade),
      catalogosPersonalizados: parseCatalogosPersonalizadosTexto(form.experiencia.catalogosPersonalizadosTexto),
      operacao: criarPayloadOperacaoLoja(form.operacao),
      tabelaMedidas: parseTabelaMedidasTexto(form.experiencia.tabelaMedidasTexto)
    }
  };
}

function criarPayloadOperacaoLoja(operacao: OperacaoLojaDigital): OperacaoLojaDigital {
  return {
    plano: {
      planoAtual: textoOuNull(operacao.plano.planoAtual) ?? "starter",
      recursosBloqueados: [...new Set(operacao.plano.recursosBloqueados)].slice(0, 40),
      quotas: {
        encomendasMensais: Math.max(0, Math.round(Number(operacao.plano.quotas.encomendasMensais) || 0)),
        imagens: Math.max(0, Math.round(Number(operacao.plano.quotas.imagens) || 0)),
        whatsapp: Math.max(0, Math.round(Number(operacao.plano.quotas.whatsapp) || 0)),
        email: Math.max(0, Math.round(Number(operacao.plano.quotas.email) || 0))
      },
      upgradeContextual: operacao.plano.upgradeContextual
    },
    checkout: {
      ...operacao.checkout,
      entradaPercentual: Math.min(100, Math.max(0, Number(operacao.checkout.entradaPercentual) || 0)),
      taxaServicoPercentual: Math.min(100, Math.max(0, Number(operacao.checkout.taxaServicoPercentual) || 0)),
      taxaServicoFixaEmKwanza: Math.max(0, Math.round(Number(operacao.checkout.taxaServicoFixaEmKwanza) || 0)),
      prefixoPedido: textoOuNull(operacao.checkout.prefixoPedido ?? ""),
      sufixoPedido: textoOuNull(operacao.checkout.sufixoPedido ?? "")
    },
    pagamentos: {
      ...operacao.pagamentos,
      instrucoesPagamento: textoOuNull(operacao.pagamentos.instrucoesPagamento ?? "")
    },
    entrega: {
      gerirDisponibilidade: operacao.entrega.gerirDisponibilidade,
      adicionarMetodoEntrega: operacao.entrega.adicionarMetodoEntrega,
      disponibilidadeSemanal: [...new Set(operacao.entrega.disponibilidadeSemanal)].slice(0, 21),
      zonas: operacao.entrega.zonas
        .filter((zona) => zona.nome.trim())
        .map((zona) => ({
          nome: zona.nome.trim(),
          precoEmKwanza: Math.max(0, Math.round(Number(zona.precoEmKwanza) || 0)),
          prazo: textoOuNull(zona.prazo ?? "")
        }))
        .slice(0, 60)
    },
    fidelizacao: {
      ...operacao.fidelizacao,
      cupomBoasVindas: textoOuNull(operacao.fidelizacao.cupomBoasVindas ?? "")
    },
    automacoes: { ...operacao.automacoes },
    canais: { ...operacao.canais },
    catalogo: {
      categoriasVisiveis: [...new Set(operacao.catalogo.categoriasVisiveis)].slice(0, 60),
      categoriasOcultas: [...new Set(operacao.catalogo.categoriasOcultas)].slice(0, 60),
      sequenciaCategorias: [...new Set(operacao.catalogo.sequenciaCategorias)].slice(0, 60),
      descontosAtivos: operacao.catalogo.descontosAtivos,
      produtosPorColecao: operacao.catalogo.produtosPorColecao,
      produtosComEstatisticas: operacao.catalogo.produtosComEstatisticas
    },
    clientes: {
      ...operacao.clientes,
      filtrosInteligentes: [...new Set(operacao.clientes.filtrosInteligentes)].slice(0, 20)
    },
    encomendas: {
      ...operacao.encomendas,
      colunasOperacionais: [...new Set(operacao.encomendas.colunasOperacionais)].slice(0, 30)
    },
    relatorios: {
      metricas: [...new Set(operacao.relatorios.metricas)].slice(0, 12),
      agruparPor: operacao.relatorios.agruparPor,
      filtrosPedidos: [...new Set(operacao.relatorios.filtrosPedidos)].slice(0, 12),
      relatoriosProntos: [...new Set(operacao.relatorios.relatoriosProntos)].slice(0, 40)
    },
    siteSeo: {
      dominioPersonalizado: textoOuNull(operacao.siteSeo.dominioPersonalizado ?? ""),
      instrucoesDns: textoOuNull(operacao.siteSeo.instrucoesDns ?? ""),
      tituloSite: textoOuNull(operacao.siteSeo.tituloSite ?? ""),
      uploadLogotipo: operacao.siteSeo.uploadLogotipo,
      imagemGeradaIa: operacao.siteSeo.imagemGeradaIa,
      categoriasDiretorio: [...new Set(operacao.siteSeo.categoriasDiretorio)].slice(0, 12)
    }
  };
}

function clonarOperacaoLoja(operacao: OperacaoLojaDigital): OperacaoLojaDigital {
  return {
    plano: {
      ...operacao.plano,
      recursosBloqueados: [...operacao.plano.recursosBloqueados],
      quotas: { ...operacao.plano.quotas }
    },
    checkout: { ...operacao.checkout },
    pagamentos: { ...operacao.pagamentos },
    entrega: {
      ...operacao.entrega,
      disponibilidadeSemanal: [...operacao.entrega.disponibilidadeSemanal],
      zonas: operacao.entrega.zonas.map((zona) => ({ ...zona }))
    },
    fidelizacao: { ...operacao.fidelizacao },
    automacoes: { ...operacao.automacoes },
    canais: { ...operacao.canais },
    catalogo: {
      ...operacao.catalogo,
      categoriasVisiveis: [...operacao.catalogo.categoriasVisiveis],
      categoriasOcultas: [...operacao.catalogo.categoriasOcultas],
      sequenciaCategorias: [...operacao.catalogo.sequenciaCategorias]
    },
    clientes: {
      ...operacao.clientes,
      filtrosInteligentes: [...operacao.clientes.filtrosInteligentes]
    },
    encomendas: {
      ...operacao.encomendas,
      colunasOperacionais: [...operacao.encomendas.colunasOperacionais]
    },
    relatorios: {
      ...operacao.relatorios,
      metricas: [...operacao.relatorios.metricas],
      filtrosPedidos: [...operacao.relatorios.filtrosPedidos],
      relatoriosProntos: [...operacao.relatorios.relatoriosProntos]
    },
    siteSeo: {
      ...operacao.siteSeo,
      categoriasDiretorio: [...operacao.siteSeo.categoriasDiretorio]
    }
  };
}

function normalizarOperacaoLoja(valor: unknown): OperacaoLojaDigital {
  const base = clonarOperacaoLoja(operacaoLojaDigital);
  const dados = objetoFormulario(valor);
  const plano = objetoFormulario(dados.plano);
  const quotas = objetoFormulario(plano.quotas);
  const checkout = objetoFormulario(dados.checkout);
  const pagamentos = objetoFormulario(dados.pagamentos);
  const entrega = objetoFormulario(dados.entrega);
  const fidelizacao = objetoFormulario(dados.fidelizacao);
  const automacoes = objetoFormulario(dados.automacoes);
  const canais = objetoFormulario(dados.canais);
  const catalogo = objetoFormulario(dados.catalogo);
  const clientes = objetoFormulario(dados.clientes);
  const encomendas = objetoFormulario(dados.encomendas);
  const relatorios = objetoFormulario(dados.relatorios);
  const siteSeo = objetoFormulario(dados.siteSeo);
  const acesso = ["aberto", "telefone", "login", "membros"].includes(String(fidelizacao.acessoLoja ?? ""))
    ? fidelizacao.acessoLoja as AcessoLojaDigital
    : base.fidelizacao.acessoLoja;
  const agrupamento = ["hora", "produto", "cliente"].includes(String(relatorios.agruparPor ?? ""))
    ? relatorios.agruparPor as AgrupamentoRelatorioLoja
    : base.relatorios.agruparPor;

  return {
    plano: {
      planoAtual: textoFormulario(plano.planoAtual) ?? base.plano.planoAtual,
      recursosBloqueados: listaTextosFormulario(plano.recursosBloqueados, base.plano.recursosBloqueados).slice(0, 40),
      quotas: {
        encomendasMensais: Math.max(0, Math.round(numeroFormulario(quotas.encomendasMensais, base.plano.quotas.encomendasMensais))),
        imagens: Math.max(0, Math.round(numeroFormulario(quotas.imagens, base.plano.quotas.imagens))),
        whatsapp: Math.max(0, Math.round(numeroFormulario(quotas.whatsapp, base.plano.quotas.whatsapp))),
        email: Math.max(0, Math.round(numeroFormulario(quotas.email, base.plano.quotas.email)))
      },
      upgradeContextual: booleanoFormulario(plano.upgradeContextual, base.plano.upgradeContextual)
    },
    checkout: {
      ignorarPaginaPagamento: booleanoFormulario(checkout.ignorarPaginaPagamento, base.checkout.ignorarPaginaPagamento),
      manterRascunhoAtePago: booleanoFormulario(checkout.manterRascunhoAtePago, base.checkout.manterRascunhoAtePago),
      confirmacaoAutomaticaPagamento: booleanoFormulario(checkout.confirmacaoAutomaticaPagamento, base.checkout.confirmacaoAutomaticaPagamento),
      entradaAtiva: booleanoFormulario(checkout.entradaAtiva, base.checkout.entradaAtiva),
      entradaPercentual: limitarNumeroFormulario(checkout.entradaPercentual, 0, 100, base.checkout.entradaPercentual),
      taxaServicoPercentual: limitarNumeroFormulario(checkout.taxaServicoPercentual, 0, 100, base.checkout.taxaServicoPercentual),
      taxaServicoFixaEmKwanza: Math.max(0, Math.round(numeroFormulario(checkout.taxaServicoFixaEmKwanza, base.checkout.taxaServicoFixaEmKwanza))),
      prefixoPedido: textoFormulario(checkout.prefixoPedido) ?? base.checkout.prefixoPedido,
      sufixoPedido: textoFormulario(checkout.sufixoPedido) ?? base.checkout.sufixoPedido,
      exigirTelefoneCheckout: booleanoFormulario(checkout.exigirTelefoneCheckout, base.checkout.exigirTelefoneCheckout),
      exigirLoginCheckout: booleanoFormulario(checkout.exigirLoginCheckout, base.checkout.exigirLoginCheckout),
      mostrarNumeroEncomendaNaMensagem: booleanoFormulario(checkout.mostrarNumeroEncomendaNaMensagem, base.checkout.mostrarNumeroEncomendaNaMensagem)
    },
    pagamentos: {
      dinheiroEntrega: booleanoFormulario(pagamentos.dinheiroEntrega, base.pagamentos.dinheiroEntrega),
      transferenciaBancaria: booleanoFormulario(pagamentos.transferenciaBancaria, base.pagamentos.transferenciaBancaria),
      cartaoAdyen: booleanoFormulario(pagamentos.cartaoAdyen, base.pagamentos.cartaoAdyen),
      paypal: booleanoFormulario(pagamentos.paypal, base.pagamentos.paypal),
      pagamentoPersonalizado: booleanoFormulario(pagamentos.pagamentoPersonalizado, base.pagamentos.pagamentoPersonalizado),
      pagamentoComInstrucoes: booleanoFormulario(pagamentos.pagamentoComInstrucoes, base.pagamentos.pagamentoComInstrucoes),
      creditoLoja: booleanoFormulario(pagamentos.creditoLoja, base.pagamentos.creditoLoja),
      instrucoesPagamento: textoFormulario(pagamentos.instrucoesPagamento) ?? base.pagamentos.instrucoesPagamento
    },
    entrega: {
      gerirDisponibilidade: booleanoFormulario(entrega.gerirDisponibilidade, base.entrega.gerirDisponibilidade),
      adicionarMetodoEntrega: booleanoFormulario(entrega.adicionarMetodoEntrega, base.entrega.adicionarMetodoEntrega),
      disponibilidadeSemanal: listaTextosFormulario(entrega.disponibilidadeSemanal, base.entrega.disponibilidadeSemanal).slice(0, 21),
      zonas: normalizarZonasEntregaFormulario(entrega.zonas, base.entrega.zonas)
    },
    fidelizacao: {
      acessoLoja: acesso,
      ofertaBoasVindasAtiva: booleanoFormulario(fidelizacao.ofertaBoasVindasAtiva, base.fidelizacao.ofertaBoasVindasAtiva),
      cupomBoasVindas: textoFormulario(fidelizacao.cupomBoasVindas) ?? base.fidelizacao.cupomBoasVindas,
      recompensasAtivas: booleanoFormulario(fidelizacao.recompensasAtivas, base.fidelizacao.recompensasAtivas),
      recompensasIndicacaoAtivas: booleanoFormulario(fidelizacao.recompensasIndicacaoAtivas, base.fidelizacao.recompensasIndicacaoAtivas),
      creditoLojaAtivo: booleanoFormulario(fidelizacao.creditoLojaAtivo, base.fidelizacao.creditoLojaAtivo)
    },
    automacoes: {
      perfilCliente: booleanoFormulario(automacoes.perfilCliente, base.automacoes.perfilCliente),
      carrinhoAbandonado: booleanoFormulario(automacoes.carrinhoAbandonado, base.automacoes.carrinhoAbandonado),
      pedidoAvaliacao: booleanoFormulario(automacoes.pedidoAvaliacao, base.automacoes.pedidoAvaliacao),
      avaliacaoRecebida: booleanoFormulario(automacoes.avaliacaoRecebida, base.automacoes.avaliacaoRecebida),
      pedidoNovamente: booleanoFormulario(automacoes.pedidoNovamente, base.automacoes.pedidoNovamente),
      aniversarioCliente: booleanoFormulario(automacoes.aniversarioCliente, base.automacoes.aniversarioCliente),
      pagamentoPendente: booleanoFormulario(automacoes.pagamentoPendente, base.automacoes.pagamentoPendente),
      pagamentoConfirmado: booleanoFormulario(automacoes.pagamentoConfirmado, base.automacoes.pagamentoConfirmado),
      creditoAtualizado: booleanoFormulario(automacoes.creditoAtualizado, base.automacoes.creditoAtualizado),
      creditoReembolsado: booleanoFormulario(automacoes.creditoReembolsado, base.automacoes.creditoReembolsado),
      pedidoSaiuEntrega: booleanoFormulario(automacoes.pedidoSaiuEntrega, base.automacoes.pedidoSaiuEntrega),
      pedidoCancelado: booleanoFormulario(automacoes.pedidoCancelado, base.automacoes.pedidoCancelado),
      produtoDigitalConfirmado: booleanoFormulario(automacoes.produtoDigitalConfirmado, base.automacoes.produtoDigitalConfirmado),
      operacaoInternaPedidoCriado: booleanoFormulario(automacoes.operacaoInternaPedidoCriado, base.automacoes.operacaoInternaPedidoCriado)
    },
    canais: {
      site: booleanoFormulario(canais.site, base.canais.site),
      whatsapp: booleanoFormulario(canais.whatsapp, base.canais.whatsapp),
      instagram: booleanoFormulario(canais.instagram, base.canais.instagram),
      google: booleanoFormulario(canais.google, base.canais.google),
      pos: booleanoFormulario(canais.pos, base.canais.pos),
      transmissoes: booleanoFormulario(canais.transmissoes, base.canais.transmissoes),
      chatbot: booleanoFormulario(canais.chatbot, base.canais.chatbot),
      appMovelQr: booleanoFormulario(canais.appMovelQr, base.canais.appMovelQr),
      caixaEntradaUnificada: booleanoFormulario(canais.caixaEntradaUnificada, base.canais.caixaEntradaUnificada),
      broadcasts: booleanoFormulario(canais.broadcasts, base.canais.broadcasts)
    },
    catalogo: {
      categoriasVisiveis: listaTextosFormulario(catalogo.categoriasVisiveis, base.catalogo.categoriasVisiveis).slice(0, 60),
      categoriasOcultas: listaTextosFormulario(catalogo.categoriasOcultas, base.catalogo.categoriasOcultas).slice(0, 60),
      sequenciaCategorias: listaTextosFormulario(catalogo.sequenciaCategorias, base.catalogo.sequenciaCategorias).slice(0, 60),
      descontosAtivos: booleanoFormulario(catalogo.descontosAtivos, base.catalogo.descontosAtivos),
      produtosPorColecao: booleanoFormulario(catalogo.produtosPorColecao, base.catalogo.produtosPorColecao),
      produtosComEstatisticas: booleanoFormulario(catalogo.produtosComEstatisticas, base.catalogo.produtosComEstatisticas)
    },
    clientes: {
      importar: booleanoFormulario(clientes.importar, base.clientes.importar),
      exportar: booleanoFormulario(clientes.exportar, base.clientes.exportar),
      edicaoMassa: booleanoFormulario(clientes.edicaoMassa, base.clientes.edicaoMassa),
      adicionarManual: booleanoFormulario(clientes.adicionarManual, base.clientes.adicionarManual),
      pesquisaAvancada: booleanoFormulario(clientes.pesquisaAvancada, base.clientes.pesquisaAvancada),
      filtrosInteligentes: listaTextosFormulario(clientes.filtrosInteligentes, base.clientes.filtrosInteligentes).slice(0, 20),
      transmissaoFiltrada: booleanoFormulario(clientes.transmissaoFiltrada, base.clientes.transmissaoFiltrada)
    },
    encomendas: {
      criarManual: booleanoFormulario(encomendas.criarManual, base.encomendas.criarManual),
      exportar: booleanoFormulario(encomendas.exportar, base.encomendas.exportar),
      resumoAtivo: booleanoFormulario(encomendas.resumoAtivo, base.encomendas.resumoAtivo),
      rascunhos: booleanoFormulario(encomendas.rascunhos, base.encomendas.rascunhos),
      pagamentos: booleanoFormulario(encomendas.pagamentos, base.encomendas.pagamentos),
      calendario: booleanoFormulario(encomendas.calendario, base.encomendas.calendario),
      colunasOperacionais: listaTextosFormulario(encomendas.colunasOperacionais, base.encomendas.colunasOperacionais).slice(0, 30)
    },
    relatorios: {
      metricas: listaTextosFormulario(relatorios.metricas, base.relatorios.metricas).slice(0, 12),
      agruparPor: agrupamento,
      filtrosPedidos: listaTextosFormulario(relatorios.filtrosPedidos, base.relatorios.filtrosPedidos).slice(0, 12),
      relatoriosProntos: listaTextosFormulario(relatorios.relatoriosProntos, base.relatorios.relatoriosProntos).slice(0, 40)
    },
    siteSeo: {
      dominioPersonalizado: textoFormulario(siteSeo.dominioPersonalizado) ?? base.siteSeo.dominioPersonalizado,
      instrucoesDns: textoFormulario(siteSeo.instrucoesDns) ?? base.siteSeo.instrucoesDns,
      tituloSite: textoFormulario(siteSeo.tituloSite) ?? base.siteSeo.tituloSite,
      uploadLogotipo: booleanoFormulario(siteSeo.uploadLogotipo, base.siteSeo.uploadLogotipo),
      imagemGeradaIa: booleanoFormulario(siteSeo.imagemGeradaIa, base.siteSeo.imagemGeradaIa),
      categoriasDiretorio: listaTextosFormulario(siteSeo.categoriasDiretorio, base.siteSeo.categoriasDiretorio).slice(0, 12)
    }
  };
}

function normalizarZonasEntregaFormulario(valor: unknown, padrao: ZonaEntregaOperacaoLoja[]): ZonaEntregaOperacaoLoja[] {
  if (!Array.isArray(valor)) return padrao.map((zona) => ({ ...zona }));
  const zonas = valor
    .map((item) => objetoFormulario(item))
    .map((item) => ({
      nome: textoFormulario(item.nome) ?? "",
      precoEmKwanza: Math.max(0, Math.round(numeroFormulario(item.precoEmKwanza, 0))),
      prazo: textoFormulario(item.prazo)
    }))
    .filter((zona) => zona.nome)
    .slice(0, 60);
  return zonas.length ? zonas : padrao.map((zona) => ({ ...zona }));
}

function objetoFormulario(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function textoFormulario(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function booleanoFormulario(valor: unknown, padrao: boolean): boolean {
  return typeof valor === "boolean" ? valor : padrao;
}

function numeroFormulario(valor: unknown, padrao: number): number {
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function limitarNumeroFormulario(valor: unknown, minimo: number, maximo: number, padrao: number): number {
  return Math.min(maximo, Math.max(minimo, numeroFormulario(valor, padrao)));
}

function listaTextosFormulario(valor: unknown, padrao: string[]): string[] {
  if (!Array.isArray(valor)) return [...padrao];
  const textos = valor.map((item) => textoFormulario(item)).filter((item): item is string => Boolean(item));
  return textos.length ? [...new Set(textos)] : [...padrao];
}

function formatarListaTexto(lista: string[]): string {
  return lista.join("\n");
}

function parseListaTexto(texto: string): string[] {
  return texto
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, indice, lista) => lista.indexOf(item) === indice);
}

function formatarZonasEntregaTexto(zonas: ZonaEntregaOperacaoLoja[]): string {
  return zonas
    .map((zona) => [zona.nome, zona.precoEmKwanza, zona.prazo ?? ""].join(" | ").replace(/(\s\|\s)+$/g, ""))
    .join("\n");
}

function parseZonasEntregaTexto(texto: string): ZonaEntregaOperacaoLoja[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => linha.split("|").map((parte) => parte.trim()))
    .map(([nome, preco, prazo]) => ({
      nome: nome ?? "",
      precoEmKwanza: Math.max(0, Math.round(Number(preco) || 0)),
      prazo: prazo || null
    }))
    .filter((zona) => zona.nome)
    .slice(0, 60);
}

function textoOuNull(valor: string): string | null {
  const texto = valor.trim();
  return texto ? texto : null;
}

function textoOuUndefined(valor: string): string | undefined {
  const texto = valor.trim();
  return texto ? texto : undefined;
}

function formatarTabelaMedidasTexto(linhas: LinhaTabelaMedidasLoja[]): string {
  return linhas
    .map((linha) =>
      [linha.tamanho, linha.busto ?? "", linha.cintura ?? "", linha.quadril ?? "", linha.observacao ?? ""]
        .join(" | ")
        .replace(/(\s\|\s)+$/g, "")
    )
    .join("\n");
}

function formatarCatalogosPersonalizadosTexto(catalogos: CatalogoPersonalizadoLoja[]): string {
  return catalogos
    .map((catalogo) =>
      [catalogo.nome, catalogo.criterio, catalogo.valor ?? "", catalogo.descricao ?? ""]
        .join(" | ")
        .replace(/(\s\|\s)+$/g, "")
    )
    .join("\n");
}

function parseCatalogosPersonalizadosTexto(texto: string): CatalogoPersonalizadoLoja[] {
  const criterios = new Set<CriterioCatalogoPersonalizado>(["categoria", "colecao", "busca", "todos"]);
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => linha.split("|").map((parte) => parte.trim()))
    .map(([nome, criterioBruto, valor, descricao]) => {
      const criterio = criterioBruto && criterios.has(criterioBruto as CriterioCatalogoPersonalizado)
        ? criterioBruto as CriterioCatalogoPersonalizado
        : "busca";
      return {
        id: normalizarSlug(nome || valor || "catalogo"),
        nome: nome ?? "",
        criterio,
        valor: valor || null,
        descricao: descricao || null
      };
    })
    .filter((catalogo) => catalogo.nome)
    .slice(0, 12);
}

function parseTabelaMedidasTexto(texto: string): LinhaTabelaMedidasLoja[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => linha.split("|").map((parte) => parte.trim()))
    .map(([tamanho, busto, cintura, quadril, observacao]) => ({
      tamanho: tamanho ?? "",
      busto: busto || null,
      cintura: cintura || null,
      quadril: quadril || null,
      observacao: observacao || null
    }))
    .filter((linha) => linha.tamanho)
    .slice(0, 24);
}

function normalizarSlug(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calcularTaxa(parte: number, total: number) {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

function resumirCatalogoLocal(pecas: Peca[]): ConfiguracaoLojaDigital["catalogo"] {
  const vendaveis = pecas.filter((peca) => pecaVendavel(peca));
  return {
    totalProdutos: pecas.length,
    produtosVendaveis: vendaveis.length,
    produtosSemStock: pecas.filter((peca) => peca.quantidade <= 0 || peca.estado === "ESGOTADA").length,
    produtosBaixoStock: pecas.filter((peca) => peca.estadoStock === "BAIXO_STOCK" || (peca.quantidade > 0 && peca.quantidade <= 2)).length,
    valorPotencialEmKwanza: vendaveis.reduce((total, peca) => total + peca.precoEmKwanza * peca.quantidade, 0)
  };
}

function selecionarProdutosDestaque(pecas: Peca[]) {
  return pecas
    .filter((peca) => pecaVendavel(peca))
    .slice()
    .sort((a, b) => b.precoEmKwanza - a.precoEmKwanza)
    .slice(0, 4);
}

function selecionarProdutosCriticos(pecas: Peca[]) {
  return pecas
    .filter((peca) => peca.quantidade <= 2 || peca.estado === "ESGOTADA" || peca.estadoStock === "BAIXO_STOCK")
    .slice(0, 5);
}

function pecaVendavel(peca: Peca) {
  return peca.quantidade > 0 && peca.estado !== "ESGOTADA" && peca.estado !== "VENDIDA";
}
