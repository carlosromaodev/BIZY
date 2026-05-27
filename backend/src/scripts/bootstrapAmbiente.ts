import "dotenv/config";
import { pathToFileURL } from "node:url";
import { catalogoModulosNegocio, modulosNegocioPadrao } from "../dominio/tipos.js";
import { criarPrismaCliente } from "../infra/banco/prismaCliente.js";

export type AmbienteBootstrap = "development" | "staging" | "production";

export interface ValidacaoBootstrap {
  ambiente: AmbienteBootstrap;
  armazenamento: string;
  obrigatorias: string[];
  faltando: string[];
  avisos: string[];
}

export interface ResultadoBootstrapAmbiente extends ValidacaoBootstrap {
  negociosVerificados: number;
  modulosCriados: number;
  modulosExistentes: number;
}

type AmbienteEntrada = Record<string, string | undefined>;
interface PrismaBootstrap {
  negocio: {
    findMany(args: { select: { id: true; nomeComercial: true } }): Promise<Array<{ id: string; nomeComercial: string }>>;
  };
  moduloNegocio: {
    findUnique(args: {
      where: {
        negocioId_modulo: {
          negocioId: string;
          modulo: string;
        };
      };
    }): Promise<unknown | null>;
    create(args: {
      data: {
        negocioId: string;
        modulo: string;
        ativo: boolean;
        configuracaoJson: string;
      };
    }): Promise<unknown>;
  };
}

const obrigatoriasPorAmbiente: Record<AmbienteBootstrap, string[]> = {
  development: ["DATABASE_URL"],
  staging: ["DATABASE_URL", "AUTH_SECRET", "EVOLUTION_WEBHOOK_TOKEN", "N8N_BACKEND_TOKEN"],
  production: ["DATABASE_URL", "AUTH_SECRET", "EVOLUTION_WEBHOOK_TOKEN", "N8N_BACKEND_TOKEN", "N8N_WEBHOOK_SECRET"]
};

const recomendadasProducao = [
  "N8N_WEBHOOK_EVENTOS_URL",
  "EVOLUTION_API_URL",
  "EVOLUTION_API_KEY",
  "OMBALA_API_TOKEN"
];

export function resolverAmbienteBootstrap(env: AmbienteEntrada = process.env): AmbienteBootstrap {
  const valor = (env.BIZY_BOOTSTRAP_ENV ?? env.NODE_ENV ?? "development").trim().toLowerCase();
  if (valor === "prod" || valor === "production") return "production";
  if (valor === "stage" || valor === "staging") return "staging";
  return "development";
}

export function validarConfiguracaoBootstrap(env: AmbienteEntrada = process.env): ValidacaoBootstrap {
  const ambiente = resolverAmbienteBootstrap(env);
  const armazenamento = env.MODO_ARMAZENAMENTO ?? "prisma";
  const obrigatorias = armazenamento === "memoria" ? [] : obrigatoriasPorAmbiente[ambiente];
  const faltando = obrigatorias.filter((nome) => !env[nome]?.trim());
  const avisos =
    ambiente === "production"
      ? recomendadasProducao
          .filter((nome) => !env[nome]?.trim())
          .map((nome) => `${nome} não está definido; confirme se esta integração ficará desativada neste ambiente.`)
      : [];

  return { ambiente, armazenamento, obrigatorias, faltando, avisos };
}

export async function executarBootstrapAmbiente(
  prisma: PrismaBootstrap,
  env: AmbienteEntrada = process.env
): Promise<ResultadoBootstrapAmbiente> {
  const validacao = validarConfiguracaoBootstrap(env);
  if (validacao.faltando.length > 0) {
    throw new Error(`Bootstrap bloqueado: variáveis obrigatórias ausentes (${validacao.faltando.join(", ")}).`);
  }

  if (validacao.armazenamento === "memoria") {
    return { ...validacao, negociosVerificados: 0, modulosCriados: 0, modulosExistentes: 0 };
  }

  const negocios = await prisma.negocio.findMany({
    select: {
      id: true,
      nomeComercial: true
    }
  });
  let modulosCriados = 0;
  let modulosExistentes = 0;

  for (const negocio of negocios) {
    for (const definicao of catalogoModulosNegocio) {
      const existente = await prisma.moduloNegocio.findUnique({
        where: {
          negocioId_modulo: {
            negocioId: negocio.id,
            modulo: definicao.modulo
          }
        }
      });

      if (existente) {
        modulosExistentes += 1;
        continue;
      }

      await prisma.moduloNegocio.create({
        data: {
          negocioId: negocio.id,
          modulo: definicao.modulo,
          ativo: modulosNegocioPadrao.includes(definicao.modulo),
          configuracaoJson: "{}"
        }
      });
      modulosCriados += 1;
    }
  }

  return {
    ...validacao,
    negociosVerificados: negocios.length,
    modulosCriados,
    modulosExistentes
  };
}

async function main() {
  const validacao = validarConfiguracaoBootstrap();
  if (validacao.armazenamento === "memoria") {
    console.log(JSON.stringify({ ...validacao, negociosVerificados: 0, modulosCriados: 0, modulosExistentes: 0 }));
    return;
  }

  const prisma = criarPrismaCliente();
  try {
    const resultado = await executarBootstrapAmbiente(prisma);
    console.log(JSON.stringify(resultado));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((erro) => {
    console.error(erro instanceof Error ? erro.message : erro);
    process.exit(1);
  });
}
