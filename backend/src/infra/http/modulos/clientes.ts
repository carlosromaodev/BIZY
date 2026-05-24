import { AtualizarClienteCrmSchema, CriarClienteCrmSchema } from "../../../dominio/esquemas.js";
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
