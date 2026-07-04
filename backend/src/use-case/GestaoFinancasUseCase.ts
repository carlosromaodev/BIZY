import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { buildFacturaHtml, type DadosFacturaPdf } from "../infra/pdf/FacturaPdfTemplate.js";
import { buildReciboHtml, type DadosReciboPdf } from "../infra/pdf/ReciboPdfTemplate.js";
import { renderPdfFromHtml } from "../infra/pdf/PdfRenderer.js";
import { parseCsv } from "./utils/csv.js";

const CATEGORIAS_PADRAO = [
  { nome: "Vendas", tipo: "RECEITA" },
  { nome: "Comissões recebidas", tipo: "RECEITA" },
  { nome: "Outros recebimentos", tipo: "RECEITA" },
  { nome: "Fornecedores", tipo: "DESPESA" },
  { nome: "Salários", tipo: "DESPESA" },
  { nome: "Aluguer", tipo: "DESPESA" },
  { nome: "Marketing", tipo: "DESPESA" },
  { nome: "Logística/Entregas", tipo: "DESPESA" },
  { nome: "Taxas e impostos", tipo: "DESPESA" },
  { nome: "Outros custos", tipo: "DESPESA" }
];

const ORIGENS_ENTRADA = ["PEDIDO", "RECEBIMENTO_MANUAL", "COMISSAO", "FACTURA", "CONTA_RECEBER", "RECIBO"];
const ORIGENS_SAIDA = [
  "FORNECEDOR",
  "DESPESA",
  "IMPOSTO",
  "COMISSAO_PAGA",
  "NOTA_CREDITO",
  "CONTA_PAGAR",
  "REEMBOLSO",
  "PROJECTO",
  "PROJETO"
];
const MENSAGEM_ORIGEM_FINANCEIRA =
  "RN-T001: Todo movimento financeiro deve ter origem classificada (origemTipo). Entradas: PEDIDO, RECEBIMENTO_MANUAL, COMISSAO, FACTURA, CONTA_RECEBER, RECIBO. Saídas: FORNECEDOR, DESPESA, IMPOSTO, COMISSAO_PAGA, NOTA_CREDITO, CONTA_PAGAR, REEMBOLSO, PROJECTO.";
const JANELA_CONCILIACAO_MS = 3 * 24 * 60 * 60 * 1000;
const TAMANHO_CHUNK_VALORES_CONCILIACAO = 1000;

type FormatoExtratoBancario = "CSV" | "OFX";
type TipoMovimentoBancario = "CREDITO" | "DEBITO";
type EstadoConciliacaoBancaria = "PENDENTE" | "CONCILIADO" | "IGNORADO";

type LinhaExtratoBancario = {
  dataMovimento: Date;
  descricao: string;
  valor: number;
  tipo: TipoMovimentoBancario;
  referencia?: string | null;
  linha?: number;
};

type MovimentoFinanceiroSugestao = {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  dataMovimento: Date;
  origemTipo: string | null;
  origemId: string | null;
};

