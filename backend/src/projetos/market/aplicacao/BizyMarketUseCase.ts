import type {
  RepositorioAutenticacao,
  RepositorioPecas
} from "../../../dominio/repositorios/contratos.js";
import type { NegocioBizy, Peca } from "../../../dominio/tipos.js";
import type { RepositorioCreatorMarketplace } from "../dominio/creatorMarketplace.js";
import {
  montarPaginacaoOffset,
  normalizarLimitePaginacao,
  normalizarOffsetPaginacao
} from "../../../use-case/utils/paginacao.js";

export interface FiltrosBizyMarket {
  busca?: string | null;
  categoria?: string | null;
  loja?: string | null;
  municipio?: string | null;
  provincia?: string | null;
  precoMinimo?: number | null;
  precoMaximo?: number | null;
  apenasDisponivel?: boolean | null;
  apenasPromocao?: boolean | null;
  ordenarPor?: "RELEVANCIA" | "PRECO_ASC" | "PRECO_DESC" | "MAIS_VENDIDOS" | "NOVIDADES" | "ENTREGA_RAPIDA" | "MAIOR_DESCONTO" | null;
  limite?: number | null;
  offset?: number | null;
}

type ItemMarket = { peca: Peca; loja: NegocioBizy };
type FiltrosLojasMarket = {
  busca?: string | null;
  categoria?: string | null;
  provincia?: string | null;
  limite?: number | null;
  offset?: number | null;
};

export interface SellerOnboardingMarket {
  estado: "RASCUNHO" | "PENDENTE" | "EM_REVISAO" | "APROVADO" | "REJEITADO" | "SUSPENSO";
  documentos: {
    nif?: string | null;
    iban?: string | null;
    identidadeUrl?: string | null;
    comprovativoBancarioUrl?: string | null;
    termoAceiteEm?: string | null;
  };
  verificacao: {
    responsavelNome?: string | null;
    responsavelTelefone?: string | null;
    observacao?: string | null;
  };
  historico: Array<{ estado: string; motivo?: string | null; atualizadoEm: string; atualizadoPorId?: string | null }>;
  atualizadoEm?: string | null;
  atualizadoPorId?: string | null;
}

export class BizyMarketUseCase {
  constructor(
    private readonly autenticacao: RepositorioAutenticacao,
    private readonly pecas: RepositorioPecas,
    private readonly creatorMarketplace: RepositorioCreatorMarketplace
  ) {}

  async listarProdutos(filtros: FiltrosBizyMarket = {}) {
    const limite = this.normalizarLimite(filtros.limite);
    const offset = normalizarOffsetPaginacao(filtros.offset ?? undefined);
    const consultaBanco = await this.consultarProdutosMarketNoRepositorio(filtros, limite, offset);
    if (consultaBanco) {
      const produtos = consultaBanco.itens.sort((a, b) => this.ordenarItensMarket(a, b, filtros.ordenarPor ?? "RELEVANCIA"));
      return {
        produtos: produtos.map(({ peca, loja }) => this.mapearProdutoMarket(peca, loja)),
        total: consultaBanco.total,
        filtros: this.mapearFiltrosAplicados(filtros, limite, offset),
        paginacao: montarPaginacaoOffset(consultaBanco.total, limite, offset),
        categorias: this.normalizarCategoriasAgregadas(consultaBanco.categorias)
      };
    }
    const produtos = (await this.listarItensMarket())
      .filter((item) => this.itemAtendeFiltros(item, filtros))
      .sort((a, b) => this.ordenarItensMarket(a, b, filtros.ordenarPor ?? "RELEVANCIA"));

    const produtosPaginados = produtos.slice(offset, offset + limite);

    return {
      produtos: produtosPaginados.map(({ peca, loja }) => this.mapearProdutoMarket(peca, loja)),
      total: produtos.length,
      filtros: this.mapearFiltrosAplicados(filtros, limite, offset),
      paginacao: montarPaginacaoOffset(produtos.length, limite, offset),
      categorias: this.montarCategorias(produtos)
    };
  }

  async listarCategorias() {
    const consultaBanco = await this.consultarProdutosMarketNoRepositorio({}, 1, 0);
    if (consultaBanco) {
      const categorias = this.normalizarCategoriasAgregadas(consultaBanco.categorias).map((item) => ({ ...item, url: `/market/categorias/${encodeURIComponent(item.categoria)}` }));
      return { categorias, total: categorias.length };
    }
    const produtos = await this.listarItensMarket();
    const categorias = this.montarCategorias(produtos).map((item) => ({
      ...item,
      url: `/market/categorias/${encodeURIComponent(item.categoria)}`
    }));

    return {
      categorias,
      total: categorias.length
    };
  }

