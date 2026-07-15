import { randomUUID } from "node:crypto";
import type { RepositorioPecas } from "../../../../dominio/repositorios/contratos.js";
import { criarChaveCombinacaoVariante } from "../../../../dominio/servicos/VariantesProduto.js";
import type {
  CarrinhoCommerce,
  ItemCarrinhoCommerce,
  ItemCarrinhoResolvido,
  RepositorioCarrinhosCommerce
} from "../../dominio/carrinhoCommerce.js";

export class RepositorioCarrinhosCommerceMemoria implements RepositorioCarrinhosCommerce {
  private readonly carrinhos: CarrinhoCommerce[] = [];
  private readonly reservasExpiramEm = new Map<string, Date>();

  constructor(private readonly pecas?: RepositorioPecas) {}

  async criar(dados: { tokenHash: string | null; contaBizyId: string | null; sessaoCommerceId: string | null; expiraEm: Date }) {
    const agora = new Date();
    const carrinho: CarrinhoCommerce & { tokenHash: string | null } = {
      id: randomUUID(), tokenHash: dados.tokenHash, contaBizyId: dados.contaBizyId, sessaoCommerceId: dados.sessaoCommerceId,
      estado: "ABERTO", expiraEm: dados.expiraEm, convertidoEm: null,
      criadoEm: agora, atualizadoEm: agora, itens: []
    };
    this.carrinhos.push(carrinho);
    return this.publicar(carrinho);
  }

  async buscarPorTokenHash(tokenHash: string, agora: Date) {
    const carrinho = this.carrinhos.find((item) => (item as CarrinhoCommerce & { tokenHash?: string }).tokenHash === tokenHash);
    return this.aberto(carrinho, agora) ? this.publicar(carrinho!) : null;
  }

  async buscarAbertoPorConta(contaBizyId: string, agora: Date) {
    const carrinho = [...this.carrinhos].reverse().find((item) => item.contaBizyId === contaBizyId);
    return this.aberto(carrinho, agora) ? this.publicar(carrinho!) : null;
  }

  async buscarPorIdEConta(id: string, contaBizyId: string, agora: Date) {
    const carrinho = this.carrinhos.find((item) => item.id === id && item.contaBizyId === contaBizyId);
    return this.aberto(carrinho, agora) ? this.publicar(carrinho!) : null;
  }

  async substituirItens(id: string, itens: ItemCarrinhoResolvido[], carrinhoExpiraEm: Date, reservaExpiraEm: Date) {
    const carrinho = this.carrinhos.find((item) => item.id === id);
    if (!carrinho || carrinho.estado !== "ABERTO") throw new Error("Carrinho não encontrado.");

    for (const item of itens) {
      const reservadoNoutros = this.carrinhos
        .filter((outro) => outro.id !== id && outro.estado === "ABERTO" && (this.reservasExpiramEm.get(outro.id)?.getTime() ?? 0) > Date.now())
        .flatMap((outro) => outro.itens)
        .filter((outro) => outro.pecaId === item.pecaId && outro.variantePecaId === item.variantePecaId)
        .reduce((total, outro) => total + outro.quantidade, 0);
      if (item.quantidade > item.stockDisponivel - reservadoNoutros) {
        throw new Error(`Stock insuficiente para ${item.nomeProduto}.`);
      }
    }

    const agora = new Date();
    carrinho.itens = itens.map(({ stockDisponivel: _stock, ...item }): ItemCarrinhoCommerce => ({
      ...item, id: randomUUID(), carrinhoId: id, criadoEm: agora, atualizadoEm: agora
    }));
    carrinho.expiraEm = carrinhoExpiraEm;
    this.reservasExpiramEm.set(id, reservaExpiraEm);
    carrinho.atualizadoEm = agora;
    return this.publicar(carrinho);
  }

  async associarConta(id: string, contaBizyId: string) {
    const carrinho = this.carrinhos.find((item) => item.id === id && item.estado === "ABERTO");
    if (!carrinho) return null;
    carrinho.contaBizyId = contaBizyId;
    carrinho.atualizadoEm = new Date();
    return this.publicar(carrinho);
  }

  async vincularSessao(id: string, sessaoCommerceId: string) {
    const carrinho = this.carrinhos.find((item) => item.id === id && item.estado === "ABERTO");
    if (!carrinho) return null;
    carrinho.sessaoCommerceId = sessaoCommerceId;
    carrinho.atualizadoEm = new Date();
    return this.publicar(carrinho);
  }

  async abandonar(id: string) {
    const carrinho = this.carrinhos.find((item) => item.id === id);
    if (carrinho && carrinho.estado === "ABERTO") carrinho.estado = "ABANDONADO";
    this.reservasExpiramEm.delete(id);
  }

  async converter(id: string) {
    const carrinho = this.carrinhos.find((item) => item.id === id);
    if (!carrinho || carrinho.estado !== "ABERTO" || (this.reservasExpiramEm.get(id)?.getTime() ?? 0) <= Date.now()) {
      throw new Error("Reserva do carrinho expirada.");
    }
    if (this.pecas) {
      for (const item of carrinho.itens) {
        const anterior = await this.pecas.buscarPorCodigo(item.codigoPeca, item.negocioId);
        if (!anterior) throw new Error("Produto não encontrado durante o checkout.");
        if (item.variantePecaId) {
          await this.pecas.decrementarStockVariante(item.pecaId, criarChaveCombinacaoVariante(item.selecaoVariante), item.quantidade);
        } else {
          if (anterior.quantidade < item.quantidade) throw new Error("Stock do produto alterado durante o checkout.");
          await this.pecas.atualizar(item.codigoPeca, { quantidade: anterior.quantidade - item.quantidade }, item.negocioId);
        }
        const actual = await this.pecas.buscarPorCodigo(item.codigoPeca, item.negocioId);
        await this.pecas.registrarMovimentoStock({
          negocioId: item.negocioId, pecaId: item.pecaId, codigoPeca: item.codigoPeca,
          tipo: "SAIDA", quantidade: item.quantidade, quantidadeAnterior: anterior.quantidade,
          quantidadeNova: actual?.quantidade ?? anterior.quantidade - item.quantidade,
          motivo: "Conversão de carrinho Commerce", origem: "checkout-bizy"
        });
      }
    }
    carrinho.estado = "CONVERTIDO";
    carrinho.convertidoEm = new Date();
    carrinho.atualizadoEm = carrinho.convertidoEm;
    return this.publicar(carrinho);
  }

  private aberto(carrinho: CarrinhoCommerce | undefined, agora: Date) {
    return Boolean(carrinho && carrinho.estado === "ABERTO" && carrinho.expiraEm > agora);
  }

  private publicar(carrinho: CarrinhoCommerce): CarrinhoCommerce {
    return { ...carrinho, itens: carrinho.itens.map((item) => ({ ...item })) };
  }
}
