import {
  CalcularEntregaPublicaSchema,
  CriarCheckoutAbandonadoPublicoSchema,
  CriarCheckoutSitePublicoSchema,
  GerarCheckoutWhatsAppPublicoSchema,
  PublicarLojaSchema,
  RegistrarEventoTrackingSchema,
  SalvarConfiguracaoLojaPublicaSchema
} from "../../../dominio/esquemas.js";
import type { DadosNegocioBizy, NegocioBizy, Peca } from "../../../dominio/tipos.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloLojaPublica: ModuloHttp = {
  nome: "loja-publica",
  descricao: "Publicação de loja, catálogo público, checkout WhatsApp e tracking comercial.",
  registrar(app, contexto) {
    app.get("/loja-publica/configuracao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "loja-publica:gerir",
          modulo: "loja-publica",
          mensagemPermissao: "Sem permissão para consultar configuração da loja.",
          mensagemModulo: "Loja pública desativada para este negócio."
        }
      );
      if (!contextoComercial) return;

      const produtos = await contexto.gestaoPecas.listarPecas(contextoComercial.negocio.id);
      return mapearConfiguracaoLojaDigital(contextoComercial.negocio, produtos);
    });

    app.put("/loja-publica/configuracao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "loja-publica:gerir",
          modulo: "loja-publica",
          mensagemPermissao: "Sem permissão para publicar loja.",
          mensagemModulo: "Loja pública desativada para este negócio."
        }
      );
      if (!contextoComercial) return;

      const corpo = request.body ?? {};
      const payloadDetalhado = SalvarConfiguracaoLojaPublicaSchema.parse(corpo);
      const legado = PublicarLojaSchema.safeParse(corpo);
      const atual = contextoComercial.negocio;

      const slug = payloadDetalhado.publicacao.slug ?? payloadDetalhado.slug ?? (legado.success ? legado.data.slug : atual.slugPublico);
      const descricaoPublica =
        payloadDetalhado.identidade.descricaoPublica ??
        payloadDetalhado.publicacao.descricaoPublica ??
        payloadDetalhado.descricaoPublica ??
        (legado.success ? legado.data.descricaoPublica : atual.descricaoPublica);
      const publicada =
        payloadDetalhado.publicacao.publicada ??
        payloadDetalhado.publicada ??
        (legado.success ? legado.data.publicada : Boolean(atual.lojaPublicadaEm));

      const negocio = await contexto.onboardingBizy.salvarNegocio(
        contextoComercial.usuario.id,
        montarDadosNegocioComConfiguracaoLoja(atual, payloadDetalhado, descricaoPublica)
      );

      if (!slug) return negocio;
      return contexto.lojaPublica.publicarLoja(negocio.id, {
        slug,
        descricaoPublica,
        publicada
      });
    });

    app.get("/loja-publica/tracking/resumo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "tracking:ler",
          modulo: "tracking",
          mensagemPermissao: "Sem permissão para consultar tracking.",
          mensagemModulo: "Tracking desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      return contexto.lojaPublica.resumirTracking(contextoComercial.negocio.id);
    });

    app.get("/publico/lojas/dominios/autorizar", async (request, reply) => {
      aplicarNoStore(reply);
      const query = request.query as Record<string, string | undefined>;
      const dominio = query.domain ?? query.dominio ?? "";
      const dominioBase = process.env.PUBLIC_STORE_DOMAIN ?? "";

      if (!dominioBase) {
        request.log.warn({ dominio }, "PUBLIC_STORE_DOMAIN não configurado — autorização de domínio de loja falhará sempre.");
        return reply.code(503).send({ autorizado: false, erro: "PUBLIC_STORE_DOMAIN não configurado no servidor." });
      }

      const resultado = await contexto.lojaPublica.autorizarDominioPublico(dominio, dominioBase);
      if (!resultado.autorizado) {
        return reply.code(404).send({ autorizado: false });
      }

      return resultado;
    });

    app.get("/publico/lojas/:slug", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const query = request.query as Record<string, string | undefined>;
      aplicarCacheCatalogoPublico(reply);
      return contexto.lojaPublica.obterLoja(slug, {
        trackingId: query.trackingId,
        origem: query.origem,
        canal: query.canal,
        utm: extrairUtm(query)
      }, extrairFiltrosProdutosPublicos(query));
    });

    app.get("/publico/lojas/:slug/produtos/:codigo", async (request, reply) => {
      const { slug, codigo } = request.params as { slug: string; codigo: string };
      const query = request.query as Record<string, string | undefined>;
      aplicarCacheCatalogoPublico(reply);
      return contexto.lojaPublica.obterProduto(slug, codigo, {
        trackingId: query.trackingId,
        origem: query.origem,
        canal: query.canal,
        utm: extrairUtm(query)
      });
    });

    app.get("/publico/lojas/:slug/produtos/:codigo/similares", async (request, reply) => {
      const { slug, codigo } = request.params as { slug: string; codigo: string };
      const query = request.query as Record<string, string | undefined>;
      aplicarCacheCatalogoPublico(reply);
      await contexto.lojaPublica.obterProduto(slug, codigo);
      return contexto.bizyMarket.listarProdutosSimilares(codigo, {
        limite: normalizarLimiteProdutosPublicos(query.limite)
      });
    });

    app.post("/publico/lojas/:slug/entrega/calcular", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      aplicarNoStore(reply);
      const dados = CalcularEntregaPublicaSchema.parse(request.body ?? {});
      return contexto.lojaPublica.calcularEntrega(slug, dados);
    });

    app.post("/publico/lojas/:slug/produtos/:codigo/whatsapp", async (request, reply) => {
      const { slug, codigo } = request.params as { slug: string; codigo: string };
      aplicarNoStore(reply);
      const dados = GerarCheckoutWhatsAppPublicoSchema.parse(request.body ?? {});
      return contexto.lojaPublica.gerarCheckoutWhatsApp(slug, codigo, dados);
    });

    app.post("/publico/lojas/:slug/checkout", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      aplicarNoStore(reply);
      const dados = CriarCheckoutSitePublicoSchema.parse(request.body ?? {});
      const checkout = await contexto.lojaPublica.criarCheckoutSite(slug, dados);
      return reply.code(201).send(checkout);
    });

    app.post("/publico/lojas/:slug/checkout/abandonado", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      aplicarNoStore(reply);
      const dados = CriarCheckoutAbandonadoPublicoSchema.parse(request.body ?? {});
      const resultado = await contexto.lojaPublica.registrarCheckoutAbandonado(slug, dados);
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.post("/publico/tracking/eventos", async (request, reply) => {
      aplicarNoStore(reply);
      const dados = RegistrarEventoTrackingSchema.parse(request.body ?? {});
      if (!dados.slugLoja) {
        return reply.code(400).send({ erro: "VALIDACAO", mensagem: "Informe slugLoja para tracking público." });
      }
      if (contemDadoSensivelTracking(dados)) {
        return reply.code(400).send({
          erro: "TRACKING_DADO_SENSIVEL",
          mensagem: "Tracking público deve usar apenas identificadores técnicos, origem, campanha e timestamps."
        });
      }

      const evento = await contexto.lojaPublica.registrarEventoPublico(dados.slugLoja, dados);
      return reply.code(201).send(evento);
    });
  }
};

