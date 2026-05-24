import type { SessaoLive } from "../ContextoAplicacao.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloPainel: ModuloHttp = {
  nome: "painel",
  descricao: "Consultas agregadas para cockpit operacional em tempo real.",
  registrar(app, contexto) {
    app.get("/painel/resumo", async () => {
      return contexto.consultaPainel.resumirPainel(
        mapearSessoesLive(contexto.sessoesLive),
        contexto.consultaIntegracoes.listarStatus()
      );
    });
  }
};

function mapearSessoesLive(sessoesLive: Map<string, SessaoLive>) {
  return [...sessoesLive.values()].map(({ provider: _provider, ...sessao }) => sessao);
}
