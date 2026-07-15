import { createHash } from "node:crypto";
import type {
  RepositorioAfiliados,
  RepositorioAutenticacao,
  RepositorioPedidos,
  RepositorioTrackingComercial
} from "../../../dominio/repositorios/contratos.js";
import type { CompraUnificada, NegocioBizy, PedidoFilho } from "../../../dominio/tipos.js";
import type {
  ConversaoAtribuicaoCommerce,
  ModeloAtribuicaoCommerce,
  NovoParticipanteConversaoCommerce,
  PoliticaAtribuicaoCommerce,
  RepositorioAtribuicaoCommerce,
  ToqueAtribuivel
} from "../dominio/atribuicaoCommerce.js";
import type { RepositorioSmartLinksCommerce } from "../dominio/smartLinksCommerce.js";

interface DependenciasAtribuicaoCommerce {
  atribuicao: RepositorioAtribuicaoCommerce;
  smartLinks: RepositorioSmartLinksCommerce;
  autenticacao: RepositorioAutenticacao;
  afiliados: RepositorioAfiliados;
  pedidos: RepositorioPedidos;
  tracking: RepositorioTrackingComercial;
}

export interface DadosConversaoCompraCommerce {
  compra: CompraUnificada;
  pedidosFilho: PedidoFilho[];
  contaBizyId: string | null;
  sessaoCommerceId: string | null;
  trackingId: string | null;
  codigosProdutoPorNegocio?: Map<string, string[]>;
  agora?: Date;
}

export class AtribuicaoCommerceUseCase {
  constructor(private readonly deps: DependenciasAtribuicaoCommerce) {}

  async registrarConversoesCompra(dados: DadosConversaoCompraCommerce) {
    const agora = dados.agora ?? new Date();
    if (dados.sessaoCommerceId && dados.contaBizyId) {
      await this.deps.smartLinks.vincularConta(dados.sessaoCommerceId, dados.contaBizyId);
    }

    const conversoes: ConversaoAtribuicaoCommerce[] = [];
    for (const pedido of dados.pedidosFilho) {
      const existente = await this.deps.atribuicao.buscarConversao(pedido.negocioId, pedido.pedidoId, "ORDER_CREATED");
      if (existente) {
        conversoes.push(existente);
        continue;
      }

      const negocio = await this.deps.autenticacao.buscarNegocioPorId(pedido.negocioId);
      if (!negocio) continue;
      const politica = await this.obterPolitica(negocio);
      const pedidoPersistido = await this.deps.pedidos.buscarPorId(pedido.pedidoId, pedido.negocioId);
      const desde = new Date(agora.getTime() - politica.janelaDias * 24 * 60 * 60_000);
      const produtosInformados = dados.codigosProdutoPorNegocio?.get(pedido.negocioId) ?? [];
      const produtos = new Set((produtosInformados.length ? produtosInformados : pedidoPersistido?.itens.map((item) => item.codigoPeca) ?? [])
        .map((codigo) => codigo.toUpperCase()));
      const toques = await this.deps.smartLinks.listarToquesAtribuiveis({
        sessaoId: dados.sessaoCommerceId,
        contaBizyId: dados.contaBizyId,
        negocioId: pedido.negocioId,
        desde,
        ate: agora
      });
      const elegiveis = await this.validarElegibilidade(toques, pedido.negocioId, produtos, agora);
      const valorAtribuivelEmKwanza = this.calcularValorAtribuivel(
        elegiveis,
        pedidoPersistido?.itens ?? [],
        pedido.subtotalEmKwanza
      );
      const participantes = this.distribuirParticipantes(elegiveis, politica, valorAtribuivelEmKwanza);
      const explicacao = this.explicar({
        politica,
        elegiveis,
        participantes,
        sessaoCommerceId: dados.sessaoCommerceId,
        contaBizyId: dados.contaBizyId,
        desde,
        agora,
        produtos: [...produtos],
        valorBaseEmKwanza: pedido.subtotalEmKwanza,
        valorAtribuivelEmKwanza
      });
      const conversao = await this.deps.atribuicao.criarConversao({
        negocioId: pedido.negocioId,
        sessaoId: dados.sessaoCommerceId,
        contaBizyId: dados.contaBizyId,
        compraUnificadaId: dados.compra.id,
        pedidoId: pedido.pedidoId,
        tipo: "ORDER_CREATED",
        politica,
        valorBaseEmKwanza: pedido.subtotalEmKwanza,
        moeda: "AOA",
        explicacao,
        participantes
      });
      conversoes.push(conversao);

      await this.deps.tracking.registrarEvento({
        negocioId: pedido.negocioId,
        tipo: "ORDER_CREATED",
        entidadeTipo: "PEDIDO",
        entidadeId: pedido.pedidoId,
        trackingId: dados.trackingId,
        origem: participantes.length ? "atribuicao-commerce" : "organico",
        canal: elegiveis.at(-1)?.canal ?? "market",
        metadata: {
          idempotencyKey: `attribution:${pedido.negocioId}:${pedido.pedidoId}:ORDER_CREATED`,
          compraUnificadaId: dados.compra.id,
          conversaoAtribuicaoId: conversao.id,
          atribuicao: explicacao,
          receitaEmKwanza: pedido.subtotalEmKwanza
        }
      }).catch(() => undefined);
    }
    return conversoes;
  }

