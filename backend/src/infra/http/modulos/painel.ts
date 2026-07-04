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
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.consultaPainel.resumirPainel(
        mapearSessoesLive(contexto.sessoesLive),
        contexto.consultaIntegracoes.listarStatus(),
        contextoComercial.negocio.id,
        contextoComercial.usuario.id
      );
    });

    app.get("/relatorios/comercial", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar relatórios.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
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
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosRelatorioComercialQuerySchema.parse(request.query ?? {});
      return contexto.relatoriosComerciais.gerarResumoDiario(contextoComercial.negocio.id, filtros);
    });

    app.get("/relatorios/serie-receita", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar série temporal.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { dias } = (request.query ?? {}) as { dias?: string };
      return contexto.relatoriosComerciais.gerarSerieTemporalReceita(
        contextoComercial.negocio.id,
        dias ? Math.min(Number(dias), 90) : 30
      );
    });

    app.get("/relatorios/social-receita", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar relatório social.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.relatoriosComerciais.gerarRelatorioSocialReceita(contextoComercial.negocio.id);
    });

    app.get("/relatorios/comercial.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para exportar relatórios.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosRelatorioComercialQuerySchema.parse(request.query ?? {});
      const exportacao = await contexto.relatoriosComerciais.exportarCsv(contextoComercial.negocio.id, filtros);
      contexto.eventos.emitir("REPORTS_EXPORTED", {
        negocioId: contextoComercial.negocio.id,
        usuarioId: contextoComercial.usuario.id,
        recurso: "relatorio_comercial",
        formato: "csv",
        quantidade: exportacao.quantidade,
        filtros: exportacao.filtros
      });
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", "attachment; filename=\"relatorio-comercial-bizy.csv\"");
      return reply.send(exportacao.csv);
    });

    app.get("/relatorios/comercial.pdf", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "relatorios:ver",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para exportar relatórios.",
        mensagemModulo: "Módulo comercial desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosRelatorioComercialQuerySchema.parse(request.query ?? {});
      const exportacao = await contexto.relatoriosComerciais.exportarPdf(contextoComercial.negocio.id, filtros);
      contexto.eventos.emitir("REPORTS_EXPORTED", {
        negocioId: contextoComercial.negocio.id,
        usuarioId: contextoComercial.usuario.id,
        recurso: "relatorio_comercial",
        formato: "pdf",
        quantidade: exportacao.quantidade,
        filtros: exportacao.filtros
      });
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Length", String(exportacao.pdf.byteLength));
      reply.header("Content-Disposition", `attachment; filename="${exportacao.nomeArquivo}"`);
      return reply.send(exportacao.pdf);
    });
  }
};

function mapearSessoesLive(sessoesLive: Map<string, SessaoLive>) {
  return [...sessoesLive.values()].map(({ provider: _provider, ...sessao }) => sessao);
}
