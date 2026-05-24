import type { FastifyInstance } from "fastify";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";

export interface ModuloHttp {
  nome: string;
  descricao: string;
  registrar(app: FastifyInstance, contexto: ContextoAplicacao): Promise<void> | void;
}
