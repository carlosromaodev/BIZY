import type { CombinacaoVariantePeca } from "../tipos.js";

const LIMITE_COMBINACOES = 500;

export function normalizarSelecaoVariante(selecao: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(selecao)
      .map(([nome, valor]) => [nome.trim(), valor.trim()] as const)
      .filter(([nome, valor]) => nome.length > 0 && valor.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

export function criarChaveCombinacaoVariante(selecao: Record<string, string>): string {
  return JSON.stringify(normalizarSelecaoVariante(selecao));
}

export function validarSelecaoVariante(
  definicoes: Record<string, string[]>,
  selecao: Record<string, string> | null | undefined
): Record<string, string> {
  const dimensoes = Object.entries(definicoes).filter(([, opcoes]) => opcoes.length > 0);
  const normalizada = normalizarSelecaoVariante(selecao ?? {});

  if (dimensoes.length === 0) {
    if (Object.keys(normalizada).length > 0) throw new Error("Variante inválida para produto simples.");
    return {};
  }

  if (Object.keys(normalizada).length !== dimensoes.length) {
    throw new Error("Variante inválida: seleccione todas as opções do produto.");
  }

  for (const [nome, opcoes] of dimensoes) {
    const valor = normalizada[nome];
    if (!valor || !opcoes.includes(valor)) {
      throw new Error(`Variante inválida: ${nome} não possui a opção seleccionada.`);
    }
  }

  return normalizada;
}

export function gerarCombinacoesVariantes(definicoes: Record<string, string[]>): Record<string, string>[] {
  const dimensoes = Object.entries(definicoes)
    .map(([nome, opcoes]) => [nome.trim(), [...new Set(opcoes.map((opcao) => opcao.trim()).filter(Boolean))]] as const)
    .filter(([nome, opcoes]) => nome.length > 0 && opcoes.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  if (dimensoes.length === 0) return [];
  let combinacoes: Record<string, string>[] = [{}];
  for (const [nome, opcoes] of dimensoes) {
    combinacoes = combinacoes.flatMap((combinacao) => opcoes.map((opcao) => ({ ...combinacao, [nome]: opcao })));
    if (combinacoes.length > LIMITE_COMBINACOES) {
      throw new Error(`Variantes inválidas: o produto excede ${LIMITE_COMBINACOES} combinações.`);
    }
  }
  return combinacoes.map(normalizarSelecaoVariante);
}

export function encontrarCombinacaoVariante(
  combinacoes: CombinacaoVariantePeca[],
  selecao: Record<string, string>
): CombinacaoVariantePeca | null {
  const chave = criarChaveCombinacaoVariante(selecao);
  return combinacoes.find((combinacao) => combinacao.combinacao === chave && combinacao.estado === "ATIVA") ?? null;
}
