const apiUrlConfiguradaPadrao = normalizarUrlBase(import.meta.env.VITE_API_URL ?? "");

function ehHostLocal(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
}

function normalizarUrlBase(valor: string): string {
  return valor.trim().replace(/\/+$/, "");
}

function derivarSubdominioApi(subdominio: string): string {
  const partes = subdominio.split("-");
  if (partes.length <= 1) return "api";
  return ["api", ...partes.slice(1)].join("-");
}

function inferirApiUrlProducao(hostname: string, protocol: string): string {
  if (!hostname || ehHostLocal(hostname)) return "";

  const partes = hostname.split(".");
  if (partes.length < 2) return "";

  if (partes.length === 2) {
    return `${protocol}//api.${hostname}`;
  }

  const [subdominio, ...dominioPartes] = partes;
  if (!subdominio || dominioPartes.length === 0) return "";

  return `${protocol}//${derivarSubdominioApi(subdominio)}.${dominioPartes.join(".")}`;
}

interface ResolverBaseApiUrlOpcoes {
  apiUrlConfigurada?: string | null;
  emDesenvolvimento?: boolean;
  hostname?: string;
  protocol?: string;
}

export function resolverBaseApiUrl({
  apiUrlConfigurada = apiUrlConfiguradaPadrao,
  emDesenvolvimento = import.meta.env.DEV,
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
  protocol = typeof window === "undefined" ? "https:" : window.location.protocol
}: ResolverBaseApiUrlOpcoes = {}): string {
  const configurada = normalizarUrlBase(apiUrlConfigurada ?? "");

  if (configurada) {
    try {
      const destino = new URL(configurada);
      if (!ehHostLocal(destino.hostname)) return configurada;
      if (!hostname || ehHostLocal(hostname)) return configurada;
      return emDesenvolvimento ? "" : inferirApiUrlProducao(hostname, protocol);
    } catch {
      return configurada;
    }
  }

  if (emDesenvolvimento) return "";

  return inferirApiUrlProducao(hostname, protocol);
}

const apiUrl = resolverBaseApiUrl();

export function obterBaseApiUrl(): string {
  return apiUrl;
}

export function resolverUrlMedia(url?: string | null): string {
  const valor = url?.trim();
  if (!valor) return "";
  if (/^(https?:|data:|blob:)/i.test(valor)) return valor;
  if (valor.startsWith("/api/media/files/")) return `${apiUrl}${valor.replace("/api/media/", "/media/")}`;
  if (valor.startsWith("/media/files/")) return `${apiUrl}${valor}`;
  return valor;
}

const CHAVE_TOKEN = "emeu_token";
const CHAVE_USUARIO = "emeu_usuario";
const CHAVE_NEGOCIO_ACTUAL = "bizy_negocio_actual_id";
export const EVENTO_SESSAO_EXPIRADA = "emeu:sessao-expirada";
export const EVENTO_SESSAO_ATUALIZADA = "emeu:sessao-atualizada";
export const EVENTO_WORKSPACE_ALTERADO = "bizy:workspace-alterado";
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

// ── Workspace (RF-T110) ───────────────────────────────────────────

export function obterNegocioActualId(): string | null {
  return localStorage.getItem(CHAVE_NEGOCIO_ACTUAL);
}

export function alternarWorkspace(negocioId: string): void {
  localStorage.setItem(CHAVE_NEGOCIO_ACTUAL, negocioId);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_WORKSPACE_ALTERADO, { detail: { negocioId } }));
  }
}

export function limparEstadoWorkspace(): void {
  localStorage.removeItem(CHAVE_NEGOCIO_ACTUAL);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_WORKSPACE_ALTERADO));
  }
}

function notificarSessaoExpirada(): void {
  removerToken();
  removerUsuario();
  localStorage.removeItem(CHAVE_NEGOCIO_ACTUAL);

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
    const negocioId = obterNegocioActualId();
    if (negocioId) {
      headers["X-Bizy-Negocio-Id"] = negocioId;
    }
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
