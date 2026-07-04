import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ParamIdSchema } from "../../../dominio/esquemas.js";
import type { ContextoAplicacao } from "../ContextoAplicacao.js";
import { exigirAcessoComercial, type ContextoComercialHttp } from "../contextoComercial.js";
import type {
  Cliente360,
  EventoOperacional,
  Pedido,
  TarefaOperacional
} from "../../../dominio/tipos.js";
import type { ModuloHttp } from "./ModuloHttp.js";

const etapasPipeline = [
  "LEAD",
  "CONTACTO_FEITO",
  "PROPOSTA_ENVIADA",
  "NEGOCIACAO",
  "FECHADO_GANHO",
  "FECHADO_PERDIDO"
] as const;
type EtapaPipeline = (typeof etapasPipeline)[number];

const tiposLembrete = ["FOLLOW_UP", "COBRANCA", "ENTREGA", "CALLBACK", "REUNIAO", "OUTRO"] as const;
type TipoLembrete = (typeof tiposLembrete)[number];

const estadosLembrete = ["PENDENTE", "CONCLUIDO", "VENCIDO", "CANCELADO"] as const;
type EstadoLembrete = (typeof estadosLembrete)[number];

const estadosCotacao = ["ABERTA", "ACEITE", "EXPIRADA", "RECUSADA"] as const;
type EstadoCotacao = (typeof estadosCotacao)[number];

const estadosSequencia = ["ATIVA", "PAUSADA", "RASCUNHO", "ARQUIVADA"] as const;
type EstadoSequencia = (typeof estadosSequencia)[number];

const AtualizarEtapaPipelineSchema = z.object({
  etapa: z.enum(etapasPipeline),
  motivoPerda: z.string().trim().max(500).nullable().optional().transform((valor) => valor ?? null),
  observacao: z.string().trim().max(1000).nullable().optional().transform((valor) => valor ?? null),
});

const AtualizarLembreteSchema = z.object({
  titulo: z.string().trim().min(3).max(160).optional(),
  tipo: z.enum(tiposLembrete).optional(),
  estado: z.enum(estadosLembrete).optional(),
  dataHora: z.coerce.date().optional(),
  clienteId: z.string().trim().uuid().nullable().optional(),
  clienteNome: z.string().trim().max(120).nullable().optional(),
  conversaId: z.string().trim().max(120).nullable().optional(),
  pedidoId: z.string().trim().max(120).nullable().optional(),
  observacao: z.string().trim().max(1000).nullable().optional(),
  responsavelId: z.string().trim().max(120).nullable().optional()
}).refine((dados) => Object.keys(dados).length > 0, {
  message: "Informe pelo menos um campo para atualizar o lembrete."
});

const CriarLembreteSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  tipo: z.enum(tiposLembrete).default("FOLLOW_UP"),
  dataHora: z.coerce.date(),
  clienteId: z.string().trim().uuid().nullable().optional().transform((valor) => valor ?? null),
  clienteNome: z.string().trim().max(120).nullable().optional().transform((valor) => valor ?? null),
  conversaId: z.string().trim().max(120).nullable().optional().transform((valor) => valor ?? null),
  pedidoId: z.string().trim().max(120).nullable().optional().transform((valor) => valor ?? null),
  observacao: z.string().trim().max(2000).nullable().optional().transform((valor) => valor ?? null),
  responsavelId: z.string().trim().max(120).nullable().optional().transform((valor) => valor ?? null)
});

const AtualizarRespostaRapidaSchema = z.object({
  titulo: z.string().trim().min(2).max(120).optional(),
  texto: z.string().trim().min(2).max(2000).optional(),
  favorita: z.boolean().optional()
}).refine((dados) => Object.keys(dados).length > 0, {
  message: "Informe pelo menos um campo para atualizar a resposta rápida."
});

const AtualizarSequenciaSchema = z.object({
  estado: z.enum(estadosSequencia).optional()
}).refine((dados) => Object.keys(dados).length > 0, {
  message: "Informe pelo menos um campo para atualizar a sequência."
});

