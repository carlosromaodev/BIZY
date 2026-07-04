import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Plus,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { requisitarApi, obterBaseApiUrl, obterNegocioActualId, obterToken } from "../api";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  TableCard,
  Table,
  TableHead,
  Th,
  Td,
  StatusBadge,
  BotaoBizy,
  TabsBizy,
  PanelCard,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";

/* ── Tipos ────────────────────────────────────────────────────── */

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: string;
  cor: string | null;
}

interface MovimentoFinanceiro {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  origemTipo?: string | null;
  origemId?: string | null;
  metodoPagamento?: string | null;
  referenciaPagamento?: string | null;
  comprovativoUrl?: string | null;
  dataMovimento: string;
  categoria: { id: string; nome: string; tipo: string; cor: string | null } | null;
}

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  fornecedor: string | null;
  tipoRecorrencia: string;
  comprovativoUrl?: string | null;
  dataVencimento: string | null;
  pago: boolean;
  pagoEm: string | null;
  categoria: { id: string; nome: string; cor: string | null } | null;
}

interface FluxoCaixa {
  saldo: number;
  totalEntradas: number;
  totalSaidas: number;
  periodo: { de: string; ate: string };
  porDia: Array<{ dia: string; entradas: number; saidas: number }>;
  porCategoria: Array<{ categoria: string; tipo: string; total: number }>;
}

interface Factura {
  id: string;
  pedidoId?: string | null;
  serie: string;
  numero: number;
  anoFiscal: number;
  tipoDocumento?: "FACTURA" | "FACTURA_RECIBO";
  estado: string;
  estadoPagamento?: string;
  clienteNome: string;
  clienteNif: string | null;
  subtotal: number;
  ivaValor: number;
  total: number;
  valorPago?: number;
  dataVencimento?: string | null;
  pagoEm?: string | null;
  metodoPagamento?: string | null;
  referenciaPagamento?: string | null;
  comprovativoPagamentoUrl?: string | null;
  codigoValidacao?: string | null;
  emitidaEm: string;
  itens: Array<{ descricao: string; quantidade: number; precoUnitario: number; subtotal: number }>;
  _count?: { notasCredito: number };
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  estado: string;
  pagoEm: string | null;
  valorPago: number | null;
  observacao?: string | null;
}

interface ContaPagar {
  id: string;
  fornecedor: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  estado: string;
  pagoEm: string | null;
  observacao?: string | null;
}

type TabFinancas = "resumo" | "movimentos" | "despesas" | "facturas" | "receber" | "pagar";
type TipoMovimento = "ENTRADA" | "SAIDA";
type TipoDocumentoFactura = "FACTURA" | "FACTURA_RECIBO";
type DocumentoMovimento = "NENHUM" | "FACTURA" | "FACTURA_RECIBO" | "RECIBO";
type OrigemMovimento =
  | "PEDIDO"
  | "RECEBIMENTO_MANUAL"
  | "COMISSAO"
  | "FACTURA"
  | "CONTA_RECEBER"
  | "RECIBO"
  | "FORNECEDOR"
  | "DESPESA"
  | "IMPOSTO"
  | "COMISSAO_PAGA"
  | "NOTA_CREDITO"
  | "CONTA_PAGAR"
  | "REEMBOLSO"
  | "PROJECTO";

const ORIGENS_MOVIMENTO: Record<TipoMovimento, Array<{ valor: OrigemMovimento; rotulo: string }>> = {
  ENTRADA: [
    { valor: "RECEBIMENTO_MANUAL", rotulo: "Recebimento manual" },
    { valor: "PEDIDO", rotulo: "Pedido" },
    { valor: "FACTURA", rotulo: "Factura" },
    { valor: "CONTA_RECEBER", rotulo: "Conta a receber" },
    { valor: "COMISSAO", rotulo: "Comissão" },
    { valor: "RECIBO", rotulo: "Recibo" },
  ],
  SAIDA: [
    { valor: "FORNECEDOR", rotulo: "Fornecedor" },
    { valor: "DESPESA", rotulo: "Despesa" },
    { valor: "CONTA_PAGAR", rotulo: "Conta a pagar" },
    { valor: "IMPOSTO", rotulo: "Imposto" },
    { valor: "COMISSAO_PAGA", rotulo: "Comissão paga" },
    { valor: "REEMBOLSO", rotulo: "Reembolso" },
    { valor: "PROJECTO", rotulo: "Projecto" },
    { valor: "NOTA_CREDITO", rotulo: "Nota de crédito" },
  ],
};

/* ── Página ───────────────────────────────────────────────────── */

