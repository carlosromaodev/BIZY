import {
  CriarAfiliadoSchema,
  CriarLinkAfiliadoSchema,
  CriarLotePagamentoComissaoSchema,
  PagarComissaoParceiroSchema
} from "../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloAfiliados: ModuloHttp = {
  nome: "afiliados",
  descricao: "Afiliados, criadores, links de venda e comissões comerciais.",
  registrar(app, contexto) {
    app.get("/publico/links/:codigo", async (request, reply) => {
      const { codigo } = request.params as { codigo: string };
      const link = await contexto.gestaoAfiliados.resolverLinkPublico(codigo);
      if (!link) {
        return reply.code(404).send({ erro: "LINK_NAO_ENCONTRADO", mensagem: "Link de venda não encontrado ou inativo." });
      }
      return link;
    });

    app.get("/afiliados", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:ler",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar afiliados.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoAfiliados.listarParceiros(contextoComercial.negocio.id);
    });

    app.post("/afiliados", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:gerir",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para gerir afiliados.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarAfiliadoSchema.parse(request.body ?? {});
      const parceiro = await contexto.gestaoAfiliados.criarParceiro(contextoComercial.negocio.id, dados);
      return reply.code(201).send(parceiro);
    });

    app.get("/afiliados/links", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:ler",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar links de afiliados.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoAfiliados.listarLinks(contextoComercial.negocio.id);
    });

    app.post("/afiliados/:id/links", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:gerir",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para gerir links de afiliados.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = CriarLinkAfiliadoSchema.parse(request.body ?? {});
      const link = await contexto.gestaoAfiliados.criarLink(contextoComercial.negocio.id, id, dados);
      return reply.code(201).send(link);
    });

    app.get("/afiliados/:id/pacote-divulgacao", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:ler",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar pacote de divulgação.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const query = request.query as { codigoProduto?: string };
      const pacote = await contexto.gestaoAfiliados.gerarPacoteDivulgacao(contextoComercial.negocio.id, id, {
        codigoProduto: query.codigoProduto
      });
      if (!pacote) {
        return reply.code(404).send({ erro: "AFILIADO_NAO_ENCONTRADO", mensagem: "Afiliado não encontrado." });
      }
      return pacote;
    });

    app.get("/afiliados/comissoes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:ler",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar comissões.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoAfiliados.listarComissoes(contextoComercial.negocio.id);
    });

    app.get("/afiliados/comissoes/saldos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar saldos de comissões.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoAfiliados.resumirSaldosComissoes(contextoComercial.negocio.id);
    });

    app.get("/afiliados/comissoes/lotes-pagamento/exportar.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para exportar lotes de pagamento de comissões.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      const csv = await contexto.gestaoAfiliados.exportarLotesPagamentoCsv(contextoComercial.negocio.id);
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", "attachment; filename=\"lotes-comissoes-bizy.csv\"");
      return reply.send(csv);
    });

    app.get("/afiliados/comissoes/lotes-pagamento", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar lotes de pagamento de comissões.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoAfiliados.listarLotesPagamentoComissoes(contextoComercial.negocio.id);
    });

    app.post("/afiliados/comissoes/lotes-pagamento", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para pagar comissões em lote.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarLotePagamentoComissaoSchema.parse(request.body ?? {});
      const lote = await contexto.gestaoAfiliados.criarLotePagamentoComissoes(
        contextoComercial.negocio.id,
        {
          comissaoIds: dados.comissaoIds,
          referenciaPagamento: dados.referenciaPagamento,
          observacao: dados.observacao,
          periodoInicio: dados.periodoInicio,
          periodoFim: dados.periodoFim,
          autorId: contextoComercial.usuario.id,
          autorNome: contextoComercial.usuario.nome
        }
      );

      return reply.code(201).send(lote);
    });

    app.get("/afiliados/comissoes/:id/auditoria", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:ler",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar auditoria de comissões.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const auditoria = await contexto.gestaoAfiliados.listarAuditoriaComissao(id, contextoComercial.negocio.id);
      if (!auditoria) {
        return reply.code(404).send({ erro: "COMISSAO_NAO_ENCONTRADA", mensagem: "Comissão não encontrada." });
      }

      return auditoria;
    });

    app.post("/afiliados/comissoes/:id/pagar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "pagamentos:gerir",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para pagar comissões.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = PagarComissaoParceiroSchema.parse(request.body ?? {});
      const comissao = await contexto.gestaoAfiliados.marcarComissaoPaga(
        id,
        contextoComercial.negocio.id,
        {
          referenciaPagamento: dados.referenciaPagamento,
          observacao: dados.observacao,
          autorId: contextoComercial.usuario.id,
          autorNome: contextoComercial.usuario.nome
        }
      );
      if (!comissao) {
        return reply.code(404).send({ erro: "COMISSAO_NAO_ENCONTRADA", mensagem: "Comissão não encontrada." });
      }

      return comissao;
    });

    app.get("/afiliados/resumo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "afiliados:ler",
        modulo: "afiliados",
        mensagemPermissao: "Sem permissão para consultar resumo de afiliados.",
        mensagemModulo: "Afiliados desativados para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoAfiliados.resumir(contextoComercial.negocio.id);
    });
  }
};