  async obterProduto(listingId: string) {
    const item = await this.exigirItemMarketPorId(listingId);
    const similares = await this.listarProdutosSimilares(listingId, { limite: 6 });
    const combinacoesVariantes = await this.pecas.listarVariantesPeca(item.peca.id);
    const ofertaAfiliacao = (await this.creatorMarketplace.listarOfertasPublicadas(new Date()))
      .find((oferta) => oferta.produtos.some((produto) => produto.pecaId === item.peca.id));

    return {
      produto: {
        ...this.mapearProdutoMarket(item.peca, item.loja),
        combinacoesVariantes: combinacoesVariantes.map((variante) => ({
          id: variante.id,
          opcoes: variante.opcoes,
          sku: variante.sku,
          precoEmKwanza: variante.precoEmKwanza,
          quantidade: variante.quantidade,
          estado: variante.estado
        }))
      },
      similares: similares.produtos,
      afiliacao: ofertaAfiliacao ? {
        ofertaId: ofertaAfiliacao.id,
        modalidadeAcesso: this.modalidadeOferta(ofertaAfiliacao.regras),
        comissaoTipo: ofertaAfiliacao.comissaoTipo,
        comissaoValor: ofertaAfiliacao.comissaoValor,
        moeda: ofertaAfiliacao.moeda
      } : null,
      seo: this.mapearSeoProdutoMarket(item)
    };
  }

  async listarProdutosSimilares(listingId: string, opcoes: { limite?: number | null } = {}) {
    const origem = await this.exigirItemMarketPorId(listingId);
    const limite = this.normalizarLimite(opcoes.limite ?? 12);
    const categoriaOrigem = this.normalizarTexto(origem.peca.categoria);
    const precoOrigem = origem.peca.precoEmKwanza;

    const produtos = (await this.listarItensMarket())
      .filter((item) => item.peca.id !== origem.peca.id)
      .filter((item) => this.normalizarTexto(item.peca.categoria) === categoriaOrigem)
      .sort((a, b) => {
        const distanciaPrecoA = Math.abs(a.peca.precoEmKwanza - precoOrigem);
        const distanciaPrecoB = Math.abs(b.peca.precoEmKwanza - precoOrigem);
        return distanciaPrecoA - distanciaPrecoB || this.ordenarItensMarket(a, b);
      });

    return {
      produtoOrigem: this.mapearProdutoMarket(origem.peca, origem.loja),
      produtos: produtos.slice(0, limite).map(({ peca, loja }) => this.mapearProdutoMarket(peca, loja)),
      total: produtos.length,
      filtros: {
        categoria: origem.peca.categoria,
        excluirLoja: origem.loja.slugPublico,
        limite
      }
    };
  }

  async obterProdutoLegado(slugLoja: string, codigo: string) {
    const item = (await this.listarItensMarket()).find((produto) =>
      produto.loja.slugPublico === slugLoja.trim().toLowerCase() && produto.peca.codigo === codigo.trim().toUpperCase()
    );
    if (!item) throw new Error("Produto não encontrado no Bizy Market.");
    return this.obterProduto(item.peca.id);
  }

  async sugerirBusca(termo: string, limite = 8) {
    const busca = this.normalizarTexto(termo);
    if (busca.length < 2) return { sugestoes: [] };
    const quantidade = Math.min(limite, 12);
    const consultaBanco = await this.consultarProdutosMarketNoRepositorio({ busca }, quantidade, 0);
    const itens = consultaBanco?.itens ?? (await this.listarItensMarket()).filter((item) => this.itemAtendeFiltros(item, { busca })).slice(0, quantidade);
    const sugestoes = new Map<string, { tipo: "PRODUTO" | "CATEGORIA" | "LOJA"; texto: string; destino: string }>();
    for (const item of itens) {
      sugestoes.set(`produto:${item.peca.id}`, { tipo: "PRODUTO", texto: item.peca.nome, destino: this.urlProduto(item.peca) });
      if (item.peca.categoria) sugestoes.set(`categoria:${this.normalizarTexto(item.peca.categoria)}`, { tipo: "CATEGORIA", texto: item.peca.categoria, destino: `/market/categorias/${encodeURIComponent(item.peca.categoria)}` });
      if (item.loja.slugPublico) sugestoes.set(`loja:${item.loja.id}`, { tipo: "LOJA", texto: item.loja.nomeComercial, destino: `/lojas/${item.loja.slugPublico}` });
    }
    return { sugestoes: [...sugestoes.values()].slice(0, Math.min(limite, 12)) };
  }

  private async consultarProdutosMarketNoRepositorio(filtros: FiltrosBizyMarket, limite: number, offset: number) {
    if (!this.pecas.buscarProdutosMarket) return null;
    const lojas = (await this.autenticacao.listarNegociosPublicados())
      .filter((loja) => this.lojaParticipaNoMarket(loja))
      .filter((loja) => this.extrairSellerOnboarding(loja).estado !== "SUSPENSO")
      .filter((loja) => !filtros.provincia || this.normalizarTexto(loja.provincia).includes(this.normalizarTexto(filtros.provincia)))
      .filter((loja) => !filtros.municipio || this.normalizarTexto(loja.municipio).includes(this.normalizarTexto(filtros.municipio)))
      .filter((loja) => !filtros.loja || [loja.nomeComercial, loja.slugPublico].some((valor) => this.normalizarTexto(valor).includes(this.normalizarTexto(filtros.loja))));
    const busca = this.normalizarTexto(filtros.busca);
    const negocioIdsCorrespondentesBusca = busca
      ? lojas.filter((loja) => [loja.nomeComercial, loja.slugPublico].some((valor) => this.normalizarTexto(valor).includes(busca))).map((loja) => loja.id)
      : [];
    const resultado = await this.pecas.buscarProdutosMarket({
      negocioIds: lojas.map((loja) => loja.id),
      negocioIdsCorrespondentesBusca,
      busca: filtros.busca,
      categoria: filtros.categoria,
      precoMinimo: filtros.precoMinimo,
      precoMaximo: filtros.precoMaximo,
      apenasPromocao: filtros.apenasPromocao,
      ordenarPor: filtros.ordenarPor,
      limite,
      offset
    });
    const lojasPorId = new Map(lojas.map((loja) => [loja.id, loja]));
    const itens = resultado.pecas
      .map((peca) => ({ peca, loja: peca.negocioId ? lojasPorId.get(peca.negocioId) ?? null : null }))
      .filter((item): item is ItemMarket => Boolean(item.loja))
      .filter(({ peca }) => this.produtoElegivelMarket(peca));
    return { itens, total: resultado.total, categorias: resultado.categorias };
  }

