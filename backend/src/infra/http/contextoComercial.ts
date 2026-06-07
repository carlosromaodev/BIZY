import type { FastifyReply, FastifyRequest } from "fastify";
import { modulosNegocioDisponiveis, modulosNegocioPadrao } from "../../dominio/tipos.js";
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
    "social-inbox:gerir",
    "automacoes:gerir",
    "funil:gerir",
    "campanhas:gerir",
    "relatorios:ver",
    "configuracoes:gerir",
    "descontos:aprovar",
    "pedidos:cancelar",
    "clientes:exportar"
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
    "social-inbox:gerir",
    "automacoes:gerir",
    "funil:gerir",
    "campanhas:gerir",
    "relatorios:ver",
    "configuracoes:gerir",
    "descontos:aprovar",
    "pedidos:cancelar",
    "clientes:exportar"
  ],
  VENDEDOR: ["catalogo:ler", "clientes:ler", "pedidos:gerir", "conversas:gerir", "tarefas:gerir", "relatorios:ver", "tracking:ler", "social-inbox:gerir", "automacoes:ler", "funil:gerir"],
  ATENDENTE: ["clientes:ler", "pedidos:ler", "conversas:gerir", "tarefas:gerir", "social-inbox:gerir", "automacoes:ler", "funil:gerir"],
  FINANCEIRO: ["clientes:ler", "pedidos:ler", "pagamentos:gerir", "descontos:aprovar", "relatorios:ver"],
  ENTREGADOR: ["pedidos:ler", "entregas:gerir"],
  AFILIADO: ["afiliados:ver", "relatorios:ver"],
  CRIADOR: ["afiliados:ver", "relatorios:ver"]
};

export const PERMISSOES_POR_PAPEL_PUBLICAS: Record<string, string[]> = Object.freeze(
  Object.fromEntries(Object.entries(PERMISSOES_POR_PAPEL).map(([papel, permissoes]) => [papel, [...permissoes]]))
);

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

export function descontoExigeAprovacao(
  subtotalEmKwanza: number,
  descontoEmKwanza: number,
  limiteSemAprovacaoPercentual = 10
): boolean {
  if (descontoEmKwanza <= 0) return false;
  if (subtotalEmKwanza <= 0) return true;

  const limitePercentual = Math.min(Math.max(limiteSemAprovacaoPercentual, 0), 100);
  const limiteEmKwanza = Math.floor((subtotalEmKwanza * limitePercentual) / 100);
  return descontoEmKwanza > limiteEmKwanza;
}

export function obterLimiteDescontoSemAprovacaoPercentual(negocio: Pick<NegocioBizy, "entrega">): number {
  const politica = negocio.entrega.politicaComercial ?? negocio.entrega.politicas ?? {};
  if (!politica || typeof politica !== "object") return 10;

  const valor = (politica as Record<string, unknown>).limiteDescontoSemAprovacaoPercentual;
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 10;
}

export function moduloAtivo(modulosAtivos: string[], moduloNecessario: string): boolean {
  return modulosAtivos.includes(moduloNecessario);
}

function normalizarPapel(papel?: string | null): string {
  return (papel ?? "DONO").trim().toUpperCase();
}

async function modulosAtivosDoNegocio(contexto: ContextoAplicacao, negocioId: string): Promise<string[]> {
  const modulosConfigurados = await contexto.repositorios.autenticacao.listarModulosPorNegocio(negocioId);
  const padrao = process.env.MODULOS_TODOS_ATIVOS === "true" ? [...modulosNegocioDisponiveis] : [...modulosNegocioPadrao];
  if (modulosConfigurados.length === 0) return padrao;

  const ativos = new Set<string>(padrao);
  for (const modulo of modulosConfigurados) {
    if (modulo.ativo) {
      ativos.add(modulo.modulo);
    } else {
      ativos.delete(modulo.modulo);
    }
  }

  return [...ativos];
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
