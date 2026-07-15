export interface SessaoCommerce {
  id: string;
  tokenHash: string;
  trackingId: string;
  contaBizyId: string | null;
  expiraEm: Date;
  ultimoToqueEm: Date | null;
  encerradaEm: Date | null;
  metadata: Record<string, unknown>;
  criadaEm: Date;
  atualizadoEm: Date;
}

export interface ToqueAtribuicaoCommerce {
  id: string;
  sessaoId: string;
  negocioId: string;
  linkId: string;
  afiliadoId: string;
  tipo: "SMART_LINK_CLICK";
  destinoTipo: string;
  destinoId: string | null;
  campanhaId: string | null;
  conteudoId: string | null;
  codigoProduto: string | null;
  canal: string | null;
  origem: string | null;
  metadata: Record<string, unknown>;
  criadoEm: Date;
}

export interface NovoToqueAtribuicaoCommerce extends Omit<ToqueAtribuicaoCommerce, "id" | "criadoEm"> {}

export interface RepositorioSmartLinksCommerce {
  criarSessao(dados: {
    tokenHash: string;
    trackingId: string;
    contaBizyId: string | null;
    expiraEm: Date;
    metadata: Record<string, unknown>;
  }): Promise<SessaoCommerce>;
  buscarSessaoPorTokenHash(tokenHash: string, agora: Date): Promise<SessaoCommerce | null>;
  registrarToque(dados: NovoToqueAtribuicaoCommerce): Promise<ToqueAtribuicaoCommerce>;
  buscarUltimoToque(sessaoId: string): Promise<ToqueAtribuicaoCommerce | null>;
}