  async resumirLoja(negocio: NegocioBizy) {
    const pecas = await this.pecas.listar(negocio.id);
    const produtos = pecas.map((peca) => this.resumirProdutoLoja(peca, negocio));
    const publicados = produtos.filter((produto) => produto.publicado).length;
    const elegiveis = produtos.filter((produto) => produto.elegivel).length;
    const comPendencias = produtos.filter((produto) => produto.pendencias.length > 0).length;

    return {
      loja: {
        slug: negocio.slugPublico,
        nomeComercial: negocio.nomeComercial,
        publicada: Boolean(negocio.slugPublico && negocio.lojaPublicadaEm),
        participaNoMarket: this.lojaParticipaNoMarket(negocio),
        urlLoja: negocio.slugPublico ? `/lojas/${negocio.slugPublico}` : null
      },
      produtos: {
        total: produtos.length,
        publicados,
        elegiveis,
        comPendencias
      },
      seller: this.avaliarSellerOnboarding(negocio, produtos),
      categorias: this.montarCategoriasLoja(pecas),
      itens: produtos
    };
  }

  async obterSellerOnboarding(negocio: NegocioBizy) {
    const resumo = await this.resumirLoja(negocio);
    return {
      seller: resumo.seller,
      loja: resumo.loja,
      checklistCatalogo: resumo.produtos,
      itensComPendencia: resumo.itens.filter((item) => item.pendencias.length > 0).slice(0, 50)
    };
  }

  async atualizarPublicacaoProduto(negocioId: string, codigo: string, publicado: boolean) {
    const peca = await this.pecas.buscarPorCodigo(codigo.trim().toUpperCase(), negocioId);
    if (!peca) throw new Error(`Produto #${codigo} não encontrado.`);

    const atualizada = await this.pecas.atualizar(peca.codigo, {
      vitrine: this.aplicarPublicacaoMarket(peca, publicado)
    }, negocioId);

    return {
      produto: atualizada,
      publicacao: {
        publicado,
        elegivel: this.produtoElegivelMarket(atualizada),
        pendencias: this.pendenciasProdutoMarket(atualizada)
      }
    };
  }

  async atualizarPublicacaoProdutosEmMassa(negocioId: string, codigos: string[], publicado: boolean) {
    const resultados = [];
    for (const codigo of [...new Set(codigos.map((item) => item.trim().toUpperCase()).filter(Boolean))]) {
      try {
        resultados.push(await this.atualizarPublicacaoProduto(negocioId, codigo, publicado));
      } catch (erro) {
        resultados.push({
          erro: erro instanceof Error ? erro.message : "Falha ao atualizar produto.",
          codigo
        });
      }
    }

    return {
      totalSolicitado: codigos.length,
      atualizados: resultados.filter((item) => "produto" in item).length,
      falhas: resultados.filter((item) => "erro" in item),
      resultados
    };
  }

  private lojaParticipaNoMarket(loja: NegocioBizy): boolean {
    const entrega = loja.entrega && typeof loja.entrega === "object" ? loja.entrega as Record<string, unknown> : {};
    const lojaDigital = entrega.lojaDigital && typeof entrega.lojaDigital === "object" ? entrega.lojaDigital as Record<string, unknown> : {};
    return lojaDigital.participaNoMarket !== false;
  }

  private avaliarSellerOnboarding(
    negocio: NegocioBizy,
    produtos: Array<ReturnType<BizyMarketUseCase["resumirProdutoLoja"]>>
  ) {
    const seller = this.extrairSellerOnboarding(negocio);
    const documentos = seller.documentos;
    const pendencias = [
      !negocio.slugPublico || !negocio.lojaPublicadaEm ? "Publicar loja com slug e descrição pública." : null,
      !this.lojaParticipaNoMarket(negocio) ? "Ativar participação da loja no Bizy Market." : null,
      produtos.filter((produto) => produto.elegivel).length === 0 ? "Publicar pelo menos um produto elegível no Market." : null,
      !documentos.nif ? "Informar NIF ou identificação fiscal." : null,
      !documentos.iban ? "Informar IBAN para repasses." : null,
      !documentos.termoAceiteEm ? "Aceitar termos do seller Bizy Market." : null
    ].filter((item): item is string => Boolean(item));
    const estado = pendencias.length === 0 && seller.estado !== "SUSPENSO"
      ? "APROVADO"
      : seller.estado === "APROVADO"
        ? "EM_REVISAO"
        : seller.estado;

    return {
      estado,
      elegivel: estado === "APROVADO",
      pendencias,
      documentos,
      verificacao: seller.verificacao,
      historico: seller.historico,
      atualizadoEm: seller.atualizadoEm ?? null,
      atualizadoPorId: seller.atualizadoPorId ?? null
    };
  }

