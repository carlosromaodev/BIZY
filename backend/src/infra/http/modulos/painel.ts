import type { SessaoLive } from "../ContextoAplicacao.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloPainel: ModuloHttp = {
  nome: "painel",
  descricao: "Consultas agregadas para cockpit operacional em tempo real.",
  registrar(app, contexto) {
    app.get("/painel/resumo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar o painel.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.consultaPainel.resumirPainel(
        mapearSessoesLive(contexto.sessoesLive),
        contexto.consultaIntegracoes.listarStatus(),
        contextoComercial.negocio.id
      );
    });
  }
};

function mapearSessoesLive(sessoesLive: Map<string, SessaoLive>) {
  return [...sessoesLive.values()].map(({ provider: _provider, ...sessao }) => sessao);
}
