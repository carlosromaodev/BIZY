import type { Peca } from "../../../tipos";
import type {
  AcessoLojaDigital,
  AgrupamentoRelatorioLoja,
  CatalogoPersonalizadoLoja,
  ConfiguracaoLojaDigital,
  CriterioCatalogoPersonalizado,
  FormLoja,
  LinhaTabelaMedidasLoja,
  OperacaoLojaDigital,
  ZonaEntregaOperacaoLoja
} from "./tipos";

export const operacaoLojaDigital: OperacaoLojaDigital = {
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
    mensagensColecao: {},
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

export function criarFormVazio(ordemVitrinesPadrao: string[]): FormLoja {
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
      publicada: false,
      participaNoMarket: true
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
      ordemVitrines: ordemVitrinesPadrao,
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

export function criarFormAPartirConfiguracao(dados: ConfiguracaoLojaDigital, ordemVitrinesPadrao: string[]): FormLoja {
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
      publicada: dados.configuracao.publicacao.publicada,
      participaNoMarket: dados.configuracao.publicacao.participaNoMarket ?? true
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
        : ordemVitrinesPadrao,
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

export function criarPayloadConfiguracao(form: FormLoja) {
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
      publicada: form.publicacao.publicada,
      participaNoMarket: form.publicacao.participaNoMarket
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

export function criarPayloadOperacaoLoja(operacao: OperacaoLojaDigital): OperacaoLojaDigital {
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
      mensagensColecao: { ...operacao.catalogo.mensagensColecao },
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

export function clonarOperacaoLoja(operacao: OperacaoLojaDigital): OperacaoLojaDigital {
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

export function normalizarOperacaoLoja(valor: unknown): OperacaoLojaDigital {
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
      mensagensColecao: normalizarMensagensColecao(catalogo.mensagensColecao),
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

function normalizarMensagensColecao(valor: unknown): Record<string, string> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  const resultado: Record<string, string> = {};
  for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) resultado[chave] = v.trim().slice(0, 200);
  }
  return resultado;
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

export function formatarListaTexto(lista: string[]): string {
  return lista.join("\n");
}

export function parseListaTexto(texto: string): string[] {
  return texto
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, indice, lista) => lista.indexOf(item) === indice);
}

export function formatarZonasEntregaTexto(zonas: ZonaEntregaOperacaoLoja[]): string {
  return zonas
    .map((zona) => [zona.nome, zona.precoEmKwanza, zona.prazo ?? ""].join(" | ").replace(/(\s\|\s)+$/g, ""))
    .join("\n");
}

export function parseZonasEntregaTexto(texto: string): ZonaEntregaOperacaoLoja[] {
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

export function parseCatalogosPersonalizadosTexto(texto: string): CatalogoPersonalizadoLoja[] {
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

export function parseTabelaMedidasTexto(texto: string): LinhaTabelaMedidasLoja[] {
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

export function normalizarSlug(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calcularTaxa(parte: number, total: number) {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

export function resumirCatalogoLocal(pecas: Peca[]): ConfiguracaoLojaDigital["catalogo"] {
  const vendaveis = pecas.filter((peca) => pecaVendavel(peca));
  return {
    totalProdutos: pecas.length,
    produtosVendaveis: vendaveis.length,
    produtosSemStock: pecas.filter((peca) => peca.quantidade <= 0 || peca.estado === "ESGOTADA").length,
    produtosBaixoStock: pecas.filter((peca) => peca.estadoStock === "BAIXO_STOCK" || (peca.quantidade > 0 && peca.quantidade <= 2)).length,
    valorPotencialEmKwanza: vendaveis.reduce((total, peca) => total + peca.precoEmKwanza * peca.quantidade, 0)
  };
}

export function selecionarProdutosDestaque(pecas: Peca[]) {
  return pecas
    .filter((peca) => pecaVendavel(peca))
    .slice()
    .sort((a, b) => b.precoEmKwanza - a.precoEmKwanza)
    .slice(0, 4);
}

export function selecionarProdutosCriticos(pecas: Peca[]) {
  return pecas
    .filter((peca) => peca.quantidade <= 2 || peca.estado === "ESGOTADA" || peca.estadoStock === "BAIXO_STOCK")
    .slice(0, 5);
}

function pecaVendavel(peca: Peca) {
  return peca.quantidade > 0 && peca.estado !== "ESGOTADA" && peca.estado !== "VENDIDA";
}