export class GestaoFinancasUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventos?: DespachadorEventos
  ) {}

  // ── Categorias ────────────────────────────────────────────────────────────

  async listarCategorias(negocioId: string) {
    return this.prisma.categoriaFinanceira.findMany({
      where: { negocioId, ativo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }]
    });
  }

  async criarCategoria(
    negocioId: string,
    dados: { nome: string; tipo: string; icone?: string; cor?: string }
  ) {
    return this.prisma.categoriaFinanceira.create({
      data: { negocioId, nome: dados.nome, tipo: dados.tipo, icone: dados.icone, cor: dados.cor }
    });
  }

  async inicializarCategoriasPadrao(negocioId: string) {
    const existentes = await this.prisma.categoriaFinanceira.count({ where: { negocioId } });
    if (existentes > 0) return { criadas: 0 };

    await this.prisma.categoriaFinanceira.createMany({
      data: CATEGORIAS_PADRAO.map((c) => ({ negocioId, ...c }))
    });
    return { criadas: CATEGORIAS_PADRAO.length };
  }

  // ── Movimentos (Ledger) ───────────────────────────────────────────────────

  async registarMovimento(
    negocioId: string,
    dados: {
      tipo: string;
      categoriaId?: string;
      descricao: string;
      valor: number;
      origemTipo?: string;
      origemId?: string;
      responsavelId?: string;
      dataMovimento?: Date;
      metodoPagamento?: string;
      referenciaPagamento?: string;
      comprovativoUrl?: string;
      observacao?: string;
    }
  ) {
    // RN-T001: todo movimento financeiro deve ter origem classificada
    if (!dados.origemTipo) {
      throw new Error(MENSAGEM_ORIGEM_FINANCEIRA);
    }

    if (dados.tipo === "ENTRADA" && !ORIGENS_ENTRADA.includes(dados.origemTipo)) {
      throw new Error(MENSAGEM_ORIGEM_FINANCEIRA);
    }
    if (dados.tipo === "SAIDA" && !ORIGENS_SAIDA.includes(dados.origemTipo)) {
      throw new Error(MENSAGEM_ORIGEM_FINANCEIRA);
    }

    const movimento = await this.prisma.movimentoFinanceiro.create({
      data: {
        negocioId,
        tipo: dados.tipo,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        origemTipo: dados.origemTipo,
        origemId: dados.origemId,
        responsavelId: dados.responsavelId,
        dataMovimento: dados.dataMovimento ?? new Date(),
        metodoPagamento: dados.metodoPagamento,
        referenciaPagamento: dados.referenciaPagamento,
        comprovativoUrl: dados.comprovativoUrl,
        observacao: dados.observacao
      }
    });

    this.eventos?.emitir("FINANCAS_MOVIMENTO_CRIADO", {
      negocioId,
      movimentoId: movimento.id,
      tipo: dados.tipo,
      valor: dados.valor,
      origemTipo: dados.origemTipo,
      responsavelId: dados.responsavelId,
      descricao: dados.descricao
    });

    return movimento;
  }

  async listarMovimentos(
    negocioId: string,
    filtros?: { tipo?: string; categoriaId?: string; de?: Date; ate?: Date; limite?: number }
  ) {
    return this.prisma.movimentoFinanceiro.findMany({
      where: {
        negocioId,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
        ...(filtros?.de || filtros?.ate ? {
          dataMovimento: {
            ...(filtros?.de ? { gte: filtros.de } : {}),
            ...(filtros?.ate ? { lte: filtros.ate } : {})
          }
        } : {})
      },
      include: { categoria: { select: { id: true, nome: true, tipo: true, cor: true } } },
      orderBy: { dataMovimento: "desc" },
      take: filtros?.limite ?? 100
    });
  }

  // ── Reconciliação Bancária ───────────────────────────────────────────────

  async importarExtratoBancario(
    negocioId: string,
    dados: { nomeArquivo: string; formato: FormatoExtratoBancario; conteudo: string; criadoPorId?: string }
  ) {
    const linhas = this.parseExtratoBancario(dados.formato, dados.conteudo);
    if (linhas.length === 0) {
      throw new Error("RF-T043: O extracto bancário não contém movimentos válidos para importar.");
    }

    const sugestoesPorLinha = await this.sugerirConciliacoesExtrato(negocioId, linhas);

    const { importacao, movimentos } = await this.prisma.$transaction(async (tx) => {
      const importacaoCriada = await tx.importacaoExtratoBancario.create({
        data: {
          negocioId,
          nomeArquivo: dados.nomeArquivo,
          formato: dados.formato,
          totalLinhas: linhas.length,
          criadoPorId: dados.criadoPorId
        }
      });

      await tx.movimentoBancario.createMany({
        data: linhas.map((linha, indice) => ({
          negocioId,
          importacaoId: importacaoCriada.id,
          dataMovimento: linha.dataMovimento,
          descricao: linha.descricao,
          valor: linha.valor,
          tipo: linha.tipo,
          referencia: linha.referencia,
          sugestoesJson: JSON.stringify(sugestoesPorLinha[indice])
        }))
      });

      const movimentosCriados = await tx.movimentoBancario.findMany({
        where: { importacaoId: importacaoCriada.id },
        orderBy: [{ dataMovimento: "asc" }, { criadoEm: "asc" }]
      });

      return { importacao: importacaoCriada, movimentos: movimentosCriados };
    });

    return {
      importacao,
      movimentos,
      total: movimentos.length,
      pendentes: movimentos.filter((movimento) => movimento.estadoConciliacao === "PENDENTE").length,
      comSugestoes: movimentos.filter((movimento) => JSON.parse(movimento.sugestoesJson).length > 0).length
    };
  }

  async listarImportacoesExtratoBancario(negocioId: string, limite?: number) {
    return this.prisma.importacaoExtratoBancario.findMany({
      where: { negocioId },
      include: { _count: { select: { movimentos: true } } },
      orderBy: { criadoEm: "desc" },
      take: limite ?? 50
    });
  }

  async listarMovimentosBancarios(
    negocioId: string,
    filtros?: { estadoConciliacao?: EstadoConciliacaoBancaria; importacaoId?: string; limite?: number }
  ) {
    return this.prisma.movimentoBancario.findMany({
      where: {
        negocioId,
        ...(filtros?.estadoConciliacao ? { estadoConciliacao: filtros.estadoConciliacao } : {}),
        ...(filtros?.importacaoId ? { importacaoId: filtros.importacaoId } : {})
      },
      include: {
        movimentoFinanceiro: {
          select: { id: true, descricao: true, valor: true, tipo: true, dataMovimento: true, origemTipo: true }
        }
      },
      orderBy: [{ dataMovimento: "desc" }, { criadoEm: "desc" }],
      take: filtros?.limite ?? 200
    });
  }

  async conciliarMovimentoBancario(
    negocioId: string,
    movimentoBancarioId: string,
    movimentoFinanceiroId: string
  ) {
    const movimentoBancario = await this.prisma.movimentoBancario.findFirst({
      where: { id: movimentoBancarioId, negocioId }
    });
    if (!movimentoBancario) {
      throw new Error("RF-T045: Movimento bancário não encontrado para este negócio.");
    }
    if (movimentoBancario.estadoConciliacao === "CONCILIADO") {
      throw new Error("RF-T045: Movimento bancário já está reconciliado.");
    }

    const movimentoFinanceiro = await this.prisma.movimentoFinanceiro.findFirst({
      where: { id: movimentoFinanceiroId, negocioId }
    });
    if (!movimentoFinanceiro) {
      throw new Error("RF-T045: Movimento financeiro interno não encontrado para este negócio.");
    }
    if (movimentoFinanceiro.reconciliado) {
      throw new Error("RF-T045: Movimento financeiro interno já está reconciliado.");
    }

    const tipoEsperado = movimentoBancario.tipo === "CREDITO" ? "ENTRADA" : "SAIDA";
    if (movimentoFinanceiro.tipo !== tipoEsperado) {
      throw new Error("RF-T044: O tipo do movimento bancário não corresponde ao movimento financeiro interno.");
    }
    if (movimentoFinanceiro.valor !== movimentoBancario.valor) {
      throw new Error("RF-T044: O valor do movimento bancário não corresponde ao movimento financeiro interno.");
    }

    const [bancario, financeiro] = await this.prisma.$transaction([
      this.prisma.movimentoBancario.update({
        where: { id: movimentoBancario.id },
        data: {
          estadoConciliacao: "CONCILIADO",
          movimentoFinanceiroId: movimentoFinanceiro.id,
          conciliadoEm: new Date()
        },
        include: {
          movimentoFinanceiro: {
            select: { id: true, descricao: true, valor: true, tipo: true, dataMovimento: true, origemTipo: true }
          }
        }
      }),
      this.prisma.movimentoFinanceiro.update({
        where: { id: movimentoFinanceiro.id },
        data: { reconciliado: true }
      })
    ]);

    return { movimentoBancario: bancario, movimentoFinanceiro: financeiro };
  }

  async ignorarMovimentoBancario(negocioId: string, movimentoBancarioId: string) {
    const movimentoBancario = await this.prisma.movimentoBancario.findFirst({
      where: { id: movimentoBancarioId, negocioId }
    });
    if (!movimentoBancario) {
      throw new Error("RF-T045: Movimento bancário não encontrado para este negócio.");
    }
    if (movimentoBancario.estadoConciliacao === "CONCILIADO") {
      throw new Error("RF-T045: Movimento já reconciliado não pode ser ignorado.");
    }

    return this.prisma.movimentoBancario.update({
      where: { id: movimentoBancario.id },
      data: { estadoConciliacao: "IGNORADO" }
    });
  }

  private async sugerirConciliacoesExtrato(negocioId: string, linhas: LinhaExtratoBancario[]) {
    const candidatos = await this.buscarCandidatosConciliacaoEmLote(negocioId, linhas);
    const candidatosPorChave = new Map<string, MovimentoFinanceiroSugestao[]>();

    for (const candidato of candidatos) {
      const chave = this.chaveCandidatoConciliacao(candidato.tipo, candidato.valor);
      const lista = candidatosPorChave.get(chave) ?? [];
      lista.push(candidato);
      candidatosPorChave.set(chave, lista);
    }

    return linhas.map((linha) => {
      const tipoInterno = linha.tipo === "CREDITO" ? "ENTRADA" : "SAIDA";
      const candidatosDaLinha = candidatosPorChave.get(this.chaveCandidatoConciliacao(tipoInterno, linha.valor)) ?? [];
      return this.montarSugestoesConciliacao(linha, candidatosDaLinha);
    });
  }

  private montarSugestoesConciliacao(linha: LinhaExtratoBancario, candidatos: MovimentoFinanceiroSugestao[]) {
    return candidatos
      .filter((candidato) => Math.abs(candidato.dataMovimento.getTime() - linha.dataMovimento.getTime()) <= JANELA_CONCILIACAO_MS)
      .map((candidato) => ({
        movimentoFinanceiroId: candidato.id,
        descricao: candidato.descricao,
        valor: candidato.valor,
        tipo: candidato.tipo,
        origemTipo: candidato.origemTipo,
        origemId: candidato.origemId,
        dataMovimento: candidato.dataMovimento.toISOString(),
        pontuacao: this.calcularPontuacaoConciliacao(linha, candidato)
      }))
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, 5);
  }

  private async buscarCandidatosConciliacaoEmLote(negocioId: string, linhas: LinhaExtratoBancario[]) {
    if (linhas.length === 0) return [];

    const datas = linhas.map((linha) => linha.dataMovimento.getTime());
    const inicio = new Date(Math.min(...datas) - JANELA_CONCILIACAO_MS);
    const fim = new Date(Math.max(...datas) + JANELA_CONCILIACAO_MS);
    const valoresPorTipo = {
      ENTRADA: [...new Set(linhas.filter((linha) => linha.tipo === "CREDITO").map((linha) => linha.valor))],
      SAIDA: [...new Set(linhas.filter((linha) => linha.tipo === "DEBITO").map((linha) => linha.valor))]
    };

    const consultas: Array<Promise<MovimentoFinanceiroSugestao[]>> = [];
    for (const [tipo, valores] of Object.entries(valoresPorTipo)) {
      for (const chunk of this.dividirEmChunks(valores, TAMANHO_CHUNK_VALORES_CONCILIACAO)) {
        if (chunk.length === 0) continue;
        consultas.push(this.prisma.movimentoFinanceiro.findMany({
          where: {
            negocioId,
            tipo,
            valor: { in: chunk },
            reconciliado: false,
            dataMovimento: { gte: inicio, lte: fim }
          },
          select: {
            id: true,
            descricao: true,
            valor: true,
            tipo: true,
            dataMovimento: true,
            origemTipo: true,
            origemId: true
          },
          orderBy: [{ dataMovimento: "desc" }, { criadoEm: "desc" }]
        }));
      }
    }

    const resultados = await Promise.all(consultas);
    return resultados.flat();
  }

  private chaveCandidatoConciliacao(tipo: string, valor: number) {
    return `${tipo}:${valor}`;
  }

  private dividirEmChunks<T>(itens: T[], tamanho: number) {
    const chunks: T[][] = [];
    for (let indice = 0; indice < itens.length; indice += tamanho) {
      chunks.push(itens.slice(indice, indice + tamanho));
    }
    return chunks;
  }

  private calcularPontuacaoConciliacao(linha: LinhaExtratoBancario, candidato: MovimentoFinanceiroSugestao) {
    let pontuacao = 60; // Valor e tipo já foram filtrados de forma exacta.
    const diferencaDias = Math.abs(
      linha.dataMovimento.getTime() - candidato.dataMovimento.getTime()
    ) / (24 * 60 * 60 * 1000);

    if (diferencaDias < 0.5) pontuacao += 20;
    else if (diferencaDias <= 1) pontuacao += 15;
    else if (diferencaDias <= 3) pontuacao += 8;

    const descricaoBanco = this.tokenizarTexto(linha.descricao);
    const descricaoInterna = this.tokenizarTexto(candidato.descricao);
    const comuns = [...descricaoBanco].filter((token) => descricaoInterna.has(token)).length;
    pontuacao += Math.min(15, comuns * 5);

    if (linha.referencia && this.normalizarTexto(candidato.descricao).includes(this.normalizarTexto(linha.referencia))) {
      pontuacao += 5;
    }

    return Math.min(100, pontuacao);
  }

  private parseExtratoBancario(formato: FormatoExtratoBancario, conteudo: string): LinhaExtratoBancario[] {
    if (formato === "OFX") return this.parseExtratoOfx(conteudo);
    return this.parseExtratoCsv(conteudo);
  }

  private parseExtratoCsv(conteudo: string): LinhaExtratoBancario[] {
    return parseCsv(conteudo).map((linha) => {
      const dataTexto = this.obterCampo(linha.dados, ["data_movimento", "data", "date", "dtposted"]);
      if (!dataTexto) throw new Error(`RF-T043: Linha ${linha.numero} sem data de movimento.`);

      const valorCredito = this.obterValorMonetario(linha.dados, ["credito", "credit", "entrada", "deposito"]);
      const valorDebito = this.obterValorMonetario(linha.dados, ["debito", "debit", "saida", "levantamento"]);
      const valorPrincipal = this.obterValorMonetario(linha.dados, ["valor", "amount", "montante", "quantia", "trnamt"]);
      const tipoTexto = this.obterCampo(linha.dados, ["tipo", "type", "trntype"]);

      let valor: number | undefined;
      let tipo: TipoMovimentoBancario | undefined = this.parseTipoMovimentoBancario(tipoTexto);

      if (valorCredito !== undefined && valorCredito > 0) {
        valor = valorCredito;
        tipo = "CREDITO";
      } else if (valorDebito !== undefined && valorDebito > 0) {
        valor = valorDebito;
        tipo = "DEBITO";
      } else if (valorPrincipal !== undefined) {
        valor = Math.abs(valorPrincipal);
        tipo = tipo ?? (valorPrincipal < 0 ? "DEBITO" : "CREDITO");
      }

      if (valor === undefined || valor <= 0 || !tipo) {
        throw new Error(`RF-T043: Linha ${linha.numero} sem valor/tipo bancário válido.`);
      }

      return {
        dataMovimento: this.parseDataMovimento(dataTexto, `linha ${linha.numero}`),
        descricao: this.obterCampo(linha.dados, ["descricao", "description", "historico", "memo", "name"]) ?? "Movimento bancário",
        valor,
        tipo,
        referencia: this.obterCampo(linha.dados, ["referencia", "reference", "fitid", "documento"]) ?? null,
        linha: linha.numero
      };
    });
  }

  private parseExtratoOfx(conteudo: string): LinhaExtratoBancario[] {
    const blocos = [...conteudo.matchAll(/<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi)];

    return blocos.map((bloco, indice) => {
      const corpo = bloco[1] ?? "";
      const valorBruto = this.extrairTagOfx(corpo, "TRNAMT");
      const dataTexto = this.extrairTagOfx(corpo, "DTPOSTED");
      const valorNumerico = this.converterValorMonetario(valorBruto);
      const tipoOfx = this.parseTipoMovimentoBancario(this.extrairTagOfx(corpo, "TRNTYPE"));

      if (!dataTexto || valorNumerico === undefined || valorNumerico === 0) {
        throw new Error(`RF-T043: Transacção OFX ${indice + 1} sem data ou valor válido.`);
      }

      const descricao =
        this.extrairTagOfx(corpo, "NAME") ??
        this.extrairTagOfx(corpo, "MEMO") ??
        "Movimento bancário";

      return {
        dataMovimento: this.parseDataMovimento(dataTexto, `transacção OFX ${indice + 1}`),
        descricao,
        valor: Math.abs(valorNumerico),
        tipo: tipoOfx ?? (valorNumerico < 0 ? "DEBITO" : "CREDITO"),
        referencia: this.extrairTagOfx(corpo, "FITID") ?? null,
        linha: indice + 1
      };
    });
  }

  private obterCampo(dados: Record<string, string>, aliases: string[]) {
    for (const alias of aliases) {
      const valor = dados[alias]?.trim();
      if (valor) return valor;
    }
    return undefined;
  }

  private obterValorMonetario(dados: Record<string, string>, aliases: string[]) {
    const valor = this.obterCampo(dados, aliases);
    return this.converterValorMonetario(valor);
  }

  private converterValorMonetario(valor?: string | null) {
    if (!valor) return undefined;
    let normalizado = valor.trim().replace(/\s+/g, "").replace(/[^\d,.-]/g, "");
    if (!normalizado || normalizado === "-") return undefined;

    const ultimaVirgula = normalizado.lastIndexOf(",");
    const ultimoPonto = normalizado.lastIndexOf(".");
    if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
      normalizado = ultimaVirgula > ultimoPonto
        ? normalizado.replace(/\./g, "").replace(",", ".")
        : normalizado.replace(/,/g, "");
    } else if (ultimaVirgula >= 0) {
      normalizado = normalizado.replace(",", ".");
    } else if (ultimoPonto >= 0) {
      const decimais = normalizado.length - ultimoPonto - 1;
      if (decimais > 2) normalizado = normalizado.replace(/\./g, "");
    }

    const numero = Number(normalizado);
    return Number.isFinite(numero) ? Math.trunc(numero) : undefined;
  }

  private parseTipoMovimentoBancario(valor?: string | null): TipoMovimentoBancario | undefined {
    const normalizado = this.normalizarTexto(valor ?? "");
    if (!normalizado) return undefined;
    if (
      normalizado === "c" ||
      ["credito", "credit", "entrada", "deposit", "deposito"].some((token) => normalizado.includes(token))
    ) {
      return "CREDITO";
    }
    if (
      normalizado === "d" ||
      ["debito", "debit", "saida", "withdrawal", "levantamento"].some((token) => normalizado.includes(token))
    ) {
      return "DEBITO";
    }
    return undefined;
  }

  private parseDataMovimento(valor: string, contexto: string) {
    const texto = valor.trim();
    let data: Date;

    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      data = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00.000Z`);
    } else {
      const ofx = texto.match(/^(\d{4})(\d{2})(\d{2})/);
      const pt = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
      if (ofx) data = new Date(Date.UTC(Number(ofx[1]), Number(ofx[2]) - 1, Number(ofx[3])));
      else if (pt) data = new Date(Date.UTC(Number(pt[3]), Number(pt[2]) - 1, Number(pt[1])));
      else data = new Date(texto);
    }

    if (Number.isNaN(data.getTime())) {
      throw new Error(`RF-T043: Data inválida no extracto bancário (${contexto}).`);
    }

    return data;
  }

  private extrairTagOfx(conteudo: string, tag: string) {
    return conteudo.match(new RegExp(`<${tag}>([^\\r\\n<]+)`, "i"))?.[1]?.trim();
  }

  private tokenizarTexto(valor: string) {
    return new Set(
      this.normalizarTexto(valor)
        .split(/\s+/)
        .filter((token) => token.length >= 3)
    );
  }

  private normalizarTexto(valor: string) {
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  // ── Fluxo de Caixa e DRE ─────────────────────────────────────────────────

  async obterFluxoCaixa(negocioId: string, de: Date, ate: Date) {
    const where = { negocioId, dataMovimento: { gte: de, lte: ate } };
    const [totaisPorTipo, porDiaBruto, porCategoriaBruto] = await Promise.all([
      this.prisma.movimentoFinanceiro.groupBy({
        by: ["tipo"],
        where,
        _sum: { valor: true }
      }),
      this.prisma.$queryRaw<Array<{ dia: Date | string; tipo: string; total: bigint | number }>>`
        SELECT DATE("dataMovimento") AS dia, "tipo", COALESCE(SUM("valor"), 0)::bigint AS total
        FROM "MovimentoFinanceiro"
        WHERE "negocioId" = ${negocioId}
          AND "dataMovimento" >= ${de}
          AND "dataMovimento" <= ${ate}
        GROUP BY DATE("dataMovimento"), "tipo"
        ORDER BY dia ASC
      `,
      this.prisma.movimentoFinanceiro.groupBy({
        by: ["categoriaId", "tipo"],
        where,
        _sum: { valor: true }
      })
    ]);

    const totalEntradas = this.somarGrupoFinanceiro(totaisPorTipo, "ENTRADA");
    const totalSaidas = this.somarGrupoFinanceiro(totaisPorTipo, "SAIDA");
    const saldo = totalEntradas - totalSaidas;
    const categorias = await this.prisma.categoriaFinanceira.findMany({
      where: {
        negocioId,
        id: { in: porCategoriaBruto.map((grupo) => grupo.categoriaId).filter((id): id is string => Boolean(id)) }
      },
      select: { id: true, nome: true, tipo: true }
    });
    const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id, categoria]));
    const porDia = this.normalizarFluxoPorDia(porDiaBruto);
    const porCategoria = porCategoriaBruto.map((grupo) => {
      const categoria = grupo.categoriaId ? categoriasPorId.get(grupo.categoriaId) : null;
      return {
        categoria: categoria?.nome ?? "Sem categoria",
        tipo: categoria?.tipo ?? grupo.tipo,
        total: Number(grupo._sum.valor ?? 0)
      };
    });

    return {
      saldo,
      totalEntradas,
      totalSaidas,
      periodo: { de, ate },
      porDia,
      porCategoria
    };
  }

  async obterDRE(negocioId: string, mes: number, ano: number) {
    const de = new Date(ano, mes - 1, 1);
    const ate = new Date(ano, mes, 0, 23, 59, 59);

    const movimentosPorCategoria = await this.prisma.movimentoFinanceiro.groupBy({
      by: ["categoriaId", "tipo"],
      where: { negocioId, dataMovimento: { gte: de, lte: ate } },
      _sum: { valor: true }
    });
    const categorias = await this.prisma.categoriaFinanceira.findMany({
      where: {
        negocioId,
        id: { in: movimentosPorCategoria.map((grupo) => grupo.categoriaId).filter((id): id is string => Boolean(id)) }
      },
      select: { id: true, nome: true, tipo: true }
    });
    const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id, categoria]));

    let receitaBruta = 0;
    let custosVariaveis = 0;
    let custosFixos = 0;
    let totalSaidas = 0;
    for (const grupo of movimentosPorCategoria) {
      const valor = Number(grupo._sum.valor ?? 0);
      if (grupo.tipo === "ENTRADA") {
        receitaBruta += valor;
        continue;
      }
      totalSaidas += valor;
      const categoriaNome = grupo.categoriaId ? categoriasPorId.get(grupo.categoriaId)?.nome ?? "" : "";
      if (["Fornecedores", "Logística/Entregas", "Comissões pagas"].includes(categoriaNome)) {
        custosVariaveis += valor;
      } else if (["Salários", "Aluguer", "Taxas e impostos"].includes(categoriaNome)) {
        custosFixos += valor;
      }
    }

    const outrosCustos = totalSaidas - custosVariaveis - custosFixos;
    const margemContribuicao = receitaBruta - custosVariaveis;
    const resultadoOperacional = margemContribuicao - custosFixos - outrosCustos;

    return {
      periodo: { mes, ano },
      receitaBruta,
      custosVariaveis,
      margemContribuicao,
      custosFixos,
      outrosCustos,
      resultadoOperacional
    };
  }

  private somarGrupoFinanceiro(grupos: Array<{ tipo: string; _sum: { valor: number | null } }>, tipo: string) {
    return Number(grupos.find((grupo) => grupo.tipo === tipo)?._sum.valor ?? 0);
  }

  private normalizarFluxoPorDia(linhas: Array<{ dia: Date | string; tipo: string; total: bigint | number }>) {
    const porDia = new Map<string, { entradas: number; saidas: number }>();
    for (const linha of linhas) {
      const dia = linha.dia instanceof Date
        ? linha.dia.toISOString().slice(0, 10)
        : String(linha.dia).slice(0, 10);
      const actual = porDia.get(dia) ?? { entradas: 0, saidas: 0 };
      const total = Number(linha.total);
      if (linha.tipo === "ENTRADA") actual.entradas += total;
      else actual.saidas += total;
      porDia.set(dia, actual);
    }
    return [...porDia.entries()].map(([dia, valores]) => ({ dia, ...valores }));
  }

  // ── Despesas ──────────────────────────────────────────────────────────────

  async criarDespesa(
    negocioId: string,
    dados: {
      categoriaId?: string;
      descricao: string;
      valor: number;
      tipoRecorrencia?: string;
      fornecedor?: string;
      comprovativoUrl?: string;
      dataVencimento?: Date;
      observacao?: string;
    }
  ) {
    const despesa = await this.prisma.despesa.create({
      data: {
        negocioId,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        tipoRecorrencia: dados.tipoRecorrencia ?? "UNICA",
        fornecedor: dados.fornecedor,
        comprovativoUrl: dados.comprovativoUrl,
        dataVencimento: dados.dataVencimento,
        observacao: dados.observacao
      }
    });

    // registar movimento de saída
    await this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      categoriaId: dados.categoriaId,
      descricao: dados.descricao,
      valor: dados.valor,
      origemTipo: "DESPESA",
      origemId: despesa.id
    });

    this.eventos?.emitir("FINANCAS_DESPESA_CRIADA", {
      negocioId,
      despesaId: despesa.id,
      valor: dados.valor,
      descricao: dados.descricao
    });

    return despesa;
  }

  async listarDespesas(
    negocioId: string,
    filtros?: { pago?: boolean; categoriaId?: string; limite?: number }
  ) {
    return this.prisma.despesa.findMany({
      where: {
        negocioId,
        ...(filtros?.pago !== undefined ? { pago: filtros.pago } : {}),
        ...(filtros?.categoriaId ? { categoriaId: filtros.categoriaId } : {})
      },
      include: { categoria: { select: { id: true, nome: true, cor: true } } },
      orderBy: { dataVencimento: "asc" },
      take: filtros?.limite ?? 100
    });
  }

  async marcarDespesaPaga(
    id: string,
    negocioId: string,
    dados: { metodoPagamento?: string; referenciaPagamento?: string; comprovativoUrl?: string; observacao?: string } = {}
  ) {
    const despesa = await this.prisma.despesa.update({
      where: { id, negocioId },
      data: {
        pago: true,
        pagoEm: new Date(),
        metodoPagamento: dados.metodoPagamento,
        referenciaPagamento: dados.referenciaPagamento,
        comprovativoUrl: dados.comprovativoUrl,
        observacao: dados.observacao ?? undefined
      }
    });

    this.eventos?.emitir("FINANCAS_DESPESA_PAGA", {
      negocioId,
      despesaId: id,
      valor: despesa.valor
    });

    return despesa;
  }

  // ── Contas a Receber ──────────────────────────────────────────────────────

  async criarContaReceber(
    negocioId: string,
    dados: {
      clienteId?: string;
      pedidoId?: string;
      descricao: string;
      valor: number;
      dataVencimento: Date;
      facturaId?: string;
      observacao?: string;
    }
  ) {
    return this.prisma.contaReceber.create({
      data: {
        negocioId,
        clienteId: dados.clienteId,
        pedidoId: dados.pedidoId,
        facturaId: dados.facturaId,
        descricao: dados.descricao,
        valor: dados.valor,
        dataVencimento: dados.dataVencimento,
        observacao: dados.observacao
      }
    });
  }

  async listarContasReceber(
    negocioId: string,
    filtros?: { estado?: string; limite?: number }
  ) {
    return this.prisma.contaReceber.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {})
      },
      orderBy: { dataVencimento: "asc" },
      take: filtros?.limite ?? 100
    });
  }

  async obterAgingReceber(negocioId: string) {
    const agora = new Date();
    const contas = await this.prisma.contaReceber.findMany({
      where: { negocioId, estado: { not: "PAGO" } }
    });

    const aging = { aVencer: 0, vencido1a30: 0, vencido31a60: 0, vencido61a90: 0, vencidoMais90: 0 };
    for (const c of contas) {
      const dias = Math.floor((agora.getTime() - c.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
      if (dias < 0) aging.aVencer += c.valor;
      else if (dias <= 30) aging.vencido1a30 += c.valor;
      else if (dias <= 60) aging.vencido31a60 += c.valor;
      else if (dias <= 90) aging.vencido61a90 += c.valor;
      else aging.vencidoMais90 += c.valor;
    }

    return aging;
  }

  async receberPagamento(
    id: string,
    negocioId: string,
    dados: {
      valorPago?: number;
      metodoPagamento?: string;
      referenciaPagamento?: string;
      comprovativoUrl?: string;
      observacao?: string;
    }
  ) {
    const contaOriginal = await this.prisma.contaReceber.findFirstOrThrow({
      where: { id, negocioId }
    });
    const valorRecebido = dados.valorPago ?? Math.max(0, contaOriginal.valor - (contaOriginal.valorPago ?? 0));
    const valorPago = Math.min(contaOriginal.valor, (contaOriginal.valorPago ?? 0) + valorRecebido);
    const conta = await this.prisma.contaReceber.update({
      where: { id, negocioId },
      data: {
        estado: valorPago >= contaOriginal.valor ? "PAGO" : "A_VENCER",
        pagoEm: valorPago >= contaOriginal.valor ? new Date() : null,
        valorPago,
        metodoPagamento: dados.metodoPagamento,
        referenciaPagamento: dados.referenciaPagamento,
        comprovativoPagamentoUrl: dados.comprovativoUrl,
        observacao: dados.observacao ?? undefined
      }
    });

    await this.registarMovimento(negocioId, {
      tipo: "ENTRADA",
      descricao: `Recebimento: ${conta.descricao}`,
      valor: valorRecebido,
      origemTipo: "CONTA_RECEBER",
      origemId: id,
      metodoPagamento: dados.metodoPagamento,
      referenciaPagamento: dados.referenciaPagamento,
      comprovativoUrl: dados.comprovativoUrl,
      observacao: dados.observacao
    });

    if (conta.facturaId) {
      await this.marcarFacturaPagaPorRecebimento(conta.facturaId, negocioId, {
        valorPago: valorRecebido,
        metodoPagamento: dados.metodoPagamento,
        referenciaPagamento: dados.referenciaPagamento,
        comprovativoUrl: dados.comprovativoUrl
      });
    }

    this.eventos?.emitir("FINANCAS_CONTA_RECEBIDA", {
      negocioId,
      contaId: id,
      valorPago
    });

    return conta;
  }

  // ── Contas a Pagar ────────────────────────────────────────────────────────

  async criarContaPagar(
    negocioId: string,
    dados: {
      fornecedor: string;
      descricao: string;
      valor: number;
      dataVencimento: Date;
      observacao?: string;
    }
  ) {
    return this.prisma.contaPagar.create({
      data: { negocioId, ...dados }
    });
  }

  async listarContasPagar(
    negocioId: string,
    filtros?: { estado?: string; limite?: number }
  ) {
    return this.prisma.contaPagar.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {})
      },
      orderBy: { dataVencimento: "asc" },
      take: filtros?.limite ?? 100
    });
  }

  async pagarConta(
    id: string,
    negocioId: string,
    dados: { metodoPagamento?: string; referenciaPagamento?: string; comprovativoUrl?: string; observacao?: string } = {}
  ) {
    const conta = await this.prisma.contaPagar.update({
      where: { id, negocioId },
      data: {
        estado: "PAGO",
        pagoEm: new Date(),
        metodoPagamento: dados.metodoPagamento,
        referenciaPagamento: dados.referenciaPagamento,
        comprovativoPagamentoUrl: dados.comprovativoUrl,
        observacao: dados.observacao ?? undefined
      }
    });

    await this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      descricao: `Pagamento: ${conta.descricao} — ${conta.fornecedor}`,
      valor: conta.valor,
      origemTipo: "CONTA_PAGAR",
      origemId: id,
      metodoPagamento: dados.metodoPagamento,
      referenciaPagamento: dados.referenciaPagamento,
      comprovativoUrl: dados.comprovativoUrl,
      observacao: dados.observacao
    });

    this.eventos?.emitir("FINANCAS_CONTA_PAGA", {
      negocioId,
      contaId: id,
      valor: conta.valor,
      fornecedor: conta.fornecedor
    });

    return conta;
  }

  // ── Facturação ────────────────────────────────────────────────────────────

  async emitirFactura(
    negocioId: string,
    dados: {
      clienteNome: string;
      clienteNif?: string;
      clienteEndereco?: string;
      pedidoId?: string;
      movimentoOrigemId?: string;
      tipoDocumento?: "FACTURA" | "FACTURA_RECIBO";
      serie?: string;
      ivaPercentual?: number;
      dataVencimento?: Date;
      metodoPagamento?: string;
      referenciaPagamento?: string;
      comprovativoUrl?: string;
      observacao?: string;
      itens: { descricao: string; quantidade: number; precoUnitario: number }[];
    }
  ) {
    const movimentoOrigem = dados.movimentoOrigemId
      ? await this.prisma.movimentoFinanceiro.findFirst({ where: { id: dados.movimentoOrigemId, negocioId } })
      : null;
    if (dados.movimentoOrigemId && !movimentoOrigem) {
      throw new Error("Movimento financeiro de origem não encontrado para relacionar com a factura.");
    }
    if (movimentoOrigem && movimentoOrigem.tipo !== "ENTRADA") {
      throw new Error("Apenas movimentos de entrada podem ser relacionados com factura-recibo.");
    }
    if (movimentoOrigem?.origemTipo === "RECIBO" && movimentoOrigem.origemId) {
      throw new Error("Este movimento já está relacionado com uma factura-recibo.");
    }

    if (dados.pedidoId) {
      const facturaExistente = await this.prisma.factura.findFirst({
        where: { negocioId, pedidoId: dados.pedidoId },
        include: { itens: true }
      });

      if (facturaExistente) {
        return facturaExistente;
      }
    }

    const tipoDocumento = dados.tipoDocumento ?? "FACTURA";
    const serie = dados.serie ?? (tipoDocumento === "FACTURA_RECIBO" ? "FR" : "FT");
    const anoFiscal = new Date().getFullYear();
    const ivaPerc = dados.ivaPercentual ?? 14;

    // próximo número na série
    const ultima = await this.prisma.factura.findFirst({
      where: { negocioId, serie, anoFiscal },
      orderBy: { numero: "desc" },
      select: { numero: true }
    });
    const numero = (ultima?.numero ?? 0) + 1;

    // calcular totais
    const itensCalc = dados.itens.map((item) => {
      const subtotal = item.quantidade * item.precoUnitario;
      const ivaValor = Math.round(subtotal * (ivaPerc / 100));
      return { ...item, subtotal, ivaPercentual: ivaPerc, ivaValor };
    });

    const subtotal = itensCalc.reduce((s, i) => s + i.subtotal, 0);
    const ivaValor = itensCalc.reduce((s, i) => s + i.ivaValor, 0);
    const total = subtotal + ivaValor;
    if (movimentoOrigem && tipoDocumento !== "FACTURA_RECIBO") {
      throw new Error("Movimento financeiro só pode ser relacionado diretamente com factura-recibo.");
    }
    if (movimentoOrigem && movimentoOrigem.valor !== total) {
      throw new Error("O valor do movimento deve coincidir com o total da factura-recibo para evitar divergência no caixa.");
    }
    const dataVencimento = dados.dataVencimento ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const emitidaEm = new Date();
    const codigoValidacao = gerarCodigoValidacaoDocumento(negocioId, serie, numero, anoFiscal, total);
    const hashDocumento = gerarHashDocumento({
      negocioId,
      serie,
      numero,
      anoFiscal,
      total,
      clienteNome: dados.clienteNome,
      emitidaEm
    });
    const qrCode = gerarPayloadQrDocumento({
      tipoDocumento,
      serie,
      numero,
      anoFiscal,
      codigoValidacao,
      total
    });

    const factura = await this.prisma.factura.create({
      data: {
        negocioId,
        pedidoId: dados.pedidoId,
        clienteNome: dados.clienteNome,
        clienteNif: dados.clienteNif,
        clienteEndereco: dados.clienteEndereco,
        tipoDocumento,
        serie,
        numero,
        anoFiscal,
        estadoPagamento: tipoDocumento === "FACTURA_RECIBO" ? "PAGO" : "PENDENTE",
        subtotal,
        ivaPercentual: ivaPerc,
        ivaValor,
        total,
        valorPago: tipoDocumento === "FACTURA_RECIBO" ? total : 0,
        dataVencimento: tipoDocumento === "FACTURA_RECIBO" ? emitidaEm : dataVencimento,
        pagoEm: tipoDocumento === "FACTURA_RECIBO" ? emitidaEm : undefined,
        metodoPagamento: tipoDocumento === "FACTURA_RECIBO" ? dados.metodoPagamento ?? movimentoOrigem?.metodoPagamento ?? undefined : undefined,
        referenciaPagamento: tipoDocumento === "FACTURA_RECIBO" ? dados.referenciaPagamento ?? movimentoOrigem?.referenciaPagamento ?? undefined : undefined,
        comprovativoPagamentoUrl: tipoDocumento === "FACTURA_RECIBO" ? dados.comprovativoUrl ?? movimentoOrigem?.comprovativoUrl ?? undefined : undefined,
        codigoValidacao,
        qrCode,
        hashDocumento,
        observacao: dados.observacao,
        emitidaEm,
        itens: { create: itensCalc.map((i) => ({
          descricao: i.descricao,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          subtotal: i.subtotal,
          ivaPercentual: i.ivaPercentual,
          ivaValor: i.ivaValor
        })) }
      },
      include: { itens: true }
    });

    if (tipoDocumento === "FACTURA_RECIBO") {
      if (movimentoOrigem) {
        await this.prisma.movimentoFinanceiro.update({
          where: { id: movimentoOrigem.id },
          data: {
            origemTipo: "RECIBO",
            origemId: factura.id,
            metodoPagamento: dados.metodoPagamento ?? movimentoOrigem.metodoPagamento,
            referenciaPagamento: dados.referenciaPagamento ?? movimentoOrigem.referenciaPagamento,
            comprovativoUrl: dados.comprovativoUrl ?? movimentoOrigem.comprovativoUrl,
            observacao: dados.observacao ?? movimentoOrigem.observacao
          }
        });
      } else {
        await this.registarMovimento(negocioId, {
          tipo: "ENTRADA",
          descricao: `Factura-recibo ${serie} ${String(numero).padStart(4, "0")}/${anoFiscal}`,
          valor: total,
          origemTipo: "RECIBO",
          origemId: factura.id,
          metodoPagamento: dados.metodoPagamento,
          referenciaPagamento: dados.referenciaPagamento,
          comprovativoUrl: dados.comprovativoUrl
        });
      }
    } else {
      await this.criarContaReceber(negocioId, {
        pedidoId: dados.pedidoId,
        facturaId: factura.id,
        descricao: `Factura ${serie} ${String(numero).padStart(4, "0")}/${anoFiscal} — ${dados.clienteNome}`,
        valor: total,
        dataVencimento,
        observacao: "Gerado automaticamente pela emissão da factura."
      });
    }

    this.eventos?.emitir("FINANCAS_FACTURA_EMITIDA", {
      negocioId,
      facturaId: factura.id,
      serie,
      numero,
      total,
      clienteNome: dados.clienteNome
    });

    return factura;
  }

  async listarFacturas(
    negocioId: string,
    filtros?: { estado?: string; de?: Date; ate?: Date; limite?: number; pedidoId?: string }
  ) {
    return this.prisma.factura.findMany({
      where: {
        negocioId,
        ...(filtros?.estado ? { estado: filtros.estado } : {}),
        ...(filtros?.pedidoId ? { pedidoId: filtros.pedidoId } : {}),
        ...(filtros?.de || filtros?.ate ? {
          emitidaEm: {
            ...(filtros?.de ? { gte: filtros.de } : {}),
            ...(filtros?.ate ? { lte: filtros.ate } : {})
          }
        } : {})
      },
      include: { itens: true, _count: { select: { notasCredito: true } } },
      orderBy: { emitidaEm: "desc" },
      take: filtros?.limite ?? 100
    });
  }

  async obterFactura(id: string, negocioId: string) {
    return this.prisma.factura.findFirst({
      where: { id, negocioId },
      include: { itens: true, notasCredito: true }
    });
  }

  async anularFactura(id: string, negocioId: string, motivo: string) {
    const actual = await this.prisma.factura.findFirstOrThrow({
      where: { id, negocioId },
      select: { estadoPagamento: true }
    });
    if (actual.estadoPagamento === "PAGO") {
      throw new Error("Factura paga não deve ser anulada directamente; emita uma nota de crédito para manter rasto contabilístico.");
    }

    const factura = await this.prisma.factura.update({
      where: { id, negocioId },
      data: { estado: "ANULADA", estadoPagamento: "PENDENTE", anuladaEm: new Date(), motivoAnulacao: motivo }
    });

    await this.prisma.contaReceber.updateMany({
      where: { negocioId, facturaId: id, estado: { not: "PAGO" } },
      data: { estado: "CANCELADO", observacao: `Cancelada pela anulação da factura: ${motivo}` }
    });

    this.eventos?.emitir("FINANCAS_FACTURA_ANULADA", {
      negocioId,
      facturaId: id,
      motivo
    });

    return factura;
  }

  async gerarPdfFactura(id: string, negocioId: string): Promise<Buffer> {
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { id, negocioId },
      include: { itens: true, negocio: true }
    });

    const dados: DadosFacturaPdf = {
      serie: factura.serie,
      numero: factura.numero,
      anoFiscal: factura.anoFiscal,
      tipoDocumento: factura.tipoDocumento,
      estado: factura.estado,
      estadoPagamento: factura.estadoPagamento,
      emitidaEm: factura.emitidaEm,
      dataVencimento: factura.dataVencimento,
      pagoEm: factura.pagoEm,
      nomeComercial: factura.negocio.nomeComercial,
      nif: factura.negocio.nif,
      telefone: factura.negocio.telefone,
      email: factura.negocio.email,
      endereco: factura.negocio.endereco,
      moeda: factura.negocio.moeda,
      clienteNome: factura.clienteNome,
      clienteNif: factura.clienteNif,
      clienteEndereco: factura.clienteEndereco,
      subtotal: factura.subtotal,
      ivaPercentual: factura.ivaPercentual,
      ivaValor: factura.ivaValor,
      total: factura.total,
      valorPago: factura.valorPago,
      metodoPagamento: factura.metodoPagamento,
      referenciaPagamento: factura.referenciaPagamento,
      codigoValidacao: factura.codigoValidacao,
      qrCode: factura.qrCode,
      hashDocumento: factura.hashDocumento,
      observacao: factura.observacao,
      itens: factura.itens.map((i) => ({
        descricao: i.descricao,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
        subtotal: i.subtotal,
        ivaPercentual: i.ivaPercentual,
        ivaValor: i.ivaValor
      }))
    };

    const html = buildFacturaHtml(dados);
    return renderPdfFromHtml(html, { footerLabel: factura.negocio.nomeComercial });
  }

  // ── Nota de Crédito ──────────────────────────────────────────────────────

  async emitirNotaCredito(
    negocioId: string,
    dados: { facturaId: string; motivo: string; valor: number }
  ) {
    const anoFiscal = new Date().getFullYear();
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { id: dados.facturaId, negocioId },
      include: { notasCredito: true }
    });
    if (factura.estado === "ANULADA") {
      throw new Error("Não é possível emitir nota de crédito para factura anulada.");
    }
    const creditoEmitido = factura.notasCredito
      .filter((nota) => nota.estado === "EMITIDA")
      .reduce((total, nota) => total + nota.valor, 0);
    const saldoCreditavel = factura.total - creditoEmitido;
    if (dados.valor > saldoCreditavel) {
      throw new Error("Valor da nota de crédito excede o saldo creditável da factura.");
    }

    const ultima = await this.prisma.notaCredito.findFirst({
      where: { negocioId, anoFiscal },
      orderBy: { numero: "desc" },
      select: { numero: true }
    });
    const numero = (ultima?.numero ?? 0) + 1;

    const nota = await this.prisma.notaCredito.create({
      data: {
        negocioId,
        facturaId: dados.facturaId,
        numero,
        anoFiscal,
        motivo: dados.motivo,
        valor: dados.valor
      }
    });

    await this.prisma.factura.update({
      where: { id: dados.facturaId, negocioId },
      data: { estado: dados.valor >= saldoCreditavel ? "CORRIGIDA" : "EMITIDA" }
    });

    // registar movimento de saída (devolução)
    await this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      descricao: `Nota crédito NC ${String(numero).padStart(4, "0")}/${anoFiscal}`,
      valor: dados.valor,
      origemTipo: "NOTA_CREDITO",
      origemId: nota.id
    });

    this.eventos?.emitir("FINANCAS_NOTA_CREDITO_EMITIDA", {
      negocioId,
      notaCreditoId: nota.id,
      facturaId: dados.facturaId,
      valor: dados.valor,
      motivo: dados.motivo
    });

    return nota;
  }

  // ── Orçamento ─────────────────────────────────────────────────────────────

  async definirOrcamento(
    negocioId: string,
    dados: { categoriaId: string; mes: number; ano: number; valorOrcado: number }
  ) {
    return this.prisma.orcamentoPeriodo.upsert({
      where: {
        negocioId_categoriaId_mes_ano: {
          negocioId,
          categoriaId: dados.categoriaId,
          mes: dados.mes,
          ano: dados.ano
        }
      },
      create: { negocioId, ...dados },
      update: { valorOrcado: dados.valorOrcado }
    });
  }

  async obterOrcadoVsRealizado(negocioId: string, mes: number, ano: number) {
    const de = new Date(ano, mes - 1, 1);
    const ate = new Date(ano, mes, 0, 23, 59, 59);

    const [orcamentos, movimentos] = await Promise.all([
      this.prisma.orcamentoPeriodo.findMany({
        where: { negocioId, mes, ano },
        include: { categoria: { select: { id: true, nome: true } } }
      }),
      this.prisma.movimentoFinanceiro.findMany({
        where: { negocioId, tipo: "SAIDA", dataMovimento: { gte: de, lte: ate }, categoriaId: { not: null } },
        select: { categoriaId: true, valor: true }
      })
    ]);

    const realizadoPorCategoria: Record<string, number> = {};
    for (const m of movimentos) {
      if (m.categoriaId) {
        realizadoPorCategoria[m.categoriaId] = (realizadoPorCategoria[m.categoriaId] ?? 0) + m.valor;
      }
    }

    return orcamentos.map((o) => {
      const realizado = realizadoPorCategoria[o.categoriaId] ?? 0;
      const variacao = o.valorOrcado > 0 ? Math.round((realizado / o.valorOrcado) * 100) : 0;
      return {
        categoriaId: o.categoriaId,
        categoria: o.categoria.nome,
        orcado: o.valorOrcado,
        realizado,
        variacao,
        alerta: variacao >= 100 ? "EXCEDIDO" : variacao >= 80 ? "ATENCAO" : "OK"
      };
    });
  }

  // ── Recibos de Pagamento (RF-T037) ───────────────────────────────────────

  async gerarReciboPagamento(
    negocioId: string,
    dados: {
      clienteNome: string;
      clienteNif?: string;
      valorPago: number;
      metodoPagamento?: string;
      referencia?: string;
      comprovativoUrl?: string;
      facturaId?: string;
      observacao?: string;
    }
  ) {
    const anoFiscal = new Date().getFullYear();

    // próximo número de recibo (baseado em movimentos de tipo RECIBO)
    const ultimoRecibo = await this.prisma.movimentoFinanceiro.findFirst({
      where: { negocioId, origemTipo: "RECIBO" },
      orderBy: { criadoEm: "desc" },
      select: { descricao: true }
    });
    const match = ultimoRecibo?.descricao.match(/RC (\d+)\//);
    const numero = match ? parseInt(match[1]) + 1 : 1;

    // buscar dados do negócio
    const negocio = await this.prisma.negocio.findUniqueOrThrow({
      where: { id: negocioId },
      select: { nomeComercial: true, nif: true, telefone: true, email: true, endereco: true, moeda: true }
    });

    // referência da factura se fornecida
    let facturaRef: string | undefined;
    if (dados.facturaId) {
      const factura = await this.prisma.factura.findFirst({
        where: { id: dados.facturaId, negocioId },
        select: { serie: true, numero: true, anoFiscal: true, total: true, valorPago: true, estadoPagamento: true }
      });
      if (factura) {
        const pendente = Math.max(0, factura.total - factura.valorPago);
        if (pendente <= 0 || factura.estadoPagamento === "PAGO") {
          throw new Error("Factura já está paga; não é possível gerar novo recibo para o mesmo documento.");
        }
        if (dados.valorPago > pendente) {
          throw new Error("Valor recebido excede o saldo pendente da factura.");
        }
        facturaRef = `${factura.serie} ${String(factura.numero).padStart(4, "0")}/${factura.anoFiscal}`;
      }
    }

    // registar movimento
    await this.registarMovimento(negocioId, {
      tipo: "ENTRADA",
      descricao: `RC ${String(numero).padStart(4, "0")}/${anoFiscal} — ${dados.clienteNome}`,
      valor: dados.valorPago,
      origemTipo: "RECIBO",
      origemId: dados.facturaId,
      metodoPagamento: dados.metodoPagamento,
      referenciaPagamento: dados.referencia,
      comprovativoUrl: dados.comprovativoUrl,
      observacao: dados.observacao
    });

    if (dados.facturaId) {
      await this.marcarFacturaPagaPorRecebimento(dados.facturaId, negocioId, {
        valorPago: dados.valorPago,
        metodoPagamento: dados.metodoPagamento,
        referenciaPagamento: dados.referencia,
        comprovativoUrl: dados.comprovativoUrl
      });
    }

    // gerar PDF
    const dadosPdf: DadosReciboPdf = {
      numero,
      anoFiscal,
      emitidoEm: new Date(),
      nomeComercial: negocio.nomeComercial,
      nif: negocio.nif,
      telefone: negocio.telefone,
      email: negocio.email,
      endereco: negocio.endereco,
      moeda: negocio.moeda,
      clienteNome: dados.clienteNome,
      clienteNif: dados.clienteNif,
      valorPago: dados.valorPago,
      metodoPagamento: dados.metodoPagamento,
      referencia: dados.referencia,
      comprovativoUrl: dados.comprovativoUrl,
      facturaRef,
      observacao: dados.observacao
    };

    const html = buildReciboHtml(dadosPdf);
    return {
      pdf: await renderPdfFromHtml(html, { footerLabel: negocio.nomeComercial }),
      numero,
      anoFiscal
    };
  }

  private async marcarFacturaPagaPorRecebimento(
    facturaId: string,
    negocioId: string,
    dados: {
      valorPago: number;
      metodoPagamento?: string;
      referenciaPagamento?: string;
      comprovativoUrl?: string;
    }
  ) {
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { id: facturaId, negocioId },
      select: { total: true, valorPago: true }
    });
    const valorPagoAcumulado = Math.min(factura.total, factura.valorPago + dados.valorPago);
    const estadoPagamento = valorPagoAcumulado >= factura.total
      ? "PAGO"
      : valorPagoAcumulado > 0
        ? "PARCIAL"
        : "PENDENTE";

    return this.prisma.factura.update({
      where: { id: facturaId, negocioId },
      data: {
        estadoPagamento,
        valorPago: valorPagoAcumulado,
        pagoEm: estadoPagamento === "PAGO" ? new Date() : null,
        metodoPagamento: dados.metodoPagamento,
        referenciaPagamento: dados.referenciaPagamento,
        comprovativoPagamentoUrl: dados.comprovativoUrl
      }
    });
  }

  // ── Despesas Recorrentes (RF-T025) ───────────────────────────────────────

  async processarDespesasRecorrentes(negocioId: string) {
    const agora = new Date();
    const despesasRecorrentes = await this.prisma.despesa.findMany({
      where: {
        negocioId,
        tipoRecorrencia: { in: ["MENSAL", "SEMANAL"] },
        pago: true
      },
      include: { categoria: { select: { id: true, nome: true } } }
    });

    let criadas = 0;

    for (const despesa of despesasRecorrentes) {
      const pagoEm = despesa.pagoEm ?? despesa.criadoEm;
      const diasDesde = Math.floor((agora.getTime() - pagoEm.getTime()) / (1000 * 60 * 60 * 24));

      const intervalo = despesa.tipoRecorrencia === "SEMANAL" ? 7 : 30;

      if (diasDesde >= intervalo) {
        // verificar se já existe despesa recente com mesma descrição
        const existente = await this.prisma.despesa.findFirst({
          where: {
            negocioId,
            descricao: despesa.descricao,
            criadoEm: { gte: new Date(agora.getTime() - intervalo * 24 * 60 * 60 * 1000) }
          }
        });

        if (!existente) {
          await this.criarDespesa(negocioId, {
            categoriaId: despesa.categoriaId ?? undefined,
            descricao: despesa.descricao,
            valor: despesa.valor,
            tipoRecorrencia: despesa.tipoRecorrencia,
            fornecedor: despesa.fornecedor ?? undefined,
            dataVencimento: new Date(agora.getTime() + intervalo * 24 * 60 * 60 * 1000),
            observacao: `Recorrência automática de: ${despesa.descricao}`
          });
          criadas++;
        }
      }
    }

    return { criadas };
  }

  // ── Alertas de Pagamentos (RF-T034) ──────────────────────────────────────

  async obterAlertasPagamentos(negocioId: string) {
    const agora = new Date();
    const em3Dias = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);
    const em1Dia = new Date(agora.getTime() + 1 * 24 * 60 * 60 * 1000);

    const contasPagar = await this.prisma.contaPagar.findMany({
      where: { negocioId, estado: { not: "PAGO" } },
      orderBy: { dataVencimento: "asc" }
    });

    const alertas: Array<{
      id: string;
      tipo: "VENCIDO" | "VENCE_AMANHA" | "VENCE_3_DIAS";
      fornecedor: string;
      descricao: string;
      valor: number;
      dataVencimento: Date;
      diasAtraso?: number;
    }> = [];

    for (const conta of contasPagar) {
      if (conta.dataVencimento < agora) {
        const diasAtraso = Math.floor((agora.getTime() - conta.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
        alertas.push({
          id: conta.id, tipo: "VENCIDO", fornecedor: conta.fornecedor,
          descricao: conta.descricao, valor: conta.valor,
          dataVencimento: conta.dataVencimento, diasAtraso
        });
      } else if (conta.dataVencimento <= em1Dia) {
        alertas.push({
          id: conta.id, tipo: "VENCE_AMANHA", fornecedor: conta.fornecedor,
          descricao: conta.descricao, valor: conta.valor,
          dataVencimento: conta.dataVencimento
        });
      } else if (conta.dataVencimento <= em3Dias) {
        alertas.push({
          id: conta.id, tipo: "VENCE_3_DIAS", fornecedor: conta.fornecedor,
          descricao: conta.descricao, valor: conta.valor,
          dataVencimento: conta.dataVencimento
        });
      }
    }

    // alertas de despesas não pagas próximas do vencimento
    const despesasPendentes = await this.prisma.despesa.findMany({
      where: { negocioId, pago: false, dataVencimento: { not: null, lte: em3Dias } },
      orderBy: { dataVencimento: "asc" }
    });

    for (const d of despesasPendentes) {
      if (!d.dataVencimento) continue;
      if (d.dataVencimento < agora) {
        alertas.push({
          id: d.id, tipo: "VENCIDO", fornecedor: d.fornecedor ?? "—",
          descricao: d.descricao, valor: d.valor,
          dataVencimento: d.dataVencimento,
          diasAtraso: Math.floor((agora.getTime() - d.dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
        });
      } else if (d.dataVencimento <= em1Dia) {
        alertas.push({
          id: d.id, tipo: "VENCE_AMANHA", fornecedor: d.fornecedor ?? "—",
          descricao: d.descricao, valor: d.valor, dataVencimento: d.dataVencimento
        });
      } else {
        alertas.push({
          id: d.id, tipo: "VENCE_3_DIAS", fornecedor: d.fornecedor ?? "—",
          descricao: d.descricao, valor: d.valor, dataVencimento: d.dataVencimento
        });
      }
    }

    return { alertas, totalVencido: alertas.filter((a) => a.tipo === "VENCIDO").reduce((s, a) => s + a.valor, 0) };
  }

  // ── Cobrança Automática (RF-T029) ────────────────────────────────────────

  async gerarCobrancasVencidas(negocioId: string) {
    const agora = new Date();

    const contasVencidas = await this.prisma.contaReceber.findMany({
      where: { negocioId, estado: { not: "PAGO" }, dataVencimento: { lt: agora } },
      orderBy: { dataVencimento: "asc" }
    });

    const cobrancas: Array<{
      contaId: string;
      descricao: string;
      valor: number;
      diasAtraso: number;
      clienteId: string | null;
    }> = [];

    for (const conta of contasVencidas) {
      const diasAtraso = Math.floor((agora.getTime() - conta.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));

      cobrancas.push({
        contaId: conta.id,
        descricao: conta.descricao,
        valor: conta.valor,
        diasAtraso,
        clienteId: conta.clienteId
      });
    }

    // Criar tarefas operacionais para cada cobrança (se modelo TarefaOperacional existir)
    let tarefasCriadas = 0;
    for (const c of cobrancas) {
      const jaExiste = await this.prisma.tarefaOperacional.findFirst({
        where: {
          negocioId,
          tipo: "COBRANCA",
          entidadeId: c.contaId,
          estado: { not: "CONCLUIDA" }
        }
      });

      if (!jaExiste) {
        await this.prisma.tarefaOperacional.create({
          data: {
            negocioId,
            titulo: `Cobrança: ${c.descricao}`,
            descricao: `Pagamento vencido há ${c.diasAtraso} dia(s). Valor: ${c.valor}`,
            tipo: "COBRANCA",
            prioridade: c.diasAtraso > 30 ? "ALTA" : c.diasAtraso > 7 ? "MEDIA" : "BAIXA",
            entidadeTipo: "ContaReceber",
            entidadeId: c.contaId,
            estado: "PENDENTE"
          }
        });
        tarefasCriadas++;
      }
    }

    return { totalVencidas: cobrancas.length, tarefasCriadas, cobrancas };
  }

  // ── Taxa de Inadimplência (RF-T030) ────────────────────────────────────

  async calcularTaxaInadimplencia(
    negocioId: string,
    filtros?: { de?: Date; ate?: Date }
  ) {
    const agora = new Date();
    const de = filtros?.de ?? new Date(agora.getFullYear(), agora.getMonth() - 2, 1);
    const ate = filtros?.ate ?? agora;

    const todasContas = await this.prisma.contaReceber.findMany({
      where: {
        negocioId,
        criadoEm: { gte: de, lte: ate }
      }
    });

    const total = todasContas.length;
    if (total === 0) return { total: 0, inadimplentes: 0, taxa: 0, valorTotal: 0, valorInadimplente: 0 };

    const inadimplentes = todasContas.filter(
      (c) => c.estado !== "PAGO" && c.dataVencimento < agora
    );

    const valorTotal = todasContas.reduce((s, c) => s + c.valor, 0);
    const valorInadimplente = inadimplentes.reduce((s, c) => s + c.valor, 0);

    // Agrupar por mês
    const porMes: Record<string, { total: number; inadimplentes: number }> = {};
    for (const c of todasContas) {
      const chave = `${String(c.criadoEm.getMonth() + 1).padStart(2, "0")}/${c.criadoEm.getFullYear()}`;
      if (!porMes[chave]) porMes[chave] = { total: 0, inadimplentes: 0 };
      porMes[chave].total++;
      if (c.estado !== "PAGO" && c.dataVencimento < agora) {
        porMes[chave].inadimplentes++;
      }
    }

    return {
      total,
      inadimplentes: inadimplentes.length,
      taxa: Math.round((inadimplentes.length / total) * 100),
      valorTotal,
      valorInadimplente,
      porMes: Object.entries(porMes).map(([periodo, v]) => ({
        periodo,
        ...v,
        taxa: v.total > 0 ? Math.round((v.inadimplentes / v.total) * 100) : 0
      }))
    };
  }

  // ── Priorização de Pagamentos (RF-T033) ─────────────────────────────────

  async priorizarPagamentos(negocioId: string) {
    const contasPendentes = await this.prisma.contaPagar.findMany({
      where: { negocioId, estado: { not: "PAGO" } },
      orderBy: { dataVencimento: "asc" }
    });

    const agora = new Date();

    const priorizadas = contasPendentes.map((conta) => {
      const diasAteVencimento = Math.floor(
        (conta.dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
      );

      let prioridade: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
      let motivo: string;

      if (diasAteVencimento < 0) {
        prioridade = "CRITICA";
        motivo = `Vencido há ${Math.abs(diasAteVencimento)} dia(s)`;
      } else if (diasAteVencimento <= 3) {
        prioridade = "ALTA";
        motivo = `Vence em ${diasAteVencimento} dia(s)`;
      } else if (diasAteVencimento <= 7) {
        prioridade = "MEDIA";
        motivo = `Vence em ${diasAteVencimento} dia(s)`;
      } else {
        prioridade = "BAIXA";
        motivo = `Vence em ${diasAteVencimento} dia(s)`;
      }

      return {
        id: conta.id,
        fornecedor: conta.fornecedor,
        descricao: conta.descricao,
        valor: conta.valor,
        dataVencimento: conta.dataVencimento,
        diasAteVencimento,
        prioridade,
        motivo
      };
    });

    // Ordenar: CRITICA > ALTA > MEDIA > BAIXA, depois por valor (maior primeiro dentro do mesmo nível)
    const ordemPrioridade = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
    priorizadas.sort((a, b) => {
      const diff = ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade];
      return diff !== 0 ? diff : b.valor - a.valor;
    });

    const totalPendente = priorizadas.reduce((s, p) => s + p.valor, 0);

    return {
      pagamentos: priorizadas,
      resumo: {
        total: priorizadas.length,
        totalPendente,
        criticas: priorizadas.filter((p) => p.prioridade === "CRITICA").length,
        altas: priorizadas.filter((p) => p.prioridade === "ALTA").length
      }
    };
  }

  // ── Risco de Inadimplência (RF-T031) ─────────────────────────────────────

  async calcularRiscoInadimplencia(negocioId: string) {
    const agora = new Date();

    // buscar todas as contas a receber
    const contas = await this.prisma.contaReceber.findMany({
      where: { negocioId },
      orderBy: { criadoEm: "desc" }
    });

    // agrupar por cliente
    const porCliente: Record<string, {
      clienteId: string;
      total: number;
      pagas: number;
      vencidas: number;
      valorTotal: number;
      valorVencido: number;
      diasAtrasoMedio: number;
    }> = {};

    for (const c of contas) {
      const chave = c.clienteId ?? "sem-cliente";
      if (!porCliente[chave]) {
        porCliente[chave] = {
          clienteId: chave,
          total: 0, pagas: 0, vencidas: 0,
          valorTotal: 0, valorVencido: 0, diasAtrasoMedio: 0
        };
      }
      const p = porCliente[chave];
      p.total++;
      p.valorTotal += c.valor;

      if (c.estado === "PAGO") {
        p.pagas++;
        // calcular dias de atraso no pagamento (pagoEm vs dataVencimento)
        if (c.pagoEm && c.pagoEm > c.dataVencimento) {
          const diasAtraso = Math.floor((c.pagoEm.getTime() - c.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));
          p.diasAtrasoMedio = (p.diasAtrasoMedio * (p.pagas - 1) + diasAtraso) / p.pagas;
        }
      } else if (c.dataVencimento < agora) {
        p.vencidas++;
        p.valorVencido += c.valor;
      }
    }

    // calcular score de risco (0-100, 100 = maior risco)
    const riscos = Object.values(porCliente).map((p) => {
      const taxaInadimplencia = p.total > 0 ? (p.vencidas / p.total) * 100 : 0;
      const factorAtraso = Math.min(p.diasAtrasoMedio / 30, 1) * 30; // até 30 pontos
      const factorVencidas = Math.min(taxaInadimplencia, 50); // até 50 pontos
      const factorValor = p.valorVencido > 0 ? Math.min((p.valorVencido / p.valorTotal) * 20, 20) : 0; // até 20 pontos

      const score = Math.round(factorVencidas + factorAtraso + factorValor);
      const nivel = score >= 70 ? "ALTO" : score >= 40 ? "MEDIO" : "BAIXO";

      return {
        clienteId: p.clienteId === "sem-cliente" ? null : p.clienteId,
        totalContas: p.total,
        contasPagas: p.pagas,
        contasVencidas: p.vencidas,
        valorTotal: p.valorTotal,
        valorVencido: p.valorVencido,
        diasAtrasoMedio: Math.round(p.diasAtrasoMedio),
        score,
        nivel
      };
    });

    // ordenar por score desc
    riscos.sort((a, b) => b.score - a.score);

    return { clientes: riscos };
  }

  // ── Fecho de Período (RN-T004) ─────────────────────────────────────────

  async fecharPeriodo(negocioId: string, mes: number, ano: number) {
    const de = new Date(ano, mes - 1, 1);
    const ate = new Date(ano, mes, 0, 23, 59, 59);

    const semCategoria = await this.prisma.movimentoFinanceiro.count({
      where: { negocioId, dataMovimento: { gte: de, lte: ate }, categoriaId: null }
    });

    if (semCategoria > 0) {
      throw new Error(
        `RN-T004: Existem ${semCategoria} movimentos sem categoria no período ${mes}/${ano}. Reconcilie antes de fechar.`
      );
    }

    const negocio = await this.prisma.negocio.findUniqueOrThrow({
      where: { id: negocioId },
      select: { dadosOperacionaisJson: true }
    });

    const dadosOp = JSON.parse(negocio.dadosOperacionaisJson || "{}");
    if (!dadosOp.periodosFechados) dadosOp.periodosFechados = [];

    const chave = `${mes}/${ano}`;
    if (dadosOp.periodosFechados.includes(chave)) {
      throw new Error(`Período ${chave} já se encontra fechado.`);
    }

    dadosOp.periodosFechados.push(chave);

    await this.prisma.negocio.update({
      where: { id: negocioId },
      data: { dadosOperacionaisJson: JSON.stringify(dadosOp) }
    });

    this.eventos?.emitir("FINANCAS_PERIODO_FECHADO", {
      negocioId,
      periodo: chave,
      mes,
      ano
    });

    return { periodo: chave, fechadoEm: new Date() };
  }

  // ── Limite de Desconto (RN-T005) ──────────────────────────────────────

  async validarLimiteDesconto(
    negocioId: string,
    percentualDesconto: number,
    aprovadorId?: string
  ) {
    const LIMITE_DESCONTO = 15;

    if (percentualDesconto <= LIMITE_DESCONTO) {
      return { aprovado: true, percentualDesconto };
    }

    if (!aprovadorId) {
      throw new Error(
        "RN-T005: Descontos acima de 15% exigem aprovação de perfil com permissão financas:aprovacao."
      );
    }

    const membro = await this.prisma.membroNegocio.findFirst({
      where: {
        negocioId,
        usuarioId: aprovadorId,
        status: "ATIVO",
        papel: { in: ["ADMIN", "DONO", "GESTOR_FINANCEIRO"] }
      }
    });

    if (!membro) {
      throw new Error(
        "RN-T005: Descontos acima de 15% exigem aprovação de perfil com permissão financas:aprovacao."
      );
    }

    return { aprovado: true, percentualDesconto, aprovadorId };
  }

  // ── Reembolso Vinculado (RN-T006) ─────────────────────────────────────

  async registarReembolso(
    negocioId: string,
    dados: {
      descricao: string;
      valor: number;
      pedidoId?: string;
      facturaId?: string;
      notaCreditoId?: string;
      responsavelId?: string;
      observacao?: string;
    }
  ) {
    if (!dados.pedidoId && !dados.facturaId && !dados.notaCreditoId) {
      throw new Error(
        "RN-T006: Todo reembolso deve estar vinculado a um pedido, factura ou nota de crédito. Reembolsos avulsos são bloqueados."
      );
    }

    const origemId = dados.pedidoId ?? dados.facturaId ?? dados.notaCreditoId;
    const origemDetalhe = dados.pedidoId
      ? `Pedido: ${dados.pedidoId}`
      : dados.facturaId
        ? `Factura: ${dados.facturaId}`
        : `Nota crédito: ${dados.notaCreditoId}`;

    const movimento = await this.registarMovimento(negocioId, {
      tipo: "SAIDA",
      descricao: dados.descricao || `Reembolso — ${origemDetalhe}`,
      valor: dados.valor,
      origemTipo: "REEMBOLSO",
      origemId,
      responsavelId: dados.responsavelId,
      observacao: dados.observacao
    });

    this.eventos?.emitir("FINANCAS_REEMBOLSO_REGISTADO", {
      negocioId,
      movimentoId: movimento.id,
      valor: dados.valor,
      origemDetalhe,
      responsavelId: dados.responsavelId
    });

    return movimento;
  }

  // ── Movimento Multi-Moeda (RN-T007) ───────────────────────────────────

  async registarMovimentoMultiMoeda(
    negocioId: string,
    dados: {
      tipo: string;
      categoriaId?: string;
      descricao: string;
      valor: number;
      origemTipo?: string;
      origemId?: string;
      responsavelId?: string;
      dataMovimento?: Date;
      observacao?: string;
      moedaOriginal?: string;
      taxaCambio?: number;
      valorOriginal?: number;
    }
  ) {
    const negocio = await this.prisma.negocio.findUniqueOrThrow({
      where: { id: negocioId },
      select: { moeda: true }
    });

    const moedaPadrao = negocio.moeda || "AOA";

    if (dados.moedaOriginal && dados.moedaOriginal !== moedaPadrao) {
      if (!dados.taxaCambio || !dados.valorOriginal) {
        throw new Error(
          "RN-T007: Transacções em moeda estrangeira devem registar taxa de câmbio e valor original."
        );
      }

      const valorConvertido = Math.round(dados.valorOriginal * dados.taxaCambio);

      const detalheCambio = JSON.stringify({
        moedaOriginal: dados.moedaOriginal,
        valorOriginal: dados.valorOriginal,
        taxaCambio: dados.taxaCambio,
        moedaDestino: moedaPadrao
      });

      const observacaoFinal = dados.observacao
        ? `${dados.observacao} | Câmbio: ${detalheCambio}`
        : `Câmbio: ${detalheCambio}`;

      return this.registarMovimento(negocioId, {
        tipo: dados.tipo,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: valorConvertido,
        origemTipo: dados.origemTipo,
        origemId: dados.origemId,
        responsavelId: dados.responsavelId,
        dataMovimento: dados.dataMovimento,
        observacao: observacaoFinal
      });
    }

    return this.registarMovimento(negocioId, {
      tipo: dados.tipo,
      categoriaId: dados.categoriaId,
      descricao: dados.descricao,
      valor: dados.valor,
      origemTipo: dados.origemTipo,
      origemId: dados.origemId,
      responsavelId: dados.responsavelId,
      dataMovimento: dados.dataMovimento,
      observacao: dados.observacao
    });
  }

  // ── Regras Fiscais (RN-T002, RN-T003) ────────────────────────────────────

  async validarAnulacaoFactura(id: string, negocioId: string) {
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { id, negocioId }
    });

    if (factura.estado === "ANULADA") {
      throw new Error("Factura já se encontra anulada.");
    }

    // RN-T002: factura emitida não pode ser editada, apenas anulada via nota de crédito ou anulação
    return factura;
  }
}

function gerarCodigoValidacaoDocumento(
  negocioId: string,
  serie: string,
  numero: number,
  anoFiscal: number,
  total: number
) {
  return createHash("sha256")
    .update(`${negocioId}:${serie}:${numero}:${anoFiscal}:${total}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

function gerarHashDocumento(dados: {
  negocioId: string;
  serie: string;
  numero: number;
  anoFiscal: number;
  total: number;
  clienteNome: string;
  emitidaEm: Date;
}) {
  return createHash("sha256")
    .update(JSON.stringify({
      negocioId: dados.negocioId,
      serie: dados.serie,
      numero: dados.numero,
      anoFiscal: dados.anoFiscal,
      total: dados.total,
      clienteNome: dados.clienteNome,
      emitidaEm: dados.emitidaEm.toISOString()
    }))
    .digest("hex");
}

function gerarPayloadQrDocumento(dados: {
  tipoDocumento: string;
  serie: string;
  numero: number;
  anoFiscal: number;
  codigoValidacao: string;
  total: number;
}) {
  return JSON.stringify({
    emissor: "BIZY",
    tipo: dados.tipoDocumento,
    documento: `${dados.serie} ${String(dados.numero).padStart(4, "0")}/${dados.anoFiscal}`,
    codigo: dados.codigoValidacao,
    total: dados.total
  });
}