interface NegocioPipeline {
  id: string;
  titulo: string;
  clienteId: string | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  etapa: EtapaPipeline;
  valorEstimadoEmKwanza: number;
  responsavelId: string | null;
  dataPrevisaoFecho: string | null;
  motivoPerda: string | null;
  produtoId: string | null;
  produtoNome: string | null;
  observacao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

interface LembreteFrontend {
  id: string;
  titulo: string;
  tipo: TipoLembrete;
  estado: EstadoLembrete;
  clienteId: string | null;
  clienteNome: string | null;
  pedidoId: string | null;
  conversaId: string | null;
  dataHora: string;
  recorrente: boolean;
  observacao: string | null;
  responsavelId: string | null;
  criadoEm: string;
}

interface RespostaRapidaFrontend {
  id: string;
  titulo: string;
  texto: string;
  categoria: "SAUDACAO" | "PRECO" | "DISPONIBILIDADE" | "PAGAMENTO" | "ENTREGA" | "POS_VENDA" | "OUTRO";
  variaveisUsadas: string[];
  favorita: boolean;
  criadaEm: string;
  atualizadaEm: string;
}

interface SequenciaFrontend {
  id: string;
  nome: string;
  tipo: "BOAS_VINDAS" | "COBRANCA" | "POS_VENDA" | "REACTIVACAO" | "PERSONALIZADA";
  estado: EstadoSequencia;
  passos: Array<{ ordem: number; tipo: "ENVIAR_TEMPLATE" | "CRIAR_TAREFA" | "ADICIONAR_TAG"; detalhe: string; esperaMinutos: number }>;
  totalInscritos: number;
  totalConvertidos: number;
  pausaSeResponder: boolean;
  limiteExecucoesPorCliente: number;
  criadaEm: string;
  atualizadaEm: string;
}

const respostasRapidasPadrao: RespostaRapidaFrontend[] = [
  {
    id: "padrao-saudacao",
    titulo: "Saudação inicial",
    texto: "Olá, {{nome}}. Sou da loja. Posso ajudar com preço, stock ou entrega?",
    categoria: "SAUDACAO",
    variaveisUsadas: ["nome"],
    favorita: false,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "padrao-preco",
    titulo: "Confirmar preço",
    texto: "{{produto}} está por {{preco}}. Posso reservar para si?",
    categoria: "PRECO",
    variaveisUsadas: ["produto", "preco"],
    favorita: false,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "padrao-disponibilidade",
    titulo: "Verificar disponibilidade",
    texto: "Vou confirmar o stock de {{produto}} e já volto com a disponibilidade.",
    categoria: "DISPONIBILIDADE",
    variaveisUsadas: ["produto"],
    favorita: false,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "padrao-pagamento",
    titulo: "Pedir comprovativo",
    texto: "Pode enviar o comprovativo por aqui para confirmarmos o pagamento do pedido #{{pedido}}.",
    categoria: "PAGAMENTO",
    variaveisUsadas: ["pedido"],
    favorita: false,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "padrao-entrega",
    titulo: "Confirmar entrega",
    texto: "Confirma o bairro, referência e horário ideal para entrega?",
    categoria: "ENTREGA",
    variaveisUsadas: [],
    favorita: false,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "padrao-pos-venda",
    titulo: "Pós-venda",
    texto: "Olá, {{nome}}. Correu tudo bem com a sua compra? Posso ajudar com mais alguma coisa?",
    categoria: "POS_VENDA",
    variaveisUsadas: ["nome"],
    favorita: false,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  }
];

const sequenciasPadrao: SequenciaFrontend[] = [
  {
    id: "seq-boas-vindas",
    nome: "Boas-vindas a novo lead",
    tipo: "BOAS_VINDAS",
    estado: "ATIVA",
    passos: [
      { ordem: 1, tipo: "ENVIAR_TEMPLATE", detalhe: "Saudação e contexto do interesse", esperaMinutos: 0 },
      { ordem: 2, tipo: "CRIAR_TAREFA", detalhe: "Follow-up humano se não responder", esperaMinutos: 180 }
    ],
    totalInscritos: 0,
    totalConvertidos: 0,
    pausaSeResponder: true,
    limiteExecucoesPorCliente: 1,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "seq-cobranca",
    nome: "Cobrança de pagamento",
    tipo: "COBRANCA",
    estado: "ATIVA",
    passos: [
      { ordem: 1, tipo: "ENVIAR_TEMPLATE", detalhe: "Lembrete de comprovativo", esperaMinutos: 0 },
      { ordem: 2, tipo: "CRIAR_TAREFA", detalhe: "Cobrança assistida", esperaMinutos: 240 }
    ],
    totalInscritos: 0,
    totalConvertidos: 0,
    pausaSeResponder: true,
    limiteExecucoesPorCliente: 2,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "seq-pos-venda",
    nome: "Pós-venda e recompra",
    tipo: "POS_VENDA",
    estado: "ATIVA",
    passos: [
      { ordem: 1, tipo: "ENVIAR_TEMPLATE", detalhe: "Confirmação de satisfação", esperaMinutos: 1440 },
      { ordem: 2, tipo: "ADICIONAR_TAG", detalhe: "Cliente pronto para recompra", esperaMinutos: 4320 }
    ],
    totalInscritos: 0,
    totalConvertidos: 0,
    pausaSeResponder: true,
    limiteExecucoesPorCliente: 1,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "seq-reactivacao",
    nome: "Reactivação de cliente inactivo",
    tipo: "REACTIVACAO",
    estado: "PAUSADA",
    passos: [
      { ordem: 1, tipo: "ENVIAR_TEMPLATE", detalhe: "Mensagem de reactivação", esperaMinutos: 0 },
      { ordem: 2, tipo: "CRIAR_TAREFA", detalhe: "Contacto humano se houver sinal de compra", esperaMinutos: 1440 }
    ],
    totalInscritos: 0,
    totalConvertidos: 0,
    pausaSeResponder: true,
    limiteExecucoesPorCliente: 1,
    criadaEm: "2026-01-01T00:00:00.000Z",
    atualizadaEm: "2026-01-01T00:00:00.000Z"
  }
];

export const moduloApoioComercial: ModuloHttp = {
  nome: "apoio-comercial",
  descricao: "Contratos de apoio para módulos comerciais do frontend.",
  registrar(app, contexto) {
    app.get("/pipeline", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "funil:ler", "funil");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 200);
      return { negocios: await montarPipeline(contexto, contextoComercial.negocio.id, limite) };
    });

    app.patch("/pipeline/:id/etapa", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "funil:gerir", "funil");
      if (!contextoComercial) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = AtualizarEtapaPipelineSchema.parse(request.body ?? {});
      const evento = await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "crm_apoio",
        tipo: "PIPELINE_ETAPA_ATUALIZADA",
        entidadeTipo: "pipeline_negocio",
        entidadeId: id,
        estado: "PROCESSADO",
        payload: {
          etapa: dados.etapa,
          motivoPerda: dados.motivoPerda,
          observacao: dados.observacao,
          autorId: contextoComercial.usuario.id
        }
      });
      const negocios = await montarPipeline(contexto, contextoComercial.negocio.id, 500);
      const negocio = negocios.find((item) => item.id === id) ?? null;
      if (!negocio) return reply.code(404).send({ erro: "NEGOCIO_NAO_ENCONTRADO", mensagem: "Negócio não encontrado no pipeline." });
      return { negocio, evento: evento.evento };
    });

    app.post("/lembretes", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "tarefas:gerir", "crm");
      if (!contextoComercial) return;

      const dados = CriarLembreteSchema.parse(request.body ?? {});
      const pedidoId = await obterPedidoIdValido(contexto, contextoComercial.negocio.id, dados.pedidoId);
      const tarefa = await contexto.gestaoTarefas.criarTarefa({
        negocioId: contextoComercial.negocio.id,
        tipo: dados.tipo,
        titulo: dados.titulo,
        descricao: dados.observacao ?? "",
        prioridade: prioridadeLembrete(dados.tipo),
        origem: "atendimento",
        clienteId: dados.clienteId,
        pedidoId,
        entidadeTipo: dados.conversaId ? "conversa" : "lembrete",
        entidadeId: dados.conversaId,
        responsavelId: dados.responsavelId ?? contextoComercial.usuario.id,
        prazoEm: dados.dataHora,
        observacao: dados.observacao,
        contexto: {
          clienteNome: dados.clienteNome,
          pedidoReferencia: dados.pedidoId,
          origemInterface: "atendimento"
        }
      });
      await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "agenda",
        tipo: "LEMBRETE_CRIADO",
        entidadeTipo: "tarefa_operacional",
        entidadeId: tarefa.id,
        estado: "PROCESSADO",
        payload: {
          autorId: contextoComercial.usuario.id,
          clienteId: dados.clienteId,
          clienteNome: dados.clienteNome,
          conversaId: dados.conversaId,
          pedidoId: dados.pedidoId,
          tipo: dados.tipo,
          dataHora: dados.dataHora.toISOString()
        }
      });
      const clientes = await mapaClientes(contexto, contextoComercial.negocio.id);
      return reply.code(201).send({ lembrete: mapearTarefaParaLembrete(tarefa, clientes) });
    });

    app.get("/lembretes", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "tarefas:ler", "crm");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 100);
      const lembretes = await listarLembretes(contexto, contextoComercial.negocio.id, limite);
      return { lembretes };
    });

    app.patch("/lembretes/:id", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "tarefas:gerir", "crm");
      if (!contextoComercial) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = AtualizarLembreteSchema.parse(request.body ?? {});
      const pedidoId = dados.pedidoId === undefined
        ? undefined
        : await obterPedidoIdValido(contexto, contextoComercial.negocio.id, dados.pedidoId);
      const tarefa = await contexto.gestaoTarefas.atualizarTarefa(id, contextoComercial.negocio.id, {
        tipo: dados.tipo,
        titulo: dados.titulo,
        descricao: dados.observacao === undefined ? undefined : dados.observacao ?? "",
        estado: dados.estado ? mapearEstadoLembreteParaTarefa(dados.estado) : undefined,
        clienteId: dados.clienteId,
        pedidoId,
        entidadeTipo: dados.conversaId === undefined ? undefined : dados.conversaId ? "conversa" : "lembrete",
        entidadeId: dados.conversaId === undefined ? undefined : dados.conversaId,
        responsavelId: dados.responsavelId,
        prazoEm: dados.dataHora,
        observacao: dados.observacao === undefined ? undefined : dados.observacao,
        contexto: {
          origemInterface: "agenda",
          ...(dados.clienteNome !== undefined ? { clienteNome: dados.clienteNome } : {}),
          ...(dados.pedidoId !== undefined ? { pedidoReferencia: dados.pedidoId } : {})
        }
      });
      await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "agenda",
        tipo: dados.estado === "CONCLUIDO"
          ? "LEMBRETE_CONCLUIDO"
          : dados.estado === "CANCELADO"
            ? "LEMBRETE_CANCELADO"
            : "LEMBRETE_ATUALIZADO",
        entidadeTipo: "tarefa_operacional",
        entidadeId: id,
        estado: "PROCESSADO",
        payload: {
          autorId: contextoComercial.usuario.id,
          campos: Object.keys(dados)
        }
      });
      const clientes = await mapaClientes(contexto, contextoComercial.negocio.id);
      return { lembrete: mapearTarefaParaLembrete(tarefa, clientes) };
    });

    app.get("/metas", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "relatorios:ver", "relatorios");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 50);
      const metas = await montarMetas(contexto, contextoComercial.negocio.id);
      return { metas: metas.slice(0, limite) };
    });

    app.get("/cotacoes", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "pedidos:ler", "pedidos");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 200);
      const cotacoes = await listarCotacoes(contexto, contextoComercial.negocio.id, limite);
      return { cotacoes };
    });

    app.post("/cotacoes/:id/enviar", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "conversas:gerir", "conversas");
      if (!contextoComercial) return;

      const { id } = ParamIdSchema.parse(request.params);
      const cotacao = await obterCotacao(contexto, contextoComercial.negocio.id, id);
      if (!cotacao) return reply.code(404).send({ erro: "COTACAO_NAO_ENCONTRADA", mensagem: "Cotação não encontrada." });
      const evento = await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "cotacoes",
        tipo: "COTACAO_ENVIO_SOLICITADO",
        entidadeTipo: "cotacao",
        entidadeId: id,
        estado: "PROCESSADO",
        payload: { autorId: contextoComercial.usuario.id, clienteTelefone: cotacao.clienteTelefone }
      });
      return reply.code(202).send({ cotacao, envio: { status: "REGISTADO", eventoId: evento.evento.id } });
    });

    app.post("/cotacoes/:id/converter", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "pedidos:gerir", "pedidos");
      if (!contextoComercial) return;

      const { id } = ParamIdSchema.parse(request.params);
      const cotacao = await obterCotacao(contexto, contextoComercial.negocio.id, id);
      if (!cotacao) return reply.code(404).send({ erro: "COTACAO_NAO_ENCONTRADA", mensagem: "Cotação não encontrada." });
      const evento = await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "cotacoes",
        tipo: "COTACAO_CONVERTIDA",
        entidadeTipo: "cotacao",
        entidadeId: id,
        estado: "PROCESSADO",
        payload: { autorId: contextoComercial.usuario.id, pedidoConvertidoId: id }
      });
      return { cotacao: { ...cotacao, estado: "ACEITE", pedidoConvertidoId: id }, evento: evento.evento };
    });

    app.get("/respostas-rapidas", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "conversas:ler", "conversas");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 100);
      const respostas = await listarRespostasRapidas(contexto, contextoComercial.negocio.id);
      return { respostas: respostas.slice(0, limite) };
    });

    app.patch("/respostas-rapidas/:id", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "conversas:gerir", "conversas");
      if (!contextoComercial) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = AtualizarRespostaRapidaSchema.parse(request.body ?? {});
      const respostas = await listarRespostasRapidas(contexto, contextoComercial.negocio.id);
      const atual = respostas.find((resposta) => resposta.id === id);
      if (!atual) return reply.code(404).send({ erro: "RESPOSTA_RAPIDA_NAO_ENCONTRADA", mensagem: "Resposta rápida não encontrada." });
      const resposta = { ...atual, ...dados, atualizadaEm: new Date().toISOString() };
      await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "crm_apoio",
        tipo: "RESPOSTA_RAPIDA_ATUALIZADA",
        entidadeTipo: "resposta_rapida",
        entidadeId: id,
        estado: "PROCESSADO",
        payload: resposta
      });
      return { resposta };
    });

    app.get("/actividades", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "tarefas:ler", "crm");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 100);
      const actividades = await listarActividades(contexto, contextoComercial.negocio.id, limite);
      return { actividades };
    });

    app.get("/formularios", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "clientes:ler", "crm");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 50);
      const formularios = await montarFormulariosPadrao(contexto, contextoComercial);
      return { formularios: formularios.slice(0, limite) };
    });

    app.get("/sequencias", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "automacoes:ler", "automacoes");
      if (!contextoComercial) return;

      const limite = limiteQuery(request.query, 50);
      const sequencias = await listarSequencias(contexto, contextoComercial.negocio.id);
      return { sequencias: sequencias.slice(0, limite) };
    });

    app.patch("/sequencias/:id", async (request, reply) => {
      const contextoComercial = await exigirCrm(contexto, request, reply, "automacoes:gerir", "automacoes");
      if (!contextoComercial) return;

      const { id } = ParamIdSchema.parse(request.params);
      const dados = AtualizarSequenciaSchema.parse(request.body ?? {});
      const sequencias = await listarSequencias(contexto, contextoComercial.negocio.id);
      const atual = sequencias.find((sequencia) => sequencia.id === id);
      if (!atual) return reply.code(404).send({ erro: "SEQUENCIA_NAO_ENCONTRADA", mensagem: "Sequência não encontrada." });
      const sequencia = { ...atual, ...dados, atualizadaEm: new Date().toISOString() };
      await contexto.gestaoGovernancaCrm.registrarEvento({
        negocioId: contextoComercial.negocio.id,
        topico: "crm_apoio",
        tipo: "SEQUENCIA_ATUALIZADA",
        entidadeTipo: "sequencia",
        entidadeId: id,
        estado: "PROCESSADO",
        payload: sequencia
      });
      return { sequencia };
    });
  }
};

