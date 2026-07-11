import { AlertTriangle, Banknote, Box, CircleDollarSign, FileCheck2, Headphones, PackageCheck, RefreshCcw, RotateCcw, Truck } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { requisitarApi } from "../../../api";
import { CrmPageMotion } from "../../../componentes/CrmInterno21st";
import { CabecalhoPagina } from "../../../componentes/Shell";
import { formatarKwanza } from "../../../utilidades";

interface PedidoSeller {
  compra: { id: string; numero: number; estado: string; estadoPagamento: string; criadoEm: string };
  comprador: { nome: string | null; telefoneFinal: string; emailMascarado: string | null };
  pedido: {
    id: string; estado: string; estadoEntrega: string; estadoSeparacao: string; estadoEmbalagem: string;
    provaEntregaUrl: string | null; tentativasEntrega: number; motivoAtraso: string | null; estadoDevolucao: string | null;
    totalEmKwanza: number;
  };
}

interface PortalSeller {
  pedidos: PedidoSeller[];
  repasses: Array<{ id: string; estado: string; valorDisponivelEmKwanza: number; valorLiquidoEmKwanza: number; motivoRetencao: string | null }>;
  reembolsos: Array<{ id: string; pedidoId: string; estado: string; valorEmKwanza: number; motivo: string }>;
  metricas: { pedidos: number; porPreparar: number; entregasPendentes: number; disputas: number };
}

type VistaSeller = "PEDIDOS" | "FINANCEIRO" | "SUPORTE";

