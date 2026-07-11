import type {
  RepositorioAutenticacao,
  RepositorioPecas
} from "../../../dominio/repositorios/contratos.js";
import type { NegocioBizy, Peca } from "../../../dominio/tipos.js";
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
    private readonly pecas: RepositorioPecas
  ) {}

  async listarProdutos(filtros: FiltrosBizyMarket = {}) {
    const limite = this.normalizarLimite(filtros.limite);
    const offset = normalizarOffsetPaginacao(filtros.offset ?? undefined);
    const produtos = (await this.listarItensMarket())
      .filter((item) => this.itemAtendeFiltros(item, filtros))
      .sort((a, b) => this.ordenarItensMarket(a, b));

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

  async obterProduto(codigo: string) {
    const item = await this.exigirItemMarket(codigo);
    const similares = await this.listarProdutosSimilares(codigo, { limite: 6 });

    return {
      produto: this.mapearProdutoMarket(item.peca, item.loja),
      similares: similares.produtos,
      seo: this.mapearSeoProdutoMarket(item)
    };
  }

  async listarProdutosSimilares(codigo: string, opcoes: { limite?: number | null } = {}) {
    const origem = await this.exigirItemMarket(codigo);
    const limite = this.normalizarLimite(opcoes.limite ?? 12);
    const categoriaOrigem = this.normalizarTexto(origem.peca.categoria);
    const precoOrigem = origem.peca.precoEmKwanza;

    const produtos = (await this.listarItensMarket())
      .filter((item) => item.peca.codigo !== origem.peca.codigo)
      .filter((item) => item.loja.id !== origem.loja.id)
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
      .filter((loja) => this.lojaParticipaNoMarket(loja));
    const lojasPorId = new Map(lojasPublicadas.map((loja) => [loja.id, loja]));

    return (await this.pecas.listar())
      .map((peca) => ({ peca, loja: peca.negocioId ? lojasPorId.get(peca.negocioId) ?? null : null }))
      .filter((item): item is ItemMarket => Boolean(item.loja))
      .filter(({ peca }) => this.produtoElegivelMarket(peca));
  }

  private async exigirItemMarket(codigo: string): Promise<ItemMarket> {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const item = (await this.listarItensMarket()).find((produto) => produto.peca.codigo === codigoNormalizado);
    if (!item) throw new Error(`Produto #${codigo} não encontrado no Bizy Market.`);
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
    let score = 0;
    if (item.peca.quantidade > 0) score += 30;
    if (item.peca.fotos.length >= 3) score += 10;
    if (item.peca.descricao && item.peca.descricao.length > 50) score += 10;
    if (item.peca.vitrine.precoPromocionalEmKwanza) score += 5;
    if (item.peca.estadoStock === "DISPONIVEL") score += 15;
    if (item.peca.estadoStock === "BAIXO_STOCK") score += 5;
    if (item.peca.vitrine.selos.includes("PATROCINADO")) score += 20;
    if (item.peca.vitrine.selos.includes("DESTAQUE")) score += 15;
    if (item.peca.vitrine.selos.includes("MAIS_VENDIDO")) score += 10;
    if (item.peca.vitrine.selos.includes("NOVIDADE")) score += 5;
    score -= item.peca.vitrine.prioridade;
    return score;
  }

  private ordenarItensMarket(a: ItemMarket, b: ItemMarket): number {
    const scoreA = this.calcularScoreRelevancia(a);
    const scoreB = this.calcularScoreRelevancia(b);
    return (
      scoreB - scoreA ||
      a.peca.nome.localeCompare(b.peca.nome, "pt-AO", { numeric: true, sensitivity: "base" }) ||
      a.loja.nomeComercial.localeCompare(b.loja.nomeComercial, "pt-AO", { sensitivity: "base" })
    );
  }

  async listarLojasMarket(filtros: FiltrosLojasMarket = {}) {
    const limite = this.normalizarLimite(filtros.limite ?? 24);
    const offset = normalizarOffsetPaginacao(filtros.offset ?? undefined);
    const itens = await this.listarItensMarket();
    const lojasPorId = new Map<string, { loja: NegocioBizy; totalProdutos: number; categorias: Set<string> }>();

    for (const item of itens) {
      const existente = lojasPorId.get(item.loja.id);
      if (existente) {
        existente.totalProdutos++;
        if (item.peca.categoria?.trim()) existente.categorias.add(item.peca.categoria.trim());
      } else {
        const cats = new Set<string>();
        if (item.peca.categoria?.trim()) cats.add(item.peca.categoria.trim());
        lojasPorId.set(item.loja.id, { loja: item.loja, totalProdutos: 1, categorias: cats });
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

    lojas.sort((a, b) => b.totalProdutos - a.totalProdutos);

    return {
      lojas: lojas.slice(offset, offset + limite).map(({ loja, totalProdutos, categorias }) => ({
        ...this.mapearLojaMarket(loja),
        totalProdutos,
        categorias: [...categorias].sort()
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
      urlProduto: `/lojas/${slug}/produtos/${peca.codigo}`,
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
    const totais = new Map<string, number>();
    for (const { peca } of items) {
      const categoria = peca.categoria?.trim();
      if (!categoria) continue;
      totais.set(categoria, (totais.get(categoria) ?? 0) + 1);
    }

    return [...totais.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, "pt-AO", { sensitivity: "base" }));
  }

  private mapearSeoProdutoMarket(item: ItemMarket) {
    const titulo = `${item.peca.nome} | Bizy Market`;
    const descricao = this.texto(item.peca.descricao) ?? `${item.peca.nome} vendido por ${item.loja.nomeComercial}.`;
    return {
      titulo,
      descricao,
      canonicalPath: `/market/produtos/${item.peca.codigo}`,
      imagem: item.peca.fotos[0] ?? null,
      previewSocial: {
        whatsapp: { titulo, descricao, imagem: item.peca.fotos[0] ?? null, url: `/market/produtos/${item.peca.codigo}` },
        navegador: { title: titulo, metaDescription: descricao, canonicalPath: `/market/produtos/${item.peca.codigo}` }
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
      ...(offset > 0 ? { offset } : {}),
      limite
    };
  }

  private normalizarLimite(limite?: number | null): number {
    return normalizarLimitePaginacao(limite ?? undefined, 48, 100);
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
