import type { UsuarioSistema } from "../../../dominio/tipos.js";
import type {
  CodigoOtpContaBizy,
  ContaBizy,
  EnderecoComprador,
  FavoritoComprador,
  MetadadosAcessoContaBizy,
  PerfilComprador,
  SessaoContaBizy,
  TipoContextoContaBizy
} from "./tipos.js";

export interface RepositorioContaBizy {
  buscarContaPorId(id: string): Promise<ContaBizy | null>;
  buscarContaPorUsuarioSistema(usuarioSistemaId: string): Promise<ContaBizy | null>;
  garantirContaCompatibilidade(usuario: UsuarioSistema): Promise<ContaBizy>;
  criarOuObterContaTelefoneVerificado(dados: {
    telefoneCanonico: string;
    nome?: string | null;
    emailCanonico?: string | null;
  }): Promise<ContaBizy>;
  garantirPerfilComprador(contaId: string, dados?: {
    nomeExibicao?: string | null;
    consentimentoDados?: boolean;
    consentimentoMarketing?: boolean;
    preferencias?: Record<string, unknown>;
  }): Promise<PerfilComprador>;
  obterPerfilComprador(contaId: string): Promise<PerfilComprador | null>;
  listarEnderecos(contaId: string): Promise<EnderecoComprador[]>;
  salvarEndereco(contaId: string, dados: {
    id?: string | null;
    rotulo: string;
    provincia?: string | null;
    municipio?: string | null;
    bairro?: string | null;
    endereco: string;
    referencia?: string | null;
    principal?: boolean;
  }): Promise<EnderecoComprador | null>;
  removerEndereco(id: string, contaId: string): Promise<boolean>;
  listarFavoritos(contaId: string): Promise<FavoritoComprador[]>;
  adicionarFavorito(contaId: string, slugLoja: string, codigoProduto: string): Promise<FavoritoComprador>;
  removerFavorito(contaId: string, slugLoja: string, codigoProduto: string): Promise<boolean>;
  garantirContexto(contaId: string, tipo: TipoContextoContaBizy, negocioId?: string | null): Promise<void>;
  criarConsentimento(dados: {
    contaId: string;
    tipo: string;
    versao: string;
    concedido: boolean;
    origem: string;
    ipHash?: string | null;
  }): Promise<void>;
  criarCodigoOtp(dados: {
    contaId?: string | null;
    contactoCanonico: string;
    finalidade: CodigoOtpContaBizy["finalidade"];
    compraId?: string | null;
    codigoHash: string;
    codigoFinal: string;
    expiraEm: Date;
    statusEnvio: string;
    provider: string;
    providerMessageId?: string | null;
  }): Promise<void>;
  contarCodigosOtpDesde(contactoCanonico: string, desde: Date): Promise<number>;
  revogarCodigosOtpAbertos(contactoCanonico: string, finalidade: CodigoOtpContaBizy["finalidade"], agora: Date): Promise<void>;
  buscarCodigoOtpValido(
    contactoCanonico: string,
    finalidade: CodigoOtpContaBizy["finalidade"],
    compraId: string | null,
    agora: Date
  ): Promise<CodigoOtpContaBizy | null>;
  incrementarTentativasOtp(id: string): Promise<void>;
  consumirCodigoOtp(id: string, agora: Date): Promise<void>;
  criarSessao(contaId: string, tokenHash: string, expiraEm: Date, metadados: MetadadosAcessoContaBizy): Promise<SessaoContaBizy>;
  buscarSessaoPorTokenHash(tokenHash: string, agora: Date): Promise<{ sessao: SessaoContaBizy; conta: ContaBizy } | null>;
  tocarSessao(id: string, agora: Date): Promise<void>;
  listarSessoes(contaId: string, agora: Date): Promise<SessaoContaBizy[]>;
  revogarSessao(id: string, contaId: string, motivo: string, agora: Date): Promise<boolean>;
  revogarSessaoPorTokenHash(tokenHash: string, motivo: string, agora: Date): Promise<void>;
  criarAcessoCompra(compraId: string, tokenHash: string, expiraEm: Date): Promise<void>;
  validarAcessoCompra(compraId: string, tokenHash: string, agora: Date): Promise<boolean>;
  revogarAcessosCompra(compraId: string, motivo: string, agora: Date): Promise<void>;
}
