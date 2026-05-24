const apiUrlConfigurada = import.meta.env.VITE_API_URL?.trim();

function ehHostLocal(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
}

function obterApiUrl(): string {
  if (apiUrlConfigurada) {
    if (typeof window !== "undefined" && !ehHostLocal(window.location.hostname)) {
      try {
        const destino = new URL(apiUrlConfigurada);
        if (ehHostLocal(destino.hostname)) return "";
      } catch {
        return apiUrlConfigurada;
      }
    }

    return apiUrlConfigurada;
  }

  if (import.meta.env.DEV && typeof window !== "undefined" && ehHostLocal(window.location.hostname)) {
    return "http://localhost:3333";
  }

  return "";
}

const apiUrl = obterApiUrl();

export function obterBaseApiUrl(): string {
  return apiUrl;
}

const CHAVE_TOKEN = "emeu_token";
const CHAVE_USUARIO = "emeu_usuario";
export const EVENTO_SESSAO_EXPIRADA = "emeu:sessao-expirada";
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

export function guardarSessao(token: string, usuario: UsuarioSessao): void {
  guardarToken(token);
  guardarUsuario(usuario);
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

export function obterUrlEventos(): string {
  const token = obterToken();
  const parametros = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${apiUrl}/eventos${parametros}`;
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
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined
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

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    if (autenticado && resposta.status === 401) {
      notificarSessaoExpirada();
    }
    throw new Error(erro?.mensagem ?? erro?.message ?? "Pedido rejeitado pelo backend.");
  }

  return resposta.json();
}
