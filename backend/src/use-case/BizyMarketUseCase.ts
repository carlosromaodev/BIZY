import type {
  RepositorioAutenticacao,
  RepositorioPecas
} from "../dominio/repositorios/contratos.js";
import type { NegocioBizy, Peca } from "../dominio/tipos.js";

export interface FiltrosBizyMarket {
  busca?: string | null;
  categoria?: string | null;
  loja?: string | null;
  municipio?: string | null;
  provincia?: string | null;
  limite?: number | null;
}

type ItemMarket = { peca: Peca; loja: NegocioBizy };

export class BizyMarketUseCase {
  constructor(
    private readonly autenticacao: RepositorioAutenticacao,
    private readonly pecas: RepositorioPecas
  ) {}

  async listarProdutos(filtros: FiltrosBizyMarket = {}) {
    const limite = this.normalizarLimite(filtros.limite);
    const produtos = (await this.listarItensMarket())
      .filter((item) => this.itemAtendeFiltros(item, filtros))
      .sort((a, b) => this.ordenarItensMarket(a, b));

    const produtosLimitados = produtos.slice(0, limite);

    return {
      produtos: produtosLimitados.map(({ peca, loja }) => this.mapearProdutoMarket(peca, loja)),
      total: produtos.length,
      filtros: this.mapearFiltrosAplicados(filtros, limite),
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
        urlLoja: negocio.slugPublico ? `/lojas/${negocio.slugPublico}` : null
      },
      produtos: {
        total: produtos.length,
        publicados,
        elegiveis,
        comPendencias
      },
      categorias: this.montarCategoriasLoja(pecas),
      itens: produtos
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

  private async listarItensMarket(): Promise<ItemMarket[]> {
    const lojasPublicadas = await this.autenticacao.listarNegociosPublicados();
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

    return true;
  }

  private ordenarItensMarket(a: ItemMarket, b: ItemMarket): number {
    return (
      a.peca.vitrine.prioridade - b.peca.vitrine.prioridade ||
      a.peca.nome.localeCompare(b.peca.nome, "pt-AO", { numeric: true, sensitivity: "base" }) ||
      a.loja.nomeComercial.localeCompare(b.loja.nomeComercial, "pt-AO", { sensitivity: "base" })
    );
  }

  private mapearProdutoMarket(peca: Peca, loja: NegocioBizy) {
    const slug = loja.slugPublico ?? "";
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
      !this.produtoPublicadoMarket(peca) ? "Produto despublicado do Bizy Market." : null
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
        origem: "crm"
      }
    };
  }

  private produtoPublicadoMarket(peca: Peca): boolean {
    return peca.vitrine.publicacaoMarket?.publicado !== false;
  }

  private mapearFiltrosAplicados(filtros: FiltrosBizyMarket, limite: number) {
    return {
      ...(filtros.busca ? { busca: filtros.busca } : {}),
      ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
      ...(filtros.provincia ? { provincia: filtros.provincia } : {}),
      ...(filtros.municipio ? { municipio: filtros.municipio } : {}),
      ...(filtros.loja ? { loja: filtros.loja } : {}),
      limite
    };
  }

  private normalizarLimite(limite?: number | null): number {
    if (!limite || Number.isNaN(limite)) return 48;
    return Math.max(1, Math.min(Math.trunc(limite), 100));
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
