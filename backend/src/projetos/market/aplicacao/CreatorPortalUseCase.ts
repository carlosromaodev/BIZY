import { randomBytes } from "node:crypto";
import type {
  RepositorioAfiliados,
  RepositorioTrackingComercial
} from "../../../dominio/repositorios/contratos.js";
import type { ContaBizy } from "../../commerce/dominio/tipos.js";
import type { RepositorioContaBizy } from "../../commerce/dominio/contratos.js";

interface DependenciasCreatorPortal {
  contas: RepositorioContaBizy;
  afiliados: RepositorioAfiliados;
  tracking: RepositorioTrackingComercial;
}

const TIPOS_DESTINO = new Set(["LOJA", "PRODUTO", "CAMPANHA", "CONTEUDO", "CARRINHO", "MINI_LOJA", "LEARNING"]);

export class CreatorPortalUseCase {
  constructor(private readonly deps: DependenciasCreatorPortal) {}

  async obterPortal(conta: ContaBizy) {
    const parceiros = await this.parceirosDaConta(conta);
    const porNegocio = new Map<string, typeof parceiros>();
    for (const parceiro of parceiros) {
      const lista = porNegocio.get(parceiro.negocioId) ?? [];
      lista.push(parceiro);
      porNegocio.set(parceiro.negocioId, lista);
    }

    const blocos = await Promise.all([...porNegocio.entries()].map(async ([negocioId, parceirosNegocio]) => {
      const ids = new Set(parceirosNegocio.map((item) => item.id));
      const [linksTodos, comissoesTodas, lotesTodos, eventos] = await Promise.all([
        this.deps.afiliados.listarLinks(negocioId),
        this.deps.afiliados.listarComissoes(negocioId),
        this.deps.afiliados.listarLotesPagamentoComissoes(negocioId),
        this.deps.tracking.listarEventos(negocioId, { limite: 5_000 })
      ]);
      const links = linksTodos.filter((item) => ids.has(item.afiliadoId));
      const linkIds = new Set(links.map((item) => item.id));
      const linkCodigos = new Set(links.map((item) => item.codigo));
      const comissoes = comissoesTodas.filter((item) => ids.has(item.afiliadoId));
      const eventosElegiveis = eventos.filter((evento) => {
        const metadata = evento.metadata ?? {};
        const parceiroId = String(metadata.afiliadoId ?? metadata.parceiroId ?? "");
        const linkId = String(metadata.linkId ?? "");
        const codigo = String(metadata.codigoLink ?? metadata.linkCodigo ?? "").toUpperCase();
        return ids.has(parceiroId) || linkIds.has(linkId) || linkCodigos.has(codigo);
      });
      const pagamentos = lotesTodos.flatMap((lote) => {
        const itens = lote.itens.filter((item) => ids.has(item.afiliadoId));
        if (!itens.length) return [];
        return [{
          id: lote.id,
          referencia: lote.referenciaPagamento,
          status: lote.status,
          valorEmKwanza: itens.reduce((total, item) => total + item.valorEmKwanza, 0),
          moeda: lote.moeda,
          criadoEm: lote.criadoEm
        }];
      });
      return { parceirosNegocio, links, comissoes, eventosElegiveis, pagamentos };
    }));

    const links = blocos.flatMap((item) => item.links);
    const comissoes = blocos.flatMap((item) => item.comissoes);
    const eventos = blocos.flatMap((item) => item.eventosElegiveis);
    const pagamentos = blocos.flatMap((item) => item.pagamentos);
    const contar = (...tipos: string[]) => eventos.filter((evento) => tipos.includes(evento.tipo)).length;
    const somar = (status: string[]) => comissoes
      .filter((item) => status.includes(item.status))
      .reduce((total, item) => total + item.valorEmKwanza, 0);

    return {
      conta: { id: conta.id, nome: conta.nome },
      parceiros: parceiros.map((item) => ({
        id: item.id,
        negocioId: item.negocioId,
        tipo: item.tipo,
        codigo: item.codigo,
        nomePublico: item.nomePublico,
        estado: item.estado
      })),
      metricas: {
        cliquesValidos: contar("SMART_LINK_CLICK", "LINK_CLICK"),
        visualizacoes: contar("CONTENT_IMPRESSION", "CONTENT_VIEW", "PRODUCT_VIEW", "VISUALIZACAO_PRODUTO"),
        checkouts: contar("CHECKOUT_STARTED", "CHECKOUT_INICIADO"),
        pedidos: new Set(comissoes.map((item) => item.pedidoId)).size,
        receitaAtribuidaEmKwanza: comissoes.reduce((total, item) => total + item.baseEmKwanza, 0),
        comissaoEstimadaEmKwanza: somar(["ESTIMADA"]),
        comissaoConfirmadaEmKwanza: somar(["CONFIRMADA"]),
        comissaoRetidaEmKwanza: somar(["RETIDA"]),
        saldoDisponivelEmKwanza: somar(["CONFIRMADA"]),
        comissaoPagaEmKwanza: somar(["PAGA"]),
        comissaoRevertidaEmKwanza: somar(["REVERTIDA", "CANCELADA"]),
        disputas: 0
      },
      links,
      comissoes,
      pagamentos: pagamentos.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
    };
  }

  async criarLink(conta: ContaBizy, dados: {
    parceiroId: string;
    destinoTipo: string;
    destinoId?: string | null;
    slugLoja?: string | null;
    codigoProduto?: string | null;
    canal?: string | null;
  }) {
    const parceiros = await this.parceirosDaConta(conta);
    const parceiro = parceiros.find((item) => item.id === dados.parceiroId && item.estado === "ATIVO");
    if (!parceiro || !TIPOS_DESTINO.has(dados.destinoTipo)) throw new Error("RECURSO_NAO_ENCONTRADO");
    const codigo = `CR-${randomBytes(7).toString("base64url").toUpperCase()}`;
    return this.deps.afiliados.criarLink({
      negocioId: parceiro.negocioId,
      afiliadoId: parceiro.id,
      codigo,
      destinoTipo: dados.destinoTipo,
      destinoId: dados.destinoId ?? null,
      slugLoja: dados.slugLoja ?? null,
      codigoProduto: dados.codigoProduto ?? null,
      canal: dados.canal ?? "creator-portal",
      metadata: { criadoNoPortal: true }
    });
  }

  private async parceirosDaConta(conta: ContaBizy) {
    let parceiros = await this.deps.afiliados.listarParceirosPorConta(conta.id);
    if (!parceiros.length && conta.telefoneVerificadoEm && conta.telefoneCanonico) {
      const canonico = conta.telefoneCanonico;
      const nacional = canonico.replace(/^\+?244/, "");
      parceiros = await this.deps.afiliados.associarParceirosPorContactoVerificado(
        conta.id,
        [canonico, canonico.replace(/^\+/, ""), nacional]
      );
    }
    for (const parceiro of parceiros) {
      await this.deps.contas.garantirContexto(
        conta.id,
        parceiro.tipo === "CRIADOR" ? "CRIADOR" : "AFILIADO",
        parceiro.negocioId
      );
    }
    return parceiros;
  }
}