  private extrairSellerOnboarding(negocio: NegocioBizy): SellerOnboardingMarket {
    const entrega = this.objeto(negocio.entrega);
    const lojaDigital = this.objeto(entrega.lojaDigital);
    const marketplace = this.objeto(lojaDigital.marketplace);
    const seller = this.objeto(marketplace.sellerOnboarding);
    const documentos = this.objeto(seller.documentos);
    const verificacao = this.objeto(seller.verificacao);
    const historicoRaw = Array.isArray(seller.historico) ? seller.historico : [];

    return {
      estado: normalizarEstadoSeller(seller.estado),
      documentos: {
        nif: this.texto(documentos.nif),
        iban: this.texto(documentos.iban),
        identidadeUrl: this.texto(documentos.identidadeUrl),
        comprovativoBancarioUrl: this.texto(documentos.comprovativoBancarioUrl),
        termoAceiteEm: this.texto(documentos.termoAceiteEm)
      },
      verificacao: {
        responsavelNome: this.texto(verificacao.responsavelNome),
        responsavelTelefone: this.texto(verificacao.responsavelTelefone),
        observacao: this.texto(verificacao.observacao)
      },
      historico: historicoRaw
        .map((item) => this.objeto(item))
        .map((item) => ({
          estado: String(item.estado ?? "PENDENTE"),
          motivo: this.texto(item.motivo),
          atualizadoEm: this.texto(item.atualizadoEm) ?? new Date().toISOString(),
          atualizadoPorId: this.texto(item.atualizadoPorId)
        })),
      atualizadoEm: this.texto(seller.atualizadoEm),
      atualizadoPorId: this.texto(seller.atualizadoPorId)
    };
  }

  private async listarItensMarket(): Promise<ItemMarket[]> {
    const lojasPublicadas = (await this.autenticacao.listarNegociosPublicados())
      .filter((loja) => this.lojaParticipaNoMarket(loja))
      .filter((loja) => this.extrairSellerOnboarding(loja).estado !== "SUSPENSO");
    const lojasPorId = new Map(lojasPublicadas.map((loja) => [loja.id, loja]));

    return (await this.pecas.listar())
      .map((peca) => ({ peca, loja: peca.negocioId ? lojasPorId.get(peca.negocioId) ?? null : null }))
      .filter((item): item is ItemMarket => Boolean(item.loja))
      .filter(({ peca }) => this.produtoElegivelMarket(peca));
  }

  private async exigirItemMarketPorId(id: string): Promise<ItemMarket> {
    const peca = await this.pecas.buscarPorId(id);
    if (!peca || !peca.negocioId || !this.produtoElegivelMarket(peca)) throw new Error("Produto não encontrado no Bizy Market.");
    const loja = (await this.autenticacao.listarNegociosPublicados()).find((item) => item.id === peca.negocioId);
    const item = loja && this.lojaParticipaNoMarket(loja) && this.extrairSellerOnboarding(loja).estado !== "SUSPENSO" ? { peca, loja } : null;
    if (!item) throw new Error("Produto não encontrado no Bizy Market.");
    return item;
  }

  private produtoElegivelMarket(peca: Peca): boolean {
    return (
      !peca.arquivadaEm &&
      peca.quantidade > 0 &&
      peca.estado !== "ESGOTADA" &&
      peca.estado !== "VENDIDA" &&
      peca.fotos.length > 0 &&
      peca.precoEmKwanza > 0 &&
      Boolean(peca.categoria?.trim()) &&
      this.produtoPublicadoMarket(peca)
    );
  }

  private itemAtendeFiltros(item: ItemMarket, filtros: FiltrosBizyMarket): boolean {
    const busca = this.normalizarTexto(filtros.busca);
    if (busca) {
      const campos = [
        item.peca.codigo,
        item.peca.sku,
        item.peca.nome,
        item.peca.descricao,
        item.peca.categoria,
        item.peca.colecao,
        item.loja.nomeComercial,
        item.loja.slugPublico
      ].map((valor) => this.normalizarTexto(valor));
      if (!campos.some((campo) => campo.includes(busca))) return false;
    }

    const categoria = this.normalizarTexto(filtros.categoria);
    if (categoria && !this.normalizarTexto(item.peca.categoria).includes(categoria)) return false;

    const provincia = this.normalizarTexto(filtros.provincia);
    if (provincia && !this.normalizarTexto(item.loja.provincia).includes(provincia)) return false;

    const municipio = this.normalizarTexto(filtros.municipio);
    if (municipio && !this.normalizarTexto(item.loja.municipio).includes(municipio)) return false;

    const loja = this.normalizarTexto(filtros.loja);
    if (loja) {
      const nomeLoja = this.normalizarTexto(item.loja.nomeComercial);
      const slugLoja = this.normalizarTexto(item.loja.slugPublico);
      if (!nomeLoja.includes(loja) && !slugLoja.includes(loja)) return false;
    }

    const precoFinal = item.peca.vitrine.precoPromocionalEmKwanza ?? item.peca.precoEmKwanza;
    if (filtros.precoMinimo != null && precoFinal < filtros.precoMinimo) return false;
    if (filtros.precoMaximo != null && precoFinal > filtros.precoMaximo) return false;
    if (filtros.apenasDisponivel && item.peca.quantidade <= 0) return false;
    if (filtros.apenasPromocao && !item.peca.vitrine.precoPromocionalEmKwanza) return false;

    return true;
  }