async function exigirCrm(
  contexto: ContextoAplicacao,
  request: FastifyRequest,
  reply: FastifyReply,
  permissao: string,
  modulo: string
) {
  return exigirAcessoComercial(contexto, request, reply, {
    permissao,
    modulo,
    mensagemPermissao: "Sem permissão para consultar ou gerir este módulo de apoio.",
    mensagemModulo: "Módulo necessário desativado para este negócio."
  });
}

function limiteQuery(query: unknown, padrao: number) {
  const valor = Number((query as { limite?: string } | undefined)?.limite ?? padrao);
  if (!Number.isFinite(valor)) return padrao;
  return Math.max(1, Math.min(Math.floor(valor), 500));
}

function ehUuid(valor: string | null | undefined): valor is string {
  return typeof valor === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
}

async function obterPedidoIdValido(contexto: ContextoAplicacao, negocioId: string, pedidoId: string | null) {
  if (!ehUuid(pedidoId)) return null;
  const perfil = await contexto.gestaoPedidos.obterPedido(pedidoId, negocioId);
  return perfil?.pedido.id ?? null;
}

function prioridadeLembrete(tipo: TipoLembrete) {
  if (tipo === "COBRANCA" || tipo === "ENTREGA") return "ALTA";
  return "NORMAL";
}

