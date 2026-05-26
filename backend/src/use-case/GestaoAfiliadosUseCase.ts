import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioAfiliados, RepositorioPecas } from "../dominio/repositorios/contratos.js";
import { normalizarTelefone } from "../dominio/servicos/normalizarContato.js";
import type {
  LinkAfiliado,
  NovoLotePagamentoComissao,
  NovoLinkAfiliado,
  NovoParceiroComercial,
  ParceiroComercial,
  Pedido,
  RegraComissaoParceiro,
  ResumoSaldosComissoes,
  SaldoComissaoParceiro
} from "../dominio/tipos.js";

export interface AtribuicaoAfiliadoResolvida {
  parceiro: ParceiroComercial;
  link: LinkAfiliado;
}

export class GestaoAfiliadosUseCase {
  constructor(
    private readonly afiliados: RepositorioAfiliados,
    eventos?: DespachadorEventos,
    private readonly pecas?: RepositorioPecas
  ) {
    eventos?.aoReceber("ORDER_PAYMENT_CONFIRMED", (evento) => {
      const pedidoId = typeof evento.dados.pedidoId === "string" ? evento.dados.pedidoId : null;
      const negocioId = typeof evento.dados.negocioId === "string" ? evento.dados.negocioId : null;
      if (!pedidoId || !negocioId) return;

      void this.afiliados.confirmarComissaoPorPedido(pedidoId, negocioId).catch(() => undefined);
    });
    for (const tipo of ["ORDER_CANCELLED", "ORDER_RETURNED", "ORDER_REFUNDED"] as const) {
      eventos?.aoReceber(tipo, (evento) => {
        const pedidoId = typeof evento.dados.pedidoId === "string" ? evento.dados.pedidoId : null;
        const negocioId = typeof evento.dados.negocioId === "string" ? evento.dados.negocioId : null;
        if (!pedidoId || !negocioId) return;

        const motivoEvento = typeof evento.dados.motivo === "string" ? evento.dados.motivo : null;
        const motivo = `${this.rotuloEventoReversao(tipo)}: ${motivoEvento ?? "Pedido deixou de ser elegível para comissão."}`;
        void this.afiliados.reverterComissaoPorPedido(pedidoId, negocioId, motivo).catch(() => undefined);
      });
    }
  }

  async criarParceiro(negocioId: string, dados: Omit<NovoParceiroComercial, "negocioId">) {
    this.validarRegraComissao(dados.regraComissao);
    return this.afiliados.criarParceiro({
      ...dados,
      negocioId,
      codigo: this.normalizarCodigo(dados.codigo)
    });
  }

  async listarParceiros(negocioId: string) {
    return { parceiros: await this.afiliados.listarParceiros(negocioId) };
  }

  async criarLink(negocioId: string, afiliadoId: string, dados: Omit<NovoLinkAfiliado, "negocioId" | "afiliadoId">) {
    const parceiro = await this.afiliados.buscarParceiroPorId(afiliadoId, negocioId);
    if (!parceiro) throw new Error("Parceiro comercial não encontrado.");
    if (parceiro.estado !== "ATIVO") throw new Error("Parceiro comercial não está ativo para gerar links.");

    const link = await this.afiliados.criarLink({
      ...dados,
      negocioId,
      afiliadoId,
      codigo: this.normalizarCodigo(dados.codigo),
      codigoProduto: dados.codigoProduto ? this.normalizarCodigo(dados.codigoProduto) : null
    });
    return this.comUrlPublica(link);
  }

  async listarLinks(negocioId: string) {
    const links = await this.afiliados.listarLinks(negocioId);
    return { links: links.map((link) => this.comUrlPublica(link)) };
  }

  async resolverLinkPublico(codigo: string) {
    const link = await this.afiliados.buscarLinkPorCodigo(this.normalizarCodigo(codigo));
    if (!link || !link.ativo) return null;
    if (link.expiraEm && link.expiraEm.getTime() <= Date.now()) return null;

    return {
      codigo: link.codigo,
      ativo: link.ativo,
      destino: {
        tipo: link.destinoTipo,
        slugLoja: link.slugLoja,
        codigoProduto: link.codigoProduto,
        canal: link.canal,
        origemConteudo: link.origemConteudo
      },
      link: this.comUrlPublica(link)
    };
  }