  private calcularScoreRelevancia(item: ItemMarket): number {
    return this.explicarRanking(item).score;
  }

  private explicarRanking(item: ItemMarket) {
    const seller = this.avaliarSellerOnboarding(item.loja, [this.resumirProdutoLoja(item.peca, item.loja)]);
    const marketplace = this.objeto(this.objeto(this.objeto(item.loja.entrega).lojaDigital).marketplace);
    const operacao = this.objeto(marketplace.metricasOperacionais);
    const cancelamentos = Number(operacao.cancelamentos ?? 0);
    const reclamacoes = Number(operacao.reclamacoes ?? 0);
    const disputas = Number(operacao.disputas ?? 0);
    const cumprimentoEntrega = Math.max(0, Math.min(100, Number(operacao.cumprimentoEntregaPercentual ?? 80)));
    const qualidadeCatalogo = [
      item.peca.fotos.length >= 3,
      Boolean(item.peca.descricao && item.peca.descricao.length > 50),
      Boolean(item.peca.categoria?.trim()),
      item.peca.precoEmKwanza > 0
    ].filter(Boolean).length * 5;
    const disponibilidade = item.peca.estadoStock === "DISPONIVEL" ? 20 : item.peca.estadoStock === "BAIXO_STOCK" ? 8 : 0;
    const confianca = seller.elegivel ? 15 : Math.max(0, 10 - seller.pendencias.length * 2);
    const frescorDias = Math.max(0, Math.floor((Date.now() - item.peca.atualizadoEm.getTime()) / 86_400_000));
    const frescor = frescorDias <= 7 ? 10 : frescorDias <= 30 ? 5 : 0;
    const penalizacoes = Math.min(35, cancelamentos * 3 + reclamacoes * 4 + disputas * 8);
    const risco = disputas > 0 || reclamacoes >= 3;
    const patrocinadoSolicitado = item.peca.vitrine.selos.includes("PATROCINADO");
    const patrocinioElegivel = patrocinadoSolicitado && seller.elegivel && !risco && item.peca.quantidade > 0;
    const score = Math.max(0, Math.round(qualidadeCatalogo + disponibilidade + confianca + frescor + cumprimentoEntrega * 0.2 + (patrocinioElegivel ? 5 : 0) - penalizacoes));
    return {
      score,
      versao: "market.ranking.v1",
      fatores: { qualidadeCatalogo, disponibilidade, confianca, frescor, cumprimentoEntrega, penalizacoes },
      patrocinio: { solicitado: patrocinadoSolicitado, elegivel: patrocinioElegivel },
      explicacao: [
        `${qualidadeCatalogo}/20 em qualidade de catálogo`,
        `${disponibilidade}/20 em disponibilidade`,
        `${cumprimentoEntrega}% de cumprimento de entrega`,
        penalizacoes > 0 ? `${penalizacoes} pontos de penalização operacional` : "sem penalização operacional"
      ]
    };
  }

  private ordenarItensMarket(a: ItemMarket, b: ItemMarket, ordenarPor: NonNullable<FiltrosBizyMarket["ordenarPor"]> = "RELEVANCIA"): number {
    const precoA = a.peca.vitrine.precoPromocionalEmKwanza ?? a.peca.precoEmKwanza;
    const precoB = b.peca.vitrine.precoPromocionalEmKwanza ?? b.peca.precoEmKwanza;
    const descontoA = a.peca.precoEmKwanza > 0 ? (a.peca.precoEmKwanza - precoA) / a.peca.precoEmKwanza : 0;
    const descontoB = b.peca.precoEmKwanza > 0 ? (b.peca.precoEmKwanza - precoB) / b.peca.precoEmKwanza : 0;
    const prioridade = ordenarPor === "PRECO_ASC" ? precoA - precoB
      : ordenarPor === "PRECO_DESC" ? precoB - precoA
      : ordenarPor === "NOVIDADES" ? b.peca.atualizadoEm.getTime() - a.peca.atualizadoEm.getTime()
      : ordenarPor === "MAIOR_DESCONTO" ? descontoB - descontoA
      : ordenarPor === "MAIS_VENDIDOS" ? Number(b.peca.vitrine.selos.includes("MAIS_VENDIDO")) - Number(a.peca.vitrine.selos.includes("MAIS_VENDIDO"))
      : ordenarPor === "ENTREGA_RAPIDA" ? this.cumprimentoEntrega(b.loja) - this.cumprimentoEntrega(a.loja)
      : this.calcularScoreRelevancia(b) - this.calcularScoreRelevancia(a);
    const scoreA = this.calcularScoreRelevancia(a);
    const scoreB = this.calcularScoreRelevancia(b);
    return (
      prioridade || scoreB - scoreA ||
      a.peca.nome.localeCompare(b.peca.nome, "pt-AO", { numeric: true, sensitivity: "base" }) ||
      a.loja.nomeComercial.localeCompare(b.loja.nomeComercial, "pt-AO", { sensitivity: "base" })
    );
  }

