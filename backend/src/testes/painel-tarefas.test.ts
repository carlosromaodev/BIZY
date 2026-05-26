import { describe, expect, it } from "vitest";
import { ConsultaPainelUseCase } from "../use-case/ConsultaPainelUseCase.js";
import {
  RepositorioComentariosMemoria,
  RepositorioPecasMemoria,
  RepositorioReservasMemoria,
  RepositorioTarefasOperacionaisMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

const minutosAtras = (minutos: number) => new Date(Date.now() - minutos * 60_000);
const minutosDepois = (minutos: number) => new Date(Date.now() + minutos * 60_000);

describe("Painel - minhas tarefas", () => {
  it("prioriza tarefas do usuário por atraso e impacto comercial", async () => {
    const negocioId = "negocio-painel-tarefas";
    const usuarioId = "vendedor-painel-1";
    const tarefas = new RepositorioTarefasOperacionaisMemoria();
    const painel = new ConsultaPainelUseCase(
      new RepositorioPecasMemoria(),
      new RepositorioReservasMemoria(),
      new RepositorioComentariosMemoria(),
      tarefas
    );

    const cobrancaAtrasada = await tarefas.criar({
      negocioId,
      tipo: "COBRANCA",
      titulo: "Cobrar pedido parado",
      descricao: "Pagamento venceu.",
      prioridade: "ALTA",
      responsavelId: usuarioId,
      prazoEm: minutosAtras(90),
      pedidoId: "11111111-1111-4111-8111-111111111111",
      contexto: { totalEmKwanza: 25_000 }
    });
    await tarefas.criar({
      negocioId,
      tipo: "POS_VENDA",
      titulo: "Pedir avaliação",
      descricao: "Cliente recebeu ontem.",
      prioridade: "NORMAL",
      responsavelId: usuarioId,
      prazoEm: minutosDepois(120)
    });
    await tarefas.criar({
      negocioId,
      tipo: "ENTREGA",
      titulo: "Entrega de outro vendedor",
      descricao: "Não deve aparecer em minhas tarefas.",
      prioridade: "URGENTE",
      responsavelId: "outro-vendedor",
      prazoEm: minutosAtras(180)
    });

    const resumo = await painel.resumirPainel([], [], negocioId, usuarioId);

    expect(resumo.minhasTarefas).toEqual([
      expect.objectContaining({
        id: cobrancaAtrasada.id,
        tipo: "COBRANCA",
        atrasada: true,
        impactoComercial: "ALTO"
      }),
      expect.objectContaining({
        tipo: "POS_VENDA",
        atrasada: false,
        impactoComercial: "MEDIO"
      })
    ]);
    expect(resumo.tarefasOperacionais).toEqual(
      expect.objectContaining({
        abertas: 3,
        minhasAbertas: 2,
        minhasAtrasadas: 1,
        urgentes: 1
      })
    );
  });
});