type ConfiguracaoLojaPayload = ReturnType<typeof SalvarConfiguracaoLojaPublicaSchema.parse>;

function montarDadosNegocioComConfiguracaoLoja(
  atual: NegocioBizy,
  dados: ConfiguracaoLojaPayload,
  descricaoPublica: string | null | undefined
): DadosNegocioBizy {
  const entregaAtual = objeto(atual.entrega);
  const entregaPayload = dados.entrega;
  const temaAtual = objeto(entregaAtual.temaLoja);
  const retiradaAtual = objeto(entregaAtual.retiradaNaLoja);
  const consumoLocalAtual = objeto(entregaAtual.consumoLocal);
  const pagamentosAtual = objeto(entregaAtual.pagamentos);
  const lojaDigitalAtual = objeto(entregaAtual.lojaDigital);
  const criacaoConfirmadaEmAtual = texto(lojaDigitalAtual.criacaoConfirmadaEm);
  const experienciaLoja = normalizarExperienciaLoja(dados.experiencia);
  const criacaoConfirmadaEm = dados.criacao.confirmar
    ? criacaoConfirmadaEmAtual ?? new Date().toISOString()
    : criacaoConfirmadaEmAtual;

  return {
    nomeComercial: dados.identidade.nomeComercial ?? atual.nomeComercial,
    segmento: atual.segmento,
    tipo: atual.tipo,
    nif: atual.nif,
    telefone: dados.identidade.telefone ?? atual.telefone,
    whatsapp: dados.identidade.whatsapp ?? atual.whatsapp,
    email: dados.identidade.email ?? atual.email,
    instagram: atual.instagram,
    tiktok: atual.tiktok,
    provincia: dados.identidade.provincia ?? atual.provincia,
    municipio: dados.identidade.municipio ?? atual.municipio,
    endereco: dados.identidade.endereco ?? atual.endereco,
    moeda: atual.moeda,
    fusoHorario: atual.fusoHorario,
    canaisVenda: atual.canaisVenda,
    metodosPagamento: dados.pagamentos.metodosPagamento ?? atual.metodosPagamento,
    contasSociais: atual.contasSociais,
    entrega: {
      ...entregaAtual,
      temaLoja: {
        ...temaAtual,
        corPrimaria: dados.tema.corPrimaria ?? texto(temaAtual.corPrimaria) ?? "#111111",
        logoUrl: dados.tema.logoUrl ?? texto(temaAtual.logoUrl),
        capaUrl: dados.tema.capaUrl ?? texto(temaAtual.capaUrl)
      },
      entregaAtiva: entregaPayload.entregaAtiva ?? booleano(entregaAtual.entregaAtiva, true),
      taxaPadraoEmKwanza: entregaPayload.taxaPadraoEmKwanza ?? numero(entregaAtual.taxaPadraoEmKwanza) ?? 0,
      entregaGratisAcimaDeKwanza:
        entregaPayload.entregaGratisAcimaDeKwanza ?? numero(entregaAtual.entregaGratisAcimaDeKwanza) ?? null,
      prazoPadrao: entregaPayload.prazoPadrao ?? texto(entregaAtual.prazoPadrao),
      instrucoesEntrega: entregaPayload.instrucoesEntrega ?? texto(entregaAtual.instrucoesEntrega),
      retiradaNaLoja: {
        ...retiradaAtual,
        ativa: entregaPayload.retiradaAtiva ?? booleano(retiradaAtual.ativa, false),
        endereco: entregaPayload.enderecoRetirada ?? texto(retiradaAtual.endereco) ?? atual.endereco
      },
      consumoLocal: {
        ...consumoLocalAtual,
        ativo: entregaPayload.consumoLocalAtivo ?? booleano(consumoLocalAtual.ativo, false)
      },
      pagamentos: {
        ...pagamentosAtual,
        instrucoesCobranca: dados.pagamentos.instrucoesCobranca ?? texto(pagamentosAtual.instrucoesCobranca),
        mensagemComprovativoPendente:
          dados.pagamentos.mensagemComprovativoPendente ?? texto(pagamentosAtual.mensagemComprovativoPendente),
        mensagemPagamentoConfirmado:
          dados.pagamentos.mensagemPagamentoConfirmado ?? texto(pagamentosAtual.mensagemPagamentoConfirmado)
      },
      lojaDigital: {
        ...lojaDigitalAtual,
        criacaoConfirmadaEm,
        origemCriacao: criacaoConfirmadaEm ? texto(lojaDigitalAtual.origemCriacao) ?? "assistente-loja-digital" : null,
        experiencia: experienciaLoja
      }
    },
    minutosReservaPadrao: atual.minutosReservaPadrao,
    slugPublico: atual.slugPublico,
    descricaoPublica: descricaoPublica ?? atual.descricaoPublica,
    lojaPublicadaEm: atual.lojaPublicadaEm
  };
}

