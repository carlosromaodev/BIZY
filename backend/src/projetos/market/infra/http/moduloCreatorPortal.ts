import { z } from "zod";
import type { ModuloHttp } from "../../../../infra/http/modulos/ModuloHttp.js";
import { exigirContaAutenticada } from "../../../commerce/infra/http/segurancaContaBizy.js";
import { exigirAcessoComercial, exigirPermissaoComercial } from "../../../../infra/http/contextoComercial.js";
import { tiposConteudoCommerce } from "../../dominio/conteudoCommerce.js";

const LinkSchema = z.object({
  parceiroId: z.string().uuid(),
  destinoTipo: z.enum(["LOJA", "PRODUTO", "CAMPANHA", "CONTEUDO", "CARRINHO", "MINI_LOJA", "LEARNING"]),
  destinoId: z.string().trim().max(200).nullable().optional(),
  slugLoja: z.string().trim().max(160).nullable().optional(),
  codigoProduto: z.string().trim().max(160).nullable().optional(),
  canal: z.string().trim().max(80).nullable().optional()
});

const ConteudoSchema = z.object({
  parceiroId: z.string().uuid(), slug: z.string().trim().min(3).max(120),
  tipo: z.enum(tiposConteudoCommerce), titulo: z.string().trim().min(3).max(180),
  legenda: z.string().trim().max(4000).nullable().optional(), thumbnailUrl: z.string().url().nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(), divulgacaoComercial: z.boolean().default(true),
  produtos: z.array(z.object({ slugLoja: z.string().trim().min(1).max(160), codigoProduto: z.string().trim().min(1).max(160), variantePecaId: z.string().uuid().nullable().optional() })).min(1).max(50)
});

const OfertaCreatorSchema = z.object({
  codigo: z.string().trim().min(2).max(80), titulo: z.string().trim().min(3).max(180), descricao: z.string().trim().min(10).max(4000),
  comissaoTipo: z.enum(["PERCENTUAL", "FIXA"]), comissaoValor: z.number().int().positive(),
  criterios: z.record(z.unknown()).optional(), regras: z.record(z.unknown()).optional(), bonus: z.record(z.unknown()).optional(),
  stockAmostras: z.number().int().min(0).max(100000).optional(), iniciaEm: z.coerce.date().nullable().optional(), terminaEm: z.coerce.date().nullable().optional(),
  produtos: z.array(z.object({ codigoProduto: z.string().trim().min(1).max(160), variantePecaId: z.string().uuid().nullable().optional() })).min(1).max(100),
  missoes: z.array(z.object({ titulo: z.string().trim().min(3).max(180), descricao: z.string().trim().min(5).max(2000), criterios: z.record(z.unknown()).optional(), bonusEmKwanza: z.number().int().min(0).optional(), iniciaEm: z.coerce.date().nullable().optional(), terminaEm: z.coerce.date().nullable().optional() })).max(20).optional()
});

const DistribuicaoSchema = z.object({
  origemTipo: z.string().trim().min(2).max(80), origemId: z.string().trim().min(1).max(180),
  pedidoId: z.string().uuid().nullable().optional(), conversaoId: z.string().uuid().nullable().optional(),
  politicaCodigo: z.string().trim().min(2).max(100), politicaVersao: z.string().trim().min(1).max(100),
  valorBaseEmKwanza: z.number().int().positive(), valorComissaoKwanza: z.number().int().positive(),
  margemEmKwanza: z.number().int().nonnegative().nullable().optional(), comissaoMaximaKwanza: z.number().int().positive().nullable().optional(),
  participantes: z.array(z.object({ parceiroId: z.string().uuid(), papel: z.enum(["CRIADOR", "AFILIADO", "HOST", "CLOSER", "VENDEDOR", "RECUPERACAO", "CAMPANHA"]), pesoBasisPoints: z.number().int().positive().max(10000) })).min(1).max(20)
});