  async gerarPacoteDivulgacao(negocioId: string, afiliadoId: string, filtros: { codigoProduto?: string | null } = {}) {
    const parceiro = await this.afiliados.buscarParceiroPorId(afiliadoId, negocioId);
    if (!parceiro) return null;

    const codigoProduto = filtros.codigoProduto ? this.normalizarCodigo(filtros.codigoProduto) : null;
    const links = (await this.afiliados.listarLinks(negocioId))
      .filter((link) => link.afiliadoId === afiliadoId)
      .filter((link) => !codigoProduto || link.codigoProduto === codigoProduto)
      .map((link) => this.comUrlPublica(link));
    const produto = codigoProduto && this.pecas ? await this.pecas.buscarPorCodigo(codigoProduto, negocioId) : null;

    return {
      parceiro,
      regras: parceiro.regraComissao,
      links,
      produtos: produto
        ? [{
            codigo: produto.codigo,
            nome: produto.nome,
            precoEmKwanza: produto.precoEmKwanza,
            fotos: produto.fotos
          }]
        : [],
      materiais: [
        {
          tipo: "TEXTO_WHATSAPP",
          conteudo:
            produto
              ? `Tenho uma sugestão para ti: ${produto.nome} (#${produto.codigo}) está disponível na Bizy. Compra pelo meu link e fala direto com a loja.`
              : "Descobre os produtos da loja pelo meu link Bizy e compra com atendimento direto no WhatsApp."
        },
        {
          tipo: "LEGENDA_SOCIAL",
          conteudo:
            produto
              ? `${produto.nome} disponível agora. Usa o link da bio para comprar com segurança. #Bizy #${produto.codigo}`
              : "Produtos selecionados para comprar pelo site ou WhatsApp. Link disponível na bio."
        }
      ],
      politica: {
        autoIndicacaoPermitida: false,
        mensagem: "Comissão não é gerada quando o criador compra pelo próprio link ou quando houver duplicidade suspeita."
      }
    };
  }

  async listarComissoes(negocioId: string) {
    return { comissoes: await this.afiliados.listarComissoes(negocioId) };
  }

  async resumir(negocioId: string) {
    return this.afiliados.resumir(negocioId);
  }

  async marcarComissaoPaga(
    id: string,
    negocioId: string,
    dados: { referenciaPagamento: string; observacao?: string | null; autorId?: string | null; autorNome?: string | null }
  ) {
    return this.afiliados.marcarComissaoPaga(id, negocioId, dados);
  }

  async criarLotePagamentoComissoes(
    negocioId: string,
    dados: Omit<NovoLotePagamentoComissao, "negocioId">
  ) {
    return this.afiliados.criarLotePagamentoComissoes({
      ...dados,
      negocioId
    });
  }

  async listarLotesPagamentoComissoes(negocioId: string) {
    return { lotes: await this.afiliados.listarLotesPagamentoComissoes(negocioId) };
  }

