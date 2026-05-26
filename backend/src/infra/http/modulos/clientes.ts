import {
  AtualizarClienteCrmSchema,
  AtualizarRelacaoNegocioSchema,
  AcaoRapidaClienteSchema,
  AnonimizarClienteSchema,
  CriarClienteCrmSchema,
  CriarCompartilhamentoClienteSchema,
  CriarEnderecoClienteSchema,
  CriarRelacaoNegocioSchema,
  FiltrosClientes360QuerySchema,
  ImportarCsvSchema,
  MesclarClientesSchema,
  RevogarCompartilhamentoClienteSchema
} from "../../../dominio/esquemas.js";
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

      const query = FiltrosClientes360QuerySchema.parse(request.query ?? {});

      return contexto.gestaoClientesCrm.listarClientes(contextoComercial.negocio.id, {
        busca: query.busca,
        tag: query.tag,
        estadoRelacionamento: query.estadoRelacionamento,
        consentimentoMarketing: query.consentimentoMarketing,
        limite: query.limite
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
      const {
        whatsapp,
        notas,
        endereco,
        enderecoEntrega,
        bairro,
        bairroEntrega,
        municipio,
        municipioEntrega,
        referencia,
        referenciaEntrega,
        ...dadosCliente
      } = dados;
      const preferencias = {
        ...dadosCliente.preferencias,
        ...(whatsapp ? { whatsapp } : {}),
        ...(notas ? { notasInternas: notas } : {})
      };
      const cliente = await contexto.gestaoClientesCrm.criarCliente({
        ...dadosCliente,
        telefone: dadosCliente.telefone ?? whatsapp,
        preferencias,
        negocioId: contextoComercial.negocio.id
      });
      const enderecoInicial = enderecoEntrega ?? endereco;
      if (enderecoInicial) {
        const resultado = await contexto.gestaoClientesCrm.salvarEnderecoCliente(
          cliente.id,
          contextoComercial.negocio.id,
          {
            endereco: enderecoInicial,
            bairro: bairroEntrega ?? bairro,
            municipio: municipioEntrega ?? municipio,
            referencia: referenciaEntrega ?? referencia,
            principal: true
          }
        );
        if (resultado) {
          return reply.code(201).send({
            ...resultado.cliente,
            enderecos: resultado.enderecos
          });
        }
      }
      return reply.code(201).send(cliente);
    });

    app.post("/clientes/importar.csv", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:exportar",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para importar clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = ImportarCsvSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoClientesCrm.importarCsv(contextoComercial.negocio.id, dados.csv);
      return reply.code(201).send(resultado);
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

      const filtros = FiltrosClientes360QuerySchema.parse(request.query ?? {});
      const exportacao = await contexto.gestaoClientesCrm.exportarCsv(contextoComercial.negocio.id, filtros);
      contexto.eventos.emitir("CLIENTS_EXPORTED", {
        negocioId: contextoComercial.negocio.id,
        usuarioId: contextoComercial.usuario.id,
        recurso: "clientes",
        formato: "csv",
        quantidade: exportacao.quantidade,
        filtros: exportacao.filtros
      });
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", "attachment; filename=\"clientes-bizy.csv\"");
      return reply.send(exportacao.csv);
    });

    app.get("/clientes/segmentos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar segmentos de clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      return contexto.gestaoClientesCrm.segmentarClientes(contextoComercial.negocio.id);
    });

    app.post("/clientes/mesclar/preview", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para pré-visualizar fusão de clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = MesclarClientesSchema.parse(request.body ?? {});
      try {
        return await contexto.gestaoClientesCrm.previsualizarMesclagem(
          dados.clienteDestinoId,
          dados.clienteOrigemId,
          contextoComercial.negocio.id
        );
      } catch (erro) {
        return reply.code(400).send({
          erro: "MESCLAGEM_CLIENTE_INVALIDA",
          mensagem: erro instanceof Error ? erro.message : "Não foi possível pré-visualizar fusão de clientes."
        });
      }
    });

    app.post("/clientes/mesclar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para fundir clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const dados = MesclarClientesSchema.parse(request.body ?? {});
      try {
        return await contexto.gestaoClientesCrm.mesclarClientes(
          dados.clienteDestinoId,
          dados.clienteOrigemId,
          contextoComercial.negocio.id,
          dados.motivo ?? "Fusão manual de clientes duplicados."
        );
      } catch (erro) {
        return reply.code(400).send({
          erro: "MESCLAGEM_CLIENTE_INVALIDA",
          mensagem: erro instanceof Error ? erro.message : "Não foi possível fundir clientes."
        });
      }
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

    app.post("/clientes/compartilhamentos/:id/revogar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para revogar compartilhamento de cliente.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = RevogarCompartilhamentoClienteSchema.parse(request.body ?? {});
      try {
        return await contexto.gestaoCompartilhamentoClientes.revogarCompartilhamento({
          compartilhamentoId: id,
          negocioAtualId: contextoComercial.negocio.id,
          atorUsuarioId: contextoComercial.usuario.id,
          motivo: dados.motivo
        });
      } catch (erro) {
        return reply.code(400).send({
          erro: "COMPARTILHAMENTO_CLIENTE_INVALIDO",
          mensagem: erro instanceof Error ? erro.message : "Não foi possível revogar compartilhamento de cliente."
        });
      }
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
          motivo: dados.motivo,
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

    app.post("/clientes/:id/acoes", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para executar ação rápida do cliente.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AcaoRapidaClienteSchema.parse(request.body ?? {});
      const perfil = await contexto.gestaoClientesCrm.obterPerfil(id, contextoComercial.negocio.id);
      if (!perfil) {
        return reply.code(404).send({ erro: "CLIENTE_NAO_ENCONTRADO", mensagem: "Cliente não encontrado." });
      }

      const tarefa = await contexto.gestaoTarefas.criarTarefa({
        negocioId: contextoComercial.negocio.id,
        tipo: dados.tipo,
        titulo: dados.titulo ?? `Ação ${dados.tipo.toLowerCase()} para ${perfil.cliente.nome ?? perfil.cliente.telefone ?? "cliente"}`,
        descricao: dados.observacao ?? "",
        prioridade: dados.prioridade,
        origem: "acao_rapida_cliente",
        clienteId: perfil.cliente.id,
        clienteTelefone: perfil.cliente.telefone,
        responsavelId: dados.responsavelId ?? contextoComercial.usuario.id,
        prazoEm: dados.prazoEm,
        entidadeTipo: "cliente",
        entidadeId: perfil.cliente.id,
        observacao: dados.observacao,
        contexto: {
          ...dados.contexto,
          clienteNome: perfil.cliente.nome,
          clienteEmail: perfil.cliente.email
        }
      });

      return reply.code(201).send({ acao: dados.tipo, tarefa });
    });

    app.post("/clientes/:id/privacidade/anonimizar", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para anonimizar clientes.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = AnonimizarClienteSchema.parse(request.body ?? {});
      try {
        const cliente = await contexto.gestaoClientesCrm.anonimizarCliente(
          id,
          contextoComercial.negocio.id,
          dados.motivo
        );
        await contexto.gestaoGovernancaCrm.registrarEvento({
          negocioId: contextoComercial.negocio.id,
          topico: "privacidade",
          tipo: "CLIENTE_ANONIMIZADO",
          entidadeTipo: "cliente",
          entidadeId: id,
          idempotencyKey: `cliente-anonimizado:${contextoComercial.negocio.id}:${id}`,
          payload: {
            motivo: dados.motivo,
            usuarioId: contextoComercial.usuario.id
          },
          estado: "PROCESSADO"
        });
        return { cliente };
      } catch (erro) {
        if (erro instanceof Error && erro.message.includes("não encontrado")) {
          return reply.code(404).send({ erro: "CLIENTE_NAO_ENCONTRADO", mensagem: "Cliente não encontrado." });
        }
        throw erro;
      }
    });

    app.get("/clientes/:id/enderecos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:ler",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para consultar endereços do cliente.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const resultado = await contexto.gestaoClientesCrm.listarEnderecosCliente(id, contextoComercial.negocio.id);
      if (!resultado) {
        return reply.code(404).send({ erro: "CLIENTE_NAO_ENCONTRADO", mensagem: "Cliente não encontrado." });
      }

      return resultado;
    });

    app.post("/clientes/:id/enderecos", async (request, reply) => {
      const contextoComercial = await exigirAcessoComercial(contexto, request, reply, {
        permissao: "clientes:gerir",
        modulo: "crm",
        mensagemPermissao: "Sem permissão para gerir endereços do cliente.",
        mensagemModulo: "CRM desativado para este negócio."
      });
      if (!contextoComercial) return;

      const { id } = request.params as { id: string };
      const dados = CriarEnderecoClienteSchema.parse(request.body ?? {});
      const resultado = await contexto.gestaoClientesCrm.salvarEnderecoCliente(
        id,
        contextoComercial.negocio.id,
        dados
      );
      if (!resultado) {
        return reply.code(404).send({ erro: "CLIENTE_NAO_ENCONTRADO", mensagem: "Cliente não encontrado." });
      }

      return reply.code(201).send(resultado);
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