function mapearConfiguracaoLojaDigital(negocio: NegocioBizy, produtos: Peca[]) {
  const entrega = objeto(negocio.entrega);
  const tema = objeto(entrega.temaLoja);
  const retirada = objeto(entrega.retiradaNaLoja);
  const consumoLocal = objeto(entrega.consumoLocal);
  const pagamentos = objeto(entrega.pagamentos);
  const lojaDigital = objeto(entrega.lojaDigital);
  const criacaoConfirmadaEm = texto(lojaDigital.criacaoConfirmadaEm);
  const catalogo = resumirCatalogoLoja(produtos);
  const publicada = Boolean(negocio.lojaPublicadaEm);
  const urlPublica = montarUrlLojaPublica(negocio.slugPublico);
  const prontidao = avaliarProntidaoLoja(negocio, catalogo);

  return {
    configuracao: {
      identidade: {
        nomeComercial: negocio.nomeComercial,
        telefone: negocio.telefone,
        whatsapp: negocio.whatsapp,
        email: negocio.email,
        provincia: negocio.provincia,
        municipio: negocio.municipio,
        endereco: negocio.endereco,
        descricaoPublica: negocio.descricaoPublica
      },
      publicacao: {
        slug: negocio.slugPublico,
        descricaoPublica: negocio.descricaoPublica,
        publicada,
        publicadaEm: negocio.lojaPublicadaEm?.toISOString() ?? null,
        urlPublica
      },
      tema: {
        corPrimaria: texto(tema.corPrimaria) ?? "#111111",
        logoUrl: texto(tema.logoUrl),
        capaUrl: texto(tema.capaUrl)
      },
      entrega: {
        entregaAtiva: booleano(entrega.entregaAtiva, true),
        retiradaAtiva: booleano(retirada.ativa, false),
        consumoLocalAtivo: booleano(consumoLocal.ativo, false),
        taxaPadraoEmKwanza: numero(entrega.taxaPadraoEmKwanza) ?? 0,
        entregaGratisAcimaDeKwanza: numero(entrega.entregaGratisAcimaDeKwanza),
        prazoPadrao: texto(entrega.prazoPadrao),
        enderecoRetirada: texto(retirada.endereco) ?? negocio.endereco,
        instrucoesEntrega: texto(entrega.instrucoesEntrega)
      },
      pagamentos: {
        metodosPagamento: negocio.metodosPagamento,
        instrucoesCobranca: texto(pagamentos.instrucoesCobranca),
        mensagemComprovativoPendente: texto(pagamentos.mensagemComprovativoPendente),
        mensagemPagamentoConfirmado: texto(pagamentos.mensagemPagamentoConfirmado)
      },
      experiencia: normalizarExperienciaLoja(lojaDigital.experiencia)
    },
    publicacao: {
      slug: negocio.slugPublico,
      publicada,
      urlPublica
    },
    criacao: {
      concluida: Boolean(criacaoConfirmadaEm),
      criadaEm: criacaoConfirmadaEm,
      origem: texto(lojaDigital.origemCriacao)
    },
    catalogo,
    prontidao
  };
}

