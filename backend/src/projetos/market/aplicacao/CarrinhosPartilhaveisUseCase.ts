import { randomBytes } from "node:crypto";
import type { ItemEntradaCarrinhoCommerce } from "../dominio/carrinhoCommerce.js";
import type { RepositorioCarrinhosPartilhaveis } from "../dominio/carrinhosPartilhaveis.js";
import type { CarrinhoCommerceUseCase } from "./CarrinhoCommerceUseCase.js";

export class CarrinhosPartilhaveisUseCase {
  constructor(
    private readonly repositorio: RepositorioCarrinhosPartilhaveis,
    private readonly carrinhos: CarrinhoCommerceUseCase
  ) {}

  async criar(contaBizyId: string, dados: { parceiroId?: string | null; criadoPorTipo: string; titulo: string; descricao?: string | null; campanhaId?: string | null; liveId?: string | null; expiraEm?: Date | null; itens: ItemEntradaCarrinhoCommerce[] }) {
    if (dados.parceiroId && !await this.repositorio.parceiroAtivoDaConta(dados.parceiroId, contaBizyId)) {
      throw new Error("PARCEIRO_NAO_ENCONTRADO");
    }
    const resolvido = await this.carrinhos.sincronizar({ contaBizyId, sessaoCommerceId: null, token: null, itens: dados.itens, modo: "SUBSTITUIR" });
    if (!resolvido.carrinho.itens.length) throw new Error("CARRINHO_VAZIO");
    const negocioIds = [...new Set(resolvido.carrinho.itens.map((item) => item.negocioId))];
    return this.repositorio.criar({ codigo: randomBytes(7).toString("base64url").toUpperCase(), criadoPorTipo: dados.criadoPorTipo, contaBizyId, parceiroId: dados.parceiroId ?? null, negocioId: negocioIds.length === 1 ? negocioIds[0] : null, campanhaId: dados.campanhaId ?? null, liveId: dados.liveId ?? null, titulo: dados.titulo, descricao: dados.descricao ?? null, expiraEm: dados.expiraEm ?? null, itensJson: JSON.stringify(resolvido.carrinho.itens.map((item) => ({ slugLoja: item.slugLoja, codigoPeca: item.codigoPeca, varianteSelecionada: item.selecaoVariante, quantidade: item.quantidade, nomeProduto: item.nomeProduto, nomeFornecedor: item.nomeFornecedor, precoUnitarioEmKwanza: item.precoUnitarioEmKwanza, fotoUrl: item.fotoUrl }))) });
  }

  listar(contaBizyId: string) {
    return this.repositorio.listarPorConta(contaBizyId);
  }

  async obterPublico(codigo: string) {
    const item = await this.repositorio.buscarPublicoPorCodigo(codigo, new Date());
    if (!item) return null;
    await this.repositorio.incrementarVisualizacoes(item.id);
    return { ...item, itens: this.itens(item.itensJson) };
  }

  async importar(codigo: string, contaBizyId: string | null, token: string | null) {
    const partilhado = await this.repositorio.buscarPublicoPorCodigo(codigo, new Date());
    if (!partilhado) return null;
    const itens = this.itens(partilhado.itensJson).map((item) => ({ slugLoja: item.slugLoja, codigoPeca: item.codigoPeca, varianteSelecionada: item.varianteSelecionada, quantidade: item.quantidade, origem: partilhado.liveId ? "live-afiliada" : "carrinho-partilhado", atribuicao: { carrinhoPartilhavelId: partilhado.id, codigoCarrinho: partilhado.codigo, parceiroId: partilhado.parceiroId, campanhaId: partilhado.campanhaId, liveId: partilhado.liveId, papel: partilhado.liveId ? "HOST" : partilhado.criadoPorTipo } }));
    const resultado = await this.carrinhos.sincronizar({ contaBizyId, sessaoCommerceId: null, token, itens, modo: "MESCLAR" });
    await this.repositorio.incrementarImportacoes(partilhado.id);
    return resultado;
  }

  async destacarLive(negocioId: string, dados: { liveId: string; pecaId: string; variantePecaId?: string | null; hostParceiroId?: string | null; carrinhoPartilhavelId?: string | null }) {
    const normalizados = {
      liveId: dados.liveId,
      pecaId: dados.pecaId,
      variantePecaId: dados.variantePecaId ?? null,
      hostParceiroId: dados.hostParceiroId ?? null,
      carrinhoPartilhavelId: dados.carrinhoPartilhavelId ?? null
    };
    const validacao = await this.repositorio.validarDestaque(negocioId, normalizados);
    if (validacao === "LIVE_OU_PRODUTO_NAO_ENCONTRADO") return null;
    if (validacao !== "OK") throw new Error(validacao);
    await this.repositorio.encerrarDestaquesAtivos(dados.liveId, negocioId, new Date());
    return this.repositorio.criarDestaque({ ...normalizados, negocioId });
  }

  obterDestaqueLive(liveId: string) {
    return this.repositorio.buscarDestaqueAtivo(liveId);
  }
  private itens(json: string): Array<{ slugLoja: string; codigoPeca: string; varianteSelecionada?: Record<string, string>; quantidade: number; nomeProduto?: string; nomeFornecedor?: string; precoUnitarioEmKwanza?: number; fotoUrl?: string | null }> { try { return JSON.parse(json); } catch { return []; } }
}