export const moduloCreatorPortal: ModuloHttp = {
  nome: "creator-portal",
  descricao: "Portal autenticado de criadores e afiliados.",
  registrar(app, contexto) {
    app.get("/creator/portal", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      return contexto.creatorPortal.obterPortal(acesso.conta);
    });

    app.get("/creator/team/ledger", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para consultar o ledger.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const parceiroId = z.object({ parceiroId: z.string().uuid().optional() }).parse(request.query ?? {}).parceiroId;
      if (parceiroId && !await contexto.repositorios.afiliados.buscarParceiroPorId(parceiroId, acesso.negocio.id)) return reply.code(404).send({ erro: "PARCEIRO_NAO_ENCONTRADO" });
      return contexto.ledgerComissoes.obterExtrato(acesso.negocio.id, parceiroId);
    });

    app.post("/creator/team/distribuicoes", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para distribuir comissoes.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const dados = DistribuicaoSchema.parse(request.body ?? {});
      for (const participante of dados.participantes) if (!await contexto.repositorios.afiliados.buscarParceiroPorId(participante.parceiroId, acesso.negocio.id)) return reply.code(404).send({ erro: "PARCEIRO_NAO_ENCONTRADO" });
      try { return reply.code(201).send(await contexto.ledgerComissoes.criarDistribuicao(acesso.negocio.id, dados)); }
      catch (erro) { return reply.code(400).send({ erro: erro instanceof Error ? erro.message : "DISTRIBUICAO_INVALIDA" }); }
    });

    app.post("/creator/team/distribuicoes/:id/confirmar", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para confirmar comissoes.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const distribuicao = await contexto.ledgerComissoes.confirmarDistribuicaoPorId(acesso.negocio.id, id); return distribuicao ?? reply.code(404).send({ erro: "DISTRIBUICAO_NAO_ENCONTRADA" });
    });

    app.post("/creator/team/ledger/:parceiroId/reter", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para reter comissoes.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const { parceiroId } = z.object({ parceiroId: z.string().uuid() }).parse(request.params); const dados = z.object({ valorEmKwanza: z.number().int().positive(), motivo: z.string().trim().min(3).max(500), idempotencyKey: z.string().trim().min(8).max(180) }).parse(request.body ?? {});
      if (!await contexto.repositorios.afiliados.buscarParceiroPorId(parceiroId, acesso.negocio.id)) return reply.code(404).send({ erro: "PARCEIRO_NAO_ENCONTRADO" });
      try { return await contexto.ledgerComissoes.reter(acesso.negocio.id, parceiroId, dados.valorEmKwanza, dados.motivo, dados.idempotencyKey); } catch (erro) { return reply.code(409).send({ erro: erro instanceof Error ? erro.message : "RETENCAO_INVALIDA" }); }
    });

    app.post("/creator/team/ledger/:parceiroId/libertar", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para libertar comissoes.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const { parceiroId } = z.object({ parceiroId: z.string().uuid() }).parse(request.params); const dados = z.object({ valorEmKwanza: z.number().int().positive(), motivo: z.string().trim().min(3).max(500), idempotencyKey: z.string().trim().min(8).max(180) }).parse(request.body ?? {});
      if (!await contexto.repositorios.afiliados.buscarParceiroPorId(parceiroId, acesso.negocio.id)) return reply.code(404).send({ erro: "PARCEIRO_NAO_ENCONTRADO" });
      try { return await contexto.ledgerComissoes.libertar(acesso.negocio.id, parceiroId, dados.valorEmKwanza, dados.motivo, dados.idempotencyKey); } catch (erro) { return reply.code(409).send({ erro: erro instanceof Error ? erro.message : "LIBERTACAO_INVALIDA" }); }
    });

    app.post("/creator/team/payouts", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para criar payouts.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const dados = z.object({ parceiroId: z.string().uuid(), valorEmKwanza: z.number().int().positive(), idempotencyKey: z.string().trim().min(8).max(180) }).parse(request.body ?? {});
      if (!await contexto.repositorios.afiliados.buscarParceiroPorId(dados.parceiroId, acesso.negocio.id)) return reply.code(404).send({ erro: "PARCEIRO_NAO_ENCONTRADO" });
      try { return reply.code(201).send(await contexto.ledgerComissoes.criarPayout(acesso.negocio.id, { ...dados, solicitadoPorId: acesso.usuario.id })); } catch (erro) { return reply.code(409).send({ erro: erro instanceof Error ? erro.message : "PAYOUT_INVALIDO" }); }
    });

    app.post("/creator/team/payouts/:id/confirmar", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para confirmar payouts.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params); const { referencia } = z.object({ referencia: z.string().trim().min(3).max(180) }).parse(request.body ?? {});
      const payout = await contexto.ledgerComissoes.concluirPayout(acesso.negocio.id, id, referencia); return payout ?? reply.code(404).send({ erro: "PAYOUT_NAO_ENCONTRADO" });
    });

    app.post("/creator/team/payouts/:id/falhar", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "pagamentos:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para gerir payouts.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params); const { motivo } = z.object({ motivo: z.string().trim().min(3).max(500) }).parse(request.body ?? {});
      const payout = await contexto.ledgerComissoes.falharPayout(acesso.negocio.id, id, motivo); return payout ?? reply.code(404).send({ erro: "PAYOUT_NAO_ENCONTRADO" });
    });

    app.post("/creator/links/criar", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply);
      if (!acesso) return;
      try {
        return reply.code(201).send(await contexto.creatorPortal.criarLink(acesso.conta, LinkSchema.parse(request.body ?? {})));
      } catch {
        return reply.code(404).send({ erro: "RECURSO_NAO_ENCONTRADO" });
      }
    });

    app.get("/creator/conteudos/dados", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      return { conteudos: await contexto.conteudoCompravel.listarDaConta(acesso.conta) };
    });

    app.post("/creator/conteudos/criar", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      try { return reply.code(201).send(await contexto.conteudoCompravel.criar(acesso.conta, ConteudoSchema.parse(request.body ?? {}))); }
      catch (erro) { const mensagem = erro instanceof Error ? erro.message : "CONTEUDO_INVALIDO"; return reply.code(mensagem === "SLUG_EM_USO" ? 409 : 400).send({ erro: mensagem }); }
    });

    app.patch("/creator/team/conteudos/:id/moderar", async (request, reply) => {
      const acesso = await exigirPermissaoComercial(contexto, request, reply, "afiliados:gerir", "Sem permissao para moderar conteudo."); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const dados = z.object({ aprovar: z.boolean(), motivo: z.string().trim().max(500).nullable().optional() }).parse(request.body ?? {});
      const resultado = await contexto.conteudoCompravel.moderar(id, acesso.negocio.id, dados);
      return resultado ?? reply.code(404).send({ erro: "CONTEUDO_NAO_ENCONTRADO" });
    });

    app.get("/publico/conteudos/:slug", async (request, reply) => {
      const { slug } = z.object({ slug: z.string().trim().min(1).max(160) }).parse(request.params);
      const resultado = await contexto.conteudoCompravel.obterPublico(slug);
      return resultado ?? reply.code(404).send({ erro: "CONTEUDO_NAO_ENCONTRADO" });
    });

    app.get("/creator/oportunidades/dados", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      return contexto.creatorMarketplace.listarCreator(acesso.conta);
    });

    app.post("/creator/oportunidades/:id/candidaturas", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const dados = z.object({ parceiroId: z.string().uuid(), mensagem: z.string().trim().max(2000).nullable().optional() }).parse(request.body ?? {});
      try { return reply.code(201).send(await contexto.creatorMarketplace.candidatar(acesso.conta, id, dados)); }
      catch (erro) { const mensagem = erro instanceof Error ? erro.message : "CANDIDATURA_INVALIDA"; return reply.code(mensagem === "CANDIDATURA_EXISTENTE" ? 409 : 404).send({ erro: mensagem }); }
    });

    app.post("/creator/candidaturas/:id/amostras", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const { observacao } = z.object({ observacao: z.string().trim().max(1000).nullable().optional() }).parse(request.body ?? {});
      try { return reply.code(201).send(await contexto.creatorMarketplace.solicitarAmostra(acesso.conta, id, observacao)); }
      catch (erro) { const mensagem = erro instanceof Error ? erro.message : "AMOSTRA_INVALIDA"; return reply.code(mensagem === "AMOSTRA_INDISPONIVEL" ? 409 : 404).send({ erro: mensagem }); }
    });

    app.post("/creator/missoes/:id/aceitar", async (request, reply) => {
      const acesso = await exigirContaAutenticada(contexto, request, reply); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      try { return reply.code(201).send(await contexto.creatorMarketplace.aceitarMissao(acesso.conta, id)); }
      catch { return reply.code(404).send({ erro: "RECURSO_NAO_ENCONTRADO" }); }
    });

    app.get("/creator/team/ofertas", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "afiliados:ler", modulo: "afiliados", mensagemPermissao: "Sem permissao para consultar ofertas.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      return contexto.creatorMarketplace.listarSeller(acesso.negocio.id);
    });

    app.post("/creator/team/ofertas", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "afiliados:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para criar ofertas.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      try { return reply.code(201).send(await contexto.creatorMarketplace.criarOferta(acesso.negocio.id, OfertaCreatorSchema.parse(request.body ?? {}))); }
      catch (erro) { return reply.code(400).send({ erro: erro instanceof Error ? erro.message : "OFERTA_INVALIDA" }); }
    });

    app.patch("/creator/team/ofertas/:id/publicacao", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "afiliados:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para publicar ofertas.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params); const { publicar } = z.object({ publicar: z.boolean() }).parse(request.body ?? {});
      const resultado = await contexto.creatorMarketplace.publicarOferta(id, acesso.negocio.id, publicar);
      return resultado ?? reply.code(404).send({ erro: "OFERTA_NAO_ENCONTRADA" });
    });

    app.patch("/creator/team/candidaturas/:id/decisao", async (request, reply) => {
      const acesso = await exigirAcessoComercial(contexto, request, reply, { permissao: "afiliados:gerir", modulo: "afiliados", mensagemPermissao: "Sem permissao para decidir candidaturas.", mensagemModulo: "Afiliados desativados para este negocio." }); if (!acesso) return;
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params); const dados = z.object({ aprovar: z.boolean(), motivo: z.string().trim().max(500).nullable().optional() }).parse(request.body ?? {});
      const resultado = await contexto.creatorMarketplace.decidirCandidatura(id, acesso.negocio.id, dados);
      return resultado ?? reply.code(404).send({ erro: "CANDIDATURA_NAO_ENCONTRADA" });
    });
  }
};
