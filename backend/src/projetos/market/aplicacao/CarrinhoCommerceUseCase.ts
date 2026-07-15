import { createHash, randomBytes } from "node:crypto";
import type { RepositorioAutenticacao, RepositorioPecas } from "../../../dominio/repositorios/contratos.js";
import { encontrarCombinacaoVariante, validarSelecaoVariante } from "../../../dominio/servicos/VariantesProduto.js";
import type {
  CarrinhoCommerce,
  ItemCarrinhoResolvido,
  ItemEntradaCarrinhoCommerce,
  RepositorioCarrinhosCommerce
} from "../dominio/carrinhoCommerce.js";

interface DependenciasCarrinho {
  carrinhos: RepositorioCarrinhosCommerce;
  autenticacao: RepositorioAutenticacao;
  pecas: RepositorioPecas;
}

export class CarrinhoCommerceUseCase {
  private readonly ttlReservaMs: number;
  private readonly ttlCarrinhoMs = 30 * 24 * 60 * 60_000;

  constructor(
    private readonly deps: DependenciasCarrinho,
    private readonly segredo: string,
    minutosReserva = 30
  ) {
    this.ttlReservaMs = Math.max(5, minutosReserva) * 60_000;
  }

  async obter(contaBizyId: string | null, token: string | null) {
    const agora = new Date();
    if (contaBizyId) return this.deps.carrinhos.buscarAbertoPorConta(contaBizyId, agora);
    if (!token) return null;
    return this.deps.carrinhos.buscarPorTokenHash(this.hashToken(token), agora);
  }

  async obterPorIdAutorizado(id: string, contaBizyId: string | null, token: string | null) {
    const carrinho = await this.obter(contaBizyId, token);
    return carrinho?.id === id ? carrinho : null;
  }

  async sincronizar(dados: {
    contaBizyId: string | null;
    token: string | null;
    itens: ItemEntradaCarrinhoCommerce[];
    modo: "MESCLAR" | "SUBSTITUIR";
  }): Promise<{ carrinho: CarrinhoCommerce; token: string | null }> {
    const agora = new Date();
    const guest = dados.token
      ? await this.deps.carrinhos.buscarPorTokenHash(this.hashToken(dados.token), agora)
      : null;
    let carrinho = dados.contaBizyId
      ? await this.deps.carrinhos.buscarAbertoPorConta(dados.contaBizyId, agora)
      : guest;
    let tokenNovo: string | null = null;

    if (dados.contaBizyId && guest && carrinho?.id !== guest.id) {
      if (!carrinho) {
        carrinho = await this.deps.carrinhos.associarConta(guest.id, dados.contaBizyId);
      } else {
        const entradas = this.mesclarEntradas(this.entradasCarrinho(carrinho), this.entradasCarrinho(guest));
        carrinho = await this.deps.carrinhos.substituirItens(carrinho.id, await this.resolverItens(entradas), this.expiracaoCarrinho(), this.expiracaoReserva());
        await this.deps.carrinhos.abandonar(guest.id);
      }
    }

    if (!carrinho) {
      if (dados.contaBizyId) {
        carrinho = await this.deps.carrinhos.criar({ tokenHash: null, contaBizyId: dados.contaBizyId, expiraEm: this.expiracaoCarrinho() });
      } else {
        tokenNovo = randomBytes(32).toString("base64url");
        carrinho = await this.deps.carrinhos.criar({ tokenHash: this.hashToken(tokenNovo), contaBizyId: null, expiraEm: this.expiracaoCarrinho() });
      }
    }

    const entradas = dados.modo === "MESCLAR"
      ? this.mesclarEntradas(this.entradasCarrinho(carrinho), dados.itens)
      : this.mesclarEntradas([], dados.itens);
    const actualizado = await this.deps.carrinhos.substituirItens(carrinho.id, await this.resolverItens(entradas), this.expiracaoCarrinho(), this.expiracaoReserva());
    return { carrinho: actualizado, token: tokenNovo };
  }