  async listarConversoesCompra(compraUnificadaId: string) {
    return this.deps.atribuicao.listarConversoesCompra(compraUnificadaId);
  }

  private async obterPolitica(negocio: NegocioBizy) {
    const configuracao = this.objeto(negocio.entrega.atribuicao);
    const modelo = this.modelo(configuracao.modeloPadrao ?? configuracao.modelo);
    const janelaDias = this.inteiro(configuracao.janelaDias ?? configuracao.janelaAtribuicaoDias, 30, 1, 365);
    const pesoPrincipalBasisPoints = this.inteiro(configuracao.pesoPrincipalBasisPoints, 7000, 1, 10_000);
    const codigo = this.texto(configuracao.codigo) ?? "market-default";
    const snapshot = { modelo, janelaDias, pesoPrincipalBasisPoints, regraAssistida: "principal-mais-assistencias" };
    const hash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex").slice(0, 12);
    const versaoDeclarada = this.texto(configuracao.versao);
    const versao = versaoDeclarada ? `${versaoDeclarada}-${hash}` : `v-${hash}`;
    return this.deps.atribuicao.obterOuCriarPolitica({
      negocioId: negocio.id,
      codigo,
      versao,
      modelo,
      janelaDias,
      pesoPrincipalBasisPoints,
      regras: snapshot
    });
  }

  private async validarElegibilidade(
    toques: ToqueAtribuivel[],
    negocioId: string,
    produtos: Set<string>,
    agora: Date
  ) {
    const [links, parceiros] = await Promise.all([
      this.deps.afiliados.listarLinks(negocioId),
      this.deps.afiliados.listarParceiros(negocioId)
    ]);
    const linksAtivos = new Map(links.filter((link) => link.ativo && (!link.expiraEm || link.expiraEm > agora)).map((link) => [link.id, link]));
    const parceirosAtivos = new Set(parceiros.filter((parceiro) => parceiro.estado === "ATIVO").map((parceiro) => parceiro.id));
    return toques.filter((toque) =>
      linksAtivos.has(toque.linkId) &&
      parceirosAtivos.has(toque.afiliadoId) &&
      (!toque.codigoProduto || produtos.has(toque.codigoProduto.toUpperCase()))
    );
  }

  private distribuirParticipantes(
    toques: ToqueAtribuivel[],
    politica: PoliticaAtribuicaoCommerce,
    valorBaseEmKwanza: number
  ): NovoParticipanteConversaoCommerce[] {
    if (!toques.length) return [];
    const unicos = this.toquesUnicosPorLink(toques);
    const principal = politica.modelo === "PRIMEIRO_TOQUE" ? unicos[0] : unicos.at(-1);
    if (!principal) return [];

    const assistencias = politica.modelo === "CONVERSAO_ASSISTIDA"
      ? unicos.filter((toque) => toque.linkId !== principal.linkId).slice(-19)
      : [];
    const pesoPrincipal = assistencias.length
      ? Math.min(9999, politica.pesoPrincipalBasisPoints)
      : 10_000;
    const restante = 10_000 - pesoPrincipal;
    const pesoBaseAssistencia = assistencias.length ? Math.floor(restante / assistencias.length) : 0;
    let sobraPeso = restante - pesoBaseAssistencia * assistencias.length;
    const pesos = [pesoPrincipal, ...assistencias.map(() => pesoBaseAssistencia + (sobraPeso-- > 0 ? 1 : 0))];
    const selecionados = [principal, ...assistencias];
    const valores = pesos.map((peso) => Math.floor(valorBaseEmKwanza * peso / 10_000));
    valores[0] = (valores[0] ?? 0) + valorBaseEmKwanza - valores.reduce((total, valor) => total + valor, 0);

    return selecionados.map((toque, indice) => ({
      toqueId: toque.id,
      parceiroId: toque.afiliadoId,
      linkId: toque.linkId,
      papel: indice === 0 ? "PRINCIPAL" : `ASSISTENCIA_${indice}`,
      pesoBasisPoints: pesos[indice] ?? 0,
      valorAtribuidoEmKwanza: valores[indice] ?? 0,
      motivo: indice === 0
        ? `Toque principal seleccionado pelo modelo ${politica.modelo}.`
        : "Toque elegivel que assistiu a conversao dentro da janela."
    }));
  }

