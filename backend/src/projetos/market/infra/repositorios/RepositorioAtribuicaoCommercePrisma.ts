import type { PrismaClient } from "@prisma/client";
import type {
  ConversaoAtribuicaoCommerce,
  ModeloAtribuicaoCommerce,
  NovaConversaoAtribuicaoCommerce,
  NovaPoliticaAtribuicaoCommerce,
  ParticipanteConversaoCommerce,
  PoliticaAtribuicaoCommerce,
  RepositorioAtribuicaoCommerce
} from "../../dominio/atribuicaoCommerce.js";

export class RepositorioAtribuicaoCommercePrisma implements RepositorioAtribuicaoCommerce {
  constructor(private readonly prisma: PrismaClient) {}

  async obterOuCriarPolitica(dados: NovaPoliticaAtribuicaoCommerce) {
    const politica = await this.prisma.politicaAtribuicaoCommerce.upsert({
      where: {
        negocioId_codigo_versao: {
          negocioId: dados.negocioId,
          codigo: dados.codigo,
          versao: dados.versao
        }
      },
      create: {
        negocioId: dados.negocioId,
        codigo: dados.codigo,
        versao: dados.versao,
        modelo: dados.modelo,
        janelaDias: dados.janelaDias,
        pesoPrincipalBasisPoints: dados.pesoPrincipalBasisPoints,
        regrasJson: JSON.stringify(dados.regras)
      },
      update: {}
    });
    return this.mapearPolitica(politica);
  }

  async buscarConversao(negocioId: string, pedidoId: string, tipo: "ORDER_CREATED") {
    const conversao = await this.prisma.conversaoAtribuicaoCommerce.findUnique({
      where: { negocioId_pedidoId_tipo: { negocioId, pedidoId, tipo } },
      include: { participantes: { orderBy: { papel: "asc" } } }
    });
    return conversao ? this.mapearConversao(conversao) : null;
  }

  async criarConversao(dados: NovaConversaoAtribuicaoCommerce) {
    const conversao = await this.prisma.conversaoAtribuicaoCommerce.upsert({
      where: {
        negocioId_pedidoId_tipo: {
          negocioId: dados.negocioId,
          pedidoId: dados.pedidoId,
          tipo: dados.tipo
        }
      },
      create: {
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
        explicacaoJson: JSON.stringify(dados.explicacao),
        participantes: {
          create: dados.participantes.map((participante) => ({
            toqueId: participante.toqueId,
            parceiroId: participante.parceiroId,
            linkId: participante.linkId,
            papel: participante.papel,
            pesoBasisPoints: participante.pesoBasisPoints,
            valorAtribuidoEmKwanza: participante.valorAtribuidoEmKwanza,
            motivo: participante.motivo
          }))
        }
      },
      update: {},
      include: { participantes: { orderBy: { papel: "asc" } } }
    });
    return this.mapearConversao(conversao);
  }

  async listarConversoesCompra(compraUnificadaId: string) {
    const conversoes = await this.prisma.conversaoAtribuicaoCommerce.findMany({
      where: { compraUnificadaId },
      include: { participantes: { orderBy: { papel: "asc" } } },
      orderBy: { criadaEm: "asc" }
    });
    return conversoes.map((item) => this.mapearConversao(item));
  }

  private mapearPolitica(item: {
    id: string;
    negocioId: string;
    codigo: string;
    versao: string;
    modelo: string;
    janelaDias: number;
    pesoPrincipalBasisPoints: number;
    regrasJson: string;
    ativaDesde: Date;
    desativadaEm: Date | null;
    criadaEm: Date;
  }): PoliticaAtribuicaoCommerce {
    const { regrasJson, modelo, ...restante } = item;
    return { ...restante, modelo: modelo as ModeloAtribuicaoCommerce, regras: this.json(regrasJson) };
  }

  private mapearConversao(item: {
    id: string;
    negocioId: string;
    sessaoId: string | null;
    contaBizyId: string | null;
    compraUnificadaId: string;
    pedidoId: string;
    tipo: string;
    politicaId: string;
    politicaCodigo: string;
    politicaVersao: string;
    modelo: string;
    janelaDias: number;
    valorBaseEmKwanza: number;
    moeda: string;
    explicacaoJson: string;
    criadaEm: Date;
    participantes: Array<{
      id: string;
      conversaoId: string;
      toqueId: string | null;
      parceiroId: string | null;
      linkId: string | null;
      papel: string;
      pesoBasisPoints: number;
      valorAtribuidoEmKwanza: number;
      motivo: string;
      criadoEm: Date;
    }>;
  }): ConversaoAtribuicaoCommerce {
    const { explicacaoJson, modelo, tipo: _tipo, participantes, ...restante } = item;
    return {
      ...restante,
      tipo: "ORDER_CREATED",
      modelo: modelo as ModeloAtribuicaoCommerce,
      explicacao: this.json(explicacaoJson),
      participantes: participantes as ParticipanteConversaoCommerce[]
    };
  }

  private json(valor: string): Record<string, unknown> {
    try {
      const dados = JSON.parse(valor) as unknown;
      return dados && typeof dados === "object" && !Array.isArray(dados) ? dados as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
}
