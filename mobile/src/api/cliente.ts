import { Platform } from "react-native";

function obterApiUrlInicial(): string {
  try {
    const Constants = require("expo-constants").default;
    const url = Constants?.expoConfig?.extra?.apiUrl;
    if (typeof url === "string" && url.trim()) return url.trim();
  } catch {}
  // Android emulator usa 10.0.2.2 para localhost, iOS usa localhost
  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

let apiUrl = obterApiUrlInicial().replace(/\/+$/, "");

export function definirApiUrl(url: string) {
  apiUrl = url.replace(/\/+$/, "");
}

export function obterApiUrl(): string {
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

type ValorQuery = string | number | boolean | null | undefined;

function montarQuery(campos: Record<string, ValorQuery>): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(campos)) {
    if (valor === null || valor === undefined) continue;
    if (typeof valor === "string" && valor.trim() === "") continue;
    params.set(chave, String(valor));
  }
  return params.toString();
}

export function comQuery(caminho: string, campos: Record<string, ValorQuery>): string {
  const query = montarQuery(campos);
  return query ? `${caminho}?${query}` : caminho;
}

export async function requisitarApi<T>(
  caminho: string,
  opcoes: { method?: string; body?: unknown } = {}
): Promise<T> {
  const url = `${apiUrl}${caminho}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const resposta = await fetch(url, {
    method: opcoes.method ?? "GET",
    headers,
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new Error(texto || `Erro ${resposta.status}`);
  }

  return resposta.json() as Promise<T>;
}
