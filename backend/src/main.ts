import "dotenv/config";
import { criarAplicacao } from "./infra/http/criarAplicacao.js";
import pino from "pino";

const exibir = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});


const porta = Number(process.env.PORTA ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";
const app = await criarAplicacao();

try {
  await app.listen({ port: porta, host });
  exibir.info(`Bizy backend ativo em http://${host}:${porta}`);

} catch(error) {
  exibir.error(`Erro no backend!! ${error}`)
}