  async limpar(contaBizyId: string | null, token: string | null) {
    const carrinho = await this.obter(contaBizyId, token);
    if (!carrinho) return null;
    return this.deps.carrinhos.substituirItens(carrinho.id, [], this.expiracaoCarrinho(), this.expiracaoReserva());
  }

  private async resolverItens(itens: ItemEntradaCarrinhoCommerce[]): Promise<ItemCarrinhoResolvido[]> {
    const resolvidos: ItemCarrinhoResolvido[] = [];
    for (const item of itens) {
      const negocio = await this.deps.autenticacao.buscarNegocioPorSlugPublico(item.slugLoja);
      if (!negocio) throw new Error(`Loja ${item.slugLoja} não encontrada.`);
      const peca = await this.deps.pecas.buscarPorCodigo(item.codigoPeca, negocio.id);
      if (!peca || peca.arquivadaEm || peca.estado === "ESGOTADA") throw new Error(`Produto ${item.codigoPeca} indisponível.`);
      const selecao = validarSelecaoVariante(peca.variantes, item.varianteSelecionada);
      const combinacoes = await this.deps.pecas.listarVariantesPeca(peca.id);
      const variante = Object.keys(peca.variantes).length ? encontrarCombinacaoVariante(combinacoes, selecao) : null;
      if (Object.keys(peca.variantes).length && !variante) throw new Error(`Variante de ${item.codigoPeca} indisponível.`);
      const quantidade = Math.max(1, Math.min(99, Math.round(item.quantidade)));
      const preco = variante?.precoEmKwanza ?? peca.vitrine.precoPromocionalEmKwanza ?? peca.precoEmKwanza;
      const chaveItem = `${peca.id}:${variante?.id ?? "padrao"}`;
      resolvidos.push({
        negocioId: negocio.id, slugLoja: item.slugLoja, pecaId: peca.id,
        variantePecaId: variante?.id ?? null, codigoPeca: peca.codigo,
        nomeProduto: peca.nome, nomeFornecedor: negocio.nomeComercial,
        quantidade, precoUnitarioEmKwanza: preco, fotoUrl: peca.fotos[0] ?? null,
        urlProduto: `/market/produtos/${encodeURIComponent(peca.codigo)}`,
        urlLoja: `/lojas/${encodeURIComponent(item.slugLoja)}`,
        selecaoVariante: selecao, origem: item.origem?.trim() || "market",
        atribuicao: item.atribuicao ?? {}, chaveItem,
        stockDisponivel: variante?.quantidade ?? peca.quantidade
      });
    }
    return resolvidos;
  }

  private entradasCarrinho(carrinho: CarrinhoCommerce): ItemEntradaCarrinhoCommerce[] {
    return carrinho.itens.map((item) => ({
      slugLoja: item.slugLoja, codigoPeca: item.codigoPeca,
      varianteSelecionada: item.selecaoVariante, quantidade: item.quantidade,
      origem: item.origem, atribuicao: item.atribuicao
    }));
  }

  private mesclarEntradas(base: ItemEntradaCarrinhoCommerce[], novas: ItemEntradaCarrinhoCommerce[]) {
    const mapa = new Map<string, ItemEntradaCarrinhoCommerce>();
    for (const entrada of [...base, ...novas]) {
      const selecao = Object.entries(entrada.varianteSelecionada ?? {}).sort(([a], [b]) => a.localeCompare(b));
      const chave = `${entrada.slugLoja.trim()}:${entrada.codigoPeca.trim()}:${JSON.stringify(selecao)}`;
      const actual = mapa.get(chave);
      mapa.set(chave, { ...entrada, quantidade: Math.min(99, Math.max(actual?.quantidade ?? 0, entrada.quantidade)) });
    }
    return [...mapa.values()].filter((item) => item.quantidade > 0);
  }

  private expiracaoCarrinho() {
    return new Date(Date.now() + this.ttlCarrinhoMs);
  }

  private expiracaoReserva() {
    return new Date(Date.now() + this.ttlReservaMs);
  }

  private hashToken(token: string) {
    return createHash("sha256").update(`${this.segredo}:carrinho-commerce:${token}`).digest("hex");
  }
}
