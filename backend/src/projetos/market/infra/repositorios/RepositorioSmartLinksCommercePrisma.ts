import type { PrismaClient } from "@prisma/client";
import type {
  NovoToqueAtribuicaoCommerce,
  RepositorioSmartLinksCommerce,
  SessaoCommerce,
  ToqueAtribuicaoCommerce
} from "../../dominio/smartLinksCommerce.js";

export class RepositorioSmartLinksCommercePrisma implements RepositorioSmartLinksCommerce {
  constructor(private readonly prisma: PrismaClient) {}

  async criarSessao(dados: {
    tokenHash: string;
    trackingId: string;
    contaBizyId: string | null;
    expiraEm: Date;
    metadata: Record<string, unknown>;
  }) {
    const sessao = await this.prisma.sessaoCommerce.create({
      data: {
        tokenHash: dados.tokenHash,
        trackingId: dados.trackingId,
        contaBizyId: dados.contaBizyId,
        expiraEm: dados.expiraEm,
        metadataJson: JSON.stringify(dados.metadata)
      }
    });
    return this.mapearSessao(sessao);
  }

  async buscarSessaoPorTokenHash(tokenHash: string, agora: Date) {
    const sessao = await this.prisma.sessaoCommerce.findFirst({
      where: { tokenHash, encerradaEm: null, expiraEm: { gt: agora } }
    });
    return sessao ? this.mapearSessao(sessao) : null;
  }

  async registrarToque(dados: NovoToqueAtribuicaoCommerce) {
    const toque = await this.prisma.$transaction(async (tx) => {
      const criado = await tx.toqueAtribuicaoCommerce.create({
        data: {
          sessaoId: dados.sessaoId,
          negocioId: dados.negocioId,
          linkId: dados.linkId,
          afiliadoId: dados.afiliadoId,
          tipo: dados.tipo,
          destinoTipo: dados.destinoTipo,
          destinoId: dados.destinoId,
          campanhaId: dados.campanhaId,
          conteudoId: dados.conteudoId,
          codigoProduto: dados.codigoProduto,
          canal: dados.canal,
          origem: dados.origem,
          metadataJson: JSON.stringify(dados.metadata)
        }
      });
      await tx.sessaoCommerce.update({
        where: { id: dados.sessaoId },
        data: { ultimoToqueEm: criado.criadoEm }
      });
      return criado;
    });
    return this.mapearToque(toque);
  }

  async buscarUltimoToque(sessaoId: string) {
    const toque = await this.prisma.toqueAtribuicaoCommerce.findFirst({
      where: { sessaoId },
      orderBy: { criadoEm: "desc" }
    });
    return toque ? this.mapearToque(toque) : null;
  }

  async vincularConta(sessaoId: string, contaBizyId: string) {
    const atualizado = await this.prisma.sessaoCommerce.updateMany({
      where: {
        id: sessaoId,
        OR: [{ contaBizyId: null }, { contaBizyId }]
      },
      data: { contaBizyId }
    });
    if (!atualizado.count) return null;
    const sessao = await this.prisma.sessaoCommerce.findUnique({ where: { id: sessaoId } });
    return sessao ? this.mapearSessao(sessao) : null;
  }

  async listarToquesAtribuiveis(filtro: {
    sessaoId: string | null;
    contaBizyId: string | null;
    negocioId: string;
    desde: Date;
    ate: Date;
  }) {
    const sessoesPermitidas = [
      ...(filtro.sessaoId ? [{ sessaoId: filtro.sessaoId }] : []),
      ...(filtro.contaBizyId ? [{ sessao: { contaBizyId: filtro.contaBizyId } }] : [])
    ];
    if (!sessoesPermitidas.length) return [];
    const toques = await this.prisma.toqueAtribuicaoCommerce.findMany({
      where: {
        negocioId: filtro.negocioId,
        criadoEm: { gte: filtro.desde, lte: filtro.ate },
        OR: sessoesPermitidas
      },
      include: { sessao: { select: { contaBizyId: true } } },
      orderBy: { criadoEm: "asc" }
    });
    return toques.map(({ sessao, ...toque }) => ({
      ...this.mapearToque(toque),
      sessaoContaBizyId: sessao.contaBizyId
    }));
  }

  private mapearSessao(sessao: {
    id: string;
    tokenHash: string;
    trackingId: string;
    contaBizyId: string | null;
    expiraEm: Date;
    ultimoToqueEm: Date | null;
    encerradaEm: Date | null;
    metadataJson: string;
    criadaEm: Date;
    atualizadoEm: Date;
  }): SessaoCommerce {
    const { metadataJson, ...restante } = sessao;
    return { ...restante, metadata: this.json(metadataJson) };
  }

  private mapearToque(toque: {
    id: string;
    sessaoId: string;
    negocioId: string;
    linkId: string;
    afiliadoId: string;
    tipo: string;
    destinoTipo: string;
    destinoId: string | null;
    campanhaId: string | null;
    conteudoId: string | null;
    codigoProduto: string | null;
    canal: string | null;
    origem: string | null;
    metadataJson: string;
    criadoEm: Date;
  }): ToqueAtribuicaoCommerce {
    const { metadataJson, tipo: _tipo, ...restante } = toque;
    return { ...restante, tipo: "SMART_LINK_CLICK", metadata: this.json(metadataJson) };
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
