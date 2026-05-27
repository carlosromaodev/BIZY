import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloContratos: ModuloHttp = {
  nome: "contratos",
  descricao: "Contratos versionados das APIs, webhooks e eventos de automação da plataforma.",
  registrar(app, contexto) {
    app.get("/contratos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar contratos técnicos.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.contratosPlataforma.listar();
    });
  }
};
