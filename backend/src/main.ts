import "dotenv/config";
import { criarAplicacao } from "./infra/http/criarAplicacao.js";

const porta = Number(process.env.PORTA ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";
const app = await criarAplicacao();

await app.listen({ port: porta, host });

console.info(`ÉMeu backend ativo em http://${host}:${porta}`);