export function PaginaFinancas() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<TabFinancas>("resumo");
  const [fluxo, setFluxo] = useState<FluxoCaixa | null>(null);
  const [movimentos, setMovimentos] = useState<MovimentoFinanceiro[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [acaoEmCurso, setAcaoEmCurso] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [mostrarFormDespesa, setMostrarFormDespesa] = useState(false);
  const [mostrarFormMovimento, setMostrarFormMovimento] = useState(false);
  const [mostrarFormFactura, setMostrarFormFactura] = useState(false);
  const [mostrarFormReceber, setMostrarFormReceber] = useState(false);
  const [mostrarFormPagar, setMostrarFormPagar] = useState(false);

  // form despesa
  const [descDespesa, setDescDespesa] = useState("");
  const [valorDespesa, setValorDespesa] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [catIdDespesa, setCatIdDespesa] = useState("");
  const [comprovativoDespesaUrl, setComprovativoDespesaUrl] = useState("");

  // form movimento
  const [descMov, setDescMov] = useState("");
  const [valorMov, setValorMov] = useState("");
  const [tipoMov, setTipoMov] = useState<TipoMovimento>("ENTRADA");
  const [origemMov, setOrigemMov] = useState<OrigemMovimento>("RECEBIMENTO_MANUAL");
  const [origemIdMov, setOrigemIdMov] = useState("");
  const [documentoMov, setDocumentoMov] = useState<DocumentoMovimento>("NENHUM");
  const [movClienteNome, setMovClienteNome] = useState("");
  const [movClienteNif, setMovClienteNif] = useState("");
  const [movFacturaId, setMovFacturaId] = useState("");
  const [movMetodoPagamento, setMovMetodoPagamento] = useState("Transferência");
  const [movReferenciaPagamento, setMovReferenciaPagamento] = useState("");
  const [movComprovativoUrl, setMovComprovativoUrl] = useState("");
  const [movIva, setMovIva] = useState("0");
  const [catIdMov, setCatIdMov] = useState("");

  // form factura
  const [ftClienteNome, setFtClienteNome] = useState("");
  const [ftClienteNif, setFtClienteNif] = useState("");
  const [ftTipoDocumento, setFtTipoDocumento] = useState<TipoDocumentoFactura>("FACTURA");
  const [ftVencimento, setFtVencimento] = useState(dataInputDaqui(7));
  const [ftMetodoPagamento, setFtMetodoPagamento] = useState("Transferência");
  const [ftReferenciaPagamento, setFtReferenciaPagamento] = useState("");
  const [ftComprovativoUrl, setFtComprovativoUrl] = useState("");
  const [ftMovimentoOrigemId, setFtMovimentoOrigemId] = useState("");
  const [ftIva, setFtIva] = useState("14");
  const [ftObs, setFtObs] = useState("");
  const [ftItens, setFtItens] = useState([{ descricao: "", quantidade: "1", precoUnitario: "" }]);
  const [facturaPagamento, setFacturaPagamento] = useState<Factura | null>(null);
  const [pagamentoValor, setPagamentoValor] = useState("");
  const [pagamentoMetodo, setPagamentoMetodo] = useState("Transferência");
  const [pagamentoReferencia, setPagamentoReferencia] = useState("");
  const [pagamentoComprovativoUrl, setPagamentoComprovativoUrl] = useState("");
  const [notaCreditoFactura, setNotaCreditoFactura] = useState<Factura | null>(null);
  const [notaCreditoValor, setNotaCreditoValor] = useState("");
  const [notaCreditoMotivo, setNotaCreditoMotivo] = useState("");

  // form contas
  const [recDescricao, setRecDescricao] = useState("");
  const [recValor, setRecValor] = useState("");
  const [recVencimento, setRecVencimento] = useState(dataInputDaqui(7));
  const [recObs, setRecObs] = useState("");
  const [pagFornecedor, setPagFornecedor] = useState("");
  const [pagDescricao, setPagDescricao] = useState("");
  const [pagValor, setPagValor] = useState("");
  const [pagVencimento, setPagVencimento] = useState(dataInputDaqui(7));
  const [pagObs, setPagObs] = useState("");
  const pedidoIdFiltro = searchParams.get("pedidoId");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const [fc, mv, dp, ct, ft, cr, cp] = await Promise.allSettled([
        requisitarApi<FluxoCaixa>("/financas/fluxo-caixa"),
        requisitarApi<{ movimentos: MovimentoFinanceiro[] }>("/financas/movimentos?limite=50"),
        requisitarApi<{ despesas: Despesa[] }>("/financas/despesas"),
        requisitarApi<{ categorias: CategoriaFinanceira[] }>("/financas/categorias"),
        requisitarApi<{ facturas: Factura[] }>(pedidoIdFiltro ? `/financas/facturas?pedidoId=${encodeURIComponent(pedidoIdFiltro)}` : "/financas/facturas"),
        requisitarApi<{ contas: ContaReceber[] }>("/financas/contas-receber"),
        requisitarApi<{ contas: ContaPagar[] }>("/financas/contas-pagar"),
      ]);
      setFluxo(fc.status === "fulfilled" ? fc.value : null);
      setMovimentos(mv.status === "fulfilled" ? mv.value.movimentos : []);
      setDespesas(dp.status === "fulfilled" ? dp.value.despesas : []);
      setCategorias(ct.status === "fulfilled" ? ct.value.categorias : []);
      setFacturas(ft.status === "fulfilled" ? ft.value.facturas : []);
      setContasReceber(cr.status === "fulfilled" ? cr.value.contas : []);
      setContasPagar(cp.status === "fulfilled" ? cp.value.contas : []);
      const falhas = [
        fc.status === "rejected" ? `fluxo de caixa (${mensagemErro(fc.reason)})` : null,
        mv.status === "rejected" ? `movimentos (${mensagemErro(mv.reason)})` : null,
        dp.status === "rejected" ? `despesas (${mensagemErro(dp.reason)})` : null,
        ct.status === "rejected" ? `categorias (${mensagemErro(ct.reason)})` : null,
        ft.status === "rejected" ? `facturas (${mensagemErro(ft.reason)})` : null,
        cr.status === "rejected" ? `contas a receber (${mensagemErro(cr.reason)})` : null,
        cp.status === "rejected" ? `contas a pagar (${mensagemErro(cp.reason)})` : null,
      ].filter(Boolean);
      if (falhas.length > 0) setErro(`Não foi possível carregar ${falhas.join(", ")}.`);
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível carregar as finanças."));
    }
    finally { setCarregando(false); }
  }

  async function inicializarCategorias() {
    setAcaoEmCurso("categorias");
    setErro("");
    setSucesso("");
    try {
      await requisitarApi("/financas/categorias/inicializar", { method: "POST" });
      setSucesso("Categorias financeiras inicializadas.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível inicializar as categorias."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function criarDespesa() {
    setErro("");
    setSucesso("");
    let valor: number;
    try {
      if (!descDespesa.trim()) throw new Error("Informe a descrição da despesa.");
      valor = inteiroPositivo(valorDespesa, "Valor da despesa");
      if (comprovativoDespesaUrl.trim()) validarUrl(comprovativoDespesaUrl, "Comprovativo da despesa");
    } catch (err) {
      setErro(mensagemErro(err));
      return;
    }
    setAcaoEmCurso("despesa");
    try {
      await requisitarApi("/financas/despesas", {
        method: "POST",
        body: {
          descricao: descDespesa.trim(),
          valor,
          fornecedor: fornecedor || undefined,
          categoriaId: catIdDespesa || undefined,
          comprovativoUrl: comprovativoDespesaUrl.trim() || undefined,
        },
      });
      setDescDespesa(""); setValorDespesa(""); setFornecedor(""); setCatIdDespesa(""); setComprovativoDespesaUrl("");
      setMostrarFormDespesa(false);
      setSucesso("Despesa criada e registada no ledger.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível criar a despesa."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function criarMovimento() {
    setErro("");
    setSucesso("");
    let valor: number;
    let ivaPercentual: number | undefined;
    try {
      if (!descMov.trim()) throw new Error("Informe a descrição do movimento.");
      valor = inteiroPositivo(valorMov, "Valor do movimento");
      if (documentoMov === "FACTURA" || documentoMov === "FACTURA_RECIBO") {
        if (!movClienteNome.trim()) throw new Error("Informe o cliente para emitir documento fiscal.");
        ivaPercentual = numeroPercentual(movIva, "IVA do documento");
      }
      if (documentoMov === "RECIBO" && !movFacturaId.trim() && !(origemMov === "FACTURA" && origemIdMov.trim())) {
        throw new Error("Informe a factura para gerar recibo.");
      }
      if (movComprovativoUrl.trim()) validarUrl(movComprovativoUrl, "Comprovativo do movimento");
    } catch (err) {
      setErro(mensagemErro(err));
      return;
    }
    setAcaoEmCurso("movimento");
    try {
      const resposta = await requisitarApi<{ tipoResultado?: string }>("/financas/movimentos", {
        method: "POST",
        body: {
          tipo: tipoMov,
          descricao: descMov.trim(),
          valor,
          origemTipo: normalizarOrigemMovimento(tipoMov, origemMov),
          origemId: origemIdMov.trim() || undefined,
          categoriaId: catIdMov || undefined,
          documentoFiscal: documentoMov,
          clienteNome: movClienteNome.trim() || undefined,
          clienteNif: movClienteNif.trim() || undefined,
          facturaId: movFacturaId.trim() || undefined,
          ivaPercentual,
          metodoPagamento: tipoMov === "ENTRADA" ? movMetodoPagamento.trim() || undefined : undefined,
          referenciaPagamento: movReferenciaPagamento.trim() || undefined,
          comprovativoUrl: movComprovativoUrl.trim() || undefined,
        },
      });
      setDescMov(""); setValorMov(""); setTipoMov("ENTRADA"); setOrigemMov("RECEBIMENTO_MANUAL"); setOrigemIdMov("");
      setDocumentoMov("NENHUM"); setMovClienteNome(""); setMovClienteNif(""); setMovFacturaId(""); setMovIva("0");
      setMovMetodoPagamento("Transferência"); setMovReferenciaPagamento(""); setMovComprovativoUrl(""); setCatIdMov("");
      setMostrarFormMovimento(false);
      setSucesso(mensagemResultadoMovimento(resposta.tipoResultado));
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível registar o movimento."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function emitirFactura() {
    setErro("");
    setSucesso("");
    let ivaPercentual: number;
    let itens: Array<{ descricao: string; quantidade: number; precoUnitario: number }>;
    try {
      if (!ftClienteNome.trim()) throw new Error("Informe o nome do cliente.");
      ivaPercentual = numeroPercentual(ftIva, "IVA");
      if (ftTipoDocumento === "FACTURA" && !ftVencimento) throw new Error("Informe a data de vencimento da factura.");
      if (ftTipoDocumento === "FACTURA_RECIBO" && !ftMetodoPagamento.trim()) throw new Error("Informe o método de pagamento da factura-recibo.");
      if (ftComprovativoUrl.trim()) validarUrl(ftComprovativoUrl, "Comprovativo digital");
      itens = ftItens.map((i, indice) => ({
        descricao: textoObrigatorio(i.descricao, `Descrição do item ${indice + 1}`),
        quantidade: inteiroPositivo(i.quantidade, `Quantidade do item ${indice + 1}`),
        precoUnitario: inteiroPositivo(i.precoUnitario, `Preço do item ${indice + 1}`),
      }));
      const movimentoOrigem = ftMovimentoOrigemId.trim()
        ? movimentos.find((movimento) => movimento.id === ftMovimentoOrigemId.trim())
        : null;
      if (ftMovimentoOrigemId.trim() && ftTipoDocumento !== "FACTURA_RECIBO") {
        throw new Error("Movimento financeiro existente só pode ser relacionado com factura-recibo.");
      }
      if (movimentoOrigem) {
        const totalFactura = totalDocumento(itens, ivaPercentual);
        if (totalFactura !== movimentoOrigem.valor) {
          throw new Error("O total da factura-recibo deve coincidir com o valor do movimento selecionado.");
        }
      }
    } catch (err) {
      setErro(mensagemErro(err));
      return;
    }
    setAcaoEmCurso("factura");
    try {
      await requisitarApi("/financas/facturas", {
        method: "POST",
        body: {
          clienteNome: ftClienteNome.trim(),
          clienteNif: ftClienteNif || undefined,
          tipoDocumento: ftTipoDocumento,
          ivaPercentual,
          dataVencimento: ftTipoDocumento === "FACTURA" ? ftVencimento : undefined,
          movimentoOrigemId: ftTipoDocumento === "FACTURA_RECIBO" ? ftMovimentoOrigemId.trim() || undefined : undefined,
          metodoPagamento: ftTipoDocumento === "FACTURA_RECIBO" ? ftMetodoPagamento.trim() : undefined,
          referenciaPagamento: ftTipoDocumento === "FACTURA_RECIBO" ? ftReferenciaPagamento.trim() || undefined : undefined,
          comprovativoUrl: ftTipoDocumento === "FACTURA_RECIBO" ? ftComprovativoUrl.trim() || undefined : undefined,
          observacao: ftObs || undefined,
          itens,
        },
      });
      setFtClienteNome(""); setFtClienteNif(""); setFtTipoDocumento("FACTURA"); setFtVencimento(dataInputDaqui(7));
      setFtMetodoPagamento("Transferência"); setFtReferenciaPagamento(""); setFtComprovativoUrl(""); setFtMovimentoOrigemId(""); setFtIva("14"); setFtObs("");
      setFtItens([{ descricao: "", quantidade: "1", precoUnitario: "" }]);
      setMostrarFormFactura(false);
      setSucesso(ftTipoDocumento === "FACTURA_RECIBO"
        ? "Factura-recibo emitida, recibo lançado e comprovativo associado."
        : "Factura emitida e colocada em contas a receber.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível emitir a factura."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function descarregarPdfFactura(id: string) {
    setErro("");
    setSucesso("");
    setAcaoEmCurso(`pdf:${id}`);
    try {
      const headers: Record<string, string> = {};
      const token = obterToken();
      const negocioId = obterNegocioActualId();
      if (token) headers.Authorization = `Bearer ${token}`;
      if (negocioId) headers["X-Bizy-Negocio-Id"] = negocioId;
      const res = await fetch(`${obterBaseApiUrl()}/financas/facturas/${id}/pdf`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error(await mensagemErroRespostaPdf(res));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível descarregar o PDF da factura."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function anularFactura(id: string) {
    const motivo = prompt("Motivo da anulação:");
    if (!motivo) return;
    if (motivo.trim().length < 5) {
      setErro("O motivo da anulação deve ter pelo menos 5 caracteres.");
      return;
    }
    setErro("");
    setSucesso("");
    setAcaoEmCurso(`anular:${id}`);
    try {
      await requisitarApi(`/financas/facturas/${id}/anular`, { method: "POST", body: { motivo: motivo.trim() } });
      setSucesso("Factura anulada.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível anular a factura."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  function abrirPagamentoFactura(factura: Factura) {
    const pendente = Math.max(0, factura.total - (factura.valorPago ?? 0));
    setFacturaPagamento(factura);
    setPagamentoValor(String(pendente || factura.total));
    setPagamentoMetodo(factura.metodoPagamento ?? "Transferência");
    setPagamentoReferencia(factura.referenciaPagamento ?? "");
    setPagamentoComprovativoUrl(factura.comprovativoPagamentoUrl ?? "");
    setNotaCreditoFactura(null);
  }

  async function gerarReciboFactura() {
    if (!facturaPagamento) return;
    setErro("");
    setSucesso("");
    let valorPago: number;
    try {
      valorPago = inteiroPositivo(pagamentoValor, "Valor recebido");
      if (!pagamentoMetodo.trim()) throw new Error("Informe o método de pagamento.");
      if (pagamentoComprovativoUrl.trim()) validarUrl(pagamentoComprovativoUrl, "Comprovativo digital");
    } catch (err) {
      setErro(mensagemErro(err));
      return;
    }

    setAcaoEmCurso(`recibo:${facturaPagamento.id}`);
    try {
      const blob = await requisitarPdfAutenticado("/financas/recibos", {
        method: "POST",
        body: JSON.stringify({
          clienteNome: facturaPagamento.clienteNome,
          clienteNif: facturaPagamento.clienteNif ?? undefined,
          valorPago,
          metodoPagamento: pagamentoMetodo.trim(),
          referencia: pagamentoReferencia.trim() || undefined,
          comprovativoUrl: pagamentoComprovativoUrl.trim() || undefined,
          facturaId: facturaPagamento.id,
          observacao: "Recibo gerado a partir da factura no Bizy."
        })
      });
      baixarBlob(blob, `recibo-${facturaPagamento.serie}-${facturaPagamento.numero}.pdf`);
      setFacturaPagamento(null);
      setSucesso("Recibo emitido e pagamento associado à factura.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível emitir o recibo."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  function abrirNotaCredito(factura: Factura) {
    const pendenteCredito = Math.max(0, factura.total);
    setNotaCreditoFactura(factura);
    setNotaCreditoValor(String(pendenteCredito));
    setNotaCreditoMotivo("");
    setFacturaPagamento(null);
  }

  async function emitirNotaCredito() {
    if (!notaCreditoFactura) return;
    setErro("");
    setSucesso("");
    let valor: number;
    try {
      valor = inteiroPositivo(notaCreditoValor, "Valor da nota de crédito");
      if (notaCreditoMotivo.trim().length < 5) throw new Error("Informe um motivo com pelo menos 5 caracteres.");
    } catch (err) {
      setErro(mensagemErro(err));
      return;
    }

    setAcaoEmCurso(`nota:${notaCreditoFactura.id}`);
    try {
      await requisitarApi("/financas/notas-credito", {
        method: "POST",
        body: {
          facturaId: notaCreditoFactura.id,
          valor,
          motivo: notaCreditoMotivo.trim()
        }
      });
      setNotaCreditoFactura(null);
      setSucesso("Nota de crédito emitida e lançada no financeiro.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível emitir a nota de crédito."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function marcarDespesaPaga(id: string) {
    setErro("");
    setSucesso("");
    setAcaoEmCurso(`despesa:${id}`);
    try {
      await requisitarApi(`/financas/despesas/${id}/pagar`, { method: "POST" });
      setSucesso("Despesa marcada como paga.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível marcar a despesa como paga."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function criarContaReceber() {
    setErro("");
    setSucesso("");
    let valor: number;
    try {
      if (!recDescricao.trim()) throw new Error("Informe a descrição da conta a receber.");
      if (!recVencimento) throw new Error("Informe a data de vencimento.");
      valor = inteiroPositivo(recValor, "Valor a receber");
    } catch (err) {
      setErro(mensagemErro(err));
      return;
    }
    setAcaoEmCurso("conta-receber");
    try {
      await requisitarApi("/financas/contas-receber", {
        method: "POST",
        body: {
          descricao: recDescricao.trim(),
          valor,
          dataVencimento: recVencimento,
          observacao: recObs || undefined,
        },
      });
      setRecDescricao(""); setRecValor(""); setRecVencimento(dataInputDaqui(7)); setRecObs("");
      setMostrarFormReceber(false);
      setSucesso("Conta a receber criada.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível criar a conta a receber."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function receberConta(conta: ContaReceber) {
    setErro("");
    setSucesso("");
    setAcaoEmCurso(`receber:${conta.id}`);
    try {
      await requisitarApi(`/financas/contas-receber/${conta.id}/receber`, {
        method: "POST",
        body: { valorPago: conta.valor },
      });
      setSucesso("Conta recebida e lançada como entrada financeira.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível receber a conta."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function criarContaPagar() {
    setErro("");
    setSucesso("");
    let valor: number;
    try {
      if (!pagFornecedor.trim()) throw new Error("Informe o fornecedor.");
      if (!pagDescricao.trim()) throw new Error("Informe a descrição da conta a pagar.");
      if (!pagVencimento) throw new Error("Informe a data de vencimento.");
      valor = inteiroPositivo(pagValor, "Valor a pagar");
    } catch (err) {
      setErro(mensagemErro(err));
      return;
    }
    setAcaoEmCurso("conta-pagar");
    try {
      await requisitarApi("/financas/contas-pagar", {
        method: "POST",
        body: {
          fornecedor: pagFornecedor.trim(),
          descricao: pagDescricao.trim(),
          valor,
          dataVencimento: pagVencimento,
          observacao: pagObs || undefined,
        },
      });
      setPagFornecedor(""); setPagDescricao(""); setPagValor(""); setPagVencimento(dataInputDaqui(7)); setPagObs("");
      setMostrarFormPagar(false);
      setSucesso("Conta a pagar criada.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível criar a conta a pagar."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function pagarConta(conta: ContaPagar) {
    setErro("");
    setSucesso("");
    setAcaoEmCurso(`pagar:${conta.id}`);
    try {
      await requisitarApi(`/financas/contas-pagar/${conta.id}/pagar`, { method: "POST" });
      setSucesso("Conta paga e lançada como saída financeira.");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível pagar a conta."));
    } finally {
      setAcaoEmCurso(null);
    }
  }

  useEffect(() => {
    if (pedidoIdFiltro) setTab("facturas");
    void carregar();
  }, [pedidoIdFiltro]);

  const tabs = [
    { id: "resumo" as const, rotulo: "Fluxo de caixa" },
    { id: "movimentos" as const, rotulo: "Movimentos", contagem: movimentos.length },
    { id: "despesas" as const, rotulo: "Despesas", contagem: despesas.length },
    { id: "facturas" as const, rotulo: "Facturas", contagem: facturas.length },
    { id: "receber" as const, rotulo: "A receber", contagem: contasReceber.length },
    { id: "pagar" as const, rotulo: "A pagar", contagem: contasPagar.length },
  ];

  const catsDespesa = categorias.filter((c) => c.tipo === "DESPESA");
  const catsReceita = categorias.filter((c) => c.tipo === "RECEITA");
  const contasReceberVencidas = contasReceber.filter((c) => estadoVisualConta(c) === "VENCIDO").length;
  const movimentosEntradaParaFactura = movimentos.filter(movimentoPodeOriginarFactura).slice(0, 25);
  const movimentoSelecionadoFactura = movimentos.find((m) => m.id === ftMovimentoOrigemId.trim());

  function selecionarMovimentoOrigemFactura(id: string) {
    setFtMovimentoOrigemId(id);
    const movimento = movimentos.find((m) => m.id === id);
    if (!movimento) return;

    setFtTipoDocumento("FACTURA_RECIBO");
    setFtIva("0");
    setFtMetodoPagamento(movimento.metodoPagamento ?? "Transferência");
    setFtReferenciaPagamento(movimento.referenciaPagamento ?? "");
    setFtComprovativoUrl(movimento.comprovativoUrl ?? "");
    setFtItens([{ descricao: movimento.descricao, quantidade: "1", precoUnitario: String(movimento.valor) }]);
  }

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow="Gestão financeira"
        titulo="Finanças"
        tamanhoTitulo="sm"
      >
        <BotaoBizy icone={Plus} onClick={() => { setMostrarFormMovimento(true); setTab("movimentos"); }}>Movimento</BotaoBizy>
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      {categorias.length === 0 && !carregando && (
        <PanelCard titulo="Configuração inicial">
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 12 }}>
            As categorias financeiras ainda não foram configuradas. Clique abaixo para criar as categorias padrão.
          </p>
          <BotaoBizy icone={Wallet} onClick={() => void inicializarCategorias()}>Inicializar categorias</BotaoBizy>
        </PanelCard>
      )}

      <KpiGrid>
        <KpiCard hero icone={Wallet} rotulo="Saldo" valor={fmtKz(fluxo?.saldo ?? 0)} delta={fluxo ? "este mês" : "—"} deltaPositivo={(fluxo?.saldo ?? 0) >= 0} />
        <KpiCard icone={ArrowUpCircle} cor="green" rotulo="Entradas" valor={fmtKz(fluxo?.totalEntradas ?? 0)} />
        <KpiCard icone={ArrowDownCircle} cor="rose" rotulo="Saídas" valor={fmtKz(fluxo?.totalSaidas ?? 0)} />
        <KpiCard icone={DollarSign} cor="blue" rotulo="A receber" valor={contasReceber.length} delta={`${contasReceberVencidas} vencido${contasReceberVencidas !== 1 ? "s" : ""}`} />
      </KpiGrid>

      {(erro || sucesso) && (
        <div className="grid gap-2" style={{ marginTop: 14 }}>
          {erro && (
            <div className="cd-tudo-ok" role="alert" style={{ borderColor: "var(--rose)", background: "rgba(225, 29, 72, 0.08)" }}>
              <AlertTriangle size={18} style={{ color: "var(--rose)" }} />
              <span>{erro}</span>
            </div>
          )}
          {sucesso && (
            <div className="cd-tudo-ok" role="status" style={{ borderColor: "var(--green)", background: "rgba(22, 163, 74, 0.08)" }}>
              <CheckCircle2 size={18} style={{ color: "var(--green)" }} />
              <span>{sucesso}</span>
            </div>
          )}
        </div>
      )}

      <TabsBizy tabs={tabs} activo={tab} onChange={(id) => setTab(id as TabFinancas)} />

      {/* ── Tab Fluxo de Caixa ─────────────────────────────────── */}
      {tab === "resumo" && (
        <>
          {fluxo && fluxo.porCategoria.length > 0 && (
            <PanelCard titulo="Distribuição por categoria">
              <div className="bz-rec-cards">
                {fluxo.porCategoria.map((c, indice) => (
                  <div key={`${c.tipo}-${c.categoria}-${indice}`} className="bz-rec-c">
                    <div className="bz-eq-role-head">
                      {c.tipo === "ENTRADA" ? <TrendingUp size={14} style={{ color: "var(--green)" }} /> : <TrendingDown size={14} style={{ color: "var(--rose)" }} />}
                      <strong className="bz-eq-role-name">{c.categoria}</strong>
                    </div>
                    <div className="bz-eq-role-count">{fmtKz(c.total)}</div>
                  </div>
                ))}
              </div>
            </PanelCard>
          )}

          {fluxo && fluxo.porDia.length > 0 && (
            <TableCard>
              <Table>
                <TableHead>
                  <Th>Dia</Th>
                  <Th>Entradas</Th>
                  <Th>Saídas</Th>
                  <Th>Saldo dia</Th>
                </TableHead>
                <tbody>
                  {fluxo.porDia.slice(-14).map((d) => (
                    <tr key={d.dia}>
                      <Td>{new Date(d.dia + "T12:00:00").toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}</Td>
                      <Td><span style={{ color: "var(--green)" }}>{fmtKz(d.entradas)}</span></Td>
                      <Td><span style={{ color: "var(--rose)" }}>{fmtKz(d.saidas)}</span></Td>
                      <Td><strong>{fmtKz(d.entradas - d.saidas)}</strong></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableCard>
          )}

          {!fluxo && !carregando && (
            <PanelCard titulo="Fluxo de caixa">
              <div className="bz-feed-empty">Sem movimentos registados este mês.</div>
            </PanelCard>
          )}
        </>
      )}

      {/* ── Tab Movimentos ─────────────────────────────────────── */}
      {tab === "movimentos" && (
        <>
          {mostrarFormMovimento && (
            <PanelCard titulo="Registar movimento">
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[auto_1fr_140px_auto_1fr_auto]">
                  <select
                    className="bz-toolbar-select-input"
                    value={tipoMov}
                    onChange={(e) => {
                      const proximo = e.target.value as TipoMovimento;
                      setTipoMov(proximo);
                      setOrigemMov(ORIGENS_MOVIMENTO[proximo][0].valor);
                      setDocumentoMov("NENHUM");
                      setCatIdMov("");
                    }}
                  >
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                  </select>
                  <Input value={descMov} onChange={(e) => setDescMov(e.target.value)} placeholder="Descrição" />
                  <Input type="number" value={valorMov} onChange={(e) => setValorMov(e.target.value)} placeholder="Valor (Kz)" />
                  <select className="bz-toolbar-select-input" value={origemMov} onChange={(e) => setOrigemMov(e.target.value as OrigemMovimento)}>
                    {ORIGENS_MOVIMENTO[tipoMov].map((origem) => (
                      <option key={origem.valor} value={origem.valor}>{origem.rotulo}</option>
                    ))}
                  </select>
                  <Input value={origemIdMov} onChange={(e) => setOrigemIdMov(e.target.value)} placeholder="ID da origem" />
                  <select className="bz-toolbar-select-input" value={catIdMov} onChange={(e) => setCatIdMov(e.target.value)}>
                    <option value="">Categoria</option>
                    {(tipoMov === "ENTRADA" ? catsReceita : catsDespesa).map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                {tipoMov === "ENTRADA" && (
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr_140px_1fr]">
                    <select className="bz-toolbar-select-input" value={documentoMov} onChange={(e) => setDocumentoMov(e.target.value as DocumentoMovimento)}>
                      <option value="NENHUM">Sem documento</option>
                      <option value="FACTURA">Factura</option>
                      <option value="FACTURA_RECIBO">Factura-recibo</option>
                      <option value="RECIBO">Recibo de factura</option>
                    </select>
                    {(documentoMov === "FACTURA" || documentoMov === "FACTURA_RECIBO") ? (
                      <Input value={movClienteNome} onChange={(e) => setMovClienteNome(e.target.value)} placeholder="Cliente do documento" />
                    ) : (
                      <Input value={movFacturaId} onChange={(e) => setMovFacturaId(e.target.value)} placeholder="Factura ID" disabled={documentoMov !== "RECIBO"} />
                    )}
                    {(documentoMov === "FACTURA" || documentoMov === "FACTURA_RECIBO") && (
                      <Input type="number" value={movIva} onChange={(e) => setMovIva(e.target.value)} placeholder="IVA %" />
                    )}
                    <Input value={movReferenciaPagamento} onChange={(e) => setMovReferenciaPagamento(e.target.value)} placeholder="Referência" />
                  </div>
                )}
                {tipoMov === "ENTRADA" && (documentoMov === "FACTURA_RECIBO" || documentoMov === "RECIBO" || origemMov === "PEDIDO" || origemMov === "FACTURA" || origemMov === "CONTA_RECEBER") && (
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr_1fr]">
                    <select className="bz-toolbar-select-input" value={movMetodoPagamento} onChange={(e) => setMovMetodoPagamento(e.target.value)}>
                      <option>Transferência</option>
                      <option>TPA</option>
                      <option>Multicaixa Express</option>
                      <option>Dinheiro</option>
                      <option>Outro</option>
                    </select>
                    <Input value={movComprovativoUrl} onChange={(e) => setMovComprovativoUrl(e.target.value)} placeholder="Link do comprovativo digital" />
                    <Input value={movClienteNif} onChange={(e) => setMovClienteNif(e.target.value)} placeholder="NIF do cliente" />
                  </div>
                )}
                <div className="flex gap-2">
                  <BotaoBizy icone={Plus} onClick={() => void criarMovimento()} disabled={acaoEmCurso === "movimento"}>Registar</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setMostrarFormMovimento(false)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          {!mostrarFormMovimento && (
            <div className="bz-eq-invite-action">
              <BotaoBizy icone={Plus} onClick={() => setMostrarFormMovimento(true)}>Novo movimento</BotaoBizy>
            </div>
          )}

          <TableCard>
            <Table>
              <TableHead>
                <Th>Data</Th>
                <Th>Tipo</Th>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <Th>Valor</Th>
              </TableHead>
              <tbody>
                {movimentos.length > 0 ? movimentos.map((m) => (
                  <tr key={m.id}>
                    <Td>
                      <span className="bz-eq-meta">
                        {new Date(m.dataMovimento).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge cor={m.tipo === "ENTRADA" ? "green" : "rose"}>
                        {m.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                      </StatusBadge>
                    </Td>
                    <Td>
                      {m.descricao}
                      {(m.origemTipo || m.origemId || m.referenciaPagamento || m.comprovativoUrl) && (
                        <span className="block text-xs text-muted-foreground">
                          {[m.origemTipo, m.origemId ? `#${m.origemId.slice(0, 8)}` : null, m.referenciaPagamento, m.comprovativoUrl ? "comprovativo" : null].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </Td>
                    <Td><span className="bz-eq-meta">{m.categoria?.nome ?? "—"}</span></Td>
                    <Td>
                      <strong style={{ color: m.tipo === "ENTRADA" ? "var(--green)" : "var(--rose)" }}>
                        {m.tipo === "ENTRADA" ? "+" : "-"}{fmtKz(m.valor)}
                      </strong>
                    </Td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="bz-feed-empty">
                      {carregando ? "A carregar..." : "Sem movimentos registados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      {/* ── Tab Despesas ───────────────────────────────────────── */}
      {tab === "despesas" && (
        <>
          {mostrarFormDespesa && (
            <PanelCard titulo="Nova despesa">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
                <Input value={descDespesa} onChange={(e) => setDescDespesa(e.target.value)} placeholder="Descrição" />
                <Input type="number" value={valorDespesa} onChange={(e) => setValorDespesa(e.target.value)} placeholder="Valor (Kz)" />
                <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Fornecedor (opcional)" />
                <Input value={comprovativoDespesaUrl} onChange={(e) => setComprovativoDespesaUrl(e.target.value)} placeholder="Link do comprovativo" />
                <select className="bz-toolbar-select-input" value={catIdDespesa} onChange={(e) => setCatIdDespesa(e.target.value)}>
                  <option value="">Categoria</option>
                  {catsDespesa.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <BotaoBizy icone={Plus} onClick={() => void criarDespesa()} disabled={acaoEmCurso === "despesa"}>Criar</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setMostrarFormDespesa(false)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          {!mostrarFormDespesa && (
            <div className="bz-eq-invite-action">
              <BotaoBizy icone={Plus} onClick={() => setMostrarFormDespesa(true)}>Nova despesa</BotaoBizy>
            </div>
          )}

          <TableCard>
            <Table>
              <TableHead>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <Th>Fornecedor</Th>
                <Th>Valor</Th>
                <Th>Estado</Th>
                <Th>Acções</Th>
              </TableHead>
              <tbody>
                {despesas.length > 0 ? despesas.map((d) => (
                  <tr key={d.id}>
                    <Td>
                      {d.descricao}
                      {d.comprovativoUrl && <span className="block text-xs text-muted-foreground">comprovativo digital</span>}
                    </Td>
                    <Td><span className="bz-eq-meta">{d.categoria?.nome ?? "—"}</span></Td>
                    <Td><span className="bz-eq-meta">{d.fornecedor ?? "—"}</span></Td>
                    <Td><strong>{fmtKz(d.valor)}</strong></Td>
                    <Td>
                      <StatusBadge cor={d.pago ? "green" : "amber"}>
                        {d.pago ? "Pago" : "Pendente"}
                      </StatusBadge>
                    </Td>
                    <Td>
                      {!d.pago && (
                        <BotaoBizy variante="ghost" onClick={() => void marcarDespesaPaga(d.id)} disabled={acaoEmCurso === `despesa:${d.id}`}>
                          Pagar
                        </BotaoBizy>
                      )}
                    </Td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="bz-feed-empty">
                      {carregando ? "A carregar..." : "Sem despesas registadas."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      {/* ── Tab Facturas ──────────────────────────────────────── */}
      {tab === "facturas" && (
        <>
          {mostrarFormFactura && (
            <PanelCard titulo="Emitir factura">
              <div className="grid gap-3" style={{ maxWidth: 720 }}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1">
                    <span className="bz-eq-meta">Tipo de documento</span>
                    <select
                      className="bz-toolbar-select-input"
                      value={ftTipoDocumento}
                      onChange={(e) => {
                        const tipo = e.target.value as TipoDocumentoFactura;
                        setFtTipoDocumento(tipo);
                        if (tipo === "FACTURA") setFtMovimentoOrigemId("");
                      }}
                    >
                      <option value="FACTURA">Factura</option>
                      <option value="FACTURA_RECIBO">Factura-recibo</option>
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <span className="bz-eq-meta">IVA</span>
                    <Input type="number" value={ftIva} onChange={(e) => setFtIva(e.target.value)} placeholder="IVA %" />
                  </div>
                  {ftTipoDocumento === "FACTURA" ? (
                    <div className="grid gap-1">
                      <span className="bz-eq-meta">Vencimento</span>
                      <Input type="date" value={ftVencimento} onChange={(e) => setFtVencimento(e.target.value)} />
                    </div>
                  ) : (
                    <div className="grid gap-1">
                      <span className="bz-eq-meta">Método de pagamento</span>
                      <select className="bz-toolbar-select-input" value={ftMetodoPagamento} onChange={(e) => setFtMetodoPagamento(e.target.value)}>
                        <option>Transferência</option>
                        <option>TPA</option>
                        <option>Multicaixa Express</option>
                        <option>Dinheiro</option>
                        <option>Outro</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={ftClienteNome} onChange={(e) => setFtClienteNome(e.target.value)} placeholder="Nome do cliente *" />
                  <Input value={ftClienteNif} onChange={(e) => setFtClienteNif(e.target.value)} placeholder="NIF (opcional)" />
                </div>
                {ftTipoDocumento === "FACTURA_RECIBO" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={ftReferenciaPagamento} onChange={(e) => setFtReferenciaPagamento(e.target.value)} placeholder="Referência do pagamento" />
                    <Input value={ftComprovativoUrl} onChange={(e) => setFtComprovativoUrl(e.target.value)} placeholder="Link do comprovativo digital" />
                    <div className="grid gap-1 sm:col-span-2">
                      <span className="bz-eq-meta">Movimento financeiro</span>
                      <select
                        className="bz-toolbar-select-input"
                        value={ftMovimentoOrigemId}
                        onChange={(e) => selecionarMovimentoOrigemFactura(e.target.value)}
                      >
                        <option value="">Criar entrada financeira nova</option>
                        {movimentosEntradaParaFactura.map((movimento) => (
                          <option key={movimento.id} value={movimento.id}>
                            {rotuloMovimentoParaFactura(movimento)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {movimentoSelecionadoFactura && (
                      <div className="cd-tudo-ok sm:col-span-2" style={{ padding: "10px 12px" }}>
                        <CheckCircle2 size={16} style={{ color: "var(--green)" }} />
                        <span>
                          {fmtKz(movimentoSelecionadoFactura.valor)} · {movimentoSelecionadoFactura.descricao}
                          {movimentoSelecionadoFactura.referenciaPagamento ? ` · ${movimentoSelecionadoFactura.referenciaPagamento}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid gap-3">
                  <Input value={ftObs} onChange={(e) => setFtObs(e.target.value)} placeholder="Observação (opcional)" />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginTop: 4 }}>Itens</div>
                {ftItens.map((item, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_60px_100px_32px]" style={{ alignItems: "end" }}>
                    <Input value={item.descricao} onChange={(e) => { const n = [...ftItens]; n[idx].descricao = e.target.value; setFtItens(n); }} placeholder="Descrição" />
                    <Input type="number" value={item.quantidade} onChange={(e) => { const n = [...ftItens]; n[idx].quantidade = e.target.value; setFtItens(n); }} placeholder="Qtd" />
                    <Input type="number" value={item.precoUnitario} onChange={(e) => { const n = [...ftItens]; n[idx].precoUnitario = e.target.value; setFtItens(n); }} placeholder="P. Unit (Kz)" />
                    {ftItens.length > 1 && (
                      <button type="button" className="bz-iconbtn" onClick={() => setFtItens(ftItens.filter((_, i) => i !== idx))} title="Remover">
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="bz-iconbtn" style={{ width: "fit-content", fontSize: 12, gap: 4, display: "flex", alignItems: "center" }} onClick={() => setFtItens([...ftItens, { descricao: "", quantidade: "1", precoUnitario: "" }])}>
                  <Plus size={14} /> Adicionar item
                </button>
                <div className="flex gap-2" style={{ marginTop: 4 }}>
                  <BotaoBizy icone={FileText} onClick={() => void emitirFactura()} disabled={acaoEmCurso === "factura"}>Emitir</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setMostrarFormFactura(false)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          {!mostrarFormFactura && (
            <div className="bz-eq-invite-action">
              <BotaoBizy icone={FileText} onClick={() => setMostrarFormFactura(true)}>Emitir factura</BotaoBizy>
            </div>
          )}

          {pedidoIdFiltro && (
            <PanelCard titulo="Factura do pedido">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="bz-eq-meta">
                  {facturas.length > 0
                    ? "Documento financeiro ligado ao pedido selecionado."
                    : "Ainda não existe factura para este pedido ou a emissão automática falhou."}
                </span>
                <Link to="/app/financas" className="team-btn team-btn-secondary">
                  Ver todas
                </Link>
              </div>
            </PanelCard>
          )}

          {facturaPagamento && (
            <PanelCard titulo={`Registar pagamento de ${facturaPagamento.serie} ${String(facturaPagamento.numero).padStart(4, "0")}/${facturaPagamento.anoFiscal}`}>
              <div className="grid gap-3" style={{ maxWidth: 720 }}>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Input type="number" value={pagamentoValor} onChange={(e) => setPagamentoValor(e.target.value)} placeholder="Valor recebido" />
                  <select className="bz-toolbar-select-input" value={pagamentoMetodo} onChange={(e) => setPagamentoMetodo(e.target.value)}>
                    <option>Transferência</option>
                    <option>TPA</option>
                    <option>Multicaixa Express</option>
                    <option>Dinheiro</option>
                    <option>Outro</option>
                  </select>
                  <Input value={pagamentoReferencia} onChange={(e) => setPagamentoReferencia(e.target.value)} placeholder="Referência" />
                  <Input value={pagamentoComprovativoUrl} onChange={(e) => setPagamentoComprovativoUrl(e.target.value)} placeholder="Link do comprovativo" />
                </div>
                <div className="flex gap-2">
                  <BotaoBizy icone={FileText} onClick={() => void gerarReciboFactura()} disabled={acaoEmCurso === `recibo:${facturaPagamento.id}`}>Emitir recibo</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setFacturaPagamento(null)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          {notaCreditoFactura && (
            <PanelCard titulo={`Emitir nota de crédito para ${notaCreditoFactura.serie} ${String(notaCreditoFactura.numero).padStart(4, "0")}/${notaCreditoFactura.anoFiscal}`}>
              <div className="grid gap-3" style={{ maxWidth: 640 }}>
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <Input type="number" value={notaCreditoValor} onChange={(e) => setNotaCreditoValor(e.target.value)} placeholder="Valor" />
                  <Input value={notaCreditoMotivo} onChange={(e) => setNotaCreditoMotivo(e.target.value)} placeholder="Motivo da correção/devolução" />
                </div>
                <div className="flex gap-2">
                  <BotaoBizy icone={FileText} onClick={() => void emitirNotaCredito()} disabled={acaoEmCurso === `nota:${notaCreditoFactura.id}`}>Emitir nota</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setNotaCreditoFactura(null)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          <TableCard>
            <Table>
              <TableHead>
                <Th>Ref.</Th>
                <Th>Cliente</Th>
                <Th>Documento</Th>
                <Th>Total</Th>
                <Th>Pagamento</Th>
                <Th>Acções</Th>
              </TableHead>
              <tbody>
                {facturas.length > 0 ? facturas.map((f) => {
                  const pendente = saldoFactura(f);
                  const estadoPagamento = f.estadoPagamento ?? (pendente <= 0 ? "PAGO" : "PENDENTE");
                  return (
                    <tr key={f.id}>
                      <Td>
                        <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                          {f.serie} {String(f.numero).padStart(4, "0")}/{f.anoFiscal}
                        </strong>
                        {f.codigoValidacao && <span className="block truncate text-xs text-muted-foreground">Cod. {f.codigoValidacao}</span>}
                      </Td>
                      <Td>{f.clienteNome}</Td>
                      <Td>
                        <div className="grid gap-1">
                          <StatusBadge cor={f.tipoDocumento === "FACTURA_RECIBO" ? "green" : "blue"}>
                            {rotuloTipoDocumento(f.tipoDocumento)}
                          </StatusBadge>
                          <span className="bz-eq-meta">
                            {new Date(f.emitidaEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {f.dataVencimento && estadoPagamento !== "PAGO" && (
                            <span className="bz-eq-meta">Vence {new Date(f.dataVencimento).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}</span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <strong>{fmtKz(f.total)}</strong>
                        {pendente > 0 && <span className="block text-xs text-muted-foreground">Pendente {fmtKz(pendente)}</span>}
                      </Td>
                      <Td>
                        <div className="grid gap-1">
                          <StatusBadge cor={f.estado === "ANULADA" ? "rose" : corEstadoPagamento(estadoPagamento)}>
                            {f.estado === "ANULADA" ? "Anulada" : rotuloEstadoPagamento(estadoPagamento)}
                          </StatusBadge>
                          {(f.metodoPagamento || f.referenciaPagamento || f.comprovativoPagamentoUrl) && (
                            <span className="bz-eq-meta truncate">{f.metodoPagamento ?? "Pagamento"} {f.referenciaPagamento ? `· ${f.referenciaPagamento}` : ""}{f.comprovativoPagamentoUrl ? " · comprovativo" : ""}</span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex gap-1">
                          <button type="button" className="bz-iconbtn" title="Descarregar PDF" onClick={() => void descarregarPdfFactura(f.id)} disabled={acaoEmCurso === `pdf:${f.id}`}>
                            <Download size={15} />
                          </button>
                          {f.estado === "EMITIDA" && estadoPagamento !== "PAGO" && (
                            <button type="button" className="bz-iconbtn" title="Emitir recibo" onClick={() => abrirPagamentoFactura(f)} disabled={acaoEmCurso === `recibo:${f.id}`}>
                              <FileText size={15} />
                            </button>
                          )}
                          {f.estado === "EMITIDA" && (
                            <button type="button" className="bz-iconbtn" title="Nota de crédito" onClick={() => abrirNotaCredito(f)} disabled={acaoEmCurso === `nota:${f.id}`}>
                              <RefreshCcw size={15} />
                            </button>
                          )}
                          {f.estado === "EMITIDA" && estadoPagamento !== "PAGO" && (
                            <button type="button" className="bz-iconbtn" title="Anular" onClick={() => void anularFactura(f.id)} disabled={acaoEmCurso === `anular:${f.id}`}>
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="bz-feed-empty">
                      {carregando ? "A carregar..." : pedidoIdFiltro ? "Sem factura ligada a este pedido." : "Sem facturas emitidas."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      {/* ── Tab Contas a Receber ───────────────────────────────── */}
      {tab === "receber" && (
        <>
          {mostrarFormReceber && (
            <PanelCard titulo="Nova conta a receber">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_150px_1fr_auto]">
                <Input value={recDescricao} onChange={(e) => setRecDescricao(e.target.value)} placeholder="Descrição" />
                <Input type="number" value={recValor} onChange={(e) => setRecValor(e.target.value)} placeholder="Valor (Kz)" />
                <Input type="date" value={recVencimento} onChange={(e) => setRecVencimento(e.target.value)} />
                <Input value={recObs} onChange={(e) => setRecObs(e.target.value)} placeholder="Observação (opcional)" />
                <div className="flex gap-2">
                  <BotaoBizy icone={Plus} onClick={() => void criarContaReceber()} disabled={acaoEmCurso === "conta-receber"}>Criar</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setMostrarFormReceber(false)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          {!mostrarFormReceber && (
            <div className="bz-eq-invite-action">
              <BotaoBizy icone={Plus} onClick={() => setMostrarFormReceber(true)}>Nova conta a receber</BotaoBizy>
            </div>
          )}

          <TableCard>
            <Table>
              <TableHead>
                <Th>Descrição</Th>
                <Th>Valor</Th>
                <Th>Vencimento</Th>
                <Th>Estado</Th>
                <Th>Acções</Th>
              </TableHead>
              <tbody>
                {contasReceber.length > 0 ? contasReceber.map((c) => {
                  const estado = estadoVisualConta(c);
                  return (
                    <tr key={c.id}>
                      <Td>{c.descricao}</Td>
                      <Td><strong>{fmtKz(c.valor)}</strong></Td>
                      <Td>
                        <span className="bz-eq-meta">
                          {new Date(c.dataVencimento).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge cor={corEstadoConta(estado)}>
                          {rotuloEstadoConta(estado)}
                        </StatusBadge>
                      </Td>
                      <Td>
                        {estado !== "PAGO" && estado !== "CANCELADO" && (
                          <BotaoBizy variante="ghost" onClick={() => void receberConta(c)} disabled={acaoEmCurso === `receber:${c.id}`}>
                            Receber
                          </BotaoBizy>
                        )}
                      </Td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="bz-feed-empty">
                      {carregando ? "A carregar..." : "Sem contas a receber."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      {/* ── Tab Contas a Pagar ─────────────────────────────────── */}
      {tab === "pagar" && (
        <>
          {mostrarFormPagar && (
            <PanelCard titulo="Nova conta a pagar">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_150px_1fr_auto]">
                <Input value={pagFornecedor} onChange={(e) => setPagFornecedor(e.target.value)} placeholder="Fornecedor" />
                <Input value={pagDescricao} onChange={(e) => setPagDescricao(e.target.value)} placeholder="Descrição" />
                <Input type="number" value={pagValor} onChange={(e) => setPagValor(e.target.value)} placeholder="Valor (Kz)" />
                <Input type="date" value={pagVencimento} onChange={(e) => setPagVencimento(e.target.value)} />
                <Input value={pagObs} onChange={(e) => setPagObs(e.target.value)} placeholder="Observação (opcional)" />
                <div className="flex gap-2">
                  <BotaoBizy icone={Plus} onClick={() => void criarContaPagar()} disabled={acaoEmCurso === "conta-pagar"}>Criar</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setMostrarFormPagar(false)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          {!mostrarFormPagar && (
            <div className="bz-eq-invite-action">
              <BotaoBizy icone={Plus} onClick={() => setMostrarFormPagar(true)}>Nova conta a pagar</BotaoBizy>
            </div>
          )}

          <TableCard>
            <Table>
              <TableHead>
                <Th>Fornecedor</Th>
                <Th>Descrição</Th>
                <Th>Valor</Th>
                <Th>Vencimento</Th>
                <Th>Estado</Th>
                <Th>Acções</Th>
              </TableHead>
              <tbody>
                {contasPagar.length > 0 ? contasPagar.map((c) => {
                  const estado = estadoVisualConta(c);
                  return (
                    <tr key={c.id}>
                      <Td><strong>{c.fornecedor}</strong></Td>
                      <Td>{c.descricao}</Td>
                      <Td><strong>{fmtKz(c.valor)}</strong></Td>
                      <Td>
                        <span className="bz-eq-meta">
                          {new Date(c.dataVencimento).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge cor={corEstadoConta(estado)}>
                          {rotuloEstadoConta(estado)}
                        </StatusBadge>
                      </Td>
                      <Td>
                        {estado !== "PAGO" && (
                          <BotaoBizy variante="ghost" onClick={() => void pagarConta(c)} disabled={acaoEmCurso === `pagar:${c.id}`}>
                            Pagar
                          </BotaoBizy>
                        )}
                      </Td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="bz-feed-empty">
                      {carregando ? "A carregar..." : "Sem contas a pagar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}
    </CrmPageMotion>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */

function fmtKz(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(1)}M Kz`;
  if (valor >= 1_000) return `${Math.round(valor / 1_000)}k Kz`;
  return `${valor.toLocaleString("pt-AO")} Kz`;
}

function movimentoPodeOriginarFactura(movimento: MovimentoFinanceiro): boolean {
  return movimento.tipo === "ENTRADA" && !(movimento.origemTipo === "RECIBO" && movimento.origemId);
}

function rotuloMovimentoParaFactura(movimento: MovimentoFinanceiro): string {
  const data = new Date(movimento.dataMovimento).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" });
  return `${data} · ${fmtKz(movimento.valor)} · ${movimento.descricao}`;
}

function totalDocumento(itens: Array<{ quantidade: number; precoUnitario: number }>, ivaPercentual: number): number {
  return itens.reduce((total, item) => {
    const subtotal = item.quantidade * item.precoUnitario;
    return total + subtotal + Math.round(subtotal * (ivaPercentual / 100));
  }, 0);
}

function dataInputDaqui(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function textoObrigatorio(valor: string, campo: string): string {
  const limpo = valor.trim();
  if (!limpo) throw new Error(`${campo} é obrigatório.`);
  return limpo;
}

function inteiroPositivo(valor: string, campo: string): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) throw new Error(`${campo} deve ser um número positivo.`);
  return Math.round(numero);
}

function numeroPercentual(valor: string, campo: string): number {
  const numero = Number(valor || "14");
  if (!Number.isFinite(numero) || numero < 0 || numero > 100) throw new Error(`${campo} deve estar entre 0 e 100.`);
  return numero;
}

function validarUrl(valor: string, campo: string): void {
  try {
    const url = new URL(valor);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error(`${campo} deve ser um link http(s) válido.`);
  }
}

async function requisitarPdfAutenticado(caminho: string, init: RequestInit = {}): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = obterToken();
  const negocioId = obterNegocioActualId();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (negocioId) headers["X-Bizy-Negocio-Id"] = negocioId;
  if (init.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(`${obterBaseApiUrl()}${caminho}`, {
    ...init,
    credentials: "include",
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined)
    }
  });
  if (!res.ok) throw new Error(await mensagemErroRespostaPdf(res));
  return res.blob();
}

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

function normalizarOrigemMovimento(tipo: TipoMovimento, origem: OrigemMovimento): OrigemMovimento {
  return ORIGENS_MOVIMENTO[tipo].some((opcao) => opcao.valor === origem)
    ? origem
    : ORIGENS_MOVIMENTO[tipo][0].valor;
}

function mensagemResultadoMovimento(tipoResultado?: string): string {
  if (tipoResultado === "PEDIDO_CONFIRMADO") return "Pedido confirmado; factura, recibo e entrada financeira sincronizados.";
  if (tipoResultado === "CONTA_RECEBIDA") return "Conta a receber baixada e entrada financeira registada.";
  if (tipoResultado === "RECIBO_GERADO") return "Recibo emitido e factura baixada.";
  if (tipoResultado === "FACTURA_EMITIDA") return "Factura emitida e colocada em contas a receber.";
  if (tipoResultado === "FACTURA_RECIBO_EMITIDA") return "Factura-recibo emitida e ligada ao movimento financeiro.";
  return "Movimento financeiro registado.";
}

function estadoVisualConta(conta: Pick<ContaReceber | ContaPagar, "estado" | "dataVencimento">): string {
  if (conta.estado === "PAGO" || conta.estado === "CANCELADO") return conta.estado;
  const vencimento = new Date(`${conta.dataVencimento.slice(0, 10)}T23:59:59`);
  return vencimento.getTime() < Date.now() ? "VENCIDO" : conta.estado;
}

function corEstadoConta(estado: string): CorSemantica {
  if (estado === "PAGO") return "green";
  if (estado === "VENCIDO") return "rose";
  if (estado === "A_VENCER") return "amber";
  return "mute";
}

function rotuloEstadoConta(estado: string): string {
  if (estado === "A_VENCER") return "A vencer";
  if (estado === "VENCIDO") return "Vencido";
  if (estado === "PAGO") return "Pago";
  if (estado === "CANCELADO") return "Cancelado";
  return estado;
}

function saldoFactura(factura: Pick<Factura, "total" | "valorPago">): number {
  return Math.max(0, factura.total - (factura.valorPago ?? 0));
}

function rotuloTipoDocumento(tipo?: string): string {
  if (tipo === "FACTURA_RECIBO") return "Factura-recibo";
  return "Factura";
}

function rotuloEstadoPagamento(estado: string): string {
  if (estado === "PAGO") return "Pago";
  if (estado === "PARCIAL") return "Parcial";
  if (estado === "PENDENTE") return "Pendente";
  return estado;
}

function corEstadoPagamento(estado: string): CorSemantica {
  if (estado === "PAGO") return "green";
  if (estado === "PARCIAL") return "amber";
  if (estado === "PENDENTE") return "blue";
  return "mute";
}

function mensagemErro(err: unknown, fallback = "Operação não concluída."): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

async function mensagemErroRespostaPdf(resposta: Response): Promise<string> {
  try {
    const corpo = await resposta.clone().json() as { mensagem?: string; message?: string; erro?: string };
    return corpo.mensagem ?? corpo.message ?? corpo.erro ?? `Pedido rejeitado pelo backend (${resposta.status}).`;
  } catch {
    return `Pedido rejeitado pelo backend (${resposta.status}).`;
  }
}
