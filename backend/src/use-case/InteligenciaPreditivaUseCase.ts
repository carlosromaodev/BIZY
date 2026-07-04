import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

type IndicadorExternoPreditivoEntrada = {
  fonte?: string;
  chave: string;
  periodo: string;
  valor: number;
  unidade?: string;
  segmento?: string;
  metadados?: Record<string, unknown>;
};

type IndicadorExternoPreditivo = IndicadorExternoPreditivoEntrada & {
  id: string;
  fonte: string;
  recebidoEm: string;
  criadoPorId?: string;
};

type FontesDadosPreditivas = {
  preditivo?: {
    actualizadoEm?: string;
    fontesExternas?: IndicadorExternoPreditivo[];
  };
  [chave: string]: unknown;
};

export class InteligenciaPreditivaUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Scoring RFM e Segmentação (RF-T005, RF-T006) ──────────────────────────

  async calcularRFMClientes(negocioId: string) {
    const agora = new Date();

    const clientes = await this.prisma.clienteNegocio.findMany({
      where: { negocioId },
      select: { id: true, nome: true, telefone: true, criadoEm: true }
    });

    const pedidos = await this.prisma.pedido.findMany({
      where: { negocioId },
      select: { clienteNegocioId: true, totalEmKwanza: true, criadoEm: true, estadoPagamento: true }
    });

    // Agrupar pedidos por cliente
    const pedidosPorCliente: Record<string, typeof pedidos> = {};
    for (const p of pedidos) {
      if (!pedidosPorCliente[p.clienteNegocioId]) pedidosPorCliente[p.clienteNegocioId] = [];
      pedidosPorCliente[p.clienteNegocioId].push(p);
    }

    // Calcular métricas RFM brutas
    const metricas = clientes.map((c) => {
      const peds = pedidosPorCliente[c.id] ?? [];
      const pedsPagos = peds.filter((p) => p.estadoPagamento === "CONFIRMADO");

      const ultimoPedido = peds.length > 0
        ? Math.max(...peds.map((p) => p.criadoEm.getTime()))
        : c.criadoEm.getTime();

      const diasDesdeUltimo = Math.floor((agora.getTime() - ultimoPedido) / (1000 * 60 * 60 * 24));
      const frequencia = peds.length;
      const valorTotal = pedsPagos.reduce((s, p) => s + p.totalEmKwanza, 0);

      return { clienteId: c.id, nome: c.nome, telefone: c.telefone, diasDesdeUltimo, frequencia, valorTotal };
    });

    // Calcular quartis para scoring (1-5)
    const recencias = metricas.map((m) => m.diasDesdeUltimo).sort((a, b) => a - b);
    const frequencias = metricas.map((m) => m.frequencia).sort((a, b) => a - b);
    const valores = metricas.map((m) => m.valorTotal).sort((a, b) => a - b);

    function quartilScore(valor: number, arr: number[], invertido: boolean): number {
      if (arr.length === 0) return 3;
      const pos = arr.filter((v) => v <= valor).length / arr.length;
      const score = Math.ceil(pos * 5) || 1;
      return invertido ? 6 - score : score; // recência invertida: menos dias = melhor
    }

    const resultados = metricas.map((m) => {
      const scoreR = quartilScore(m.diasDesdeUltimo, recencias, true);
      const scoreF = quartilScore(m.frequencia, frequencias, false);
      const scoreM = quartilScore(m.valorTotal, valores, false);
      const scoreFinal = Math.round((scoreR + scoreF + scoreM) / 3 * 20); // 0-100

      // Segmentação automática (RF-T006)
      let segmento: string;
      if (scoreFinal >= 80) segmento = "VIP";
      else if (scoreFinal >= 60 && scoreR >= 4) segmento = "ACTIVO";
      else if (scoreFinal >= 40 && scoreR <= 2) segmento = "EM_RISCO";
      else if (scoreR <= 1 && scoreF <= 2) segmento = "PERDIDO";
      else if (m.frequencia === 0) segmento = "NOVO";
      else if (scoreR <= 2) segmento = "INACTIVO";
      else segmento = "ACTIVO";

      return {
        clienteId: m.clienteId,
        nome: m.nome,
        telefone: m.telefone,
        rfm: { recencia: scoreR, frequencia: scoreF, monetario: scoreM },
        score: scoreFinal,
        segmento,
        metricas: {
          diasDesdeUltimaCompra: m.diasDesdeUltimo,
          totalPedidos: m.frequencia,
          valorTotal: m.valorTotal
        }
      };
    });

    // Ordenar por score desc
    resultados.sort((a, b) => b.score - a.score);

    // Resumo por segmento
    const segmentos: Record<string, { count: number; valorTotal: number }> = {};
    for (const r of resultados) {
      if (!segmentos[r.segmento]) segmentos[r.segmento] = { count: 0, valorTotal: 0 };
      segmentos[r.segmento].count++;
      segmentos[r.segmento].valorTotal += r.metricas.valorTotal;
    }

    return {
      clientes: resultados,
      resumoSegmentos: Object.entries(segmentos).map(([segmento, v]) => ({ segmento, ...v })),
      totalClientes: resultados.length
    };
  }

  // ── Alertas Churn VIP (RF-T007) ──────────────────────────────────────────

  async obterAlertasChurnVIP(negocioId: string) {
    const rfm = await this.calcularRFMClientes(negocioId);

    // Clientes VIP com recência baixa (sinal de churn)
    const alertas = rfm.clientes
      .filter((c) => c.score >= 60 && c.rfm.recencia <= 2)
      .map((c) => ({
        clienteId: c.clienteId,
        nome: c.nome,
        telefone: c.telefone,
        score: c.score,
        diasDesdeUltimaCompra: c.metricas.diasDesdeUltimaCompra,
        valorTotal: c.metricas.valorTotal,
        motivo: `Cliente de alto valor (score ${c.score}) sem actividade há ${c.metricas.diasDesdeUltimaCompra} dias`
      }));

    return { alertas, total: alertas.length };
  }

  // ── LTV — Lifetime Value (RF-T008) ───────────────────────────────────────

  async calcularLTV(negocioId: string) {
    const clientes = await this.prisma.clienteNegocio.findMany({
      where: { negocioId },
      select: { id: true, nome: true, criadoEm: true }
    });

    const pedidos = await this.prisma.pedido.findMany({
      where: { negocioId, estadoPagamento: "CONFIRMADO" },
      select: { clienteNegocioId: true, totalEmKwanza: true, criadoEm: true }
    });

    const agora = new Date();
    const pedidosPorCliente: Record<string, typeof pedidos> = {};
    for (const p of pedidos) {
      if (!pedidosPorCliente[p.clienteNegocioId]) pedidosPorCliente[p.clienteNegocioId] = [];
      pedidosPorCliente[p.clienteNegocioId].push(p);
    }

    const resultados = clientes.map((c) => {
      const peds = pedidosPorCliente[c.id] ?? [];
      const valorTotal = peds.reduce((s, p) => s + p.totalEmKwanza, 0);
      const mesesCliente = Math.max(1, Math.floor(
        (agora.getTime() - c.criadoEm.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
      const valorMensal = valorTotal / mesesCliente;
      // Projecção LTV a 12 meses
      const ltv12 = Math.round(valorMensal * 12);
      // Projecção LTV a 24 meses (com taxa de retenção estimada de 70%)
      const ltv24 = Math.round(valorMensal * 24 * 0.7);

      return {
        clienteId: c.id,
        nome: c.nome,
        valorTotal,
        mesesCliente,
        valorMensal: Math.round(valorMensal),
        totalPedidos: peds.length,
        ltv12,
        ltv24
      };
    });

    resultados.sort((a, b) => b.ltv12 - a.ltv12);

    const totalLTV = resultados.reduce((s, r) => s + r.ltv12, 0);
    const mediaLTV = resultados.length > 0 ? Math.round(totalLTV / resultados.length) : 0;

    return {
      clientes: resultados.slice(0, 100),
      resumo: { totalClientes: resultados.length, totalLTV, mediaLTV }
    };
  }

  // ── Previsão Fluxo de Caixa Rolling (RF-T010) ───────────────────────────

  async preverFluxoCaixa(negocioId: string, semanas: number = 13) {
    const agora = new Date();

    // Buscar movimentos dos últimos 90 dias para estimar tendência
    const inicio90 = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
    const movimentos = await this.prisma.movimentoFinanceiro.findMany({
      where: { negocioId, dataMovimento: { gte: inicio90, lte: agora } },
      select: { tipo: true, valor: true, dataMovimento: true }
    });

    // Agrupar por semana (últimas ~13 semanas)
    const porSemana: Record<number, { entradas: number; saidas: number }> = {};
    for (const m of movimentos) {
      const semana = Math.floor((agora.getTime() - m.dataMovimento.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (!porSemana[semana]) porSemana[semana] = { entradas: 0, saidas: 0 };
      if (m.tipo === "ENTRADA") porSemana[semana].entradas += m.valor;
      else porSemana[semana].saidas += m.valor;
    }

    const semanasHistorico = Object.values(porSemana);
    const mediaEntradas = semanasHistorico.length > 0
      ? semanasHistorico.reduce((s, w) => s + w.entradas, 0) / semanasHistorico.length : 0;
    const mediaSaidas = semanasHistorico.length > 0
      ? semanasHistorico.reduce((s, w) => s + w.saidas, 0) / semanasHistorico.length : 0;

    // Desvio padrão para cenários
    const desvioEntradas = Math.sqrt(
      semanasHistorico.reduce((s, w) => s + Math.pow(w.entradas - mediaEntradas, 2), 0) /
      Math.max(semanasHistorico.length, 1)
    );
    const desvioSaidas = Math.sqrt(
      semanasHistorico.reduce((s, w) => s + Math.pow(w.saidas - mediaSaidas, 2), 0) /
      Math.max(semanasHistorico.length, 1)
    );

    // Saldo actual
    const todosMovimentos = await this.prisma.movimentoFinanceiro.findMany({
      where: { negocioId },
      select: { tipo: true, valor: true }
    });
    let saldoActual = 0;
    for (const m of todosMovimentos) {
      saldoActual += m.tipo === "ENTRADA" ? m.valor : -m.valor;
    }

    // Gerar previsão
    const previsao: Array<{
      semana: number;
      dataInicio: string;
      optimista: { entradas: number; saidas: number; saldo: number };
      provavel: { entradas: number; saidas: number; saldo: number };
      pessimista: { entradas: number; saidas: number; saldo: number };
    }> = [];

    let saldoOpt = saldoActual;
    let saldoProv = saldoActual;
    let saldoPess = saldoActual;

    for (let i = 1; i <= semanas; i++) {
      const dataInicio = new Date(agora.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);

      const entOpt = Math.round(mediaEntradas + desvioEntradas * 0.5);
      const saiOpt = Math.round(mediaSaidas - desvioSaidas * 0.3);
      saldoOpt += entOpt - saiOpt;

      const entProv = Math.round(mediaEntradas);
      const saiProv = Math.round(mediaSaidas);
      saldoProv += entProv - saiProv;

      const entPess = Math.round(mediaEntradas - desvioEntradas * 0.5);
      const saiPess = Math.round(mediaSaidas + desvioSaidas * 0.3);
      saldoPess += entPess - saiPess;

      previsao.push({
        semana: i,
        dataInicio: dataInicio.toISOString().slice(0, 10),
        optimista: { entradas: entOpt, saidas: saiOpt, saldo: saldoOpt },
        provavel: { entradas: entProv, saidas: saiProv, saldo: saldoProv },
        pessimista: { entradas: entPess, saidas: saiPess, saldo: saldoPess }
      });
    }

    // RF-T011: alertas de défice
    const alertasDefice = previsao
      .filter((s) => s.provavel.saldo < 0 || s.pessimista.saldo < 0)
      .map((s) => ({
        semana: s.semana,
        dataInicio: s.dataInicio,
        saldoProvavel: s.provavel.saldo,
        saldoPessimista: s.pessimista.saldo,
        severidade: s.provavel.saldo < 0 ? "CRITICO" as const : "ATENCAO" as const
      }));

    return {
      saldoActual,
      previsao,
      alertasDefice,
      mediaSemanais: { entradas: Math.round(mediaEntradas), saidas: Math.round(mediaSaidas) }
    };
  }

  // ── Detecção de Anomalias (RF-T013) ─────────────────────────────────────

  async detectarAnomalias(negocioId: string) {
    const agora = new Date();
    const inicio6m = new Date(agora.getFullYear(), agora.getMonth() - 6, 1);

    const movimentos = await this.prisma.movimentoFinanceiro.findMany({
      where: { negocioId, dataMovimento: { gte: inicio6m } },
      include: { categoria: { select: { nome: true, tipo: true } } },
      orderBy: { dataMovimento: "asc" }
    });

    // Agrupar por mês e tipo
    const porMes: Record<string, { entradas: number; saidas: number }> = {};
    for (const m of movimentos) {
      const chave = m.dataMovimento.toISOString().slice(0, 7);
      if (!porMes[chave]) porMes[chave] = { entradas: 0, saidas: 0 };
      if (m.tipo === "ENTRADA") porMes[chave].entradas += m.valor;
      else porMes[chave].saidas += m.valor;
    }

    const meses = Object.entries(porMes).sort(([a], [b]) => a.localeCompare(b));
    if (meses.length < 3) return { anomalias: [], mensagem: "Dados insuficientes (mínimo 3 meses)" };

    // Calcular média e desvio padrão
    const entradasArr = meses.map(([, v]) => v.entradas);
    const saidasArr = meses.map(([, v]) => v.saidas);

    const media = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const desvio = (arr: number[], m: number) => Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length);

    const mediaEnt = media(entradasArr);
    const desvioEnt = desvio(entradasArr, mediaEnt);
    const mediaSai = media(saidasArr);
    const desvioSai = desvio(saidasArr, mediaSai);

    const anomalias: Array<{
      mes: string;
      tipo: string;
      valor: number;
      media: number;
      desvios: number;
      descricao: string;
    }> = [];

    for (const [mes, valores] of meses) {
      if (desvioEnt > 0) {
        const desviosEnt = (valores.entradas - mediaEnt) / desvioEnt;
        if (Math.abs(desviosEnt) > 2) {
          anomalias.push({
            mes, tipo: "RECEITA", valor: valores.entradas,
            media: Math.round(mediaEnt), desvios: Math.round(desviosEnt * 10) / 10,
            descricao: desviosEnt > 0
              ? `Receita ${Math.round(Math.abs(desviosEnt))}x acima da média`
              : `Receita ${Math.round(Math.abs(desviosEnt))}x abaixo da média`
          });
        }
      }

      if (desvioSai > 0) {
        const desviosSai = (valores.saidas - mediaSai) / desvioSai;
        if (Math.abs(desviosSai) > 2) {
          anomalias.push({
            mes, tipo: "DESPESA", valor: valores.saidas,
            media: Math.round(mediaSai), desvios: Math.round(desviosSai * 10) / 10,
            descricao: desviosSai > 0
              ? `Despesa ${Math.round(Math.abs(desviosSai))}x acima da média`
              : `Despesa ${Math.round(Math.abs(desviosSai))}x abaixo da média`
          });
        }
      }
    }

    return { anomalias, totalMesesAnalisados: meses.length };
  }

  // ── Rebalanceamento de Carga (RF-T015) ──────────────────────────────────

  async analisarCargaEquipa(negocioId: string) {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const membros = await this.prisma.membroNegocio.findMany({
      where: { negocioId, status: "ATIVO" },
      include: { usuario: { select: { id: true, nome: true } } }
    });

    const resultado = await Promise.all(membros.map(async (m) => {
      const [conversasAbertas, tarefasPendentes, pedidosSemana] = await Promise.all([
        this.prisma.conversaAtendimento.count({
          where: { negocioId, responsavelId: m.usuarioId, estado: { in: ["ABERTA", "EM_ATENDIMENTO"] } }
        }),
        this.prisma.tarefaOperacional.count({
          where: { negocioId, responsavelId: m.usuarioId, estado: { in: ["ABERTA", "PENDENTE", "EM_PROGRESSO"] } }
        }),
        this.prisma.pedido.count({
          where: { negocioId, responsavelId: m.usuarioId, criadoEm: { gte: inicioSemana } }
        })
      ]);

      const cargaTotal = conversasAbertas * 3 + tarefasPendentes * 2 + pedidosSemana;

      return {
        membroId: m.id,
        nome: m.usuario.nome,
        papel: m.papel,
        conversasAbertas,
        tarefasPendentes,
        pedidosSemana,
        cargaTotal
      };
    }));

    // Calcular média e identificar sobrecargas
    const mediaCarga = resultado.length > 0
      ? resultado.reduce((s, r) => s + r.cargaTotal, 0) / resultado.length : 0;

    const comSobrecarga = resultado.map((r) => ({
      ...r,
      desvio: mediaCarga > 0 ? Math.round(((r.cargaTotal - mediaCarga) / mediaCarga) * 100) : 0,
      estado: r.cargaTotal > mediaCarga * 1.5 ? "SOBRECARGA" as const
        : r.cargaTotal < mediaCarga * 0.5 ? "SUBCARGA" as const
        : "NORMAL" as const
    }));

    comSobrecarga.sort((a, b) => b.cargaTotal - a.cargaTotal);

    const sugestoes: string[] = [];
    const sobrecarregados = comSobrecarga.filter((m) => m.estado === "SOBRECARGA");
    const subcarregados = comSobrecarga.filter((m) => m.estado === "SUBCARGA");

    if (sobrecarregados.length > 0 && subcarregados.length > 0) {
      sugestoes.push(
        `Redistribuir tarefas de ${sobrecarregados.map((m) => m.nome).join(", ")} para ${subcarregados.map((m) => m.nome).join(", ")}`
      );
    }
    if (sobrecarregados.length > 0 && subcarregados.length === 0) {
      sugestoes.push("Equipa toda com carga elevada — considerar contratar ou reduzir scope");
    }

    return {
      membros: comSobrecarga,
      mediaCarga: Math.round(mediaCarga),
      sugestoes,
      resumo: {
        total: resultado.length,
        sobrecarregados: sobrecarregados.length,
        normais: comSobrecarga.filter((m) => m.estado === "NORMAL").length,
        subcarregados: subcarregados.length
      }
    };
  }

  // ── Previsão de Demanda por SKU (RF-T001) ────────────────────────────────

  async preverDemandaPorSKU(negocioId: string, semanas = 4) {
    const agora = new Date();
    const inicio90 = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Buscar itens vendidos nos últimos 90 dias
    const itens = await this.prisma.itemPedido.findMany({
      where: {
        pedido: { negocioId, criadoEm: { gte: inicio90 } }
      },
      select: { pecaId: true, quantidade: true, pedido: { select: { criadoEm: true } } }
    });

    // Agrupar vendas por peça por semana
    const vendasPorPeca: Record<string, number[]> = {};
    for (const item of itens) {
      if (!item.pecaId) continue;
      const semana = Math.floor((agora.getTime() - item.pedido.criadoEm.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (!vendasPorPeca[item.pecaId]) vendasPorPeca[item.pecaId] = [];
      vendasPorPeca[item.pecaId][semana] = (vendasPorPeca[item.pecaId][semana] ?? 0) + item.quantidade;
    }

    const previsoes = [];
    for (const [pecaId, vendas] of Object.entries(vendasPorPeca)) {
      const semanasComDados = vendas.filter((v) => v != null);
      if (semanasComDados.length < 2) continue;

      const media = semanasComDados.reduce((s, v) => s + v, 0) / semanasComDados.length;
      const desvio = Math.sqrt(semanasComDados.reduce((s, v) => s + Math.pow(v - media, 2), 0) / semanasComDados.length);
      const confianca = desvio > 0 ? Math.min(0.95, Math.max(0.3, 1 - (desvio / (media || 1)))) : 0.7;

      for (let i = 1; i <= semanas; i++) {
        const periodoInicio = new Date(agora.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);
        const periodoFim = new Date(periodoInicio.getTime() + 7 * 24 * 60 * 60 * 1000);
        const quantidadePrevista = Math.round(media);

        previsoes.push({
          pecaId,
          periodoInicio,
          periodoFim,
          quantidadePrevista,
          confianca: Math.round(confianca * 100) / 100,
          mediaHistorica: Math.round(media),
          desvio: Math.round(desvio * 10) / 10
        });
      }
    }

    // Persistir previsões
    if (previsoes.length > 0) {
      await this.prisma.previsaoDemanda.createMany({
        data: previsoes.map((p) => ({
          negocioId,
          pecaId: p.pecaId,
          periodoInicio: p.periodoInicio,
          periodoFim: p.periodoFim,
          quantidadePrevista: p.quantidadePrevista,
          confianca: p.confianca,
          factoresJson: JSON.stringify({ mediaHistorica: p.mediaHistorica, desvio: p.desvio })
        }))
      });
    }

    return { previsoes, totalSKUs: Object.keys(vendasPorPeca).length };
  }

  // ── Alertas de Reposição de Stock (RF-T002) ─────────────────────────────

  async obterAlertasReposicaoStock(negocioId: string) {
    const agora = new Date();
    const proximas4Semanas = new Date(agora.getTime() + 28 * 24 * 60 * 60 * 1000);

    const previsoes = await this.prisma.previsaoDemanda.findMany({
      where: { negocioId, periodoInicio: { gte: agora, lte: proximas4Semanas } },
      orderBy: { periodoInicio: "asc" }
    });

    // Agrupar demanda prevista por peça
    const demandaPorPeca: Record<string, number> = {};
    for (const p of previsoes) {
      if (!p.pecaId) continue;
      demandaPorPeca[p.pecaId] = (demandaPorPeca[p.pecaId] ?? 0) + p.quantidadePrevista;
    }

    const pecaIds = Object.keys(demandaPorPeca);
    if (pecaIds.length === 0) return { alertas: [] };

    const pecas = await this.prisma.peca.findMany({
      where: { id: { in: pecaIds } },
      select: { id: true, nome: true, quantidade: true }
    });

    const alertas = pecas
      .filter((p) => p.quantidade < (demandaPorPeca[p.id] ?? 0))
      .map((p) => ({
        pecaId: p.id,
        nome: p.nome,
        stockActual: p.quantidade,
        demandaPrevista: demandaPorPeca[p.id],
        deficit: (demandaPorPeca[p.id] ?? 0) - p.quantidade,
        severidade: p.quantidade === 0 ? "CRITICO" as const : "ATENCAO" as const
      }))
      .sort((a, b) => b.deficit - a.deficit);

    return { alertas, total: alertas.length };
  }

  // ── Persistir Scores de Clientes (ScoreCliente) ─────────────────────────

  async persistirScoresClientes(negocioId: string) {
    const rfm = await this.calcularRFMClientes(negocioId);
    const ltv = await this.calcularLTV(negocioId);

    const ltvPorCliente: Record<string, number> = {};
    for (const c of ltv.clientes) {
      ltvPorCliente[c.clienteId] = c.ltv12;
    }

    const dados = rfm.clientes.map((c) => ({
      negocioId,
      clienteId: c.clienteId,
      tipoScore: "RFM",
      valor: c.score,
      segmento: c.segmento,
      recencia: c.rfm.recencia,
      frequencia: c.rfm.frequencia,
      monetario: c.rfm.monetario,
      probabilidadeChurn: c.rfm.recencia <= 2 && c.score >= 60 ? 0.7 : c.rfm.recencia <= 2 ? 0.4 : 0.1,
      ltvEstimado: ltvPorCliente[c.clienteId] ?? 0,
      factoresJson: JSON.stringify(c.metricas)
    }));

    if (dados.length > 0) {
      await this.prisma.scoreCliente.createMany({ data: dados });
    }

    return { persistidos: dados.length };
  }

  async obterScoresClientes(negocioId: string, filtros?: { tipoScore?: string; segmento?: string; limite?: number }) {
    return this.prisma.scoreCliente.findMany({
      where: {
        negocioId,
        ...(filtros?.tipoScore ? { tipoScore: filtros.tipoScore } : {}),
        ...(filtros?.segmento ? { segmento: filtros.segmento } : {})
      },
      orderBy: { calculadoEm: "desc" },
      take: filtros?.limite ?? 100
    });
  }

  // ── Insights Preditivos (RF-T017 — Ambient Analytics) ───────────────────

  async gerarInsightPreditivo(negocioId: string, dados: {
    tipo: string;
    titulo: string;
    descricao: string;
    confianca: number;
    acaoSugerida?: string;
    entidadeTipo?: string;
    entidadeId?: string;
    factores?: unknown[];
  }) {
    const nivelConfianca = dados.confianca >= 0.8 ? "ALTA" : dados.confianca >= 0.5 ? "MEDIA" : "BAIXA";

    return this.prisma.insightPreditivo.create({
      data: {
        negocioId,
        tipo: dados.tipo,
        titulo: dados.titulo,
        descricao: dados.descricao,
        confianca: dados.confianca,
        nivelConfianca,
        acaoSugerida: dados.acaoSugerida,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        factoresJson: JSON.stringify(dados.factores ?? []),
        expiradoEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // expira em 7 dias
      }
    });
  }

  async listarInsights(negocioId: string, filtros?: { tipo?: string; nivelConfianca?: string; limite?: number }) {
    const agora = new Date();
    return this.prisma.insightPreditivo.findMany({
      where: {
        negocioId,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.nivelConfianca ? { nivelConfianca: filtros.nivelConfianca } : {}),
        OR: [{ expiradoEm: null }, { expiradoEm: { gt: agora } }]
      },
      include: { feedbacks: { select: { accao: true, criadoEm: true } } },
      orderBy: { criadoEm: "desc" },
      take: filtros?.limite ?? 50
    });
  }

  // ── Feedback de Insights (RN-T018) ──────────────────────────────────────

  async registarFeedbackInsight(insightId: string, usuarioId: string, accao: string, comentario?: string) {
    return this.prisma.feedbackInsight.create({
      data: { insightId, usuarioId, accao, comentario }
    });
  }

  // ── Produtos Encalhados (RF-T003) ────────────────────────────────────────

  async identificarProdutosEncalhados(negocioId: string, diasSemVenda = 30) {
    const agora = new Date();
    const limiteData = new Date(agora.getTime() - diasSemVenda * 24 * 60 * 60 * 1000);

    // Buscar todas as peças do negócio
    const pecas = await this.prisma.peca.findMany({
      where: { negocioId },
      select: { id: true, nome: true, quantidade: true, precoEmKwanza: true, sku: true, criadoEm: true }
    });

    if (pecas.length === 0) return { produtos: [], total: 0 };

    // Buscar vendas recentes (últimos N dias)
    const vendasRecentes = await this.prisma.itemPedido.findMany({
      where: {
        pecaId: { in: pecas.map((p) => p.id) },
        pedido: { negocioId, criadoEm: { gte: limiteData } }
      },
      select: { pecaId: true, quantidade: true }
    });

    const vendasPorPeca = new Map<string, number>();
    for (const v of vendasRecentes) {
      if (!v.pecaId) continue;
      vendasPorPeca.set(v.pecaId, (vendasPorPeca.get(v.pecaId) ?? 0) + v.quantidade);
    }

    // Identificar encalhados: stock > 0 e zero vendas no período
    const encalhados = pecas
      .filter((p) => p.quantidade > 0 && !vendasPorPeca.has(p.id))
      .map((p) => {
        const valorParado = p.quantidade * p.precoEmKwanza;
        const diasDesdeCreacao = Math.floor((agora.getTime() - p.criadoEm.getTime()) / (1000 * 60 * 60 * 24));

        let sugestao: string;
        if (diasDesdeCreacao > 180) sugestao = "Considerar descontinuação ou liquidação";
        else if (diasDesdeCreacao > 90) sugestao = "Criar promoção ou bundle com produtos populares";
        else sugestao = "Destacar na loja pública ou incluir em campanha";

        return {
          pecaId: p.id,
          nome: p.nome,
          sku: p.sku,
          stockActual: p.quantidade,
          valorParado,
          diasSemVenda: diasSemVenda,
          diasDesdeCreacao,
          sugestao,
          risco: diasDesdeCreacao > 180 ? "ALTO" as const : diasDesdeCreacao > 90 ? "MEDIO" as const : "BAIXO" as const
        };
      })
      .sort((a, b) => b.valorParado - a.valorParado);

    const valorTotalParado = encalhados.reduce((s, p) => s + p.valorParado, 0);

    return { produtos: encalhados, total: encalhados.length, valorTotalParado };
  }

  // ── Padrões Sazonais (RF-T004) ──────────────────────────────────────────

  async detectarPadroesSazonais(negocioId: string) {
    const agora = new Date();
    const mesActual = agora.getMonth(); // 0-11
    const anoActual = agora.getFullYear();

    // Buscar pedidos dos últimos 24 meses para comparação
    const inicio24m = new Date(anoActual - 2, mesActual, 1);
    const pedidos = await this.prisma.pedido.findMany({
      where: { negocioId, criadoEm: { gte: inicio24m } },
      select: { totalEmKwanza: true, criadoEm: true, estado: true }
    });

    if (pedidos.length < 10) return { padroes: [], mensagem: "Dados insuficientes (mínimo 10 pedidos em 24 meses)" };

    // Agrupar por mês
    const porMes: Record<string, { count: number; valor: number }> = {};
    for (const p of pedidos) {
      const chave = p.criadoEm.toISOString().slice(0, 7); // YYYY-MM
      if (!porMes[chave]) porMes[chave] = { count: 0, valor: 0 };
      porMes[chave].count++;
      porMes[chave].valor += p.totalEmKwanza;
    }

    const meses = Object.entries(porMes).sort(([a], [b]) => a.localeCompare(b));

    // Comparação período-a-período (mesmo mês do ano anterior)
    const comparacoes: Array<{
      mes: string;
      anoActual: { count: number; valor: number } | null;
      anoAnterior: { count: number; valor: number } | null;
      variacao: { pedidos: number; valor: number } | null;
    }> = [];

    for (let m = 0; m < 12; m++) {
      const mesStr = String(m + 1).padStart(2, "0");
      const chaveActual = `${anoActual}-${mesStr}`;
      const chaveAnterior = `${anoActual - 1}-${mesStr}`;

      const actual = porMes[chaveActual] ?? null;
      const anterior = porMes[chaveAnterior] ?? null;

      let variacao = null;
      if (actual && anterior && anterior.count > 0) {
        variacao = {
          pedidos: Math.round(((actual.count - anterior.count) / anterior.count) * 100),
          valor: Math.round(((actual.valor - anterior.valor) / anterior.valor) * 100)
        };
      }

      comparacoes.push({
        mes: mesStr,
        anoActual: actual,
        anoAnterior: anterior,
        variacao
      });
    }

    // Identificar padrões sazonais (meses com consistentemente mais/menos vendas)
    const mediaMensal = meses.length > 0
      ? meses.reduce((s, [, v]) => s + v.valor, 0) / meses.length : 0;

    const padroes = comparacoes
      .filter((c) => c.anoActual || c.anoAnterior)
      .map((c) => {
        const valorRef = c.anoActual?.valor ?? c.anoAnterior?.valor ?? 0;
        const desvio = mediaMensal > 0 ? Math.round(((valorRef - mediaMensal) / mediaMensal) * 100) : 0;
        let tendencia: string;
        if (desvio > 30) tendencia = "PICO_SAZONAL";
        else if (desvio < -30) tendencia = "VALE_SAZONAL";
        else tendencia = "NORMAL";

        return { ...c, desvioMedia: desvio, tendencia };
      });

    return {
      padroes,
      anoComparacao: { actual: anoActual, anterior: anoActual - 1 },
      mediaMensal: Math.round(mediaMensal),
      totalMesesComDados: meses.length
    };
  }

  // ── Lead Scoring (RF-T009) ──────────────────────────────────────────────

  async calcularLeadScoring(negocioId: string) {
    const agora = new Date();
    const inicio90 = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);

    const clientes = await this.prisma.clienteNegocio.findMany({
      where: { negocioId },
      select: { id: true, nome: true, telefone: true, criadoEm: true }
    });

    const pedidos = await this.prisma.pedido.findMany({
      where: { negocioId },
      select: { clienteNegocioId: true, totalEmKwanza: true, criadoEm: true, estado: true, estadoPagamento: true }
    });

    const conversas = await this.prisma.conversaAtendimento.findMany({
      where: { negocioId, criadaEm: { gte: inicio90 } },
      select: { clienteNegocioId: true, criadaEm: true, estado: true }
    });

    // Agrupar dados por cliente
    const pedidosPorCliente: Record<string, typeof pedidos> = {};
    for (const p of pedidos) {
      if (!pedidosPorCliente[p.clienteNegocioId]) pedidosPorCliente[p.clienteNegocioId] = [];
      pedidosPorCliente[p.clienteNegocioId].push(p);
    }

    const conversasPorCliente: Record<string, number> = {};
    for (const c of conversas) {
      if (c.clienteNegocioId) {
        conversasPorCliente[c.clienteNegocioId] = (conversasPorCliente[c.clienteNegocioId] ?? 0) + 1;
      }
    }

    const leads = clientes.map((c) => {
      const peds = pedidosPorCliente[c.id] ?? [];
      const pedsPagos = peds.filter((p) => p.estadoPagamento === "CONFIRMADO");
      const interaccoes90d = conversasPorCliente[c.id] ?? 0;
      const diasDesdeRegisto = Math.floor((agora.getTime() - c.criadoEm.getTime()) / (1000 * 60 * 60 * 24));

      // Factores de scoring
      const factorCompras = Math.min(pedsPagos.length * 15, 30); // até 30 pts
      const factorValor = Math.min(Math.floor(pedsPagos.reduce((s, p) => s + p.totalEmKwanza, 0) / 10000) * 5, 20); // até 20 pts
      const factorInteraccao = Math.min(interaccoes90d * 10, 20); // até 20 pts
      const factorRecencia = diasDesdeRegisto <= 7 ? 15 : diasDesdeRegisto <= 30 ? 10 : diasDesdeRegisto <= 90 ? 5 : 0; // até 15 pts
      const factorConversao = peds.length > 0 ? Math.round((pedsPagos.length / peds.length) * 15) : 0; // até 15 pts

      const score = factorCompras + factorValor + factorInteraccao + factorRecencia + factorConversao;

      let qualificacao: string;
      if (score >= 70) qualificacao = "QUENTE";
      else if (score >= 40) qualificacao = "MORNO";
      else qualificacao = "FRIO";

      return {
        clienteId: c.id,
        nome: c.nome,
        telefone: c.telefone,
        score,
        qualificacao,
        factores: { compras: factorCompras, valor: factorValor, interaccao: factorInteraccao, recencia: factorRecencia, conversao: factorConversao },
        metricas: { totalPedidos: peds.length, pedidosPagos: pedsPagos.length, interaccoes90d, diasDesdeRegisto }
      };
    });

    leads.sort((a, b) => b.score - a.score);

    const resumo = {
      quentes: leads.filter((l) => l.qualificacao === "QUENTE").length,
      mornos: leads.filter((l) => l.qualificacao === "MORNO").length,
      frios: leads.filter((l) => l.qualificacao === "FRIO").length
    };

    return { leads: leads.slice(0, 100), resumo, total: leads.length };
  }

  // ── Previsão de Receita Mensal (RF-T012) ────────────────────────────────

  async preverReceitaMensal(negocioId: string, meses = 3) {
    const agora = new Date();
    const inicio12m = new Date(agora.getFullYear() - 1, agora.getMonth(), 1);
    const factoresExternos = await this.listarFontesExternasPreditivas(negocioId, { limite: 20 });

    const pedidos = await this.prisma.pedido.findMany({
      where: { negocioId, estadoPagamento: "CONFIRMADO", criadoEm: { gte: inicio12m } },
      select: { totalEmKwanza: true, criadoEm: true }
    });

    // RN-T015: mínimo de dados para previsão
    if (pedidos.length < 30) {
      const mediaSimples = pedidos.length > 0
        ? Math.round(pedidos.reduce((s, p) => s + p.totalEmKwanza, 0) / Math.max(1, pedidos.length))
        : 0;
      return {
        previsoes: [],
        dadosInsuficientes: true,
        mensagem: "Menos de 30 transacções confirmadas. Previsão detalhada requer mais dados.",
        mediaSimplesPorTransaccao: mediaSimples,
        factoresExternos
      };
    }

    // Agrupar receita por mês
    const receitaPorMes: Record<string, number> = {};
    for (const p of pedidos) {
      const chave = p.criadoEm.toISOString().slice(0, 7);
      receitaPorMes[chave] = (receitaPorMes[chave] ?? 0) + p.totalEmKwanza;
    }

    const mesesHistorico = Object.entries(receitaPorMes).sort(([a], [b]) => a.localeCompare(b));
    const valores = mesesHistorico.map(([, v]) => v);

    const media = valores.reduce((s, v) => s + v, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((s, v) => s + Math.pow(v - media, 2), 0) / valores.length);

    // Tendência linear simples (regressão)
    const n = valores.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = valores.reduce((s, v) => s + v, 0);
    const sumXY = valores.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = valores.reduce((s, _, i) => s + i * i, 0);
    const pendente = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;

    const confianca = desvio > 0 ? Math.min(0.95, Math.max(0.3, 1 - (desvio / (media || 1)))) : 0.7;

    const previsoes: Array<{
      mes: string;
      optimista: number;
      provavel: number;
      pessimista: number;
      confianca: number;
    }> = [];

    for (let i = 1; i <= meses; i++) {
      const dataPrevisao = new Date(agora.getFullYear(), agora.getMonth() + i, 1);
      const mesStr = dataPrevisao.toISOString().slice(0, 7);
      const baseProjectada = Math.round(media + pendente * (n + i - 1));

      previsoes.push({
        mes: mesStr,
        optimista: Math.round(baseProjectada + desvio * 0.5),
        provavel: Math.max(0, baseProjectada),
        pessimista: Math.max(0, Math.round(baseProjectada - desvio * 0.5)),
        confianca: Math.round(confianca * 100) / 100
      });
    }

    return {
      previsoes,
      dadosInsuficientes: false,
      historico: mesesHistorico.map(([mes, valor]) => ({ mes, valor })),
      mediaMensal: Math.round(media),
      tendenciaMensal: Math.round(pendente),
      factoresExternos
    };
  }

  // ── RNF-T020 — Graceful degradation no recálculo preditivo ──────────────

  async recalcularPrevisoesComDegradacao(
    negocioId: string,
    opcoes?: { semanasDemanda?: number; semanasCaixa?: number; mesesReceita?: number }
  ) {
    const tarefas = [
      {
        chave: "demanda",
        executar: () => this.preverDemandaPorSKU(negocioId, opcoes?.semanasDemanda ?? 4)
      },
      {
        chave: "fluxoCaixa",
        executar: () => this.preverFluxoCaixa(negocioId, opcoes?.semanasCaixa ?? 13)
      },
      {
        chave: "receita",
        executar: () => this.preverReceitaMensal(negocioId, opcoes?.mesesReceita ?? 3)
      },
      {
        chave: "scoresClientes",
        executar: () => this.persistirScoresClientes(negocioId)
      }
    ];

    const resultados = await Promise.allSettled(tarefas.map((tarefa) => tarefa.executar()));
    const concluidas: Record<string, unknown> = {};
    const falhas: Array<{ chave: string; erro: string }> = [];

    resultados.forEach((resultado, indice) => {
      const chave = tarefas[indice].chave;
      if (resultado.status === "fulfilled") {
        concluidas[chave] = resultado.value;
      } else {
        falhas.push({
          chave,
          erro: resultado.reason instanceof Error ? resultado.reason.message : String(resultado.reason)
        });
      }
    });

    return {
      estado: falhas.length === 0 ? "CONCLUIDO" : concluidas && Object.keys(concluidas).length > 0 ? "PARCIAL" : "FALHADO",
      concluidas,
      falhas,
      recalculadoEm: new Date().toISOString()
    };
  }

  async enfileirarRecalculoPreditivo(
    negocioId: string,
    opcoes?: { semanasDemanda?: number; semanasCaixa?: number; mesesReceita?: number; solicitadoPorId?: string }
  ) {
    const evento = await this.criarEventoRecalculoPreditivo(negocioId, opcoes);

    return {
      estado: "ENFILEIRADO",
      eventoN8n: evento
    };
  }

  async enfileirarRecalculoPreditivoLote(
    negocioIds: string[],
    opcoes?: {
      semanasDemanda?: number;
      semanasCaixa?: number;
      mesesReceita?: number;
      solicitadoPorId?: string;
      concorrencia?: number;
    }
  ) {
    const idsUnicos = [...new Set(negocioIds.map((id) => id.trim()).filter(Boolean))];
    if (idsUnicos.length === 0) {
      throw new Error("Informe pelo menos um negócio para recálculo preditivo.");
    }

    const loteId = randomUUID();
    const concorrenciaSugerida = Math.max(1, Math.min(opcoes?.concorrencia ?? 4, idsUnicos.length, 20));
    const resultados = await Promise.allSettled(
      idsUnicos.map((negocioId, indice) =>
        this.criarEventoRecalculoPreditivo(negocioId, {
          ...opcoes,
          loteId,
          indiceLote: indice,
          totalNegocios: idsUnicos.length,
          concorrenciaSugerida,
          chaveParticao: negocioId
        })
      )
    );

    const eventos = resultados.flatMap((resultado, indice) =>
      resultado.status === "fulfilled"
        ? [{ negocioId: idsUnicos[indice], eventoN8n: resultado.value }]
        : []
    );
    const falhas = resultados.flatMap((resultado, indice) =>
      resultado.status === "rejected"
        ? [{
            negocioId: idsUnicos[indice],
            erro: resultado.reason instanceof Error ? resultado.reason.message : String(resultado.reason)
          }]
        : []
    );

    return {
      estado: falhas.length === 0 ? "ENFILEIRADO" : eventos.length > 0 ? "PARCIAL" : "FALHADO",
      loteId,
      totalNegocios: idsUnicos.length,
      enfileirados: eventos.length,
      concorrenciaSugerida,
      eventos,
      falhas
    };
  }

  private criarEventoRecalculoPreditivo(
    negocioId: string,
    opcoes?: {
      semanasDemanda?: number;
      semanasCaixa?: number;
      mesesReceita?: number;
      solicitadoPorId?: string;
      loteId?: string;
      indiceLote?: number;
      totalNegocios?: number;
      concorrenciaSugerida?: number;
      chaveParticao?: string;
    }
  ) {
    return this.prisma.outboxEventoN8n.create({
      data: {
        negocioId,
        eventoId: randomUUID(),
        tipo: "PREDICTIVE_RECALCULO_SOLICITADO",
        payloadJson: JSON.stringify({
          negocioId,
          semanasDemanda: opcoes?.semanasDemanda ?? 4,
          semanasCaixa: opcoes?.semanasCaixa ?? 13,
          mesesReceita: opcoes?.mesesReceita ?? 3,
          solicitadoPorId: opcoes?.solicitadoPorId ?? null,
          endpointExecucao: "/inteligencia/recalcular",
          loteId: opcoes?.loteId ?? null,
          indiceLote: opcoes?.indiceLote ?? null,
          totalNegocios: opcoes?.totalNegocios ?? 1,
          concorrenciaSugerida: opcoes?.concorrenciaSugerida ?? 1,
          chaveParticao: opcoes?.chaveParticao ?? negocioId,
          solicitadoEm: new Date().toISOString()
        }),
        status: "PENDENTE",
        proximaTentativaEm: new Date()
      },
      select: { id: true, eventoId: true, status: true }
    });
  }

  // ── RNF-T024 — Fontes externas para o motor preditivo ───────────────────

  async importarFontesExternasPreditivas(
    negocioId: string,
    dados: {
      fonte: string;
      indicadores?: IndicadorExternoPreditivoEntrada[];
      conteudoCsv?: string;
      criadoPorId?: string;
    }
  ) {
    const indicadores = [
      ...(dados.indicadores ?? []),
      ...this.parseIndicadoresExternosCsv(dados.conteudoCsv ?? "", dados.fonte)
    ].map((indicador) => this.normalizarIndicadorExterno(indicador, dados.fonte, dados.criadoPorId));

    if (indicadores.length === 0) {
      throw new Error("Informe pelo menos um indicador externo em JSON ou CSV.");
    }

    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { fontesDadosJson: true }
    });
    if (!negocio) throw new Error("Negócio não encontrado.");

    const fontesDados = this.lerFontesDadosPreditivas(negocio.fontesDadosJson);
    const existentes = fontesDados.preditivo?.fontesExternas ?? [];
    const porChave = new Map<string, IndicadorExternoPreditivo>();
    for (const indicador of existentes) {
      porChave.set(this.chaveIndicadorExterno(indicador), indicador);
    }
    for (const indicador of indicadores) {
      porChave.set(this.chaveIndicadorExterno(indicador), indicador);
    }

    const fontesExternas = [...porChave.values()]
      .sort((a, b) => b.recebidoEm.localeCompare(a.recebidoEm))
      .slice(0, 500);

    const actualizado: FontesDadosPreditivas = {
      ...fontesDados,
      preditivo: {
        ...(fontesDados.preditivo ?? {}),
        actualizadoEm: new Date().toISOString(),
        fontesExternas
      }
    };

    await this.prisma.negocio.update({
      where: { id: negocioId },
      data: { fontesDadosJson: JSON.stringify(actualizado) }
    });

    return {
      importados: indicadores.length,
      totalFontesExternas: fontesExternas.length,
      indicadores: indicadores.map((indicador) => ({
        id: indicador.id,
        fonte: indicador.fonte,
        chave: indicador.chave,
        periodo: indicador.periodo,
        valor: indicador.valor,
        unidade: indicador.unidade ?? null,
        segmento: indicador.segmento ?? null
      }))
    };
  }

  async listarFontesExternasPreditivas(
    negocioId: string,
    filtros?: { fonte?: string; chave?: string; segmento?: string; limite?: number }
  ) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { fontesDadosJson: true }
    });
    if (!negocio) return [];

    const fontesDados = this.lerFontesDadosPreditivas(negocio.fontesDadosJson);
    const fonteFiltro = filtros?.fonte?.trim().toUpperCase();
    const chaveFiltro = filtros?.chave?.trim().toLowerCase();
    const segmentoFiltro = filtros?.segmento?.trim().toLowerCase();

    return (fontesDados.preditivo?.fontesExternas ?? [])
      .filter((indicador) => !fonteFiltro || indicador.fonte.toUpperCase() === fonteFiltro)
      .filter((indicador) => !chaveFiltro || indicador.chave.toLowerCase() === chaveFiltro)
      .filter((indicador) => !segmentoFiltro || indicador.segmento?.toLowerCase() === segmentoFiltro)
      .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.recebidoEm.localeCompare(a.recebidoEm))
      .slice(0, filtros?.limite ?? 100);
  }

  // ── Previsão de Atrasos em Projectos (RF-T014) ─────────────────────────

  async preverAtrasosProjectos(negocioId: string) {
    const agora = new Date();

    const projectos = await this.prisma.projecto.findMany({
      where: { negocioId, estado: { not: "FECHADO" } },
      include: {
        entregas: { select: { id: true, estado: true, dataLimite: true, criadoEm: true, concluidaEm: true } },
        membrosProjecto: { select: { membroId: true } }
      }
    });

    if (projectos.length === 0) return { projectos: [], total: 0 };
    const despesasPorProjecto = await this.calcularDespesasPorProjecto(
      negocioId,
      projectos.map((projecto) => projecto.id)
    );

    // Calcular velocidade histórica: entregas concluídas por semana
    const entregasConcluidas = projectos
      .flatMap((p) => p.entregas)
      .filter((e) => e.estado === "CONCLUIDA" && e.concluidaEm);

    const velocidadeSemanal = entregasConcluidas.length > 0
      ? entregasConcluidas.length / Math.max(1, Math.ceil(
          (agora.getTime() - Math.min(...entregasConcluidas.map((e) => e.criadoEm.getTime()))) /
          (7 * 24 * 60 * 60 * 1000)
        ))
      : 0.5; // fallback: 0.5 entregas/semana

    const analises = projectos.map((p) => {
      const total = p.entregas.length;
      const concluidas = p.entregas.filter((e) => e.estado === "CONCLUIDA").length;
      const pendentes = total - concluidas;

      // Estimar semanas necessárias para concluir
      const semanasEstimadas = velocidadeSemanal > 0 ? Math.ceil(pendentes / velocidadeSemanal) : pendentes * 2;
      const dataEstimadaConclusao = new Date(agora.getTime() + semanasEstimadas * 7 * 24 * 60 * 60 * 1000);

      // Verificar se tem data fim e se vai atrasar
      const temPrazo = !!p.dataFim;
      const diasAtraso = temPrazo
        ? Math.ceil((dataEstimadaConclusao.getTime() - p.dataFim!.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Entregas atrasadas (data limite ultrapassada)
      const entregasAtrasadas = p.entregas.filter(
        (e) => e.dataLimite && e.estado !== "CONCLUIDA" && e.estado !== "CANCELADA" && e.dataLimite < agora
      ).length;

      // Verificar orçamento
      const despesaProjecto = despesasPorProjecto.get(p.id) ?? 0;
      const orcamentoExcedido = !!p.orcamento && p.orcamento > 0 && despesaProjecto > p.orcamento;

      let risco: "ALTO" | "MEDIO" | "BAIXO";
      if (diasAtraso > 14 || entregasAtrasadas > 2 || (orcamentoExcedido && despesaProjecto > (p.orcamento ?? 0) * 1.2)) {
        risco = "ALTO";
      } else if (diasAtraso > 0 || entregasAtrasadas > 0 || orcamentoExcedido) risco = "MEDIO";
      else risco = "BAIXO";

      return {
        projectoId: p.id,
        nome: p.nome,
        progresso: total > 0 ? Math.round((concluidas / total) * 100) : 0,
        entregasTotais: total,
        entregasConcluidas: concluidas,
        entregasPendentes: pendentes,
        entregasAtrasadas,
        dataFimPrevista: p.dataFim?.toISOString().slice(0, 10) ?? null,
        dataEstimadaConclusao: dataEstimadaConclusao.toISOString().slice(0, 10),
        diasAtrasoEstimado: Math.max(0, diasAtraso),
        risco,
        orcamento: p.orcamento ?? null,
        despesaProjecto,
        orcamentoExcedido,
        membros: p.membrosProjecto.length
      };
    });

    analises.sort((a, b) => b.diasAtrasoEstimado - a.diasAtrasoEstimado);

    return {
      projectos: analises,
      total: analises.length,
      velocidadeSemanalEquipa: Math.round(velocidadeSemanal * 10) / 10,
      emRisco: analises.filter((a) => a.risco !== "BAIXO").length
    };
  }

  private async calcularDespesasPorProjecto(negocioId: string, projectoIds: string[]) {
    if (!projectoIds.length) return new Map<string, number>();

    const despesas = await this.prisma.movimentoFinanceiro.groupBy({
      by: ["origemId"],
      where: {
        negocioId,
        tipo: "SAIDA",
        origemTipo: { in: ["PROJECTO", "PROJETO"] },
        origemId: { in: projectoIds }
      },
      _sum: { valor: true }
    });

    return new Map(
      despesas.flatMap((despesa) => (despesa.origemId ? [[despesa.origemId, despesa._sum.valor ?? 0]] : []))
    );
  }

  private normalizarIndicadorExterno(
    indicador: IndicadorExternoPreditivoEntrada,
    fontePadrao: string,
    criadoPorId?: string
  ): IndicadorExternoPreditivo {
    const fonte = (indicador.fonte ?? fontePadrao).trim().toUpperCase();
    const chave = indicador.chave.trim().toLowerCase();
    const periodo = indicador.periodo.trim();
    const valor = Number(indicador.valor);

    if (!fonte) throw new Error("Fonte externa é obrigatória.");
    if (!chave) throw new Error("Chave do indicador externo é obrigatória.");
    if (!periodo) throw new Error("Período do indicador externo é obrigatório.");
    if (!Number.isFinite(valor)) throw new Error(`Valor inválido para o indicador externo ${chave}.`);

    return {
      id: randomUUID(),
      fonte,
      chave,
      periodo,
      valor,
      unidade: indicador.unidade?.trim() || undefined,
      segmento: indicador.segmento?.trim() || undefined,
      metadados: indicador.metadados,
      recebidoEm: new Date().toISOString(),
      criadoPorId
    };
  }

  private parseIndicadoresExternosCsv(conteudo: string, fontePadrao: string): IndicadorExternoPreditivoEntrada[] {
    const linhas = conteudo
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter(Boolean);
    if (linhas.length === 0) return [];

    const separador = linhas[0].includes(";") ? ";" : ",";
    const cabecalho = this.dividirLinhaCsv(linhas[0], separador).map((campo) => campo.trim().toLowerCase());
    const indice = (nome: string) => cabecalho.indexOf(nome);
    const idxChave = indice("chave");
    const idxPeriodo = indice("periodo");
    const idxValor = indice("valor");
    if (idxChave < 0 || idxPeriodo < 0 || idxValor < 0) {
      throw new Error("CSV de indicadores externos deve conter cabeçalho chave,periodo,valor.");
    }

    return linhas.slice(1).map((linha) => {
      const colunas = this.dividirLinhaCsv(linha, separador);
      return {
        fonte: this.valorCsv(colunas, indice("fonte")) || fontePadrao,
        chave: this.valorCsv(colunas, idxChave),
        periodo: this.valorCsv(colunas, idxPeriodo),
        valor: Number(this.valorCsv(colunas, idxValor).replace(",", ".")),
        unidade: this.valorCsv(colunas, indice("unidade")) || undefined,
        segmento: this.valorCsv(colunas, indice("segmento")) || undefined
      };
    });
  }

  private dividirLinhaCsv(linha: string, separador: string) {
    const colunas: string[] = [];
    let actual = "";
    let entreAspas = false;

    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      const proximo = linha[i + 1];
      if (char === '"' && proximo === '"') {
        actual += '"';
        i++;
        continue;
      }
      if (char === '"') {
        entreAspas = !entreAspas;
        continue;
      }
      if (char === separador && !entreAspas) {
        colunas.push(actual.trim());
        actual = "";
        continue;
      }
      actual += char;
    }
    colunas.push(actual.trim());
    return colunas;
  }

  private valorCsv(colunas: string[], indice: number) {
    if (indice < 0) return "";
    return colunas[indice]?.trim() ?? "";
  }

  private chaveIndicadorExterno(indicador: IndicadorExternoPreditivo) {
    return [
      indicador.fonte.toUpperCase(),
      indicador.chave.toLowerCase(),
      indicador.periodo,
      indicador.segmento?.toLowerCase() ?? ""
    ].join("|");
  }

  private lerFontesDadosPreditivas(valor: string | null | undefined): FontesDadosPreditivas {
    try {
      const parsed = JSON.parse(valor || "{}") as FontesDadosPreditivas;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  // ── Guarda Mínimo de Dados (RN-T015) ────────────────────────────────────

  async verificarMinimoParaPrevisao(negocioId: string): Promise<{
    elegivel: boolean;
    diasHistorico: number;
    totalTransaccoes: number;
    minimoTransaccoes: number;
    minimoDias: number;
  }> {
    const MINIMO_TRANSACCOES = 100;
    const MINIMO_DIAS = 90;

    const primeiroMovimento = await this.prisma.pedido.findFirst({
      where: { negocioId },
      orderBy: { criadoEm: "asc" },
      select: { criadoEm: true }
    });

    const totalTransaccoes = await this.prisma.pedido.count({ where: { negocioId } });

    const diasHistorico = primeiroMovimento
      ? Math.floor((Date.now() - primeiroMovimento.criadoEm.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      elegivel: diasHistorico >= MINIMO_DIAS || totalTransaccoes >= MINIMO_TRANSACCOES,
      diasHistorico,
      totalTransaccoes,
      minimoTransaccoes: MINIMO_TRANSACCOES,
      minimoDias: MINIMO_DIAS
    };
  }

  // ── Gargalos no Funil Comercial (RF-T016) ───────────────────────────────

  async analisarFunilComercial(negocioId: string) {
    const agora = new Date();
    const inicio30 = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Pedidos dos últimos 30 dias agrupados por estado
    const pedidos = await this.prisma.pedido.findMany({
      where: { negocioId, criadoEm: { gte: inicio30 } },
      select: { estado: true, estadoPagamento: true, criadoEm: true, totalEmKwanza: true }
    });

    const total = pedidos.length;
    if (total === 0) return { etapas: [], gargalos: [], total: 0 };

    // Contagem por estado
    const porEstado: Record<string, { count: number; valor: number }> = {};
    for (const p of pedidos) {
      if (!porEstado[p.estado]) porEstado[p.estado] = { count: 0, valor: 0 };
      porEstado[p.estado].count++;
      porEstado[p.estado].valor += p.totalEmKwanza;
    }

    // Definir etapas do funil
    const etapasFunil = [
      "AGUARDANDO_PAGAMENTO",
      "PENDENTE",
      "EM_PROCESSAMENTO",
      "ENVIADO",
      "ENTREGUE",
      "CONCLUIDO"
    ];

    let anterior = total;
    const etapas = etapasFunil.map((estado) => {
      const dados = porEstado[estado] ?? { count: 0, valor: 0 };
      const taxa = anterior > 0 ? Math.round((dados.count / anterior) * 100) : 0;
      const resultado = { estado, count: dados.count, valor: dados.valor, taxaConversao: taxa };
      anterior = dados.count || anterior;
      return resultado;
    });

    // Identificar gargalos (taxas de conversão baixas)
    const gargalos = etapas
      .filter((e) => e.taxaConversao < 50 && e.taxaConversao > 0)
      .map((e) => ({
        estado: e.estado,
        taxaConversao: e.taxaConversao,
        pedidosParados: e.count,
        sugestao: e.estado === "AGUARDANDO_PAGAMENTO"
          ? "Enviar lembretes de pagamento aos clientes"
          : e.estado === "PENDENTE"
          ? "Priorizar processamento de pedidos pendentes"
          : e.estado === "EM_PROCESSAMENTO"
          ? "Verificar bottleneck na preparação/expedição"
          : "Acompanhar transição entre etapas"
      }));

    // Cancelados/devolvidos
    const cancelados = porEstado["CANCELADO"]?.count ?? 0;
    const taxaCancelamento = total > 0 ? Math.round((cancelados / total) * 100) : 0;

    return {
      etapas,
      gargalos,
      total,
      cancelados,
      taxaCancelamento,
      valorTotal: pedidos.reduce((s, p) => s + p.totalEmKwanza, 0)
    };
  }
}
