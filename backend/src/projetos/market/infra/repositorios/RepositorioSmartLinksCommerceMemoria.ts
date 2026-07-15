import { randomUUID } from "node:crypto";
import type {
  NovoToqueAtribuicaoCommerce,
  RepositorioSmartLinksCommerce,
  SessaoCommerce,
  ToqueAtribuicaoCommerce
} from "../../dominio/smartLinksCommerce.js";

export class RepositorioSmartLinksCommerceMemoria implements RepositorioSmartLinksCommerce {
  private readonly sessoes = new Map<string, SessaoCommerce>();
  private readonly toques = new Map<string, ToqueAtribuicaoCommerce>();

  async criarSessao(dados: {
    tokenHash: string;
    trackingId: string;
    contaBizyId: string | null;
    expiraEm: Date;
    metadata: Record<string, unknown>;
  }) {
    const agora = new Date();
    const sessao: SessaoCommerce = {
      id: randomUUID(),
      ...dados,
      ultimoToqueEm: null,
      encerradaEm: null,
      criadaEm: agora,
      atualizadoEm: agora
    };
    this.sessoes.set(sessao.id, sessao);
    return sessao;
  }

  async buscarSessaoPorTokenHash(tokenHash: string, agora: Date) {
    return [...this.sessoes.values()].find((sessao) =>
      sessao.tokenHash === tokenHash && !sessao.encerradaEm && sessao.expiraEm > agora
    ) ?? null;
  }

  async registrarToque(dados: NovoToqueAtribuicaoCommerce) {
    const sessao = this.sessoes.get(dados.sessaoId);
    if (!sessao) throw new Error("Sessao commerce nao encontrada.");
    const criadoEm = new Date();
    const toque: ToqueAtribuicaoCommerce = { id: randomUUID(), ...dados, criadoEm };
    this.toques.set(toque.id, toque);
    sessao.ultimoToqueEm = criadoEm;
    sessao.atualizadoEm = criadoEm;
    return toque;
  }

  async buscarUltimoToque(sessaoId: string) {
    return [...this.toques.values()]
      .filter((toque) => toque.sessaoId === sessaoId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())[0] ?? null;
  }

  async vincularConta(sessaoId: string, contaBizyId: string) {
    const sessao = this.sessoes.get(sessaoId);
    if (!sessao || (sessao.contaBizyId && sessao.contaBizyId !== contaBizyId)) return null;
    sessao.contaBizyId = contaBizyId;
    sessao.atualizadoEm = new Date();
    return sessao;
  }

  async listarToquesAtribuiveis(filtro: {
    sessaoId: string | null;
    contaBizyId: string | null;
    negocioId: string;
    desde: Date;
    ate: Date;
  }) {
    if (!filtro.sessaoId && !filtro.contaBizyId) return [];
    return [...this.toques.values()]
      .filter((toque) => {
        const sessao = this.sessoes.get(toque.sessaoId);
        const sessaoPermitida = toque.sessaoId === filtro.sessaoId || Boolean(
          filtro.contaBizyId && sessao?.contaBizyId === filtro.contaBizyId
        );
        return sessaoPermitida && toque.negocioId === filtro.negocioId &&
          toque.criadoEm >= filtro.desde && toque.criadoEm <= filtro.ate;
      })
      .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
      .map((toque) => ({ ...toque, sessaoContaBizyId: this.sessoes.get(toque.sessaoId)?.contaBizyId ?? null }));
  }
}
