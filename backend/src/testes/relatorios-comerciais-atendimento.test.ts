import { describe, expect, it } from "vitest";
import { RelatoriosComerciaisUseCase } from "../use-case/RelatoriosComerciaisUseCase.js";
import {
  RepositorioAtendimentoMemoria,
  RepositorioClientesMemoria,
  RepositorioPecasMemoria,
  RepositorioPedidosMemoria,
  RepositorioReservasMemoria,
  RepositorioTarefasOperacionaisMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

describe("Relatórios comerciais - atendimento", () => {
  it("calcula tempo médio de primeira resposta e taxa de resolução das conversas", async () => {
    const negocioId = "negocio_metricas_atendimento";
    const atendimento = new RepositorioAtendimentoMemoria();
    const relatorios = new RelatoriosComerciaisUseCase(
      new RepositorioPedidosMemoria(),
      new RepositorioClientesMemoria(),
      new RepositorioPecasMemoria(),
      new RepositorioReservasMemoria(),
      atendimento,
      new RepositorioTarefasOperacionaisMemoria()
    );

    await atendimento.registrarMensagem({
      negocioId,
      telefone: "923111001",
      direcao: "INBOUND",
      remetente: "cliente",
      canal: "whatsapp",
      tipo: "RECEBIDA",
      conteudo: "Olá, ainda está disponível?",
      status: "RECEIVED",
      origem: "whatsapp",
      enviadaEm: new Date("2026-05-26T09:00:00.000Z")
    });
    await atendimento.registrarMensagem({
      negocioId,
      telefone: "923111001",
      direcao: "OUTBOUND",
      remetente: "agente",
      canal: "whatsapp",
      tipo: "MANUAL",
      conteudo: "Sim, ainda temos stock.",
      status: "SENT",
      origem: "atendimento_conversa",
      enviadaEm: new Date("2026-05-26T09:05:00.000Z")
    });

    await atendimento.registrarMensagem({
      negocioId,
      telefone: "923111002",
      direcao: "INBOUND",
      remetente: "cliente",
      canal: "whatsapp",
      tipo: "RECEBIDA",
      conteudo: "Preciso de ajuda com entrega.",
      status: "RECEIVED",
      origem: "whatsapp",
      enviadaEm: new Date("2026-05-26T10:00:00.000Z")
    });

    const conversas = await atendimento.listarConversasComMensagens(10, negocioId);
    const conversaResolvida = conversas.find((item) => item.conversa.telefone === "923111001");
    expect(conversaResolvida).toBeTruthy();
    await atendimento.atualizarConversa(conversaResolvida!.conversa.id, { estado: "RESOLVIDA" }, negocioId);

    const relatorio = await relatorios.gerarRelatorio(negocioId);

    expect(relatorio.atendimento).toEqual(
      expect.objectContaining({
        conversasAbertas: 1,
        conversasResolvidas: 1,
        tempoMedioPrimeiraRespostaMinutos: 5,
        taxaResolucaoPercentual: 50
      })
    );
  });
});