  async resumirSaldosComissoes(negocioId: string): Promise<ResumoSaldosComissoes> {
    const [parceiros, comissoes, lotes] = await Promise.all([
      this.afiliados.listarParceiros(negocioId),
      this.afiliados.listarComissoes(negocioId),
      this.afiliados.listarLotesPagamentoComissoes(negocioId)
    ]);
    const lotesPorAfiliado = new Map<string, Set<string>>();

    for (const lote of lotes) {
      if (lote.status !== "PAGO") continue;
      for (const item of lote.itens) {
        const ids = lotesPorAfiliado.get(item.afiliadoId) ?? new Set<string>();
        ids.add(lote.id);
        lotesPorAfiliado.set(item.afiliadoId, ids);
      }
    }

    const saldos = parceiros.map<SaldoComissaoParceiro>((parceiro) => {
      const comissoesDoParceiro = comissoes.filter((comissao) => comissao.afiliadoId === parceiro.id);
      const comissoesEstimadas = comissoesDoParceiro.filter((comissao) => comissao.status === "ESTIMADA");
      const comissoesConfirmadas = comissoesDoParceiro.filter((comissao) => comissao.status === "CONFIRMADA");
      const comissoesPagas = comissoesDoParceiro.filter((comissao) => comissao.status === "PAGA");
      const comissoesRevertidas = comissoesDoParceiro.filter((comissao) => comissao.status === "REVERTIDA");
      const comissaoEstimadaEmKwanza = this.somarComissoes(comissoesEstimadas);
      const comissaoConfirmadaEmKwanza = this.somarComissoes(comissoesConfirmadas);
      const comissaoPagaEmKwanza = this.somarComissoes(comissoesPagas);
      const comissaoRevertidaEmKwanza = this.somarComissoes(comissoesRevertidas);

      return {
        afiliadoId: parceiro.id,
        codigo: parceiro.codigo,
        nomePublico: parceiro.nomePublico,
        tipo: parceiro.tipo,
        estado: parceiro.estado,
        contacto: parceiro.contacto,
        quantidadeComissoesEstimadas: comissoesEstimadas.length,
        quantidadeComissoesConfirmadas: comissoesConfirmadas.length,
        quantidadeComissoesPagas: comissoesPagas.length,
        quantidadeComissoesRevertidas: comissoesRevertidas.length,
        comissaoEstimadaEmKwanza,
        comissaoConfirmadaEmKwanza,
        comissaoPagaEmKwanza,
        comissaoRevertidaEmKwanza,
        saldoPendenteEmKwanza: comissaoConfirmadaEmKwanza,
        lotesPagos: lotesPorAfiliado.get(parceiro.id)?.size ?? 0
      };
    });

    saldos.sort((a, b) => {
      if (b.saldoPendenteEmKwanza !== a.saldoPendenteEmKwanza) {
        return b.saldoPendenteEmKwanza - a.saldoPendenteEmKwanza;
      }
      if (b.comissaoPagaEmKwanza !== a.comissaoPagaEmKwanza) {
        return b.comissaoPagaEmKwanza - a.comissaoPagaEmKwanza;
      }
      return a.nomePublico.localeCompare(b.nomePublico);
    });

    return {
      totais: {
        totalParceiros: saldos.length,
        comissaoEstimadaEmKwanza: saldos.reduce((total, saldo) => total + saldo.comissaoEstimadaEmKwanza, 0),
        comissaoConfirmadaEmKwanza: saldos.reduce((total, saldo) => total + saldo.comissaoConfirmadaEmKwanza, 0),
        comissaoPagaEmKwanza: saldos.reduce((total, saldo) => total + saldo.comissaoPagaEmKwanza, 0),
        comissaoRevertidaEmKwanza: saldos.reduce((total, saldo) => total + saldo.comissaoRevertidaEmKwanza, 0),
        saldoPendenteEmKwanza: saldos.reduce((total, saldo) => total + saldo.saldoPendenteEmKwanza, 0),
        totalLotesPagos: lotes.filter((lote) => lote.status === "PAGO").length
      },
      saldos
    };
  }

  async exportarLotesPagamentoCsv(negocioId: string): Promise<string> {
    const lotes = await this.afiliados.listarLotesPagamentoComissoes(negocioId);
    const linhas: Array<Array<string | number | Date | null>> = [
      [
        "id",
        "referenciaPagamento",
        "status",
        "periodoInicio",
        "periodoFim",
        "quantidadeComissoes",
        "valorTotalEmKwanza",
        "moeda",
        "autorNome",
        "criadoEm"
      ],
      ...lotes.map((lote) => [
        lote.id,
        lote.referenciaPagamento,
        lote.status,
        lote.periodoInicio,
        lote.periodoFim,
        lote.quantidadeComissoes,
        lote.valorTotalEmKwanza,
        lote.moeda,
        lote.autorNome,
        lote.criadoEm
      ])
    ];

    return `${linhas.map((linha, indice) => linha.map((valor) => indice === 0 ? String(valor) : this.csv(valor)).join(",")).join("\n")}\n`;
  }

  async listarAuditoriaComissao(id: string, negocioId: string) {
    const eventos = await this.afiliados.listarHistoricoComissao(id, negocioId);
    return eventos ? { eventos } : null;
  }