function resumirCatalogoLoja(produtos: Peca[]) {
  const vendaveis = produtos.filter((produto) => produtoVendavel(produto));
  return {
    totalProdutos: produtos.length,
    produtosVendaveis: vendaveis.length,
    produtosSemStock: produtos.filter((produto) => produto.quantidade <= 0 || produto.estado === "ESGOTADA").length,
    produtosBaixoStock: produtos.filter((produto) => produto.estadoStock === "BAIXO_STOCK").length,
    valorPotencialEmKwanza: vendaveis.reduce((total, produto) => total + produto.precoEmKwanza * produto.quantidade, 0)
  };
}

function avaliarProntidaoLoja(
  negocio: NegocioBizy,
  catalogo: ReturnType<typeof resumirCatalogoLoja>
) {
  const pendencias = [
    !negocio.slugPublico ? "Definir link público da loja." : null,
    !negocio.whatsapp && !negocio.telefone ? "Adicionar WhatsApp ou telefone comercial." : null,
    catalogo.produtosVendaveis === 0 ? "Adicionar pelo menos um produto vendável." : null,
    negocio.metodosPagamento.length === 0 ? "Configurar pelo menos um método de pagamento." : null
  ].filter((item): item is string => Boolean(item));

  return {
    prontaParaPublicar: pendencias.length === 0,
    pendencias,
    progresso: Math.round(((4 - pendencias.length) / 4) * 100)
  };
}