  async listarLojasMarket(filtros: FiltrosLojasMarket = {}) {
    const limite = this.normalizarLimite(filtros.limite ?? 24);
    const offset = normalizarOffsetPaginacao(filtros.offset ?? undefined);
    const itens = await this.listarItensMarket();
    const lojasPorId = new Map<string, { loja: NegocioBizy; totalProdutos: number; categorias: Set<string>; scoreTotal: number }>();

    for (const item of itens) {
      const existente = lojasPorId.get(item.loja.id);
      if (existente) {
        existente.totalProdutos++;
        existente.scoreTotal += this.calcularScoreRelevancia(item);
        if (item.peca.categoria?.trim()) existente.categorias.add(item.peca.categoria.trim());
      } else {
        const cats = new Set<string>();
        if (item.peca.categoria?.trim()) cats.add(item.peca.categoria.trim());
        lojasPorId.set(item.loja.id, { loja: item.loja, totalProdutos: 1, categorias: cats, scoreTotal: this.calcularScoreRelevancia(item) });
      }
    }

    let lojas = [...lojasPorId.values()];

    if (filtros.busca) {
      const busca = this.normalizarTexto(filtros.busca);
      lojas = lojas.filter(({ loja }) => {
        const campos = [loja.nomeComercial, loja.slugPublico, loja.descricaoPublica, loja.segmento].map((v) => this.normalizarTexto(v));
        return campos.some((c) => c.includes(busca));
      });
    }
    if (filtros.categoria) {
      const cat = this.normalizarTexto(filtros.categoria);
      lojas = lojas.filter(({ categorias }) => [...categorias].some((c) => this.normalizarTexto(c).includes(cat)));
    }
    if (filtros.provincia) {
      const prov = this.normalizarTexto(filtros.provincia);
      lojas = lojas.filter(({ loja }) => this.normalizarTexto(loja.provincia).includes(prov));
    }

    lojas.sort((a, b) => (b.scoreTotal / b.totalProdutos) - (a.scoreTotal / a.totalProdutos) || b.totalProdutos - a.totalProdutos);

    return {
      lojas: lojas.slice(offset, offset + limite).map(({ loja, totalProdutos, categorias, scoreTotal }) => ({
        ...this.mapearLojaMarket(loja),
        totalProdutos,
        categorias: [...categorias].sort(),
        ranking: { score: Math.round(scoreTotal / totalProdutos), versao: "market.ranking.v1", amostraProdutos: totalProdutos }
      })),
      total: lojas.length,
      paginacao: montarPaginacaoOffset(lojas.length, limite, offset),
      filtros: {
        ...(filtros.busca ? { busca: filtros.busca } : {}),
        ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
        ...(filtros.provincia ? { provincia: filtros.provincia } : {}),
        ...(offset > 0 ? { offset } : {}),
        limite
      }
    };
  }

  async obterLojaMarket(slug: string) {
    const lojas = await this.autenticacao.listarNegociosPublicados();
    const loja = lojas.find((l) => l.slugPublico === slug.trim().toLowerCase());
    if (!loja || !this.lojaParticipaNoMarket(loja)) {
      throw new Error(`Loja '${slug}' não encontrada no Bizy Market.`);
    }

    const pecas = await this.pecas.listar(loja.id);
    const produtos = pecas.filter((p) => this.produtoElegivelMarket(p));
    const categorias = this.montarCategorias(produtos.map((p) => ({ peca: p, loja })));

    return {
      loja: {
        ...this.mapearLojaMarket(loja),
        totalProdutos: produtos.length,
        categorias: categorias.map((c) => c.categoria)
      },
      produtos: produtos
        .sort((a, b) => this.ordenarItensMarket({ peca: a, loja }, { peca: b, loja }))
        .slice(0, 48)
        .map((p) => this.mapearProdutoMarket(p, loja)),
      seo: {
        titulo: `${loja.nomeComercial} | Bizy Market`,
        descricao: this.texto(loja.descricaoPublica) ?? `Produtos de ${loja.nomeComercial} no Bizy Market.`,
        canonicalPath: `/market/lojas/${slug}`,
        imagem: this.texto(this.objeto(this.objeto(loja.entrega).temaLoja).capaUrl)
      }
    };
  }

