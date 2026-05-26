import {
  AtualizarTemplateWhatsAppSchema,
  ConfirmarCampanhaSchema,
  CriarCampanhaSchema,
  CriarTemplateWhatsAppSchema,
  FiltrosCampanhasQuerySchema,
  FiltrosEventosOperacionaisQuerySchema,
  PausarCampanhaSchema,
  RegistrarEventoOperacionalSchema,
  CriarJobImportacaoClientesSchema,
  CriarMembroNegocioSchema,
  AtualizarMembroNegocioSchema
} from "../../../dominio/esquemas.js";
import type { MembroNegocioOperacional } from "../../../dominio/tipos.js";
import { montarAlteracoes, registrarAuditoriaCritica } from "../auditoriaOperacional.js";
import { PERMISSOES_POR_PAPEL_PUBLICAS, exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloCampanhas: ModuloHttp = {
  nome: "campanhas-governanca",
  descricao: "Campanhas WhatsApp, templates, membros, eventos idempotentes e jobs operacionais.",
  registrar(app, contexto) {
    app.post("/whatsapp/templates", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para gerir templates WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarTemplateWhatsAppSchema.parse(request.body ?? {});
      const template = await contexto.gestaoCampanhasCrm.criarTemplate({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });

      return reply.code(201).send({ template });
    });

    app.patch("/whatsapp/templates/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "whatsapp",
        mensagemPermissao: "Sem permissão para gerir templates WhatsApp.",
        mensagemModulo: "WhatsApp desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarTemplateWhatsAppSchema.parse(request.body ?? {});
      const { motivo, ...resto } = dados;
      const template = await contexto.gestaoCampanhasCrm.atualizarTemplate(id, contextoComercial.negocio.id, {
        ...resto,
        motivoUltimaAlteracao: motivo
      });

      return { template };
    });

    app.get("/campanhas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "campanhas:gerir",
        modulo: "campanhas",
        mensagemPermissao: "Sem permissão para consultar campanhas.",
        mensagemModulo: "Campanhas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosCampanhasQuerySchema.parse(request.query ?? {});
      const campanhas = await contexto.gestaoCampanhasCrm.listarCampanhas(contextoComercial.negocio.id, filtros);
      return { campanhas };
    });

    app.post("/campanhas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "campanhas:gerir",
        modulo: "campanhas",
        mensagemPermissao: "Sem permissão para criar campanhas.",
        mensagemModulo: "Campanhas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarCampanhaSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoCampanhasCrm.criarCampanha({
        ...dados,
        negocioId: contextoComercial.negocio.id,
        usuarioId: contextoComercial.usuario.id
      });

      return reply.code(201).send(resultado);
    });

    app.post("/campanhas/:id/confirmar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "campanhas:gerir",
        modulo: "campanhas",
        mensagemPermissao: "Sem permissão para confirmar campanhas.",
        mensagemModulo: "Campanhas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const dados = ConfirmarCampanhaSchema.parse(request.body ?? {});
      if (!dados.confirmar) {
        throw new Error("Confirmação explícita é obrigatória para disparar campanha.");
      }
      const { id } = request.params as { id: string };
      const resultado = await contexto.gestaoCampanhasCrm.confirmarCampanha(id, contextoComercial.negocio.id);

      return reply.code(202).send(resultado);
    });

    app.post("/campanhas/:id/pausar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "campanhas:gerir",
        modulo: "campanhas",
        mensagemPermissao: "Sem permissão para pausar campanhas.",
        mensagemModulo: "Campanhas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = PausarCampanhaSchema.parse(request.body ?? {});
      const campanha = await contexto.gestaoCampanhasCrm.pausarCampanha(id, contextoComercial.negocio.id, dados.motivo);

      return { campanha };
    });

    app.get("/campanhas/:id/resultados", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "campanhas:gerir",
        modulo: "campanhas",
        mensagemPermissao: "Sem permissão para consultar campanhas.",
        mensagemModulo: "Campanhas desativadas para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      return contexto.gestaoCampanhasCrm.obterResultados(id, contextoComercial.negocio.id);
    });

    app.get("/negocio/papeis", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar papéis.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      return {
        papeis: Object.entries(PERMISSOES_POR_PAPEL_PUBLICAS).map(([papel, permissoes]) => ({ papel, permissoes }))
      };
    });

    app.get("/negocio/membros", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar membros.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const membros = await contexto.gestaoGovernancaCrm.listarMembros(contextoComercial.negocio.id);
      return {
        membros: [
          {
            id: `usuario:${contextoComercial.usuario.id}`,
            negocioId: contextoComercial.negocio.id,
            usuarioId: contextoComercial.usuario.id,
            nome: contextoComercial.usuario.nome,
            telefone: contextoComercial.usuario.telefone,
            email: contextoComercial.usuario.email,
            avatarUrl: contextoComercial.usuario.avatarUrl,
            papel: contextoComercial.papel,
            status: "ATIVO",
            permissoes: contextoComercial.permissoes,
            criadoEm: contextoComercial.usuario.criadoEm,
            atualizadoEm: contextoComercial.usuario.atualizadoEm
          },
          ...membros
        ]
      };
    });

    app.post("/negocio/membros", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para criar membros.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarMembroNegocioSchema.parse(request.body ?? {});
      const membro = await contexto.gestaoGovernancaCrm.criarMembro({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "permissoes",
        tipo: "MEMBRO_CRIADO",
        entidadeTipo: "membro_negocio",
        entidadeId: membro.id,
        motivo: "Membro criado no negócio.",
        alteracoes: montarAlteracoes(null, dadosMembroAuditoria(membro), [
          "papel",
          "status",
          "permissoes",
          "telefone",
          "email"
        ])
      });
      return reply.code(201).send({ membro });
    });

    app.patch("/negocio/membros/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "configuracoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para atualizar membros.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarMembroNegocioSchema.parse(request.body ?? {});
      const membroAntes =
        (await contexto.gestaoGovernancaCrm.listarMembros(contextoComercial.negocio.id)).find((membro) => membro.id === id) ??
        null;
      const membro = await contexto.gestaoGovernancaCrm.atualizarMembro(id, contextoComercial.negocio.id, dados);
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "permissoes",
        tipo: "MEMBRO_ATUALIZADO",
        entidadeTipo: "membro_negocio",
        entidadeId: id,
        motivo: dados.motivo ?? "Membro atualizado no negócio.",
        alteracoes: montarAlteracoes(dadosMembroAuditoria(membroAntes), dadosMembroAuditoria(membro), [
          "papel",
          "status",
          "permissoes"
        ])
      });
      return { membro };
    });

    app.post("/eventos-operacionais", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para registrar eventos operacionais.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = RegistrarEventoOperacionalSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoGovernancaCrm.registrarEvento({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });
      return reply.code(resultado.duplicado ? 200 : 201).send(resultado);
    });

    app.get("/eventos-operacionais", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "automacoes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar eventos operacionais.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const filtros = FiltrosEventosOperacionaisQuerySchema.parse(request.query ?? {});
      const eventos = await contexto.gestaoGovernancaCrm.listarEventos(contextoComercial.negocio.id, filtros);
      return { eventos };
    });

    app.post("/jobs/importacao/clientes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para importar clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarJobImportacaoClientesSchema.parse(request.body ?? {});
      if (dados.idempotencyKey) {
        const existente = await contexto.gestaoGovernancaCrm.buscarJobPorIdempotencia(
          contextoComercial.negocio.id,
          dados.idempotencyKey
        );
        if (existente) return reply.code(200).send({ job: existente, resultado: existente.resultado, duplicado: true });
      }

      const criado = await contexto.gestaoGovernancaCrm.criarJob({
        negocioId: contextoComercial.negocio.id,
        tipo: "IMPORTACAO_CLIENTES",
        estado: "PROCESSANDO",
        idempotencyKey: dados.idempotencyKey,
        resultado: {}
      });
      if (criado.duplicado) return reply.code(200).send({ job: criado.job, resultado: criado.job.resultado, duplicado: true });

      const resultado = await contexto.gestaoClientesCrm.importarCsv(contextoComercial.negocio.id, dados.csv);
      const job = await contexto.gestaoGovernancaCrm.atualizarJob(criado.job.id, contextoComercial.negocio.id, {
        estado: "CONCLUIDO",
        total: resultado.total,
        processados: resultado.criados + resultado.atualizados,
        erros: resultado.erros,
        resultado: resultado as unknown as Record<string, unknown>,
        concluidoEm: new Date()
      });

      return reply.code(202).send({ job: job ?? criado.job, resultado, duplicado: false });
    });
  }
};

function dadosMembroAuditoria(membro: MembroNegocioOperacional | null): Record<string, unknown> | null {
  if (!membro) return null;
  return {
    papel: membro.papel,
    status: membro.status,
    permissoes: membro.permissoes,
    telefone: membro.telefone,
    email: membro.email
  };
}