function normalizarExperienciaLoja(valor: unknown) {
  const dados = objeto(valor);
  const ordemPadrao = ["destaques", "promocoes", "novidades", "maisVendidos", "kits", "reposicoes"];
  const secoesPermitidas = new Set(ordemPadrao);
  const ordemInformada = Array.isArray(dados.ordemVitrines)
    ? dados.ordemVitrines.filter((item): item is string => typeof item === "string" && secoesPermitidas.has(item))
    : [];
  const tabelaMedidas = Array.isArray(dados.tabelaMedidas)
    ? dados.tabelaMedidas
        .map((linha) => objeto(linha))
        .map((linha) => ({
          tamanho: texto(linha.tamanho) ?? "",
          busto: texto(linha.busto),
          cintura: texto(linha.cintura),
          quadril: texto(linha.quadril),
          observacao: texto(linha.observacao)
        }))
        .filter((linha) => linha.tamanho)
        .slice(0, 24)
    : [];
  const criteriosCatalogo = new Set(["categoria", "colecao", "busca", "todos"]);
  const catalogosPersonalizados = Array.isArray(dados.catalogosPersonalizados)
    ? dados.catalogosPersonalizados
        .map((item, indice) => objeto(item))
        .map((item, indice) => {
          const criterio = texto(item.criterio);
          const nome = texto(item.nome);
          return {
            id: normalizarIdCatalogo(texto(item.id) ?? nome ?? `catalogo-${indice + 1}`),
            nome: nome ?? "",
            descricao: texto(item.descricao),
            criterio: criteriosCatalogo.has(criterio ?? "") ? criterio : "busca",
            valor: texto(item.valor)
          };
        })
        .filter((item) => item.nome)
        .slice(0, 12)
    : [];
  const modo = texto(dados.modoNegocio);

  return {
    modoNegocio: ["auto", "moda", "comida", "servicos", "geral"].includes(modo ?? "") ? modo : "auto",
    ordemVitrines: [...new Set(ordemInformada.length ? ordemInformada : ordemPadrao)],
    catalogosEditaveis: booleano(dados.catalogosEditaveis, true),
    leadCaptureAtivo: booleano(dados.leadCaptureAtivo, true),
    leadCaptureTitulo: texto(dados.leadCaptureTitulo),
    cupomDestaque: texto(dados.cupomDestaque),
    politicaTroca: texto(dados.politicaTroca),
    politicaEntrega: texto(dados.politicaEntrega),
    politicaPrivacidade: texto(dados.politicaPrivacidade),
    catalogosPersonalizados,
    operacao: normalizarOperacaoLoja(dados.operacao),
    tabelaMedidas
  };
}

