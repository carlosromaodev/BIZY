import {
  ArrowDownCircle,
  ArrowUpCircle,
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
import { requisitarApi, obterBaseApiUrl, obterToken } from "../api";
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
  dataMovimento: string;
  categoria: { id: string; nome: string; tipo: string; cor: string | null } | null;
}

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  fornecedor: string | null;
  tipoRecorrencia: string;
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
  serie: string;
  numero: number;
  anoFiscal: number;
  estado: string;
  clienteNome: string;
  clienteNif: string | null;
  subtotal: number;
  ivaValor: number;
  total: number;
  emitidaEm: string;
  itens: Array<{ descricao: string; quantidade: number; precoUnitario: number; subtotal: number }>;
  _count?: { notasCredito: number };
}

type TabFinancas = "resumo" | "movimentos" | "despesas" | "facturas" | "receber" | "pagar";

/* ── Página ───────────────────────────────────────────────────── */

export function PaginaFinancas() {
  const [tab, setTab] = useState<TabFinancas>("resumo");
  const [fluxo, setFluxo] = useState<FluxoCaixa | null>(null);
  const [movimentos, setMovimentos] = useState<MovimentoFinanceiro[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [contasReceber, setContasReceber] = useState<any[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormDespesa, setMostrarFormDespesa] = useState(false);
  const [mostrarFormMovimento, setMostrarFormMovimento] = useState(false);
  const [mostrarFormFactura, setMostrarFormFactura] = useState(false);

  // form despesa
  const [descDespesa, setDescDespesa] = useState("");
  const [valorDespesa, setValorDespesa] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [catIdDespesa, setCatIdDespesa] = useState("");

  // form movimento
  const [descMov, setDescMov] = useState("");
  const [valorMov, setValorMov] = useState("");
  const [tipoMov, setTipoMov] = useState("ENTRADA");
  const [catIdMov, setCatIdMov] = useState("");

  // form factura
  const [ftClienteNome, setFtClienteNome] = useState("");
  const [ftClienteNif, setFtClienteNif] = useState("");
  const [ftIva, setFtIva] = useState("14");
  const [ftObs, setFtObs] = useState("");
  const [ftItens, setFtItens] = useState([{ descricao: "", quantidade: "1", precoUnitario: "" }]);

  async function carregar() {
    setCarregando(true);
    try {
      const [fc, mv, dp, ct, ft, cr, cp] = await Promise.allSettled([
        requisitarApi<FluxoCaixa>("/financas/fluxo-caixa"),
        requisitarApi<{ movimentos: MovimentoFinanceiro[] }>("/financas/movimentos?limite=50"),
        requisitarApi<{ despesas: Despesa[] }>("/financas/despesas"),
        requisitarApi<{ categorias: CategoriaFinanceira[] }>("/financas/categorias"),
        requisitarApi<{ facturas: Factura[] }>("/financas/facturas"),
        requisitarApi<{ contas: any[] }>("/financas/contas-receber"),
        requisitarApi<{ contas: any[] }>("/financas/contas-pagar"),
      ]);
      setFluxo(fc.status === "fulfilled" ? fc.value : null);
      setMovimentos(mv.status === "fulfilled" ? mv.value.movimentos : []);
      setDespesas(dp.status === "fulfilled" ? dp.value.despesas : []);
      setCategorias(ct.status === "fulfilled" ? ct.value.categorias : []);
      setFacturas(ft.status === "fulfilled" ? ft.value.facturas : []);
      setContasReceber(cr.status === "fulfilled" ? cr.value.contas : []);
      setContasPagar(cp.status === "fulfilled" ? cp.value.contas : []);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  async function inicializarCategorias() {
    try {
      await requisitarApi("/financas/categorias/inicializar", { method: "POST" });
      await carregar();
    } catch { /* silencioso */ }
  }

  async function criarDespesa() {
    if (!descDespesa.trim() || !valorDespesa.trim()) return;
    try {
      await requisitarApi("/financas/despesas", {
        method: "POST",
        body: {
          descricao: descDespesa,
          valor: Math.round(Number(valorDespesa)),
          fornecedor: fornecedor || undefined,
          categoriaId: catIdDespesa || undefined,
        },
      });
      setDescDespesa(""); setValorDespesa(""); setFornecedor(""); setCatIdDespesa("");
      setMostrarFormDespesa(false);
      await carregar();
    } catch { /* silencioso */ }
  }

  async function criarMovimento() {
    if (!descMov.trim() || !valorMov.trim()) return;
    try {
      await requisitarApi("/financas/movimentos", {
        method: "POST",
        body: {
          tipo: tipoMov,
          descricao: descMov,
          valor: Math.round(Number(valorMov)),
          categoriaId: catIdMov || undefined,
        },
      });
      setDescMov(""); setValorMov(""); setTipoMov("ENTRADA"); setCatIdMov("");
      setMostrarFormMovimento(false);
      await carregar();
    } catch { /* silencioso */ }
  }

  async function emitirFactura() {
    if (!ftClienteNome.trim() || ftItens.some((i) => !i.descricao.trim() || !i.precoUnitario)) return;
    try {
      await requisitarApi("/financas/facturas", {
        method: "POST",
        body: {
          clienteNome: ftClienteNome,
          clienteNif: ftClienteNif || undefined,
          ivaPercentual: Number(ftIva) || 14,
          observacao: ftObs || undefined,
          itens: ftItens.map((i) => ({
            descricao: i.descricao,
            quantidade: Number(i.quantidade) || 1,
            precoUnitario: Math.round(Number(i.precoUnitario)),
          })),
        },
      });
      setFtClienteNome(""); setFtClienteNif(""); setFtIva("14"); setFtObs("");
      setFtItens([{ descricao: "", quantidade: "1", precoUnitario: "" }]);
      setMostrarFormFactura(false);
      await carregar();
    } catch { /* silencioso */ }
  }

  async function descarregarPdfFactura(id: string) {
    try {
      const res = await fetch(`${obterBaseApiUrl()}/financas/facturas/${id}/pdf`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${obterToken() ?? ""}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silencioso */ }
  }

  async function anularFactura(id: string) {
    const motivo = prompt("Motivo da anulação:");
    if (!motivo || motivo.length < 5) return;
    try {
      await requisitarApi(`/financas/facturas/${id}/anular`, { method: "POST", body: { motivo } });
      await carregar();
    } catch { /* silencioso */ }
  }

  async function marcarDespesaPaga(id: string) {
    try {
      await requisitarApi(`/financas/despesas/${id}/pagar`, { method: "POST" });
      await carregar();
    } catch { /* silencioso */ }
  }

  useEffect(() => { void carregar(); }, []);

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
        <KpiCard icone={DollarSign} cor="blue" rotulo="A receber" valor={contasReceber.length} delta={`${contasReceber.filter((c: any) => c.estado === "VENCIDO").length} vencido${contasReceber.filter((c: any) => c.estado === "VENCIDO").length !== 1 ? "s" : ""}`} />
      </KpiGrid>

      <TabsBizy tabs={tabs} activo={tab} onChange={(id) => setTab(id as TabFinancas)} />

      {/* ── Tab Fluxo de Caixa ─────────────────────────────────── */}
      {tab === "resumo" && (
        <>
          {fluxo && fluxo.porCategoria.length > 0 && (
            <PanelCard titulo="Distribuição por categoria">
              <div className="bz-rec-cards">
                {fluxo.porCategoria.map((c) => (
                  <div key={c.categoria} className="bz-rec-c">
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
              <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto_auto]">
                <select className="bz-toolbar-select-input" value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </select>
                <Input value={descMov} onChange={(e) => setDescMov(e.target.value)} placeholder="Descrição" />
                <Input type="number" value={valorMov} onChange={(e) => setValorMov(e.target.value)} placeholder="Valor (Kz)" />
                <select className="bz-toolbar-select-input" value={catIdMov} onChange={(e) => setCatIdMov(e.target.value)}>
                  <option value="">Categoria</option>
                  {(tipoMov === "ENTRADA" ? catsReceita : catsDespesa).map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <BotaoBizy icone={Plus} onClick={() => void criarMovimento()}>Registar</BotaoBizy>
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
                    <Td>{m.descricao}</Td>
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
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <Input value={descDespesa} onChange={(e) => setDescDespesa(e.target.value)} placeholder="Descrição" />
                <Input type="number" value={valorDespesa} onChange={(e) => setValorDespesa(e.target.value)} placeholder="Valor (Kz)" />
                <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Fornecedor (opcional)" />
                <select className="bz-toolbar-select-input" value={catIdDespesa} onChange={(e) => setCatIdDespesa(e.target.value)}>
                  <option value="">Categoria</option>
                  {catsDespesa.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <BotaoBizy icone={Plus} onClick={() => void criarDespesa()}>Criar</BotaoBizy>
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
                    <Td>{d.descricao}</Td>
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
                        <BotaoBizy variante="ghost" onClick={() => void marcarDespesaPaga(d.id)}>
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
              <div className="grid gap-3" style={{ maxWidth: 560 }}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={ftClienteNome} onChange={(e) => setFtClienteNome(e.target.value)} placeholder="Nome do cliente *" />
                  <Input value={ftClienteNif} onChange={(e) => setFtClienteNif(e.target.value)} placeholder="NIF (opcional)" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input type="number" value={ftIva} onChange={(e) => setFtIva(e.target.value)} placeholder="IVA %" />
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
                  <BotaoBizy icone={FileText} onClick={() => void emitirFactura()}>Emitir</BotaoBizy>
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

          <TableCard>
            <Table>
              <TableHead>
                <Th>Ref.</Th>
                <Th>Cliente</Th>
                <Th>Data</Th>
                <Th>Total</Th>
                <Th>Estado</Th>
                <Th>Acções</Th>
              </TableHead>
              <tbody>
                {facturas.length > 0 ? facturas.map((f) => (
                  <tr key={f.id}>
                    <Td>
                      <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                        {f.serie} {String(f.numero).padStart(4, "0")}/{f.anoFiscal}
                      </strong>
                    </Td>
                    <Td>{f.clienteNome}</Td>
                    <Td>
                      <span className="bz-eq-meta">
                        {new Date(f.emitidaEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </Td>
                    <Td><strong>{fmtKz(f.total)}</strong></Td>
                    <Td>
                      <StatusBadge cor={f.estado === "EMITIDA" ? "green" : f.estado === "ANULADA" ? "rose" : "amber"}>
                        {f.estado === "EMITIDA" ? "Emitida" : f.estado === "ANULADA" ? "Anulada" : f.estado}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <button type="button" className="bz-iconbtn" title="Descarregar PDF" onClick={() => void descarregarPdfFactura(f.id)}>
                          <Download size={15} />
                        </button>
                        {f.estado === "EMITIDA" && (
                          <button type="button" className="bz-iconbtn" title="Anular" onClick={() => void anularFactura(f.id)}>
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="bz-feed-empty">
                      {carregando ? "A carregar..." : "Sem facturas emitidas."}
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
        <TableCard>
          <Table>
            <TableHead>
              <Th>Descrição</Th>
              <Th>Valor</Th>
              <Th>Vencimento</Th>
              <Th>Estado</Th>
            </TableHead>
            <tbody>
              {contasReceber.length > 0 ? contasReceber.map((c: any) => (
                <tr key={c.id}>
                  <Td>{c.descricao}</Td>
                  <Td><strong>{fmtKz(c.valor)}</strong></Td>
                  <Td>
                    <span className="bz-eq-meta">
                      {new Date(c.dataVencimento).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge cor={corEstadoConta(c.estado)}>
                      {c.estado === "A_VENCER" ? "A vencer" : c.estado === "VENCIDO" ? "Vencido" : c.estado === "PAGO" ? "Pago" : c.estado}
                    </StatusBadge>
                  </Td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="bz-feed-empty">
                    {carregando ? "A carregar..." : "Sem contas a receber."}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableCard>
      )}

      {/* ── Tab Contas a Pagar ─────────────────────────────────── */}
      {tab === "pagar" && (
        <TableCard>
          <Table>
            <TableHead>
              <Th>Fornecedor</Th>
              <Th>Descrição</Th>
              <Th>Valor</Th>
              <Th>Vencimento</Th>
              <Th>Estado</Th>
            </TableHead>
            <tbody>
              {contasPagar.length > 0 ? contasPagar.map((c: any) => (
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
                    <StatusBadge cor={corEstadoConta(c.estado)}>
                      {c.estado === "A_VENCER" ? "A vencer" : c.estado === "VENCIDO" ? "Vencido" : c.estado === "PAGO" ? "Pago" : c.estado}
                    </StatusBadge>
                  </Td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="bz-feed-empty">
                    {carregando ? "A carregar..." : "Sem contas a pagar."}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableCard>
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

function corEstadoConta(estado: string): CorSemantica {
  if (estado === "PAGO") return "green";
  if (estado === "VENCIDO") return "rose";
  if (estado === "A_VENCER") return "amber";
  return "mute";
}
