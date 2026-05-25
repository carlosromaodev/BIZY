import type { FastifyReply, FastifyRequest } from "fastify";
import type { DadosNegocioBizy, NegocioBizy, UsuarioSistema } from "../../dominio/tipos.js";
import type { ContextoAplicacao } from "./ContextoAplicacao.js";
import { exigirUsuarioAutenticado } from "./seguranca.js";

export interface ContextoComercialHttp {
  usuario: UsuarioSistema;
  negocio: NegocioBizy;
  papel: string;
  permissoes: string[];
  modulosAtivos: string[];
}

const MODULOS_CORE = [
  "crm",
  "catalogo",
  "conversas",
  "reservas",
  "pedidos",
  "whatsapp",
  "loja-publica",
  "afiliados",
  "tracking"
] as const;

const PERMISSOES_POR_PAPEL: Record<string, string[]> = {
  DONO: [
    "negocio:gerir",
    "catalogo:gerir",
    "clientes:gerir",
    "pedidos:gerir",
    "pagamentos:gerir",
    "conversas:gerir",
    "tarefas:gerir",
    "loja-publica:gerir",
    "afiliados:gerir",
    "tracking:ler",
    "campanhas:gerir",
    "relatorios:ver",
    "configuracoes:gerir"
  ],
  ADMIN: [
    "negocio:gerir",
    "catalogo:gerir",
    "clientes:gerir",
    "pedidos:gerir",
    "pagamentos:gerir",
    "conversas:gerir",
    "tarefas:gerir",
    "loja-publica:gerir",
    "afiliados:gerir",
    "tracking:ler",
    "campanhas:gerir",
    "relatorios:ver",
    "configuracoes:gerir"
  ],
  VENDEDOR: ["catalogo:ler", "clientes:ler", "pedidos:gerir", "conversas:gerir", "tarefas:gerir", "relatorios:ver", "tracking:ler"],
  ATENDENTE: ["clientes:ler", "pedidos:ler", "conversas:gerir", "tarefas:gerir"],
  FINANCEIRO: ["clientes:ler", "pedidos:ler", "pagamentos:gerir", "relatorios:ver"],
  ENTREGADOR: ["pedidos:ler", "entregas:gerir"],
  AFILIADO: ["afiliados:ver", "relatorios:ver"],
  CRIADOR: ["afiliados:ver", "relatorios:ver"]
};

export async function resolverContextoComercial(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  mensagemAutenticacao = "Faça login para continuar."
): Promise<ContextoComercialHttp | null> {
  const usuario = await exigirUsuarioAutenticado(contexto, request, reply, mensagemAutenticacao);
  if (!usuario) return null;

  const negocio = await obterOuCriarNegocioPrincipal(contexto, usuario);
  const papel = normalizarPapel(negocio.usuarioPapel ?? usuario.papel);

  return {
    usuario,
    negocio,
    papel,
    permissoes: permissoesDoPapel(papel),
    modulosAtivos: await modulosAtivosDoNegocio(contexto, negocio.id)
  };
}

export async function exigirPermissaoComercial(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  permissao: string,
  mensagem = "Sem permissão para executar esta ação."
): Promise<ContextoComercialHttp | null> {
  const contextoComercial = await resolverContextoComercial(contexto, request, reply);
  if (!contextoComercial) return null;

  if (!temPermissao(contextoComercial.permissoes, permissao)) {
    await reply.code(403).send({ erro: "PERMISSAO_NEGADA", mensagem });
    return null;
  }

  return contextoComercial;
}

export async function exigirModuloComercial(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  modulo: string,
  mensagem = "Módulo desativado para este negócio."
): Promise<ContextoComercialHttp | null> {
  const contextoComercial = await resolverContextoComercial(contexto, request, reply);
  if (!contextoComercial) return null;

  if (!moduloAtivo(contextoComercial.modulosAtivos, modulo)) {
    await reply.code(403).send({ erro: "MODULO_DESATIVADO", mensagem, modulo });
    return null;
  }

  return contextoComercial;
}

export async function exigirAcessoComercial(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  opcoes: {
    permissao?: string;
    modulo?: string;
    mensagemPermissao?: string;
    mensagemModulo?: string;
  }
): Promise<ContextoComercialHttp | null> {
  const contextoComercial = await resolverContextoComercial(contexto, request, reply);
  if (!contextoComercial) return null;

  if (opcoes.modulo && !moduloAtivo(contextoComercial.modulosAtivos, opcoes.modulo)) {
    await reply.code(403).send({
      erro: "MODULO_DESATIVADO",
      mensagem: opcoes.mensagemModulo ?? "Módulo desativado para este negócio.",
      modulo: opcoes.modulo
    });
    return null;
  }

  if (opcoes.permissao && !temPermissao(contextoComercial.permissoes, opcoes.permissao)) {
    await reply.code(403).send({
      erro: "PERMISSAO_NEGADA",
      mensagem: opcoes.mensagemPermissao ?? "Sem permissão para executar esta ação."
    });
    return null;
  }

  return contextoComercial;
}

export async function obterOuCriarNegocioPrincipal(
  contexto: ContextoAplicacao,
  usuario: UsuarioSistema
): Promise<NegocioBizy> {
  const negocio = await contexto.repositorios.autenticacao.buscarNegocioPrincipalPorUsuario(usuario.id);
  if (negocio) return negocio;

  return contexto.repositorios.autenticacao.salvarNegocioUsuario(usuario.id, dadosNegocioLegado(usuario));
}

export function permissoesDoPapel(papel: string): string[] {
  return [...(PERMISSOES_POR_PAPEL[normalizarPapel(papel)] ?? [])];
}

export function temPermissao(permissoes: string[], permissaoNecessaria: string): boolean {
  if (permissoes.includes(permissaoNecessaria)) return true;

  const [dominio, acao] = permissaoNecessaria.split(":");
  return acao === "ler" && permissoes.includes(`${dominio}:gerir`);
}

export function moduloAtivo(modulosAtivos: string[], moduloNecessario: string): boolean {
  return modulosAtivos.includes(moduloNecessario);
}

function normalizarPapel(papel?: string | null): string {
  return (papel ?? "DONO").trim().toUpperCase();
}

async function modulosAtivosDoNegocio(contexto: ContextoAplicacao, negocioId: string): Promise<string[]> {
  const modulosConfigurados = await contexto.repositorios.autenticacao.listarModulosAtivosPorNegocio(negocioId);
  return modulosConfigurados.length > 0 ? modulosConfigurados : [...MODULOS_CORE];
}

function dadosNegocioLegado(usuario: UsuarioSistema): DadosNegocioBizy {
  return {
    nomeComercial: `Loja de ${usuario.nome || "Bizy"}`,
    segmento: "geral",
    tipo: "LOJA",
    telefone: usuario.telefone,
    whatsapp: usuario.telefone,
    email: usuario.email,
    canaisVenda: ["WHATSAPP"],
    metodosPagamento: [],
    entrega: {},
    minutosReservaPadrao: 10
  };
}
