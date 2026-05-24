import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export interface ErroHttpClassificado {
  statusCode: number;
  resposta: {
    erro: string;
    mensagem: string;
    recuperavel?: boolean;
    mensagens?: Array<{ caminho: string; mensagem: string }>;
  };
}

const mensagemBancoIndisponivel =
  "Base de dados indisponível. Verifique se o Postgres está em execução e tente novamente.";

const codigosPrismaBancoIndisponivel = new Set(["P1000", "P1001", "P1002", "P1008", "P1010", "P1011", "P1017", "P2024"]);

export function classificarErroHttp(erro: unknown): ErroHttpClassificado {
  if (erro instanceof ZodError) {
    return {
      statusCode: 400,
      resposta: {
        erro: "VALIDACAO",
        mensagem: "Dados inválidos.",
        mensagens: erro.issues.map((issue) => ({
          caminho: issue.path.join("."),
          mensagem: issue.message
        }))
      }
    };
  }

  if (ehErroBancoIndisponivel(erro)) {
    return {
      statusCode: 503,
      resposta: {
        erro: "BANCO_INDISPONIVEL",
        mensagem: mensagemBancoIndisponivel,
        recuperavel: true
      }
    };
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === "P2002") {
      return {
        statusCode: 409,
        resposta: {
          erro: "CONFLITO_DADOS",
          mensagem: "Já existe um registo com estes dados."
        }
      };
    }

    if (erro.code === "P2025") {
      return {
        statusCode: 404,
        resposta: {
          erro: "REGISTO_NAO_ENCONTRADO",
          mensagem: "Registo não encontrado."
        }
      };
    }
  }

  const mensagem = obterMensagemErro(erro);
  const erroDominio = classificarErroDominio(mensagem);
  if (erroDominio) return erroDominio;

  return {
    statusCode: 500,
    resposta: {
      erro: "ERRO_INTERNO",
      mensagem: process.env.NODE_ENV === "production" ? "Erro interno no backend." : mensagem || "Erro interno no backend."
    }
  };
}

export function ehErroInfraestrutura(erro: unknown): boolean {
  return classificarErroHttp(erro).statusCode >= 500;
}

export function ehErroBancoIndisponivel(erro: unknown): boolean {
  const codigo = obterCodigoErro(erro);
  if (codigo && codigosPrismaBancoIndisponivel.has(codigo)) return true;

  if (erro instanceof Prisma.PrismaClientInitializationError) return true;
  if (erro instanceof Prisma.PrismaClientRustPanicError) return true;

  const nome = obterNomeErro(erro);
  if (nome === "PrismaClientInitializationError" || nome === "PrismaClientRustPanicError") return true;

  const mensagem = obterMensagemErro(erro);
  return [
    "can't reach database server",
    "can't connect to database server",
    "database server was closed",
    "server has closed the connection",
    "connection refused",
    "connect econnrefused",
    "timed out fetching a new connection",
    "connection pool timeout",
    "remaining connection slots are reserved"
  ].some((padrao) => mensagem.toLowerCase().includes(padrao));
}

function classificarErroDominio(mensagem: string): ErroHttpClassificado | null {
  const normalizada = mensagem.toLowerCase();

  if (!normalizada) return null;

  if (normalizada.includes("não encontrada") || normalizada.includes("não encontrado")) {
    return {
      statusCode: 404,
      resposta: { erro: "NAO_ENCONTRADO", mensagem }
    };
  }

  if (normalizada.includes("já existe") || normalizada.includes("já possui") || normalizada.includes("duplicad")) {
    return {
      statusCode: 409,
      resposta: { erro: "CONFLITO_DADOS", mensagem }
    };
  }

  if (
    normalizada.includes("inválid") ||
    normalizada.includes("expirad") ||
    normalizada.includes("muitas tentativas") ||
    normalizada.includes("não pode") ||
    normalizada.includes("não está") ||
    normalizada.includes("rejeitad")
  ) {
    return {
      statusCode: 400,
      resposta: { erro: "REGRA_NEGOCIO", mensagem }
    };
  }

  return null;
}

function obterMensagemErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === "string") return erro;
  if (erro && typeof erro === "object" && "message" in erro && typeof erro.message === "string") {
    return erro.message;
  }
  return "";
}

function obterNomeErro(erro: unknown): string | null {
  if (erro instanceof Error) return erro.name;
  if (erro && typeof erro === "object" && "name" in erro && typeof erro.name === "string") {
    return erro.name;
  }
  return null;
}

function obterCodigoErro(erro: unknown): string | null {
  if (erro && typeof erro === "object" && "code" in erro && typeof erro.code === "string") {
    return erro.code;
  }
  return null;
}