function textoDoContexto(contexto: Record<string, unknown>, chave: string) {
  const valor = contexto[chave];
  return typeof valor === "string" && valor.trim() ? valor : null;
}

async function mapaClientes(contexto: ContextoAplicacao, negocioId: string) {
  const { clientes } = await contexto.gestaoClientesCrm.listarClientes(negocioId, { limite: 1000 });
  return new Map<string, Cliente360>(clientes.map((cliente) => [cliente.id, cliente]));
}

async function montarPipeline(contexto: ContextoAplicacao, negocioId: string, limite: number): Promise<NegocioPipeline[]> {
  const [{ pedidos }, clientes, eventos] = await Promise.all([
    contexto.gestaoPedidos.listarPedidos(negocioId, { limite: 1000 }),
    mapaClientes(contexto, negocioId),
    contexto.gestaoGovernancaCrm.listarEventos(negocioId, {
      topico: "crm_apoio",
      tipo: "PIPELINE_ETAPA_ATUALIZADA",
      limite: 1000
    })
  ]);
  const etapasPorId = new Map<string, EventoOperacional>();
  for (const evento of eventos) {
    if (evento.entidadeId && !etapasPorId.has(evento.entidadeId)) etapasPorId.set(evento.entidadeId, evento);
  }

  return pedidos
    .map((pedido) => mapearPedidoParaNegocio(pedido, clientes.get(pedido.clienteNegocioId) ?? null, etapasPorId.get(pedido.id)))
    .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime())
    .slice(0, limite);
}