  async listarLojasRelacionadas(categoria: string, opcoes: { limite?: number | null } = {}) {
    const limite = this.normalizarLimite(opcoes.limite ?? 6);
    const categoriaNorm = this.normalizarTexto(categoria);
    const itens = await this.listarItensMarket();
    const lojasPorId = new Map<string, { loja: NegocioBizy; totalProdutos: number }>();

    for (const item of itens) {
      if (!this.normalizarTexto(item.peca.categoria).includes(categoriaNorm)) continue;
      const existente = lojasPorId.get(item.loja.id);
      if (existente) {
        existente.totalProdutos++;
      } else {
        lojasPorId.set(item.loja.id, { loja: item.loja, totalProdutos: 1 });
      }
    }

    const lojas = [...lojasPorId.values()]
      .sort((a, b) => b.totalProdutos - a.totalProdutos)
      .slice(0, limite);

    return {
      categoria,
      lojas: lojas.map(({ loja, totalProdutos }) => ({
        ...this.mapearLojaMarket(loja),
        totalProdutos
      })),
      total: lojasPorId.size
    };
  }

  async listarBlocoDescoberta(opcoes: { limite?: number | null } = {}) {
    const limite = this.normalizarLimite(opcoes.limite ?? 12);
    const itens = await this.listarItensMarket();

    const maisVendidos = itens
      .filter((i) => i.peca.vitrine.selos.includes("MAIS_VENDIDO"))
      .sort((a, b) => this.ordenarItensMarket(a, b))
      .slice(0, limite);

    const novidades = itens
      .filter((i) => i.peca.vitrine.selos.includes("NOVIDADE"))
      .sort((a, b) => this.ordenarItensMarket(a, b))
      .slice(0, limite);

    const promocoes = itens
      .filter((i) => Boolean(i.peca.vitrine.precoPromocionalEmKwanza))
      .sort((a, b) => this.ordenarItensMarket(a, b))
      .slice(0, limite);

    return {
      maisVendidos: maisVendidos.map(({ peca, loja }) => this.mapearProdutoMarket(peca, loja)),
      novidades: novidades.map(({ peca, loja }) => this.mapearProdutoMarket(peca, loja)),
      promocoes: promocoes.map(({ peca, loja }) => this.mapearProdutoMarket(peca, loja))
    };
  }

  private mapearProdutoMarket(peca: Peca, loja: NegocioBizy) {
    const slug = loja.slugPublico ?? "";
    const patrocinado = peca.vitrine.selos.includes("PATROCINADO");
    return {
      id: peca.id,
      listingId: peca.id,
      codigo: peca.codigo,
      sku: peca.sku,
      nome: peca.nome,
      descricao: peca.descricao,
      categoria: peca.categoria,
      colecao: peca.colecao,
      precoEmKwanza: peca.precoEmKwanza,
      precoPromocionalEmKwanza: peca.vitrine.precoPromocionalEmKwanza,
      quantidade: peca.quantidade,
      fotos: peca.fotos,
      variantes: peca.variantes,
      vitrine: peca.vitrine,
      estadoStock: peca.estadoStock,
      patrocinado,
      ranking: this.explicarRanking({ peca, loja }),
      urlProduto: this.urlProduto(peca),
      urlLoja: `/lojas/${slug}`,
      loja: this.mapearLojaMarket(loja)
    };
  }

  private mapearLojaMarket(loja: NegocioBizy) {
    const entrega = this.objeto(loja.entrega);
    const tema = this.objeto(entrega.temaLoja);
    return {
      slug: loja.slugPublico,
      nomeComercial: loja.nomeComercial,
      descricaoPublica: loja.descricaoPublica,
      segmento: loja.segmento,
      tipo: loja.tipo,
      provincia: loja.provincia,
      municipio: loja.municipio,
      corPrimaria: this.texto(tema.corPrimaria) ?? "#111111",
      logoUrl: this.texto(tema.logoUrl),
      capaUrl: this.texto(tema.capaUrl)
    };
  }

  private montarCategorias(items: ItemMarket[]) {
    return this.normalizarCategoriasAgregadas(items.map(({ peca }) => ({ categoria: peca.categoria ?? "", total: 1 })));
  }