  private calcularValorAtribuivel(
    toques: ToqueAtribuivel[],
    itens: Array<{ codigoPeca: string; subtotalEmKwanza: number }>,
    subtotalPedido: number
  ) {
    if (!toques.length) return 0;
    if (toques.some((toque) => !toque.codigoProduto)) return subtotalPedido;
    const produtosAtribuidos = new Set(toques.flatMap((toque) => toque.codigoProduto ? [toque.codigoProduto.toUpperCase()] : []));
    return itens
      .filter((item) => produtosAtribuidos.has(item.codigoPeca.toUpperCase()))
      .reduce((total, item) => total + item.subtotalEmKwanza, 0);
  }

  private toquesUnicosPorLink(toques: ToqueAtribuivel[]) {
    const unicos = new Map<string, ToqueAtribuivel>();
    for (const toque of toques) unicos.set(toque.linkId, toque);
    return [...unicos.values()].sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());
  }

  private explicar(dados: {
    politica: PoliticaAtribuicaoCommerce;
    elegiveis: ToqueAtribuivel[];
    participantes: NovoParticipanteConversaoCommerce[];
    sessaoCommerceId: string | null;
    contaBizyId: string | null;
    desde: Date;
    agora: Date;
    produtos: string[];
    valorBaseEmKwanza: number;
    valorAtribuivelEmKwanza: number;
  }) {
    return {
      schema: "bizy.commerce.attribution.v1",
      modelo: dados.politica.modelo,
      regra: dados.politica.codigo,
      versao: dados.politica.versao,
      janelaDias: dados.politica.janelaDias,
      janela: { desde: dados.desde.toISOString(), ate: dados.agora.toISOString() },
      produtos: dados.produtos,
      valorBaseEmKwanza: dados.valorBaseEmKwanza,
      valorAtribuivelEmKwanza: dados.valorAtribuivelEmKwanza,
      sessaoCommerceId: dados.sessaoCommerceId,
      contaBizyId: dados.contaBizyId,
      crossDevice: Boolean(dados.contaBizyId && dados.elegiveis.some((toque) => toque.sessaoId !== dados.sessaoCommerceId)),
      toquesConsiderados: dados.elegiveis.map((toque) => ({
        toqueId: toque.id,
        sessaoId: toque.sessaoId,
        parceiroId: toque.afiliadoId,
        linkId: toque.linkId,
        produto: toque.codigoProduto,
        campanhaId: toque.campanhaId,
        conteudoId: toque.conteudoId,
        canal: toque.canal,
        capturadoEm: toque.criadoEm.toISOString()
      })),
      participantes: dados.participantes.map((participante) => ({
        toqueId: participante.toqueId,
        parceiroId: participante.parceiroId,
        linkId: participante.linkId,
        papel: participante.papel,
        pesoBasisPoints: participante.pesoBasisPoints,
        valorAtribuidoEmKwanza: participante.valorAtribuidoEmKwanza,
        motivo: participante.motivo
      })),
      motivo: dados.participantes.length
        ? "Conversao atribuida a toques validos segundo a politica congelada."
        : "Conversao organica: nenhum toque elegivel foi encontrado na janela."
    };
  }

  private modelo(valor: unknown): ModeloAtribuicaoCommerce {
    const normalizado = typeof valor === "string" ? valor.trim().toUpperCase().replace(/[\s-]+/g, "_") : "";
    if (normalizado === "PRIMEIRO_TOQUE" || normalizado === "CONVERSAO_ASSISTIDA") return normalizado;
    return "ULTIMO_TOQUE";
  }

  private inteiro(valor: unknown, padrao: number, minimo: number, maximo: number) {
    const numero = typeof valor === "number" ? valor : typeof valor === "string" ? Number(valor) : NaN;
    return Number.isFinite(numero) ? Math.min(maximo, Math.max(minimo, Math.trunc(numero))) : padrao;
  }

  private texto(valor: unknown) {
    return typeof valor === "string" && valor.trim() ? valor.trim().slice(0, 80) : null;
  }

  private objeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
  }
}
