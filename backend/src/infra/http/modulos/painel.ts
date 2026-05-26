import type { SessaoLive } from "../ContextoAplicacao.js";
import { FiltrosRelatorioComercialQuerySchema } from "../../../dominio/esquemas.js";
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

    app.get("/relatorios/comercial", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar relatórios.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosRelatorioComercialQuerySchema.parse(request.query ?? {});
      return contexto.relatoriosComerciais.gerarRelatorio(contextoComercial.negocio.id, filtros);
    });

    app.get("/relatorios/resumo-diario", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar resumo diário.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosRelatorioComercialQuerySchema.parse(request.query ?? {});
      return contexto.relatoriosComerciais.gerarResumoDiario(contextoComercial.negocio.id, filtros);
    });

    app.get("/relatorios/social-receita", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar relatório social.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.relatoriosComerciais.gerarRelatorioSocialReceita(contextoComercial.negocio.id);
    });

    app.get("/relatorios/comercial.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para exportar relatórios.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosRelatorioComercialQuerySchema.parse(request.query ?? {});
      const csv = await contexto.relatoriosComerciais.exportarCsv(contextoComercial.negocio.id, filtros);
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", "attachment; filename=\"relatorio-comercial-bizy.csv\"");
      return reply.send(csv);
    });
  }
};

function mapearSessoesLive(sessoesLive: Map<string, SessaoLive>) {
  return [...sessoesLive.values()].map(({ provider: _provider, ...sessao }) => sessao);
}
