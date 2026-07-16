import { z } from "zod";
import { ehErroBancoIndisponivel } from "../../../../infra/http/errosHttp.js";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";
import {
  definirCookieConta,
  exigirContaAutenticada,
  limparCookieConta,
  metadadosAcesso,
  obterTokenCompra,
  obterTokenSessaoConta,
  resolverContaAutenticada
} from "./segurancaContaBizy.js";

const OtpSchema = z.object({
  telefone: z.string().trim().min(9).max(32).optional(),
  finalidade: z.enum(["LOGIN", "ASSOCIAR_COMPRA"]).default("LOGIN"),
  compraId: z.string().uuid().nullable().optional()
});

const ConfirmarOtpSchema = OtpSchema.extend({
  codigo: z.string().regex(/^\d{6}$/),
  nome: z.string().trim().min(2).max(160).nullable().optional(),
  email: z.string().email().nullable().optional(),
  consentimentoDados: z.boolean().optional(),
  consentimentoMarketing: z.boolean().optional()
});

const PerfilSchema = z.object({
  nomeExibicao: z.string().trim().min(2).max(160).nullable().optional(),
  preferencias: z.record(z.unknown()).optional(),
  consentimentoDados: z.boolean().optional(),
  consentimentoMarketing: z.boolean().optional()
});

const EnderecoSchema = z.object({
  rotulo: z.string().trim().min(2).max(80),
  provincia: z.string().trim().max(120).nullable().optional(),
  municipio: z.string().trim().max(120).nullable().optional(),
  bairro: z.string().trim().max(120).nullable().optional(),
  endereco: z.string().trim().min(5).max(500),
  referencia: z.string().trim().max(300).nullable().optional(),
  principal: z.boolean().optional()
});

const FavoritoSchema = z.object({
  slugLoja: z.string().trim().min(1).max(160).transform((valor) => valor.toLowerCase()),
  codigoProduto: z.string().trim().min(1).max(160)
});

export const moduloContaBizy: ModuloHttp = {
  nome: "conta-bizy",
  descricao: "Conta universal, OTP e sessoes revogaveis do comprador.",
  registrar(app, contexto) {
    app.get("/conta/estado", async (request) => {
      const acesso = await resolverContaAutenticada(contexto, request);
      return acesso
        ? { autenticada: true, conta: { id: acesso.conta.id, nome: acesso.conta.nome } }
        : { autenticada: false, conta: null };
    });

    app.post("/conta/otp/solicitar", async (request, reply) => {
      const dados = OtpSchema.parse(request.body ?? {});
      try {
        const resultado = await contexto.contaBizy.solicitarOtp({ ...dados, tokenCompra: obterTokenCompra(request) });
        return reply.code(202).send(resultado);
      } catch (erro) {
        if (ehErroBancoIndisponivel(erro)) throw erro;
        const mensagem = erro instanceof Error ? erro.message : "Nao foi possivel solicitar o codigo.";
        const status = mensagem === "Compra nao encontrada." ? 404 : mensagem.startsWith("Aguarde") ? 429 : 400;
        return reply.code(status).send({ erro: "OTP_NAO_SOLICITADO", mensagem });
      }
    });

    app.post("/conta/otp/confirmar", async (request, reply) => {
      const dados = ConfirmarOtpSchema.parse(request.body ?? {});
      try {
        const resultado = await contexto.contaBizy.confirmarOtp(
          { ...dados, tokenCompra: obterTokenCompra(request) },
          metadadosAcesso(request)
        );
        definirCookieConta(reply, resultado.token, resultado.expiraEm);
        return { conta: resultado.conta, sessaoId: resultado.sessaoId, expiraEm: resultado.expiraEm };
      } catch (erro) {
        if (ehErroBancoIndisponivel(erro)) throw erro;
        const mensagem = erro instanceof Error ? erro.message : "Codigo invalido ou expirado.";
        return reply.code(mensagem === "Compra nao encontrada." ? 404 : 400).send({ erro: "OTP_INVALIDO", mensagem });
      }
    });

    app.get("/conta/sessao", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return {
        conta: {
          id: acesso.conta.id,
          nome: acesso.conta.nome,
          telefone: acesso.conta.telefoneCanonico,
          email: acesso.conta.emailCanonico,
          status: acesso.conta.status
        }
      };
    });

    app.get("/conta/resumo", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return contexto.contaBizy.obterResumo(acesso.conta);
    });

    app.get("/conta/contextos", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return { contextos: await contexto.contaBizy.obterContextos(acesso.conta.id) };
    });

    app.get("/conta/navegacao", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const resumo = await contexto.contaBizy.obterResumo(acesso.conta);
      return { conta: resumo.conta, contextos: resumo.contextos, navegacao: resumo.navegacao };
    });

    app.get("/conta/sessoes", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return { sessoes: await contexto.contaBizy.listarSessoes(acesso.conta.id) };
    });

    app.get("/conta/comprador/perfil", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return contexto.contaBizy.obterPerfilComprador(acesso.conta.id);
    });

    app.patch("/conta/comprador/perfil", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return contexto.contaBizy.atualizarPerfilComprador(acesso.conta.id, PerfilSchema.parse(request.body ?? {}), metadadosAcesso(request).ipHash);
    });

    app.get("/conta/comprador/enderecos", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return { enderecos: await contexto.contaBizy.listarEnderecos(acesso.conta.id) };
    });

    app.post("/conta/comprador/enderecos", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const endereco = await contexto.contaBizy.salvarEndereco(acesso.conta.id, EnderecoSchema.parse(request.body ?? {}));
      return reply.code(201).send(endereco);
    });

    app.patch("/conta/comprador/enderecos/:id", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const endereco = await contexto.contaBizy.salvarEndereco(acesso.conta.id, { id, ...EnderecoSchema.parse(request.body ?? {}) });
      if (!endereco) return reply.code(404).send({ erro: "ENDERECO_NAO_ENCONTRADO" });
      return endereco;
    });

    app.delete("/conta/comprador/enderecos/:id", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      if (!await contexto.contaBizy.removerEndereco(id, acesso.conta.id)) return reply.code(404).send({ erro: "ENDERECO_NAO_ENCONTRADO" });
      return { sucesso: true };
    });

    app.get("/conta/comprador/favoritos", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return { favoritos: await contexto.contaBizy.listarFavoritos(acesso.conta.id) };
    });

    app.post("/conta/comprador/favoritos", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const dados = FavoritoSchema.parse(request.body ?? {});
      return reply.code(201).send(await contexto.contaBizy.adicionarFavorito(acesso.conta.id, dados.slugLoja, dados.codigoProduto));
    });

    app.delete("/conta/comprador/favoritos/:slugLoja/:codigoProduto", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const dados = FavoritoSchema.parse(request.params);
      if (!await contexto.contaBizy.removerFavorito(acesso.conta.id, dados.slugLoja, dados.codigoProduto)) {
        return reply.code(404).send({ erro: "FAVORITO_NAO_ENCONTRADO" });
      }
      return { sucesso: true };
    });

    app.delete("/conta/sessoes/:id", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const revogada = await contexto.contaBizy.revogarSessao(id, acesso.conta.id);
      if (!revogada) return reply.code(404).send({ erro: "SESSAO_NAO_ENCONTRADA" });
      return { sucesso: true };
    });

    app.delete("/conta/sessao", async (request, reply) => {
      await contexto.contaBizy.encerrarSessao(obterTokenSessaoConta(request));
      limparCookieConta(reply);
      return { sucesso: true };
    });
  }
};
