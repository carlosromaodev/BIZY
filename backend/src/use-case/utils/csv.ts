export interface LinhaCsv {
  numero: number;
  dados: Record<string, string>;
}

export function parseCsv(conteudo: string): LinhaCsv[] {
  const linhas = conteudo
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((linha) => linha.trim().length > 0);
  if (linhas.length === 0) return [];

  const cabecalhos = parseLinhaCsv(linhas[0]).map((campo) => normalizarCabecalho(campo));
  return linhas.slice(1).map((linha, indice) => {
    const valores = parseLinhaCsv(linha);
    const dados = cabecalhos.reduce<Record<string, string>>((acumulador, cabecalho, posicao) => {
      if (!cabecalho) return acumulador;
      acumulador[cabecalho] = (valores[posicao] ?? "").trim();
      return acumulador;
    }, {});

    return {
      numero: indice + 2,
      dados
    };
  });
}

export function normalizarCabecalho(valor: string): string {
  return valor
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function lerBooleano(valor?: string | null): boolean | undefined {
  const normalizado = (valor ?? "").trim().toLowerCase();
  if (!normalizado) return undefined;
  if (["1", "true", "sim", "s", "yes", "y"].includes(normalizado)) return true;
  if (["0", "false", "nao", "não", "n", "no"].includes(normalizado)) return false;
  return undefined;
}

export function lerInteiro(valor?: string | null): number | undefined {
  const normalizado = (valor ?? "").replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
  if (!normalizado) return undefined;
  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return undefined;
  return Math.trunc(numero);
}

export function lerLista(valor?: string | null): string[] {
  return (valor ?? "")
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let indice = 0; indice < linha.length; indice += 1) {
    const caractere = linha[indice];
    const proximo = linha[indice + 1];

    if (caractere === "\"" && dentroDeAspas && proximo === "\"") {
      atual += "\"";
      indice += 1;
      continue;
    }

    if (caractere === "\"") {
      dentroDeAspas = !dentroDeAspas;
      continue;
    }

    if ((caractere === "," || caractere === ";") && !dentroDeAspas) {
      campos.push(atual);
      atual = "";
      continue;
    }

    atual += caractere;
  }

  campos.push(atual);
  return campos;
}
