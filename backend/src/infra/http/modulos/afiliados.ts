import {
  CriarAfiliadoSchema,
  CriarLinkAfiliadoSchema,
  PagarComissaoParceiroSchema
} from "../../../dominio/esquemas.js";
import { exigirAcessoComercial } from "../contextoComercial.js";
import type { ModuloHttp } from "./ModuloHttp.js";

export const moduloAfiliados: ModuloHttp = {
  nome: "afiliados",
  descricao: "Afiliados, criadores, links de venda e comissões comerciais.",
  registrar(app, contexto) {
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
          observacao: dados.observacao
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