function mapearPedidoParaNegocio(
  pedido: Pedido,
  cliente: Cliente360 | null,
  eventoEtapa?: EventoOperacional
): NegocioPipeline {
  const payload = eventoEtapa?.payload ?? {};
  const etapa = ehEtapaPipeline(payload.etapa) ? payload.etapa : etapaPedido(pedido);
  const primeiroItem = pedido.itens[0] ?? null;
  return {
    id: pedido.id,
    titulo: pedido.origem === "orcamento" ? `Cotação #${pedido.numero}` : `Pedido #${pedido.numero}`,
    clienteId: pedido.clienteNegocioId,
    clienteNome: cliente?.nome ?? null,
    clienteTelefone: cliente?.telefone ?? null,
    etapa,
    valorEstimadoEmKwanza: pedido.totalEmKwanza,
    responsavelId: pedido.responsavelId,
    dataPrevisaoFecho: dataPrevisaoPedido(pedido),
    motivoPerda: typeof payload.motivoPerda === "string" ? payload.motivoPerda : null,
    produtoId: primeiroItem?.codigoPeca ?? null,
    produtoNome: primeiroItem?.nomeProduto ?? null,
    observacao: typeof payload.observacao === "string" ? payload.observacao : pedido.observacao,
    criadoEm: pedido.criadoEm.toISOString(),
    atualizadoEm: (eventoEtapa?.criadoEm ?? pedido.atualizadoEm).toISOString()
  };
}

function etapaPedido(pedido: Pedido): EtapaPipeline {
  if (["CANCELADO", "TROCADO", "DEVOLVIDO"].includes(pedido.estado) || pedido.estadoPagamento === "REJEITADO") return "FECHADO_PERDIDO";
  if (["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENVIADO", "ENTREGUE"].includes(pedido.estado)) return "FECHADO_GANHO";
  if (pedido.estado === "AGUARDANDO_PAGAMENTO") return "CONTACTO_FEITO";
  return "LEAD";
}

function dataPrevisaoPedido(pedido: Pedido) {
  if (pedido.entregueEm) return pedido.entregueEm.toISOString();
  const base = pedido.pagoEm ?? pedido.criadoEm;
  return new Date(base.getTime() + 2 * 24 * 60 * 60_000).toISOString();
}