  private normalizarCategoriasAgregadas(items: Array<{ categoria: string; total: number }>) {
    const totais = new Map<string, { categoria: string; total: number }>();
    for (const item of items) {
      const categoria = item.categoria.trim();
      const chave = this.normalizarTexto(categoria);
      if (!chave) continue;
      const atual = totais.get(chave);
      totais.set(chave, { categoria: atual?.categoria ?? categoria, total: (atual?.total ?? 0) + item.total });
    }
    return [...totais.values()]
      .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, "pt-AO", { sensitivity: "base" }));
  }

  private mapearSeoProdutoMarket(item: ItemMarket) {
    const titulo = `${item.peca.nome} | Bizy Market`;
    const descricao = this.texto(item.peca.descricao) ?? `${item.peca.nome} vendido por ${item.loja.nomeComercial}.`;
    return {
      titulo,
      descricao,
      canonicalPath: this.urlProduto(item.peca),
      imagem: item.peca.fotos[0] ?? null,
      previewSocial: {
        whatsapp: { titulo, descricao, imagem: item.peca.fotos[0] ?? null, url: this.urlProduto(item.peca) },
        navegador: { title: titulo, metaDescription: descricao, canonicalPath: this.urlProduto(item.peca) }
      }
    };
  }

  private resumirProdutoLoja(peca: Peca, negocio: NegocioBizy) {
    const pendencias = this.pendenciasProdutoMarket(peca);
    const publicado = this.produtoElegivelMarket(peca);
    return {
      codigo: peca.codigo,
      nome: peca.nome,
      categoria: peca.categoria,
      colecao: peca.colecao,
      publicado,
      elegivel: pendencias.length === 0,
      pendencias,
      urlProduto: negocio.slugPublico ? `/lojas/${negocio.slugPublico}/produtos/${peca.codigo}` : null
    };
  }

  private pendenciasProdutoMarket(peca: Peca): string[] {
    return [
      peca.arquivadaEm ? "Produto arquivado." : null,
      peca.quantidade <= 0 ? "Produto sem stock disponível." : null,
      peca.estado === "ESGOTADA" || peca.estado === "VENDIDA" ? "Produto vendido ou esgotado." : null,
      peca.fotos.length === 0 ? "Adicionar pelo menos uma imagem." : null,
      peca.precoEmKwanza <= 0 ? "Definir preço público." : null,
      !peca.categoria?.trim() ? "Definir categoria global." : null,
      !this.produtoPublicadoMarket(peca) ? (peca.vitrine.visibilidade === "loja" ? "Produto visível apenas na loja própria." : peca.vitrine.visibilidade === "campanhas" ? "Produto reservado para campanhas." : "Produto despublicado do Bizy Market.") : null
    ].filter((item): item is string => Boolean(item));
  }

  private montarCategoriasLoja(pecas: Peca[]) {
    const totais = new Map<string, number>();
    for (const peca of pecas) {
      const categoria = peca.categoria?.trim();
      if (!categoria) continue;
      totais.set(categoria, (totais.get(categoria) ?? 0) + 1);
    }
    return [...totais.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, "pt-AO", { sensitivity: "base" }));
  }

  private aplicarPublicacaoMarket(peca: Peca, publicado: boolean): Peca["vitrine"] {
    return {
      ...peca.vitrine,
      publicacaoMarket: {
        publicado,
        atualizadoEm: new Date().toISOString(),
        origem: "team"
      }
    };
  }

  private produtoPublicadoMarket(peca: Peca): boolean {
    if (peca.vitrine.visibilidade === "loja" || peca.vitrine.visibilidade === "campanhas") return false;
    return peca.vitrine.publicacaoMarket?.publicado !== false;
  }

  private mapearFiltrosAplicados(filtros: FiltrosBizyMarket, limite: number, offset: number) {
    return {
      ...(filtros.busca ? { busca: filtros.busca } : {}),
      ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
      ...(filtros.provincia ? { provincia: filtros.provincia } : {}),
      ...(filtros.municipio ? { municipio: filtros.municipio } : {}),
      ...(filtros.loja ? { loja: filtros.loja } : {}),
      ...(filtros.precoMinimo != null ? { precoMinimo: filtros.precoMinimo } : {}),
      ...(filtros.precoMaximo != null ? { precoMaximo: filtros.precoMaximo } : {}),
      ...(filtros.apenasDisponivel ? { apenasDisponivel: true } : {}),
      ...(filtros.apenasPromocao ? { apenasPromocao: true } : {}),
      ...(filtros.ordenarPor && filtros.ordenarPor !== "RELEVANCIA" ? { ordenarPor: filtros.ordenarPor } : {}),
      ...(offset > 0 ? { offset } : {}),
      limite
    };
  }

  private normalizarLimite(limite?: number | null): number {
    return normalizarLimitePaginacao(limite ?? undefined, 48, 100);
  }

  private urlProduto(peca: Peca) {
    const slug = this.normalizarTexto(peca.nome).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "produto";
    return `/market/p/${peca.id}/${slug}`;
  }

  private cumprimentoEntrega(loja: NegocioBizy) {
    const marketplace = this.objeto(this.objeto(this.objeto(loja.entrega).lojaDigital).marketplace);
    const operacao = this.objeto(marketplace.metricasOperacionais);
    return Math.max(0, Math.min(100, Number(operacao.cumprimentoEntregaPercentual ?? 0)));
  }

  private modalidadeOferta(regras: Record<string, unknown>) {
    const valor = String(regras.modalidadeAcesso ?? "APPROVAL_REQUIRED").toUpperCase();
    return ["OPEN_ACCESS", "APPROVAL_REQUIRED", "INVITE_ONLY", "CAMPAIGN_CURATED"].includes(valor) ? valor : "APPROVAL_REQUIRED";
  }

  private normalizarTexto(valor?: string | null): string {
    return (valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  private objeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }

  private texto(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  }
}

function normalizarEstadoSeller(valor: unknown): SellerOnboardingMarket["estado"] {
  const estado = typeof valor === "string" ? valor.toUpperCase() : "";
  if (["RASCUNHO", "PENDENTE", "EM_REVISAO", "APROVADO", "REJEITADO", "SUSPENSO"].includes(estado)) {
    return estado as SellerOnboardingMarket["estado"];
  }
  return "PENDENTE";
}
