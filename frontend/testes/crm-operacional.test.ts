import { describe, expect, it } from "vitest";
import { montarClientesCrm, montarSegmentosCampanha, normalizarTelefone } from "../src/crm";
import type { Conversa, Peca, Reserva } from "../src/tipos";

describe("CRM operacional", () => {
  it("normaliza contactos angolanos e consolida clientes vindos de conversas e pedidos", () => {
    const pecas: Peca[] = [
      { id: "p1", codigo: "01", nome: "Vestido", descricao: "", precoEmKwanza: 12000, quantidade: 1, fotos: [], estado: "DISPONIVEL" },
      { id: "p2", codigo: "02", nome: "Blazer", descricao: "", precoEmKwanza: 18000, quantidade: 1, fotos: [], estado: "DISPONIVEL" }
    ];
    const conversas = [
      {
        id: "c1",
        conversaCrmId: "crm1",
        telefone: "923456789",
        nomeCliente: "Ana Cliente",
        ultimaMensagem: "Quero a peca 01",
        ultimaAtualizacao: "2026-05-23T10:00:00.000Z",
        mensagensNaoLidas: 0,
        estado: "ativo",
        estadoCrm: "ABERTA",
        prioridade: "NORMAL",
        responsavelId: null,
        tags: ["live"],
        politicaAutomacao: "AUTOMATICO",
        pecaRelacionada: "01",
        reservaAtual: null,
        mensagens: [
          { id: "m1", remetente: "cliente", conteudo: "Quero", enviadaEm: "2026-05-23T10:00:00.000Z", status: "RECEIVED" }
        ]
      }
    ] as Conversa[];
    const reservas = [
      {
        id: "r1",
        codigoPeca: "01",
        telefoneCliente: "+244923456789",
        nomeCliente: "Ana Cliente",
        usernameCliente: "ana",
        estado: "PAID",
        estadoPagamento: "CONFIRMADO",
        comentarioOriginal: "",
        liveId: "live",
        expiraEm: null,
        criadaEm: "2026-05-23T10:05:00.000Z"
      },
      {
        id: "r2",
        codigoPeca: "02",
        telefoneCliente: "937654321",
        nomeCliente: "Carlos Cliente",
        usernameCliente: "carlos",
        estado: "WAITING_PAYMENT",
        estadoPagamento: "AGUARDANDO_COMPROVATIVO",
        comentarioOriginal: "",
        liveId: "live",
        expiraEm: "2026-05-23T10:20:00.000Z",
        criadaEm: "2026-05-23T10:08:00.000Z"
      }
    ] as Reserva[];

    const clientes = montarClientesCrm({ conversas, reservas, pecas });

    expect(normalizarTelefone("923456789")).toBe("244923456789");
    expect(clientes).toHaveLength(2);
    expect(clientes.find((cliente) => cliente.telefone === "244923456789")).toEqual(
      expect.objectContaining({ pedidosPagos: 1, valorPago: 12000, telefoneFormatado: "+244 923 456 789" })
    );
    expect(clientes.find((cliente) => cliente.telefone === "244937654321")).toEqual(
      expect.objectContaining({ pedidosPendentes: 1, valorPendente: 18000, estado: "Pendente" })
    );
  });

  it("monta segmentos comerciais úteis para campanhas", () => {
    const clientes = montarClientesCrm({
      conversas: [],
      pecas: [{ id: "p1", codigo: "01", nome: "Vestido", descricao: "", precoEmKwanza: 12000, quantidade: 1, fotos: [], estado: "DISPONIVEL" }],
      reservas: [
        {
          id: "r1",
          codigoPeca: "01",
          telefoneCliente: "923456789",
          nomeCliente: "Ana Cliente",
          usernameCliente: "ana",
          estado: "WAITING_PAYMENT",
          estadoPagamento: "AGUARDANDO_COMPROVATIVO",
          comentarioOriginal: "",
          liveId: "live",
          expiraEm: null,
          criadaEm: "2026-05-23T10:00:00.000Z"
        }
      ] as Reserva[]
    });

    const segmentos = montarSegmentosCampanha(clientes);

    expect(segmentos.find((segmento) => segmento.id === "pagamento-pendente")).toEqual(
      expect.objectContaining({ titulo: "Pagamento pendente", valorEstimado: 12000 })
    );
  });
});
