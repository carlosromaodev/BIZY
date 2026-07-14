import {
  ArquivarPecaSchema,
  AtualizarPecaSchema,
  ConfigurarVariantesPecaSchema,
  CriarPecaSchema,
  ImportarCsvSchema,
  LimparColecaoSchema,
  ParamCodigoSchema,
  RegistrarMovimentoStockSchema,
  RenomearColecaoSchema
} from "../../../dominio/esquemas.js";
import { montarAlteracoes, registrarAuditoriaCritica } from "../auditoriaOperacional.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloCatalogo: ModuloHttp = {
  nome: "catalogo",
  descricao: "Cadastro e listagem das peças vendidas em live.",
  registrar(app, contexto) {
    app.post("/pecas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = CriarPecaSchema.parse(request.body);
      const peca = await contexto.gestaoPecas.cadastrarPeca({ ...dados, negocioId: contextoComercial.negocio.id });
      return reply.code(201).send(peca);
    });

    app.get("/pecas", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:ler",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para consultar catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      return contexto.gestaoPecas.listarPecas(contextoComercial.negocio.id);
    });

    app.get("/pecas/resumo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:ler",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para consultar catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      return contexto.gestaoPecas.resumirCatalogo(contextoComercial.negocio.id);
    });

    app.post("/pecas/colecoes/renomear", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir coleções.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = RenomearColecaoSchema.parse(request.body ?? {});
      return contexto.gestaoPecas.renomearColecao(contextoComercial.negocio.id, dados.de, dados.para);
    });

    app.post("/pecas/colecoes/limpar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir coleções.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = LimparColecaoSchema.parse(request.body ?? {});
      return contexto.gestaoPecas.limparColecao(contextoComercial.negocio.id, dados.colecao);
    });

    app.post("/pecas/importar.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para importar produtos.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const dados = ImportarCsvSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoPecas.importarCsv(contextoComercial.negocio.id, dados.csv);
      return reply.code(201).send(resultado);
    });

    app.get("/pecas/:codigo/movimentos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:ler",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para consultar histórico de stock.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = ParamCodigoSchema.parse(request.params);
      const movimentos = await contexto.gestaoPecas.listarMovimentosStock(codigo, contextoComercial.negocio.id);
      return { movimentos };
    });

    app.post("/pecas/:codigo/movimentos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir stock.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = ParamCodigoSchema.parse(request.params);
      const dados = RegistrarMovimentoStockSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoPecas.registrarMovimentoStock(
        codigo,
        { ...dados, responsavelId: dados.responsavelId ?? contextoComercial.usuario.id },
        contextoComercial.negocio.id
      );
      await registrarAuditoriaCritica(contexto, contextoComercial, {
        topico: "stock",
        tipo: "STOCK_AJUSTADO",
        entidadeTipo: "produto",
        entidadeId: resultado.peca.codigo,
        motivo: dados.motivo,
        alteracoes: montarAlteracoes(
          { quantidade: resultado.movimento.quantidadeAnterior },
          { quantidade: resultado.movimento.quantidadeNova },
          ["quantidade"]
        ),
        payload: {
          movimentoId: resultado.movimento.id,
          codigoPeca: resultado.peca.codigo,
          tipoMovimento: resultado.movimento.tipo,
          quantidadeMovimento: resultado.movimento.quantidade,
          responsavelId: resultado.movimento.responsavelId,
          origem: resultado.movimento.origem
        }
      });
      return reply.code(201).send(resultado);
    });

    app.get("/pecas/:codigo/variantes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "catalogo:ler",
        modulo: "catalogo",
        mensagemPermissao: "Sem permissão para consultar variantes.",
        mensagemModulo: "Catálogo desativado para este negócio."
      });
      if (!contextoComercial) return;
      const { codigo } = ParamCodigoSchema.parse(request.params);
      return { variantes: await contexto.gestaoPecas.listarVariantesPeca(codigo, contextoComercial.negocio.id) };
    });

    app.put("/pecas/:codigo/variantes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "catalogo:gerir",
        modulo: "catalogo",
        mensagemPermissao: "Sem permissão para gerir variantes.",
        mensagemModulo: "Catálogo desativado para este negócio."
      });
      if (!contextoComercial) return;
      const { codigo } = ParamCodigoSchema.parse(request.params);
      const dados = ConfigurarVariantesPecaSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoPecas.configurarVariantesPeca(codigo, dados.combinacoes, contextoComercial.negocio.id);
      return reply.code(200).send(resultado);
    });

    app.post("/pecas/:codigo/arquivar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para arquivar produto.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = ParamCodigoSchema.parse(request.params);
      const dados = ArquivarPecaSchema.parse(request.body ?? {});
      return contexto.gestaoPecas.arquivarPeca(codigo, dados.motivo, contextoComercial.negocio.id);
    });

    app.patch("/pecas/:codigo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = ParamCodigoSchema.parse(request.params);
      const dados = AtualizarPecaSchema.parse(request.body ?? {});
      return contexto.gestaoPecas.atualizarPeca(
        codigo,
        { ...dados, negocioId: contextoComercial.negocio.id },
        contextoComercial.negocio.id
      );
    });

    app.delete("/pecas/:codigo", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(
        contexto,
        request,
        reply,
        {
          permissao: "catalogo:gerir",
          modulo: "catalogo",
          mensagemPermissao: "Sem permissão para gerir catálogo.",
          mensagemModulo: "Catálogo desativado para este negócio."
        }
      );
      if (!contextoComercial) return;

      const { codigo } = ParamCodigoSchema.parse(request.params);
      return contexto.gestaoPecas.desativarPeca(codigo, contextoComercial.negocio.id);
    });
  }
};
