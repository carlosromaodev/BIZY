import type { PrismaClient } from "@prisma/client";

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
