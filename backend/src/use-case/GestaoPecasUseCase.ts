import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioPecas, RepositorioReservas } from "../dominio/repositorios/contratos.js";
import type {
  AtualizarPeca,
  ConfiguracaoVitrineProduto,
  MovimentoStock,
  NovaPeca,
  Peca,
  Reserva,
  ResumoCatalogoComercial,
  TipoMovimentoStock
} from "../dominio/tipos.js";
import { lerInteiro, lerLista, parseCsv } from "./utils/csv.js";

interface DadosRegistroMovimentoStock {
  tipo: TipoMovimentoStock;
  quantidade: number;
  motivo?: string | null;
  responsavelId?: string | null;
  origem?: string | null;
  varianteSelecionada?: string | null;
}

interface FiltrosExportacaoProdutos {
  busca?: string;
  categoria?: string;
  colecao?: string;
  estado?: Peca["estado"];
  limite?: number;
}

export class GestaoPecasUseCase {
  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly eventos: DespachadorEventos,
    private readonly repositorioReservas?: RepositorioReservas
  ) {}

  async cadastrarPeca(dados: NovaPeca) {
    const peca = await this.repositorioPecas.criar(this.normalizarCriacao(dados));
    this.eventos.emitir("STOCK_UPDATED", { peca });
    return peca;
  }

  async importarCsv(negocioId: string, conteudo: string) {
    const linhasCsv = parseCsv(conteudo);
    const linhas: Array<{
      linha: number;
      status: "CRIADO" | "ATUALIZADO" | "ERRO";
      codigo?: string;
      pecaId?: string;
      erro?: string;
    }> = [];

    for (const linhaCsv of linhasCsv) {
      try {
        const dados = this.mapearLinhaImportacao(negocioId, linhaCsv.dados);
        const existente = await this.repositorioPecas.buscarPorCodigo(dados.codigo, negocioId);
        const peca = existente
          ? await this.atualizarPeca(dados.codigo, dados, negocioId)
          : await this.cadastrarPeca(dados);
        linhas.push({
          linha: linhaCsv.numero,
          status: existente ? "ATUALIZADO" : "CRIADO",
          codigo: peca.codigo,
          pecaId: peca.id
        });
      } catch (erro) {
        linhas.push({
          linha: linhaCsv.numero,
          status: "ERRO",
          erro: erro instanceof Error ? erro.message : "Linha inválida."
        });
      }
    }

    return {
      total: linhasCsv.length,
      criados: linhas.filter((linha) => linha.status === "CRIADO").length,
      atualizados: linhas.filter((linha) => linha.status === "ATUALIZADO").length,
      erros: linhas.filter((linha) => linha.status === "ERRO").length,
      linhas
    };
  }

  async listarPecas(negocioId?: string | null) {
    return this.repositorioPecas.listar(negocioId);
  }

  async exportarCsv(
    negocioId?: string | null,
    filtros: FiltrosExportacaoProdutos = { limite: 10_000 }
  ): Promise<{ csv: string; quantidade: number; filtros: FiltrosExportacaoProdutos }> {
    const filtrosExportacao: FiltrosExportacaoProdutos = { limite: 10_000, ...filtros };
    const pecas = (await this.repositorioPecas.listar(negocioId))
      .filter((peca) => this.produtoEntraNaExportacao(peca, filtrosExportacao))
      .slice(0, filtrosExportacao.limite ?? 10_000);
    const linhas = [
      [
        "codigo",
        "sku",
        "nome",
        "descricao",
        "categoria",
        "colecao",
        "precoEmKwanza",
        "custoEmKwanza",
        "margemEstimadaEmKwanza",
        "quantidade",
        "stockMinimo",
        "estado",
        "estadoStock",
        "arquivadaEm",
        "fotos",
        "variantes"
      ],
      ...pecas.map((peca) => [
        peca.codigo,
        peca.sku ?? "",
        peca.nome,
        peca.descricao,
        peca.categoria ?? "",
        peca.colecao ?? "",
        String(peca.precoEmKwanza),
        peca.custoEmKwanza === null ? "" : String(peca.custoEmKwanza),
        peca.margemEstimadaEmKwanza === null ? "" : String(peca.margemEstimadaEmKwanza),
        String(peca.quantidade),
        String(peca.stockMinimo),
        peca.estado,
        peca.estadoStock,
        peca.arquivadaEm?.toISOString() ?? "",
        peca.fotos.join("|"),
        JSON.stringify(peca.variantes)
      ])
    ];

    return {
      csv: `${linhas.map((linha) => linha.map((valor) => this.csv(valor)).join(",")).join("\n")}\n`,
      quantidade: pecas.length,
      filtros: filtrosExportacao
    };
  }

  async resumirCatalogo(negocioId?: string | null): Promise<ResumoCatalogoComercial> {
    const [pecas, reservas] = await Promise.all([
      this.repositorioPecas.listar(negocioId),
      this.repositorioReservas?.listar(negocioId) ?? Promise.resolve([])
    ]);
    const categorias = new Map<string, number>();
    const colecoes = new Map<string, number>();

    const resumo = pecas.reduce<ResumoCatalogoComercial>(
      (acumulador, peca) => {
        acumulador.total += 1;
        if (!peca.arquivadaEm && peca.quantidade > 0 && peca.estado !== "VENDIDA") acumulador.disponiveis += 1;
        if (peca.estadoStock === "BAIXO_STOCK") acumulador.baixoStock += 1;
        if (peca.estadoStock === "ESGOTADO") acumulador.esgotadas += 1;
        if (peca.estadoStock === "ARQUIVADO") acumulador.arquivadas += 1;

        acumulador.custoTotalEmKwanza += (peca.custoEmKwanza ?? 0) * peca.quantidade;
        acumulador.valorPotencialEmKwanza += peca.precoEmKwanza * peca.quantidade;
        acumulador.margemPotencialEmKwanza += (peca.margemEstimadaEmKwanza ?? 0) * peca.quantidade;

        if (peca.categoria) categorias.set(peca.categoria, (categorias.get(peca.categoria) ?? 0) + 1);
        if (peca.colecao) colecoes.set(peca.colecao, (colecoes.get(peca.colecao) ?? 0) + 1);

        return acumulador;
      },
      {
        total: 0,
        disponiveis: 0,
        baixoStock: 0,
        esgotadas: 0,
        arquivadas: 0,
        custoTotalEmKwanza: 0,
        valorPotencialEmKwanza: 0,
        margemPotencialEmKwanza: 0,
        categorias: [],
        colecoes: [],
        alertas: {
          baixoStockProdutos: [],
          stockParado: [],
          maisVendidos: [],
          reservadosSemPagamento: []
        }
      }
    );

    return {
      ...resumo,
      categorias: this.mapearAgrupamento(categorias),
      colecoes: this.mapearAgrupamento(colecoes),
      alertas: this.montarAlertasCatalogo(pecas, reservas)
    };
  }

  async atualizarPeca(codigo: string, dados: AtualizarPeca, negocioId?: string | null) {
    const codigoNormalizado = this.normalizarCodigo(codigo);
    const pecaAtual = await this.exigirPeca(codigoNormalizado, negocioId);
    const peca = await this.repositorioPecas.atualizar(
      codigoNormalizado,
      this.normalizarAtualizacao(pecaAtual, dados),
      negocioId
    );
    this.eventos.emitir("STOCK_UPDATED", { peca });
    return peca;
  }

  async desativarPeca(codigo: string, negocioId?: string | null) {
    return this.atualizarPeca(codigo, { estado: "ESGOTADA" }, negocioId);
  }

  async arquivarPeca(codigo: string, motivo?: string | null, negocioId?: string | null) {
    const peca = await this.atualizarPeca(codigo, { arquivadaEm: new Date() }, negocioId);
    this.eventos.emitir("STOCK_UPDATED", {
      peca,
      motivo: motivo ?? "Produto arquivado para preservar histórico comercial."
    });
    return peca;
  }

  async registrarMovimentoStock(codigo: string, dados: DadosRegistroMovimentoStock, negocioId?: string | null) {
    const codigoNormalizado = this.normalizarCodigo(codigo);
    const pecaAtual = await this.exigirPeca(codigoNormalizado, negocioId);
    const quantidadeNova = this.calcularQuantidadeNova(pecaAtual, dados);
    const peca = await this.repositorioPecas.atualizar(
      codigoNormalizado,
      this.normalizarAtualizacao(pecaAtual, { quantidade: quantidadeNova }),
      negocioId
    );

    if (dados.varianteSelecionada && this.repositorioPecas.decrementarStockVariante) {
      const ehSaida = ["SAIDA", "VENDA", "RESERVA"].includes(dados.tipo);
      const ehEntrada = ["ENTRADA", "CANCELAMENTO", "DEVOLUCAO"].includes(dados.tipo);
      if (ehSaida || ehEntrada) {
        await this.repositorioPecas.decrementarStockVariante(
          peca.id,
          dados.varianteSelecionada,
          ehSaida ? dados.quantidade : -dados.quantidade
        );
      }
    }

    const movimento = await this.repositorioPecas.registrarMovimentoStock({
      negocioId: peca.negocioId,
      pecaId: peca.id,
      codigoPeca: peca.codigo,
      tipo: dados.tipo,
      quantidade: dados.quantidade,
      quantidadeAnterior: pecaAtual.quantidade,
      quantidadeNova,
      motivo: dados.motivo ?? null,
      responsavelId: dados.responsavelId ?? null,
      origem: dados.origem ?? null
    });

    this.eventos.emitir("STOCK_UPDATED", { peca, movimento });
    return { peca, movimento };
  }

  async listarMovimentosStock(codigo: string, negocioId?: string | null): Promise<MovimentoStock[]> {
    const codigoNormalizado = this.normalizarCodigo(codigo);
    await this.exigirPeca(codigoNormalizado, negocioId);
    return this.repositorioPecas.listarMovimentosStock(codigoNormalizado, negocioId);
  }

  private normalizarCriacao(dados: NovaPeca): NovaPeca {
    const normalizada = {
      ...dados,
      codigo: this.normalizarCodigo(dados.codigo),
      vitrine: this.normalizarVitrine(dados.vitrine)
    };

    if (dados.quantidade === 0) {
      return { ...normalizada, estado: "ESGOTADA" };
    }

    return normalizada;
  }

  private produtoEntraNaExportacao(peca: Peca, filtros: FiltrosExportacaoProdutos): boolean {
    if (filtros.categoria && peca.categoria !== filtros.categoria) return false;
    if (filtros.colecao && peca.colecao !== filtros.colecao) return false;
    if (filtros.estado && peca.estado !== filtros.estado) return false;
    if (!filtros.busca) return true;

    const busca = filtros.busca.toLowerCase();
    return [peca.codigo, peca.sku, peca.nome, peca.descricao, peca.categoria, peca.colecao]
      .filter((valor): valor is string => Boolean(valor))
      .some((valor) => valor.toLowerCase().includes(busca));
  }

  private csv(valor: string): string {
    const precisaEscapar = /[",\n\r]/.test(valor);
    const escapado = valor.replace(/"/g, '""');
    return precisaEscapar ? `"${escapado}"` : escapado;
  }

  private mapearLinhaImportacao(negocioId: string, linha: Record<string, string>): NovaPeca {
    const codigo = this.normalizarCodigo(linha.codigo ?? "");
    if (!codigo) throw new Error("Código do produto é obrigatório.");

    const precoEmKwanza = lerInteiro(linha.preco_em_kwanza || linha.precoemkwanza || linha.preco);
    const quantidade = lerInteiro(linha.quantidade || linha.stock || linha.estoque);
    if (precoEmKwanza === undefined || precoEmKwanza < 0) throw new Error(`Preço inválido para produto #${codigo}.`);
    if (quantidade === undefined || quantidade < 0) throw new Error(`Quantidade inválida para produto #${codigo}.`);

    const custoEmKwanza = lerInteiro(linha.custo_em_kwanza || linha.custoemkwanza || linha.custo);
    const stockMinimo = lerInteiro(linha.stock_minimo || linha.stockminimo || linha.minimo) ?? 0;
    const fotos = lerLista(linha.fotos || linha.foto || linha.imagens);

    return {
      negocioId,
      codigo,
      sku: linha.sku || null,
      nome: linha.nome || codigo,
      descricao: linha.descricao || "",
      precoEmKwanza,
      custoEmKwanza: custoEmKwanza ?? null,
      quantidade,
      stockMinimo,
      categoria: linha.categoria || null,
      colecao: linha.colecao || null,
      fotos,
      variantes: this.mapearVariantesImportacao(linha)
    };
  }

  private mapearVariantesImportacao(linha: Record<string, string>): Record<string, string[]> {
    return Object.entries(linha).reduce<Record<string, string[]>>((acumulador, [campo, valor]) => {
      if (!campo.startsWith("variante_") || !valor) return acumulador;
      const nome = campo.replace(/^variante_/, "");
      acumulador[nome] = lerLista(valor);
      return acumulador;
    }, {});
  }

  private normalizarAtualizacao(pecaAtual: Peca, dados: AtualizarPeca): AtualizarPeca {
    const dadosNormalizados = dados.vitrine ? { ...dados, vitrine: this.normalizarVitrine(dados.vitrine) } : dados;
    const quantidade = dados.quantidade ?? pecaAtual.quantidade;

    if (quantidade === 0) {
      return { ...dadosNormalizados, estado: "ESGOTADA" };
    }

    if (dadosNormalizados.estado) {
      return dadosNormalizados;
    }

    if (pecaAtual.estado === "ESGOTADA" && quantidade > 0) {
      return { ...dadosNormalizados, estado: "DISPONIVEL" };
    }

    return dadosNormalizados;
  }

  private normalizarVitrine(vitrine?: ConfiguracaoVitrineProduto): ConfiguracaoVitrineProduto {
    return {
      selos: [...new Set(vitrine?.selos ?? [])],
      prioridade: vitrine?.prioridade ?? 100,
      titulo: vitrine?.titulo ?? null,
      descricao: vitrine?.descricao ?? null,
      precoPromocionalEmKwanza: vitrine?.precoPromocionalEmKwanza ?? null,
      ativaAte: vitrine?.ativaAte ?? null,
      componentesKit: (vitrine?.componentesKit ?? []).map((item) => ({
        codigoPeca: this.normalizarCodigo(item.codigoPeca),
        quantidade: item.quantidade
      })),
      ...(vitrine?.publicacaoMarket
        ? {
            publicacaoMarket: {
              publicado: vitrine.publicacaoMarket.publicado !== false,
              atualizadoEm: vitrine.publicacaoMarket.atualizadoEm ?? null,
              origem: vitrine.publicacaoMarket.origem ?? null
            }
          }
        : {})
    };
  }

  private calcularQuantidadeNova(peca: Peca, dados: DadosRegistroMovimentoStock): number {
    const quantidadeNova = (() => {
      if (dados.tipo === "AJUSTE" || dados.tipo === "CORRECAO") {
        return dados.quantidade;
      }

      if (["ENTRADA", "CANCELAMENTO", "DEVOLUCAO"].includes(dados.tipo)) {
        return peca.quantidade + dados.quantidade;
      }

      return peca.quantidade - dados.quantidade;
    })();

    if (quantidadeNova < 0) {
      throw new Error(
        `Stock insuficiente: movimento não pode deixar a peça #${peca.codigo} com quantidade negativa. Disponível: ${peca.quantidade}.`
      );
    }

    return quantidadeNova;
  }

  private montarAlertasCatalogo(pecas: Peca[], reservas: Reserva[]): ResumoCatalogoComercial["alertas"] {
    const pecaPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca]));
    const reservasPagas = reservas.filter((reserva) => reserva.estado === "PAID");
    const reservasSemPagamento = reservas.filter((reserva) =>
      ["PENDING", "RESERVED", "WAITING_PAYMENT"].includes(reserva.estado)
    );
    const codigosComMovimentoComercial = new Set(reservas.map((reserva) => reserva.codigoPeca));

    return {
      baixoStockProdutos: pecas
        .filter((peca) => peca.estadoStock === "BAIXO_STOCK")
        .map((peca) => ({
          codigo: peca.codigo,
          nome: peca.nome,
          quantidade: peca.quantidade,
          stockMinimo: peca.stockMinimo,
          valorEmKwanza: peca.precoEmKwanza * peca.quantidade
        }))
        .sort((a, b) => a.quantidade - b.quantidade || a.codigo.localeCompare(b.codigo, "pt-AO", { numeric: true }))
        .slice(0, 10),
      stockParado: pecas
        .filter(
          (peca) =>
            peca.quantidade > peca.stockMinimo &&
            peca.estadoStock === "DISPONIVEL" &&
            !peca.arquivadaEm &&
            !codigosComMovimentoComercial.has(peca.codigo)
        )
        .map((peca) => ({
          codigo: peca.codigo,
          nome: peca.nome,
          quantidade: peca.quantidade,
          valorEmKwanza: peca.precoEmKwanza * peca.quantidade,
          ultimaAtualizacaoEm: peca.atualizadoEm
        }))
        .sort((a, b) => b.valorEmKwanza - a.valorEmKwanza || a.codigo.localeCompare(b.codigo, "pt-AO", { numeric: true }))
        .slice(0, 10),
      maisVendidos: this.agruparReservasVendidasPorProduto(reservasPagas, pecaPorCodigo).slice(0, 10),
      reservadosSemPagamento: this.agruparReservasPendentesPorProduto(reservasSemPagamento, pecaPorCodigo).slice(0, 10)
    };
  }

  private agruparReservasVendidasPorProduto(
    reservas: Reserva[],
    pecaPorCodigo: Map<string, Peca>
  ): ResumoCatalogoComercial["alertas"]["maisVendidos"] {
    return this.agruparTotaisReservas(reservas, pecaPorCodigo).map((item) => ({
      codigo: item.codigo,
      nome: item.nome,
      totalVendido: item.total,
      receitaEmKwanza: item.valorEmKwanza
    }));
  }

  private agruparReservasPendentesPorProduto(
    reservas: Reserva[],
    pecaPorCodigo: Map<string, Peca>
  ): ResumoCatalogoComercial["alertas"]["reservadosSemPagamento"] {
    return this.agruparTotaisReservas(reservas, pecaPorCodigo).map((item) => ({
      codigo: item.codigo,
      nome: item.nome,
      totalReservado: item.total,
      valorEmKwanza: item.valorEmKwanza
    }));
  }

  private agruparTotaisReservas(reservas: Reserva[], pecaPorCodigo: Map<string, Peca>) {
    const agrupamento = new Map<string, { codigo: string; nome: string; total: number; valorEmKwanza: number }>();

    for (const reserva of reservas) {
      const peca = pecaPorCodigo.get(reserva.codigoPeca);
      if (!peca) continue;
      const atual = agrupamento.get(peca.codigo) ?? {
        codigo: peca.codigo,
        nome: peca.nome,
        total: 0,
        valorEmKwanza: 0
      };
      atual.total += 1;
      atual.valorEmKwanza += peca.precoEmKwanza;
      agrupamento.set(peca.codigo, atual);
    }

    return [...agrupamento.values()]
      .sort((a, b) => b.total - a.total || b.valorEmKwanza - a.valorEmKwanza);
  }

  private mapearAgrupamento(agrupamento: Map<string, number>): Array<{ nome: string; total: number }> {
    return [...agrupamento.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-AO", { numeric: true }));
  }

  private async exigirPeca(codigo: string, negocioId?: string | null): Promise<Peca> {
    const peca = await this.repositorioPecas.buscarPorCodigo(this.normalizarCodigo(codigo), negocioId);

    if (!peca) {
      throw new Error(`Peça #${codigo} não encontrada.`);
    }

    return peca;
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
  }
}