export function PaginaPortalSeller() {
  const [dados, setDados] = useState<PortalSeller | null>(null);
  const [vista, setVista] = useState<VistaSeller>("PEDIDOS");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [acao, setAcao] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try { setDados(await requisitarApi<PortalSeller>("/market/fornecedor/portal")); }
    catch (falha) { setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o portal seller."); }
    finally { setCarregando(false); }
  }
  useEffect(() => { void carregar(); }, []);

  async function actualizar(compraId: string, corpo: Record<string, unknown>) {
    setAcao(compraId);
    setErro("");
    try {
      await requisitarApi(`/market/fornecedor/compras/${compraId}/fulfillment`, { method: "PATCH", body: JSON.stringify(corpo) });
      await carregar();
    } catch (falha) { setErro(falha instanceof Error ? falha.message : "Não foi possível actualizar o pedido."); }
    finally { setAcao(""); }
  }

  return <CrmPageMotion><div className="team-pgwrap">
    <CabecalhoPagina rotulo="Bizy Market" titulo="Portal seller">
      <button className="team-btn" type="button" onClick={() => void carregar()} disabled={carregando} title="Actualizar portal"><RefreshCcw size={16} /></button>
    </CabecalhoPagina>
    {erro && <div className="cd-tudo-ok" style={{ borderColor: "var(--destructive)", marginBottom: "1rem" }}><AlertTriangle size={18} /><span>{erro}</span></div>}
    <div className="team-kstrip" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
      <Kpi rotulo="Pedidos" valor={dados?.metricas.pedidos ?? 0} icone={<Box size={14} />} />
      <Kpi rotulo="Por preparar" valor={dados?.metricas.porPreparar ?? 0} icone={<PackageCheck size={14} />} />
      <Kpi rotulo="Entregas" valor={dados?.metricas.entregasPendentes ?? 0} icone={<Truck size={14} />} />
      <Kpi rotulo="Disputas" valor={dados?.metricas.disputas ?? 0} icone={<AlertTriangle size={14} />} />
    </div>
    <div className="mt-4 grid w-full grid-cols-3 rounded-md border bg-background p-1 sm:inline-grid sm:w-auto" aria-label="Área do portal seller">
      <BotaoVista activo={vista === "PEDIDOS"} onClick={() => setVista("PEDIDOS")} icone={<Box size={15} />}>Operação</BotaoVista>
      <BotaoVista activo={vista === "FINANCEIRO"} onClick={() => setVista("FINANCEIRO")} icone={<Banknote size={15} />}>Repasses</BotaoVista>
      <BotaoVista activo={vista === "SUPORTE"} onClick={() => setVista("SUPORTE")} icone={<Headphones size={15} />}>Disputas</BotaoVista>
    </div>

    {vista === "PEDIDOS" && <section className="cd-pedidos-recentes" style={{ marginTop: "1rem" }}>
      <div className="cd-secao-head"><span className="cd-secao-titulo">Preparação e entrega</span><span className="team-bdg" data-tone="blue">{dados?.pedidos.length ?? 0}</span></div>
      <div className="cd-pedidos-lista">{(dados?.pedidos ?? []).map((item) => <article key={item.pedido.id} className="cd-pedido" style={{ alignItems: "flex-start" }}>
        <div><strong>Compra #{item.compra.numero} · {item.comprador.nome || "Comprador"}</strong><span>Contacto final {item.comprador.telefoneFinal} · {formatarKwanza(item.pedido.totalEmKwanza)}</span><span>Separação {item.pedido.estadoSeparacao} · embalagem {item.pedido.estadoEmbalagem} · entrega {item.pedido.estadoEntrega}</span>{item.pedido.motivoAtraso && <span className="text-amber-700">Atraso: {item.pedido.motivoAtraso}</span>}</div>
        <div className="flex flex-wrap justify-end gap-2">
          {item.pedido.estadoSeparacao !== "SEPARADO" && <button className="team-btn" disabled={acao === item.compra.id} onClick={() => void actualizar(item.compra.id, { estadoSeparacao: "SEPARADO", motivo: "Separação concluída pelo seller" })}>Separado</button>}
          {item.pedido.estadoEmbalagem !== "EMBALADO" && <button className="team-btn" disabled={acao === item.compra.id} onClick={() => void actualizar(item.compra.id, { estadoEmbalagem: "EMBALADO", motivo: "Embalagem concluída pelo seller" })}>Embalado</button>}
          <button className="team-btn" disabled={acao === item.compra.id} onClick={() => void actualizar(item.compra.id, { estadoEntrega: "ENVIADO", motivo: "Pedido entregue ao transporte" })}><Truck size={14} /> Em trânsito</button>
          <button className="team-btn" disabled={acao === item.compra.id} onClick={() => void actualizar(item.compra.id, { tentativaFalhada: true, estadoEntrega: "FALHOU", motivo: "Tentativa de entrega sem sucesso" })}>Tentativa falhada</button>
          <button className="team-btn team-btn-primary" disabled={acao === item.compra.id} onClick={() => void actualizar(item.compra.id, { estadoEntrega: "ENTREGUE", motivo: "Entrega confirmada pelo seller" })}><PackageCheck size={14} /> Entregue</button>
        </div>
      </article>)}</div>
    </section>}

    {vista === "FINANCEIRO" && <section className="cd-pedidos-recentes" style={{ marginTop: "1rem" }}><div className="cd-secao-head"><span className="cd-secao-titulo">Repasses e retenções</span><CircleDollarSign size={17} /></div><div className="cd-pedidos-lista">{(dados?.repasses ?? []).map((repasse) => <div className="cd-pedido" key={repasse.id}><div><strong>{formatarKwanza(repasse.valorDisponivelEmKwanza)} disponível</strong><span>{repasse.estado}{repasse.motivoRetencao ? ` · ${repasse.motivoRetencao}` : ""}</span></div><span>{formatarKwanza(repasse.valorLiquidoEmKwanza)}</span></div>)}</div></section>}

    {vista === "SUPORTE" && <section className="cd-pedidos-recentes" style={{ marginTop: "1rem" }}><div className="cd-secao-head"><span className="cd-secao-titulo">Reembolsos e suporte</span><FileCheck2 size={17} /></div><div className="cd-pedidos-lista">{(dados?.reembolsos ?? []).map((item) => <div className="cd-pedido" key={item.id}><div><strong>{item.estado} · {formatarKwanza(item.valorEmKwanza)}</strong><span>{item.motivo}</span></div><RotateCcw size={16} /></div>)}</div></section>}
  </div></CrmPageMotion>;
}

function Kpi({ rotulo, valor, icone }: { rotulo: string; valor: number; icone: ReactNode }) { return <div className="team-kcard"><div className="team-kcard-label">{icone} {rotulo}</div><div className="team-kcard-value">{valor}</div></div>; }
function BotaoVista({ activo, onClick, icone, children }: { activo: boolean; onClick: () => void; icone: ReactNode; children: ReactNode }) { return <button type="button" className={`team-btn min-w-0 justify-center px-2 ${activo ? "team-btn-primary" : ""}`} aria-pressed={activo} onClick={onClick}>{icone}{children}</button>; }
