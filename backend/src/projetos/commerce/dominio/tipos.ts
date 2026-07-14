export type TipoContextoContaBizy =
  | "COMPRADOR"
  | "AFILIADO"
  | "CRIADOR"
  | "SELLER"
  | "PRODUTOR_LEARNING"
  | "MEMBRO_NEGOCIO";

export interface ContaBizy {
  id: string;
  nome: string | null;
  telefoneCanonico: string | null;
  emailCanonico: string | null;
  telefoneVerificadoEm: Date | null;
  emailVerificadoEm: Date | null;
  status: string;
  usuarioSistemaId: string | null;
  clienteGlobalId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface PerfilComprador {
  id: string;
  contaId: string;
  nomeExibicao: string | null;
  preferencias: Record<string, unknown>;
  consentimentoDados: boolean;
  consentimentoMarketing: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface EnderecoComprador {
  id: string;
  contaId: string;
  rotulo: string;
  provincia: string | null;
  municipio: string | null;
  bairro: string | null;
  endereco: string;
  referencia: string | null;
  principal: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface FavoritoComprador {
  id: string;
  contaId: string;
  slugLoja: string;
  codigoProduto: string;
  criadoEm: Date;
}

export interface SessaoContaBizy {
  id: string;
  contaId: string;
  dispositivoId: string | null;
  userAgent: string | null;
  expiraEm: Date;
  ultimoUsoEm: Date | null;
  revogadaEm: Date | null;
  criadaEm: Date;
}

export interface CodigoOtpContaBizy {
  id: string;
  contaId: string | null;
  contactoCanonico: string;
  finalidade: "LOGIN" | "ASSOCIAR_COMPRA";
  compraId: string | null;
  codigoHash: string;
  tentativas: number;
  expiraEm: Date;
}

export interface MetadadosAcessoContaBizy {
  dispositivoHash?: string | null;
  nomeDispositivo?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
}