function normalizarOperacaoLoja(valor: unknown) {
  const dados = objeto(valor);
  const plano = objeto(dados.plano);
  const quotas = objeto(plano.quotas);
  const checkout = objeto(dados.checkout);
  const pagamentosAvancados = objeto(dados.pagamentos);
  const entregaAvancada = objeto(dados.entrega);
  const fidelizacao = objeto(dados.fidelizacao);
  const automacoes = objeto(dados.automacoes);
  const canais = objeto(dados.canais);
  const catalogo = objeto(dados.catalogo);
  const clientes = objeto(dados.clientes);
  const encomendas = objeto(dados.encomendas);
  const relatorios = objeto(dados.relatorios);
  const siteSeo = objeto(dados.siteSeo);
  const acessoLoja = texto(fidelizacao.acessoLoja);
  const agruparPor = texto(relatorios.agruparPor);
  const acessosPermitidos = new Set(["aberto", "telefone", "login", "membros"]);
  const agrupamentosPermitidos = new Set(["hora", "produto", "cliente"]);

  return {
    plano: {
      planoAtual: texto(plano.planoAtual) ?? "starter",
      recursosBloqueados: listaTextos(plano.recursosBloqueados).slice(0, 40),
      quotas: {
        encomendasMensais: Math.round(Math.max(0, numero(quotas.encomendasMensais) ?? 0)),
        imagens: Math.round(Math.max(0, numero(quotas.imagens) ?? 0)),
        whatsapp: Math.round(Math.max(0, numero(quotas.whatsapp) ?? 0)),
        email: Math.round(Math.max(0, numero(quotas.email) ?? 0))
      },
      upgradeContextual: booleano(plano.upgradeContextual, true)
    },
    checkout: {
      ignorarPaginaPagamento: booleano(checkout.ignorarPaginaPagamento, false),
      manterRascunhoAtePago: booleano(checkout.manterRascunhoAtePago, false),
      confirmacaoAutomaticaPagamento: booleano(checkout.confirmacaoAutomaticaPagamento, false),
      entradaAtiva: booleano(checkout.entradaAtiva, false),
      entradaPercentual: limitarNumero(checkout.entradaPercentual, 0, 100, 0),
      taxaServicoPercentual: limitarNumero(checkout.taxaServicoPercentual, 0, 100, 0),
      taxaServicoFixaEmKwanza: Math.round(Math.max(0, numero(checkout.taxaServicoFixaEmKwanza) ?? 0)),
      prefixoPedido: texto(checkout.prefixoPedido),
      sufixoPedido: texto(checkout.sufixoPedido),
      exigirTelefoneCheckout: booleano(checkout.exigirTelefoneCheckout, true),
      exigirLoginCheckout: booleano(checkout.exigirLoginCheckout, false),
      mostrarNumeroEncomendaNaMensagem: booleano(checkout.mostrarNumeroEncomendaNaMensagem, true)
    },
    pagamentos: {
      dinheiroEntrega: booleano(pagamentosAvancados.dinheiroEntrega, true),
      transferenciaBancaria: booleano(pagamentosAvancados.transferenciaBancaria, true),
      cartaoAdyen: booleano(pagamentosAvancados.cartaoAdyen, false),
      paypal: booleano(pagamentosAvancados.paypal, false),
      pagamentoPersonalizado: booleano(pagamentosAvancados.pagamentoPersonalizado, false),
      pagamentoComInstrucoes: booleano(pagamentosAvancados.pagamentoComInstrucoes, true),
      creditoLoja: booleano(pagamentosAvancados.creditoLoja, false),
      instrucoesPagamento: texto(pagamentosAvancados.instrucoesPagamento)
    },
    entrega: {
      gerirDisponibilidade: booleano(entregaAvancada.gerirDisponibilidade, false),
      adicionarMetodoEntrega: booleano(entregaAvancada.adicionarMetodoEntrega, false),
      disponibilidadeSemanal: listaTextos(entregaAvancada.disponibilidadeSemanal).slice(0, 21),
      zonas: normalizarZonasEntrega(entregaAvancada.zonas)
    },
    fidelizacao: {
      acessoLoja: acessosPermitidos.has(acessoLoja ?? "") ? acessoLoja : "aberto",
      ofertaBoasVindasAtiva: booleano(fidelizacao.ofertaBoasVindasAtiva, false),
      cupomBoasVindas: texto(fidelizacao.cupomBoasVindas),
      recompensasAtivas: booleano(fidelizacao.recompensasAtivas, false),
      recompensasIndicacaoAtivas: booleano(fidelizacao.recompensasIndicacaoAtivas, false),
      creditoLojaAtivo: booleano(fidelizacao.creditoLojaAtivo, false)
    },
    automacoes: {
      perfilCliente: booleano(automacoes.perfilCliente, true),
      carrinhoAbandonado: booleano(automacoes.carrinhoAbandonado, true),
      pedidoAvaliacao: booleano(automacoes.pedidoAvaliacao, true),
      avaliacaoRecebida: booleano(automacoes.avaliacaoRecebida, true),
      pedidoNovamente: booleano(automacoes.pedidoNovamente, true),
      aniversarioCliente: booleano(automacoes.aniversarioCliente, false),
      pagamentoPendente: booleano(automacoes.pagamentoPendente, true),
      pagamentoConfirmado: booleano(automacoes.pagamentoConfirmado, true),
      creditoAtualizado: booleano(automacoes.creditoAtualizado, false),
      creditoReembolsado: booleano(automacoes.creditoReembolsado, false),
      pedidoSaiuEntrega: booleano(automacoes.pedidoSaiuEntrega, true),
      pedidoCancelado: booleano(automacoes.pedidoCancelado, true),
      produtoDigitalConfirmado: booleano(automacoes.produtoDigitalConfirmado, false),
      operacaoInternaPedidoCriado: booleano(automacoes.operacaoInternaPedidoCriado, true)
    },
    canais: {
      site: booleano(canais.site, true),
      whatsapp: booleano(canais.whatsapp, true),
      instagram: booleano(canais.instagram, false),
      google: booleano(canais.google, false),
      pos: booleano(canais.pos, false),
      transmissoes: booleano(canais.transmissoes, false),
      chatbot: booleano(canais.chatbot, true),
      appMovelQr: booleano(canais.appMovelQr, false),
      caixaEntradaUnificada: booleano(canais.caixaEntradaUnificada, true),
      broadcasts: booleano(canais.broadcasts, false)
    },
    catalogo: {
      categoriasVisiveis: listaTextos(catalogo.categoriasVisiveis).slice(0, 60),
      categoriasOcultas: listaTextos(catalogo.categoriasOcultas).slice(0, 60),
      sequenciaCategorias: listaTextos(catalogo.sequenciaCategorias).slice(0, 60),
      descontosAtivos: booleano(catalogo.descontosAtivos, false),
      produtosPorColecao: booleano(catalogo.produtosPorColecao, true),
      produtosComEstatisticas: booleano(catalogo.produtosComEstatisticas, true)
    },
    clientes: {
      importar: booleano(clientes.importar, true),
      exportar: booleano(clientes.exportar, true),
      edicaoMassa: booleano(clientes.edicaoMassa, false),
      adicionarManual: booleano(clientes.adicionarManual, true),
      pesquisaAvancada: booleano(clientes.pesquisaAvancada, true),
      filtrosInteligentes: listaTextos(clientes.filtrosInteligentes).length
        ? listaTextos(clientes.filtrosInteligentes).slice(0, 20)
        : ["todos", "inativos", "primeiro-pedido", "nunca-comprou"],
      transmissaoFiltrada: booleano(clientes.transmissaoFiltrada, false)
    },
    encomendas: {
      criarManual: booleano(encomendas.criarManual, true),
      exportar: booleano(encomendas.exportar, true),
      resumoAtivo: booleano(encomendas.resumoAtivo, true),
      rascunhos: booleano(encomendas.rascunhos, true),
      pagamentos: booleano(encomendas.pagamentos, true),
      calendario: booleano(encomendas.calendario, true),
      colunasOperacionais: listaTextos(encomendas.colunasOperacionais).length
        ? listaTextos(encomendas.colunasOperacionais).slice(0, 30)
        : ["cliente", "total", "estado", "pagamento", "entrega", "criadoEm"]
    },
    relatorios: {
      metricas: listaTextos(relatorios.metricas).slice(0, 12),
      agruparPor: agrupamentosPermitidos.has(agruparPor ?? "") ? agruparPor : "produto",
      filtrosPedidos: listaTextos(relatorios.filtrosPedidos).slice(0, 12),
      relatoriosProntos: listaTextos(relatorios.relatoriosProntos).slice(0, 40)
    },
    siteSeo: {
      dominioPersonalizado: texto(siteSeo.dominioPersonalizado),
      instrucoesDns: texto(siteSeo.instrucoesDns),
      tituloSite: texto(siteSeo.tituloSite),
      uploadLogotipo: booleano(siteSeo.uploadLogotipo, true),
      imagemGeradaIa: booleano(siteSeo.imagemGeradaIa, false),
      categoriasDiretorio: listaTextos(siteSeo.categoriasDiretorio).slice(0, 12)
    }
  };
}