  async resolverAtribuicao(
    negocioId: string,
    referencia?: string | null
  ): Promise<AtribuicaoAfiliadoResolvida | null> {
    if (!referencia?.trim()) return null;

    const link = await this.afiliados.buscarLinkPorCodigo(referencia, negocioId);
    if (!link || !link.ativo) return null;
    if (link.expiraEm && link.expiraEm.getTime() <= Date.now()) return null;

    const parceiro = await this.afiliados.buscarParceiroPorId(link.afiliadoId, negocioId);
    if (!parceiro || parceiro.estado !== "ATIVO") return null;

    return { parceiro, link };
  }

  ehAutoIndicacao(atribuicao: AtribuicaoAfiliadoResolvida | null, telefoneCliente?: string | null): boolean {
    if (!atribuicao || !telefoneCliente || !atribuicao.parceiro.contacto) return false;
    const cliente = normalizarTelefone(telefoneCliente)?.canonico;
    const parceiro = normalizarTelefone(atribuicao.parceiro.contacto)?.canonico;
    return Boolean(cliente && parceiro && cliente === parceiro);
  }

  async registrarComissaoEstimativa(dados: {
    negocioId: string;
    pedido: Pedido;
    atribuicao: AtribuicaoAfiliadoResolvida;
  }) {
    const baseEmKwanza = dados.pedido.subtotalEmKwanza;
    const valorEmKwanza = this.calcularComissao(baseEmKwanza, dados.atribuicao.parceiro.regraComissao);

    return this.afiliados.criarOuAtualizarComissao({
      negocioId: dados.negocioId,
      afiliadoId: dados.atribuicao.parceiro.id,
      linkId: dados.atribuicao.link.id,
      pedidoId: dados.pedido.id,
      status: "ESTIMADA",
      baseEmKwanza,
      valorEmKwanza,
      moeda: "AOA"
    });
  }

  private validarRegraComissao(regra: RegraComissaoParceiro): void {
    if (regra.tipo === "PERCENTUAL") {
      if (typeof regra.percentual !== "number" || regra.percentual < 0 || regra.percentual > 100) {
        throw new Error("Informe um percentual de comissão entre 0 e 100.");
      }
      return;
    }

    if (typeof regra.valorEmKwanza !== "number" || regra.valorEmKwanza < 0) {
      throw new Error("Informe um valor fixo de comissão válido.");
    }
  }

  private calcularComissao(baseEmKwanza: number, regra: RegraComissaoParceiro): number {
    if (regra.tipo === "PERCENTUAL") {
      return Math.round((baseEmKwanza * (regra.percentual ?? 0)) / 100);
    }
    return Math.min(baseEmKwanza, regra.valorEmKwanza ?? 0);
  }

  private somarComissoes(comissoes: Array<{ valorEmKwanza: number }>): number {
    return comissoes.reduce((total, comissao) => total + comissao.valorEmKwanza, 0);
  }

  private csv(valor: string | number | Date | null): string {
    if (typeof valor === "number") return String(valor);
    const normalizado = valor instanceof Date ? valor.toISOString() : valor ?? "";
    return `"${String(normalizado).replace(/"/g, '""')}"`;
  }

  private comUrlPublica(link: LinkAfiliado): LinkAfiliado & { urlPublica: string } {
    return {
      ...link,
      urlPublica: this.montarUrlPublica(link)
    };
  }

  private montarUrlPublica(link: LinkAfiliado): string {
    const base = (process.env.PUBLIC_STORE_BASE_URL ?? process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
    const slug = link.slugLoja ?? "loja";
    const caminho =
      link.destinoTipo === "PRODUTO" && link.codigoProduto
        ? `/lojas/${slug}/produtos/${link.codigoProduto}`
        : `/lojas/${slug}`;
    const params = new URLSearchParams({ ref: link.codigo });
    if (link.canal) params.set("canal", link.canal);
    if (link.origemConteudo) params.set("conteudo", link.origemConteudo);

    return `${base}${caminho}?${params.toString()}`;
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase();
  }

  private rotuloEventoReversao(tipo: "ORDER_CANCELLED" | "ORDER_RETURNED" | "ORDER_REFUNDED"): string {
    const rotulos = {
      ORDER_CANCELLED: "CANCELADO",
      ORDER_RETURNED: "DEVOLVIDO",
      ORDER_REFUNDED: "REEMBOLSADO"
    } satisfies Record<typeof tipo, string>;
    return rotulos[tipo];
  }
}
