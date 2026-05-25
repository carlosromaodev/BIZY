import {
  AtualizarClienteCrmSchema,
  AtualizarRelacaoNegocioSchema,
  CriarClienteCrmSchema,
  CriarCompartilhamentoClienteSchema,
  CriarRelacaoNegocioSchema
} from "../../../dominio/esquemas.js";
import { estadosRelacionamentoCliente } from "../../../dominio/tipos.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloClientes: ModuloHttp = {
  nome: "clientes",
  descricao: "Clientes 360, perfil comercial, métricas e exportação operacional.",
  registrar(app, contexto) {
    app.get("/clientes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const query = request.query as {
        busca?: string;
        estadoRelacionamento?: string;
        tag?: string;
        limite?: string;
      };
      const estadoRelacionamento = (estadosRelacionamentoCliente as readonly string[]).includes(
        query.estadoRelacionamento ?? ""
      )
        ? (query.estadoRelacionamento as (typeof estadosRelacionamentoCliente)[number])
        : undefined;

      return contexto.gestaoClientesCrm.listarClientes(contextoComercial.negocio.id, {
        busca: query.busca,
        tag: query.tag,
        estadoRelacionamento,
        limite: query.limite ? Number(query.limite) : undefined
      });
    });

    app.post("/clientes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para gerir clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarClienteCrmSchema.parse(request.body ?? {});
      const cliente = await contexto.gestaoClientesCrm.criarCliente({
        ...dados,
        negocioId: contextoComercial.negocio.id
      });
      return reply.code(201).send(cliente);
    });

    app.post("/negocio/relacoes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para criar relação entre negócios.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = CriarRelacaoNegocioSchema.parse(request.body ?? {});
      try {
        const relacao = await contexto.gestaoCompartilhamentoClientes.criarRelacao({
          negocioOrigemId: contextoComercial.negocio.id,
          negocioDestinoId: dados.negocioDestinoId,
          tipo: dados.tipo,
          escopo: dados.escopo,
          criadoPorUsuarioId: contextoComercial.usuario.id,
          expiraEm: dados.expiraEm
        });
        return reply.code(201).send({ relacao });
      } catch (erro) {
        return reply.code(400).send({
          erro: "RELACAO_NEGOCIO_INVALIDA",
          mensagem: erro instanceof Error ? erro.message : "Não foi possível criar relação entre negócios."
        });
      }
    });

    app.patch("/negocio/relacoes/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para atualizar relação entre negócios.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarRelacaoNegocioSchema.parse(request.body ?? {});
      try {
        const relacao = await contexto.gestaoCompartilhamentoClientes.atualizarRelacao(id, contextoComercial.negocio.id, {
          estado: dados.estado,
          atorUsuarioId: contextoComercial.usuario.id
        });
        return { relacao };
      } catch (erro) {
        return reply.code(400).send({
          erro: "RELACAO_NEGOCIO_INVALIDA",
          mensagem: erro instanceof Error ? erro.message : "Não foi possível atualizar relação entre negócios."
        });
      }
    });

    app.get("/clientes/exportar.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para exportar clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const csv = await contexto.gestaoClientesCrm.exportarCsv(contextoComercial.negocio.id);
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", "attachment; filename=\"clientes-bizy.csv\"");
      return reply.send(csv);
    });

    app.get("/clientes/compartilhamentos/recebidos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar clientes compartilhados.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const compartilhamentos = await contexto.gestaoCompartilhamentoClientes.listarRecebidos(
        contextoComercial.negocio.id
      );
      return { compartilhamentos };
    });

    app.post("/clientes/:id/compartilhamentos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para compartilhar clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = CriarCompartilhamentoClienteSchema.parse(request.body ?? {});
      try {
        const resultado = await contexto.gestaoCompartilhamentoClientes.compartilharCliente({
          clienteId: id,
          negocioOrigemId: contextoComercial.negocio.id,
          negocioDestinoId: dados.negocioDestinoId,
          relacaoId: dados.relacaoId,
          escopo: dados.escopo,
          baseLegal: dados.baseLegal,
          consentimentoCliente: dados.consentimentoCliente,
          atorUsuarioId: contextoComercial.usuario.id,
          expiraEm: dados.expiraEm
        });
        return reply.code(201).send(resultado);
      } catch (erro) {
        return reply.code(400).send({
          erro: "COMPARTILHAMENTO_CLIENTE_INVALIDO",
          mensagem: erro instanceof Error ? erro.message : "Não foi possível compartilhar cliente."
        });
      }
    });

    app.get("/clientes/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const perfil = await contexto.gestaoClientesCrm.obterPerfil(id, contextoComercial.negocio.id);
      if (!perfil) {
        return reply.code(404).send({ erro: "CLIENTE_NAO_ENCONTRADO", mensagem: "Cliente não encontrado." });
      }

      return perfil;
    });

    app.patch("/clientes/:id", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para gerir clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AtualizarClienteCrmSchema.parse(request.body ?? {});
      try {
        return await contexto.gestaoClientesCrm.atualizarCliente(id, contextoComercial.negocio.id, dados);
      } catch (erro) {
        if (erro instanceof Error && erro.message.includes("não encontrado")) {
          return reply.code(404).send({ erro: "CLIENTE_NAO_ENCONTRADO", mensagem: "Cliente não encontrado." });
        }
        throw erro;
      }
    });
  }
};
