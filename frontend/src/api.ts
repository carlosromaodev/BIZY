const apiUrlConfigurada = import.meta.env.VITE_API_URL?.trim();

function ehHostLocal(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
}

function inferirApiUrlProducao(): string {
  if (typeof window === "undefined") return "";
  const { protocol, hostname } = window.location;
  if (ehHostLocal(hostname)) return "";
  const partes = hostname.split(".");
  if (partes.length >= 2) {
    const dominio = partes.slice(-2).join(".");
    return `${protocol}//api.${dominio}`;
  }
  return "";
}

function obterApiUrl(): string {
  if (apiUrlConfigurada) {
    if (typeof window !== "undefined" && !ehHostLocal(window.location.hostname)) {
      try {
        const destino = new URL(apiUrlConfigurada);
        if (ehHostLocal(destino.hostname)) return inferirApiUrlProducao();
      } catch {
        return apiUrlConfigurada;
      }
    }

    return apiUrlConfigurada;
  }

  return inferirApiUrlProducao();
}

const apiUrl = obterApiUrl();

export function obterBaseApiUrl(): string {
  return apiUrl;
}

export function resolverUrlMedia(url?: string | null): string {
  const valor = url?.trim();
  if (!valor) return "";
  if (/^(https?:|data:|blob:)/i.test(valor)) return valor;
  if (valor.startsWith("/media/files/")) return `${apiUrl}${valor}`;
  return valor;
}

const CHAVE_TOKEN = "emeu_token";
const CHAVE_USUARIO = "emeu_usuario";
export const EVENTO_SESSAO_EXPIRADA = "emeu:sessao-expirada";
export const EVENTO_SESSAO_ATUALIZADA = "emeu:sessao-atualizada";
const EVENTO_NOTIFICACAO_SITE = "bizy:notificacao";

function emitirNotificacaoSite(detalhe: {
  descricao?: string;
  duracao?: number;
  titulo: string;
  variante?: "destructive" | "info" | "primary" | "secondary" | "success" | "warning";
}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_NOTIFICACAO_SITE, { detail: detalhe }));
}

export interface UsuarioSessao {
  id: string;
  nome: string;
  telefone: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  papel: string;
  origemCadastro?: string;
  perfilCompletoEm?: string | null;
}

export interface NegocioSessao {
  id: string;
  nomeComercial: string;
  segmento: string;
  tipo: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  provincia: string | null;
  municipio: string | null;
  moeda: string;
  fusoHorario: string;
  canaisVenda: string[];
  metodosPagamento: string[];
  minutosReservaPadrao: number;
  usuarioPapel?: string;
}

export function obterToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function guardarToken(token: string): void {
  localStorage.setItem(CHAVE_TOKEN, token);
}

export function removerToken(): void {
  localStorage.removeItem(CHAVE_TOKEN);
}

export function obterUsuario(): UsuarioSessao | null {
  const valor = localStorage.getItem(CHAVE_USUARIO);
  if (!valor) return null;
  try {
    return JSON.parse(valor) as UsuarioSessao;
  } catch {
    return null;
  }
}

export function guardarUsuario(usuario: UsuarioSessao): void {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function guardarSessao(token: string | null | undefined, usuario: UsuarioSessao): void {
  if (token) {
    guardarToken(token);
  } else {
    removerToken();
  }
  guardarUsuario(usuario);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_SESSAO_ATUALIZADA));
  }
}

export function removerUsuario(): void {
  localStorage.removeItem(CHAVE_USUARIO);
}

function notificarSessaoExpirada(): void {
  removerToken();
  removerUsuario();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }

  emitirNotificacaoSite({
    descricao: "Entra novamente para continuar a gerir o atendimento.",
    titulo: "Sessão expirada",
    variante: "warning"
  });
}

function mensagemRespostaInesperada(caminho: string, texto: string): string {
  const inicio = texto.trimStart().slice(0, 80).toLowerCase();
  if (inicio.startsWith("<!doctype") || inicio.startsWith("<html")) {
    return `A rota ${caminho} devolveu HTML em vez de JSON. Verifique se o backend está ativo e se o proxy do Vite conhece esta rota.`;
  }

  return `A rota ${caminho} devolveu uma resposta inesperada em vez de JSON.`;
}

async function lerRespostaApi(resposta: Response, caminho: string): Promise<unknown> {
  const texto = await resposta.text();
  if (!texto.trim()) return null;

  const tipoConteudo = resposta.headers.get("content-type")?.toLowerCase() ?? "";
  const inicio = texto.trimStart();
  const pareceJson =
    tipoConteudo.includes("application/json") ||
    tipoConteudo.includes("+json") ||
    inicio.startsWith("{") ||
    inicio.startsWith("[");

  if (!pareceJson) {
    throw new Error(mensagemRespostaInesperada(caminho, texto));
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`A rota ${caminho} devolveu JSON inválido.`);
  }
}

function extrairMensagemErro(corpo: unknown): string | null {
  if (!corpo || typeof corpo !== "object") return null;
  const erro = corpo as { mensagem?: unknown; message?: unknown };
  if (typeof erro.mensagem === "string") return erro.mensagem;
  if (typeof erro.message === "string") return erro.message;
  return null;
}

export function obterUrlEventos(): string {
  const token = obterToken();
  const base = `${apiUrl}/eventos`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export function criarFonteEventosAutenticada(): EventSource {
  return new EventSource(obterUrlEventos(), { withCredentials: true });
}

export async function requisitarApi<T = unknown>(
  caminho: string,
  opcoes: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
  autenticado = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(opcoes.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(opcoes.headers ?? {})
  };
  const token = obterToken();

  if (autenticado && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${apiUrl}${caminho}`, {
      method: opcoes.method ?? "GET",
      headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
      credentials: "include"
    });
  } catch {
    const mensagem = "Não foi possível contactar o backend. Verifique se a API e o Postgres estão em execução.";
    emitirNotificacaoSite({
      descricao: mensagem,
      titulo: "Backend indisponível",
      variante: "destructive"
    });
    throw new Error(mensagem);
  }

  let corpo: unknown;
  try {
    corpo = await lerRespostaApi(resposta, caminho);
  } catch (erro) {
    if (autenticado && resposta.status === 401) {
      notificarSessaoExpirada();
    }
    throw erro;
  }

  if (!resposta.ok) {
    if (autenticado && resposta.status === 401) {
      notificarSessaoExpirada();
    }
    throw new Error(extrairMensagemErro(corpo) ?? "Pedido rejeitado pelo backend.");
  }

  return corpo as T;
}
