import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { ItemEntradaCarrinhoCommerce } from "../dominio/carrinhoCommerce.js";
import type { CarrinhoCommerceUseCase } from "./CarrinhoCommerceUseCase.js";

export class CarrinhosPartilhaveisUseCase {
  constructor(private prisma: PrismaClient, private carrinhos: CarrinhoCommerceUseCase) {}

  async criar(contaBizyId: string, dados: { parceiroId?: string | null; criadoPorTipo: string; titulo: string; descricao?: string | null; campanhaId?: string | null; liveId?: string | null; expiraEm?: Date | null; itens: ItemEntradaCarrinhoCommerce[] }) {
    if (dados.parceiroId && !await this.prisma.parceiroComercial.findFirst({ where: { id: dados.parceiroId, contaBizyId, estado: "ATIVO" } })) throw new Error("PARCEIRO_NAO_ENCONTRADO");
    const resolvido = await this.carrinhos.sincronizar({ contaBizyId, sessaoCommerceId: null, token: null, itens: dados.itens, modo: "SUBSTITUIR" });
    if (!resolvido.carrinho.itens.length) throw new Error("CARRINHO_VAZIO");
    const negocioIds = [...new Set(resolvido.carrinho.itens.map((item) => item.negocioId))];
    return this.prisma.carrinhoPartilhavel.create({ data: { codigo: randomBytes(7).toString("base64url").toUpperCase(), criadoPorTipo: dados.criadoPorTipo, contaBizyId, parceiroId: dados.parceiroId ?? null, negocioId: negocioIds.length === 1 ? negocioIds[0] : null, campanhaId: dados.campanhaId ?? null, liveId: dados.liveId ?? null, titulo: dados.titulo, descricao: dados.descricao ?? null, expiraEm: dados.expiraEm ?? null, itensJson: JSON.stringify(resolvido.carrinho.itens.map((item) => ({ slugLoja: item.slugLoja, codigoPeca: item.codigoPeca, varianteSelecionada: item.selecaoVariante, quantidade: item.quantidade, nomeProduto: item.nomeProduto, nomeFornecedor: item.nomeFornecedor, precoUnitarioEmKwanza: item.precoUnitarioEmKwanza, fotoUrl: item.fotoUrl }))) } });
  }

  listar(contaBizyId: string) { return this.prisma.carrinhoPartilhavel.findMany({ where: { contaBizyId }, orderBy: { criadoEm: "desc" } }); }

  async obterPublico(codigo: string) {
    const agora = new Date(); const item = await this.prisma.carrinhoPartilhavel.findFirst({ where: { codigo: codigo.toUpperCase(), estado: "ATIVO", OR: [{ expiraEm: null }, { expiraEm: { gt: agora } }] } });
    if (!item) return null;
    await this.prisma.carrinhoPartilhavel.update({ where: { id: item.id }, data: { visualizacoes: { increment: 1 } } });
    return { ...item, itens: this.itens(item.itensJson) };
  }

  async importar(codigo: string, contaBizyId: string | null, token: string | null) {
    const partilhado = await this.prisma.carrinhoPartilhavel.findFirst({ where: { codigo: codigo.toUpperCase(), estado: "ATIVO", OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }] } });
    if (!partilhado) return null;
    const itens = this.itens(partilhado.itensJson).map((item) => ({ slugLoja: item.slugLoja, codigoPeca: item.codigoPeca, varianteSelecionada: item.varianteSelecionada, quantidade: item.quantidade, origem: partilhado.liveId ? "live-afiliada" : "carrinho-partilhado", atribuicao: { carrinhoPartilhavelId: partilhado.id, codigoCarrinho: partilhado.codigo, parceiroId: partilhado.parceiroId, campanhaId: partilhado.campanhaId, liveId: partilhado.liveId, papel: partilhado.liveId ? "HOST" : partilhado.criadoPorTipo } }));
    const resultado = await this.carrinhos.sincronizar({ contaBizyId, sessaoCommerceId: null, token, itens, modo: "MESCLAR" });
    await this.prisma.carrinhoPartilhavel.update({ where: { id: partilhado.id }, data: { importacoes: { increment: 1 } } });
    return resultado;
  }

  async destacarLive(negocioId: string, dados: { liveId: string; pecaId: string; variantePecaId?: string | null; hostParceiroId?: string | null; carrinhoPartilhavelId?: string | null }) {
    const [live, peca] = await Promise.all([this.prisma.sessaoLive.findFirst({ where: { id: dados.liveId, negocioId, ativa: true } }), this.prisma.peca.findFirst({ where: { id: dados.pecaId, negocioId, arquivadaEm: null } })]);
    if (!live || !peca) return null;
    if (dados.variantePecaId && !await this.prisma.variantePeca.findFirst({ where: { id: dados.variantePecaId, pecaId: peca.id, estado: "ATIVA" } })) throw new Error("VARIANTE_INVALIDA");
    if (dados.hostParceiroId && !await this.prisma.parceiroComercial.findFirst({ where: { id: dados.hostParceiroId, negocioId, estado: "ATIVO" } })) throw new Error("HOST_INVALIDO");
    await this.prisma.destaqueProdutoLiveCommerce.updateMany({ where: { liveId: dados.liveId, negocioId, estado: "ATIVO" }, data: { estado: "ENCERRADO", encerradoEm: new Date() } });
    return this.prisma.destaqueProdutoLiveCommerce.create({ data: { ...dados, negocioId } });
  }

  obterDestaqueLive(liveId: string) { return this.prisma.destaqueProdutoLiveCommerce.findFirst({ where: { liveId, estado: "ATIVO" }, orderBy: { destacadoEm: "desc" } }); }
  private itens(json: string): Array<{ slugLoja: string; codigoPeca: string; varianteSelecionada?: Record<string, string>; quantidade: number; nomeProduto?: string; nomeFornecedor?: string; precoUnitarioEmKwanza?: number; fotoUrl?: string | null }> { try { return JSON.parse(json); } catch { return []; } }
}
