import { randomUUID } from "node:crypto";
import type {
  ConversaoAtribuicaoCommerce,
  NovaConversaoAtribuicaoCommerce,
  NovaPoliticaAtribuicaoCommerce,
  PoliticaAtribuicaoCommerce,
  RepositorioAtribuicaoCommerce
} from "../../dominio/atribuicaoCommerce.js";

export class RepositorioAtribuicaoCommerceMemoria implements RepositorioAtribuicaoCommerce {
  private readonly politicas = new Map<string, PoliticaAtribuicaoCommerce>();
  private readonly conversoes = new Map<string, ConversaoAtribuicaoCommerce>();

  async obterOuCriarPolitica(dados: NovaPoliticaAtribuicaoCommerce) {
    const chave = `${dados.negocioId}:${dados.codigo}:${dados.versao}`;
    const existente = this.politicas.get(chave);
    if (existente) return existente;
    const agora = new Date();
    const politica: PoliticaAtribuicaoCommerce = {
      id: randomUUID(),
      ...dados,
      ativaDesde: agora,
      desativadaEm: null,
      criadaEm: agora
    };
    this.politicas.set(chave, politica);
    return politica;
  }

  async buscarConversao(negocioId: string, pedidoId: string, tipo: "ORDER_CREATED") {
    return [...this.conversoes.values()].find((item) =>
      item.negocioId === negocioId && item.pedidoId === pedidoId && item.tipo === tipo
    ) ?? null;
  }

  async criarConversao(dados: NovaConversaoAtribuicaoCommerce) {
    const existente = await this.buscarConversao(dados.negocioId, dados.pedidoId, dados.tipo);
    if (existente) return existente;
    const criadaEm = new Date();
    const conversaoId = randomUUID();
    const conversao: ConversaoAtribuicaoCommerce = {
      id: conversaoId,
      negocioId: dados.negocioId,
      sessaoId: dados.sessaoId,
      contaBizyId: dados.contaBizyId,
      compraUnificadaId: dados.compraUnificadaId,
      pedidoId: dados.pedidoId,
      tipo: dados.tipo,
      politicaId: dados.politica.id,
      politicaCodigo: dados.politica.codigo,
      politicaVersao: dados.politica.versao,
      modelo: dados.politica.modelo,
      janelaDias: dados.politica.janelaDias,
      valorBaseEmKwanza: dados.valorBaseEmKwanza,
      moeda: dados.moeda,
      explicacao: dados.explicacao,
      criadaEm,
      participantes: dados.participantes.map((participante) => ({
        id: randomUUID(),
        conversaoId,
        ...participante,
        criadoEm: criadaEm
      }))
    };
    this.conversoes.set(conversao.id, conversao);
    return conversao;
  }

  async listarConversoesCompra(compraUnificadaId: string) {
    return [...this.conversoes.values()].filter((item) => item.compraUnificadaId === compraUnificadaId);
  }
}