function ehEtapaPipeline(valor: unknown): valor is EtapaPipeline {
  return typeof valor === "string" && etapasPipeline.includes(valor as EtapaPipeline);
}

async function listarLembretes(contexto: ContextoAplicacao, negocioId: string, limite: number) {
  const [tarefas, clientes] = await Promise.all([
    contexto.gestaoTarefas.listarTarefas(negocioId, { limite: 500 }),
    mapaClientes(contexto, negocioId)
  ]);
  return tarefas
    .map((tarefa) => mapearTarefaParaLembrete(tarefa, clientes))
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
    .slice(0, limite);
}

function mapearTarefaParaLembrete(tarefa: TarefaOperacional, clientes: Map<string, Cliente360>): LembreteFrontend {
  const cliente = tarefa.clienteId ? clientes.get(tarefa.clienteId) : undefined;
  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    tipo: tipoLembrete(tarefa),
    estado: estadoLembrete(tarefa),
    clienteId: tarefa.clienteId,
    clienteNome: cliente?.nome ?? textoDoContexto(tarefa.contexto, "clienteNome"),
    pedidoId: tarefa.pedidoId ?? textoDoContexto(tarefa.contexto, "pedidoReferencia"),
    conversaId: tarefa.entidadeTipo === "conversa" ? tarefa.entidadeId : null,
    dataHora: (tarefa.prazoEm ?? tarefa.criadaEm).toISOString(),
    recorrente: tarefa.contexto.recorrente === true,
    observacao: tarefa.observacao ?? tarefa.descricao,
    responsavelId: tarefa.responsavelId,
    criadoEm: tarefa.criadaEm.toISOString()
  };
}

function tipoLembrete(tarefa: TarefaOperacional): TipoLembrete {
  const tipo = tarefa.tipo.toUpperCase();
  if (tipo.includes("COBR") || tipo.includes("PAGAMENTO")) return "COBRANCA";
  if (tipo.includes("ENTREG")) return "ENTREGA";
  if (tipo.includes("CALLBACK")) return "CALLBACK";
  if (tipo.includes("REUNIAO") || tipo.includes("REUNIÃO")) return "REUNIAO";
  if (tipo.includes("FOLLOW") || tipo.includes("POS") || tipo.includes("PÓS")) return "FOLLOW_UP";
  return "OUTRO";
}

function estadoLembrete(tarefa: TarefaOperacional): EstadoLembrete {
  if (tarefa.estado === "CONCLUIDA") return "CONCLUIDO";
  if (tarefa.estado === "CANCELADA") return "CANCELADO";
  if (tarefa.prazoEm && tarefa.prazoEm.getTime() < Date.now()) return "VENCIDO";
  return "PENDENTE";
}

function mapearEstadoLembreteParaTarefa(estado: EstadoLembrete) {
  if (estado === "CONCLUIDO") return "CONCLUIDA";
  if (estado === "CANCELADO") return "CANCELADA";
  return "ABERTA";
}

async function montarMetas(contexto: ContextoAplicacao, negocioId: string) {
  const [{ pedidos }, { clientes }] = await Promise.all([
    contexto.gestaoPedidos.listarPedidos(negocioId, { limite: 1000 }),
    contexto.gestaoClientesCrm.listarClientes(negocioId, { limite: 1000 })
  ]);
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999);
  const pedidosMes = pedidos.filter((pedido) => dentroPeriodo(pedido.criadoEm, inicioMes, fimMes));
  const pedidosMesAnterior = pedidos.filter((pedido) => dentroPeriodo(pedido.criadoEm, inicioMesAnterior, fimMesAnterior));
  const receitaMes = pedidosMes.filter(pedidoPagoComercial).reduce((total, pedido) => total + pedido.totalEmKwanza, 0);
  const receitaAnterior = pedidosMesAnterior.filter(pedidoPagoComercial).reduce((total, pedido) => total + pedido.totalEmKwanza, 0);
  const clientesNovos = clientes.filter((cliente) => dentroPeriodo(cliente.primeiraInteracaoEm, inicioMes, fimMes)).length;
  const clientesNovosAnterior = clientes.filter((cliente) => dentroPeriodo(cliente.primeiraInteracaoEm, inicioMesAnterior, fimMesAnterior)).length;

  return [
    {
      id: "meta-receita-mensal",
      tipo: "RECEITA",
      periodo: "MENSAL",
      valorAlvo: Math.max(100_000, Math.ceil((receitaMes || receitaAnterior || 50_000) * 1.3)),
      valorAtual: receitaMes,
      valorAnterior: receitaAnterior,
      vendedorId: null,
      vendedorNome: null,
      inicioEm: inicioMes.toISOString(),
      fimEm: fimMes.toISOString(),
      criadoEm: inicioMes.toISOString()
    },
    {
      id: "meta-pedidos-mensal",
      tipo: "PEDIDOS",
      periodo: "MENSAL",
      valorAlvo: Math.max(10, Math.ceil((pedidosMes.length || pedidosMesAnterior.length || 5) * 1.3)),
      valorAtual: pedidosMes.length,
      valorAnterior: pedidosMesAnterior.length,
      vendedorId: null,
      vendedorNome: null,
      inicioEm: inicioMes.toISOString(),
      fimEm: fimMes.toISOString(),
      criadoEm: inicioMes.toISOString()
    },
    {
      id: "meta-clientes-novos-mensal",
      tipo: "CLIENTES_NOVOS",
      periodo: "MENSAL",
      valorAlvo: Math.max(20, Math.ceil((clientesNovos || clientesNovosAnterior || 10) * 1.3)),
      valorAtual: clientesNovos,
      valorAnterior: clientesNovosAnterior,
      vendedorId: null,
      vendedorNome: null,
      inicioEm: inicioMes.toISOString(),
      fimEm: fimMes.toISOString(),
      criadoEm: inicioMes.toISOString()
    }
  ];
}