function normalizarZonasEntrega(valor: unknown) {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => objeto(item))
    .map((item) => ({
      nome: texto(item.nome) ?? "",
      precoEmKwanza: Math.round(Math.max(0, numero(item.precoEmKwanza) ?? 0)),
      prazo: texto(item.prazo)
    }))
    .filter((zona) => zona.nome)
    .slice(0, 60);
}

function produtoVendavel(produto: Peca): boolean {
  return !produto.arquivadaEm && produto.quantidade > 0 && produto.estado !== "ESGOTADA" && produto.estado !== "VENDIDA";
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function montarUrlLojaPublica(slug?: string | null): string | null {
  const slugNormalizado = slug ? normalizarIdCatalogo(slug) : "";
  if (!slugNormalizado) return null;

  const dominioBase = normalizarDominioPublicoLoja(process.env.PUBLIC_STORE_DOMAIN);
  if (dominioBase) {
    return `https://${slugNormalizado}.${dominioBase}`;
  }

  const base = (process.env.PUBLIC_STORE_BASE_URL ?? process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/lojas/${slugNormalizado}` : `/lojas/${slugNormalizado}`;
}

function normalizarDominioPublicoLoja(valor?: string | null): string | null {
  if (!valor) return null;
  const dominio = valor
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.split(":")[0]
    ?.replace(/\.$/, "") ?? "";

  return dominio || null;
}

function normalizarIdCatalogo(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "catalogo";
}

function numero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim()) {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : null;
  }
  return null;
}

function limitarNumero(valor: unknown, minimo: number, maximo: number, padrao: number): number {
  const informado = numero(valor);
  if (informado === null) return padrao;
  return Math.min(maximo, Math.max(minimo, informado));
}

function listaTextos(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.map((item) => texto(item)).filter((item): item is string => Boolean(item))
    : [];
}

function booleano(valor: unknown, padrao: boolean): boolean {
  return typeof valor === "boolean" ? valor : padrao;
}

function aplicarCacheCatalogoPublico(reply: { header(nome: string, valor: string): unknown }) {
  reply.header("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=30");
}

function aplicarNoStore(reply: { header(nome: string, valor: string): unknown }) {
  reply.header("Cache-Control", "no-store");
}

function extrairUtm(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query)
      .filter(([chave, valor]) => chave.startsWith("utm_") && typeof valor === "string" && valor.trim())
      .map(([chave, valor]) => [chave, valor as string])
  );
}

function extrairFiltrosProdutosPublicos(query: Record<string, string | undefined>) {
  const limite = Number(query.limite);
  return {
    busca: textoQuery(query.busca),
    categoria: textoQuery(query.categoria),
    colecao: textoQuery(query.colecao),
    estadoStock: textoQuery(query.estadoStock),
    limite: Number.isFinite(limite) ? Math.trunc(limite) : undefined
  };
}

function normalizarLimiteProdutosPublicos(valor?: string): number | undefined {
  if (!valor) return undefined;
  const limite = Number(valor);
  if (!Number.isFinite(limite)) return undefined;
  return Math.min(24, Math.max(1, Math.trunc(limite)));
}

function textoQuery(valor?: string): string | undefined {
  const texto = valor?.trim();
  return texto || undefined;
}

function contemDadoSensivelTracking(dados: {
  trackingId?: string | null;
  utm?: Record<string, string>;
  metadata?: Record<string, unknown>;
}) {
  const candidatos: unknown[] = [dados.trackingId, dados.utm, dados.metadata];
  return candidatos.some((valor) => contemDadoPessoal(valor));
}

function contemDadoPessoal(valor: unknown): boolean {
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (!texto) return false;
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(texto)) return true;
    const digitos = texto.replace(/\D/g, "");
    return /^(244)?9\d{8}$/.test(digitos);
  }

  if (Array.isArray(valor)) return valor.some((item) => contemDadoPessoal(item));

  if (valor && typeof valor === "object") {
    return Object.entries(valor as Record<string, unknown>).some(([chave, item]) => {
      const chaveNormalizada = chave.toLowerCase();
      if (["telefone", "phone", "email", "nome", "name", "endereco", "address", "whatsapp"].includes(chaveNormalizada)) {
        return true;
      }
      return contemDadoPessoal(item);
    });
  }

  return false;
}