function dentroPeriodo(data: Date, inicio: Date, fim: Date) {
  return data >= inicio && data <= fim;
}

function pedidoPagoComercial(pedido: Pedido) {
  return pedido.estadoPagamento === "CONFIRMADO" || ["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENVIADO", "ENTREGUE"].includes(pedido.estado);
}

async function listarCotacoes(contexto: ContextoAplicacao, negocioId: string, limite: number) {
  const [{ pedidos }, clientes, eventos] = await Promise.all([
    contexto.gestaoPedidos.listarPedidos(negocioId, { limite: 1000 }),
    mapaClientes(contexto, negocioId),
    contexto.gestaoGovernancaCrm.listarEventos(negocioId, { topico: "cotacoes", limite: 1000 })
  ]);
  const eventosPorCotacao = new Map<string, EventoOperacional[]>();
  for (const evento of eventos) {
    if (!evento.entidadeId) continue;
    eventosPorCotacao.set(evento.entidadeId, [...(eventosPorCotacao.get(evento.entidadeId) ?? []), evento]);
  }

  return pedidos
    .filter((pedido) => pedido.origem === "orcamento")
    .map((pedido) => mapearPedidoParaCotacao(pedido, clientes.get(pedido.clienteNegocioId) ?? null, eventosPorCotacao.get(pedido.id) ?? []))
    .sort((a, b) => new Date(b.atualizadaEm).getTime() - new Date(a.atualizadaEm).getTime())
    .slice(0, limite);
}

async function obterCotacao(contexto: ContextoAplicacao, negocioId: string, id: string) {
  const cotacoes = await listarCotacoes(contexto, negocioId, 500);
  return cotacoes.find((cotacao) => cotacao.id === id) ?? null;
}

function mapearPedidoParaCotacao(pedido: Pedido, cliente: Cliente360 | null, eventos: EventoOperacional[]) {
  const convertida = eventos.some((evento) => evento.tipo === "COTACAO_CONVERTIDA");
  const validadeEm = new Date(pedido.criadoEm.getTime() + 7 * 24 * 60 * 60_000);
  const estado: EstadoCotacao = convertida
    ? "ACEITE"
    : validadeEm.getTime() < Date.now()
      ? "EXPIRADA"
      : ["CANCELADO", "DEVOLVIDO", "TROCADO"].includes(pedido.estado)
        ? "RECUSADA"
        : "ABERTA";
  return {
    id: pedido.id,
    numero: pedido.numero,
    clienteId: pedido.clienteNegocioId,
    clienteNome: cliente?.nome ?? null,
    clienteTelefone: cliente?.telefone ?? null,
    estado,
    itens: pedido.itens.map((item) => ({
      codigoPeca: item.codigoPeca,
      nomeProduto: item.nomeProduto,
      quantidade: item.quantidade,
      precoUnitarioEmKwanza: item.precoUnitarioEmKwanza,
      subtotalEmKwanza: item.subtotalEmKwanza
    })),
    subtotalEmKwanza: pedido.subtotalEmKwanza,
    descontoEmKwanza: pedido.descontoEmKwanza,
    totalEmKwanza: pedido.totalEmKwanza,
    validadeEm: validadeEm.toISOString(),
    pedidoConvertidoId: convertida ? pedido.id : null,
    observacao: pedido.observacao,
    criadaEm: pedido.criadoEm.toISOString(),
    atualizadaEm: (eventos[0]?.criadoEm ?? pedido.atualizadoEm).toISOString()
  };
}

async function listarRespostasRapidas(contexto: ContextoAplicacao, negocioId: string) {
  const eventos = await contexto.gestaoGovernancaCrm.listarEventos(negocioId, {
    topico: "crm_apoio",
    tipo: "RESPOSTA_RAPIDA_ATUALIZADA",
    limite: 500
  });
  const overrides = new Map<string, Record<string, unknown>>();
  for (const evento of eventos) {
    if (evento.entidadeId && !overrides.has(evento.entidadeId)) overrides.set(evento.entidadeId, evento.payload);
  }

  return respostasRapidasPadrao.map((resposta) => ({
    ...resposta,
    ...(overrides.get(resposta.id) ?? {})
  })) as RespostaRapidaFrontend[];
}

async function listarActividades(contexto: ContextoAplicacao, negocioId: string, limite: number) {
  const [tarefas, clientes, eventos] = await Promise.all([
    contexto.gestaoTarefas.listarTarefas(negocioId, { limite: 500 }),
    mapaClientes(contexto, negocioId),
    contexto.gestaoGovernancaCrm.listarEventos(negocioId, { limite: 200 })
  ]);
  const actividadesTarefas = tarefas.map((tarefa) => {
    const cliente = tarefa.clienteId ? clientes.get(tarefa.clienteId) : undefined;
    return {
      id: `tarefa-${tarefa.id}`,
      tipo: tipoActividadePorTarefa(tarefa),
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || tarefa.observacao,
      clienteId: tarefa.clienteId,
      clienteNome: cliente?.nome ?? null,
      responsavelId: tarefa.responsavelId,
      dataHora: (tarefa.prazoEm ?? tarefa.criadaEm).toISOString(),
      futura: tarefa.prazoEm ? tarefa.prazoEm.getTime() > Date.now() : false,
      criadaEm: tarefa.criadaEm.toISOString()
    };
  });
  const actividadesEventos = eventos.map((evento) => ({
    id: `evento-${evento.id}`,
    tipo: "NOTA",
    titulo: tituloEvento(evento),
    descricao: evento.tipo,
    clienteId: null,
    clienteNome: null,
    responsavelId: null,
    dataHora: evento.criadoEm.toISOString(),
    futura: false,
    criadaEm: evento.criadoEm.toISOString()
  }));

  return [...actividadesTarefas, ...actividadesEventos]
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
    .slice(0, limite);
}

function tipoActividadePorTarefa(tarefa: TarefaOperacional) {
  const tipo = tarefa.tipo.toUpperCase();
  if (tipo.includes("CALL") || tipo.includes("CHAM")) return "CHAMADA";
  if (tipo.includes("VISITA")) return "VISITA";
  if (tipo.includes("REUN")) return "REUNIAO";
  if (tipo.includes("WHATSAPP") || tipo.includes("COBR")) return "WHATSAPP";
  if (tipo.includes("EMAIL")) return "EMAIL";
  return "NOTA";
}

function tituloEvento(evento: EventoOperacional) {
  if (evento.tipo === "PIPELINE_ETAPA_ATUALIZADA") return "Pipeline atualizado";
  if (evento.tipo === "RESPOSTA_RAPIDA_ATUALIZADA") return "Resposta rápida atualizada";
  if (evento.tipo === "SEQUENCIA_ATUALIZADA") return "Sequência atualizada";
  if (evento.tipo === "COTACAO_ENVIO_SOLICITADO") return "Cotação enviada";
  if (evento.tipo === "COTACAO_CONVERTIDA") return "Cotação convertida";
  return evento.tipo.replaceAll("_", " ").toLowerCase();
}

async function montarFormulariosPadrao(contexto: ContextoAplicacao, contextoComercial: ContextoComercialHttp) {
  const slug = contextoComercial.negocio.slugPublico ?? `negocio-${contextoComercial.negocio.id.slice(0, 8)}`;
  const base = process.env.PUBLIC_STORE_BASE_URL ?? "https://usebizy.com";
  const formularios = [
    {
      id: "form-lead-rapido",
      titulo: "Captação rápida de lead",
      descricao: "Formulário simples para recolher nome, telefone e produto de interesse.",
      campos: ["nome", "telefone", "produto_interesse"],
      tagAutomatica: "lead-formulario",
      linkPublico: `${base.replace(/\/$/, "")}/f/${slug}/lead`,
      totalSubmissoes: 0,
      ativo: true,
      criadoEm: contextoComercial.negocio.criadoEm.toISOString(),
      atualizadoEm: contextoComercial.negocio.atualizadoEm.toISOString()
    }
  ];

  return Promise.all(
    formularios.map(async (formulario) => {
      const eventos = formulario.tagAutomatica
        ? await contexto.gestaoGovernancaCrm.listarEventos(contextoComercial.negocio.id, {
            topico: "crm_apoio",
            tipo: "FORMULARIO_SUBMETIDO",
            limite: 10_000
          })
        : [];
      const totalSubmissoes = formulario.tagAutomatica
        ? eventos.filter((evento) =>
            evento.payload.formularioSlug === contextoComercial.negocio.slugPublico &&
            evento.payload.tagAutomatica === formulario.tagAutomatica
          ).length
        : 0;

      return {
        ...formulario,
        totalSubmissoes
      };
    })
  );
}

async function listarSequencias(contexto: ContextoAplicacao, negocioId: string) {
  const eventos = await contexto.gestaoGovernancaCrm.listarEventos(negocioId, {
    topico: "crm_apoio",
    tipo: "SEQUENCIA_ATUALIZADA",
    limite: 500
  });
  const overrides = new Map<string, Record<string, unknown>>();
  for (const evento of eventos) {
    if (evento.entidadeId && !overrides.has(evento.entidadeId)) overrides.set(evento.entidadeId, evento.payload);
  }

  return sequenciasPadrao.map((sequencia) => ({
    ...sequencia,
    ...(overrides.get(sequencia.id) ?? {})
  })) as SequenciaFrontend[];
}
