import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Plus,
  RefreshCcw,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  StatusBadge,
  BotaoBizy,
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";
import type { MetodoPagamentoNegocio, RespostaMetodosPagamento } from "../tipos";

function iconeTipo(tipo: MetodoPagamentoNegocio["tipo"]) {
  switch (tipo) {
    case "TRANSFERENCIA": return <Banknote size={20} />;
    case "MULTICAIXA": return <CreditCard size={20} />;
    case "NUMERARIO": return <Wallet size={20} />;
    default: return <CreditCard size={20} />;
  }
}

function rotuloTipo(tipo: MetodoPagamentoNegocio["tipo"]): string {
  return { TRANSFERENCIA: "Transferência bancária", MULTICAIXA: "Multicaixa Express", NUMERARIO: "Numerário", OUTRO: "Outro" }[tipo];
}

export function PaginaPagamentos() {
  const [metodos, setMetodos] = useState<MetodoPagamentoNegocio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoTipo, setNovoTipo] = useState<MetodoPagamentoNegocio["tipo"]>("TRANSFERENCIA");
  const [novoNome, setNovoNome] = useState("");
  const [novoIban, setNovoIban] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const r = await requisitarApi<RespostaMetodosPagamento>("/negocio/pagamentos");
      setMetodos(r.metodos);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(); }, []);

  async function adicionarMetodo() {
    if (!novoNome.trim()) return;
    try {
      await requisitarApi("/negocio/pagamentos", {
        method: "POST",
        body: { tipo: novoTipo, nome: novoNome, detalhes: novoIban ? { iban: novoIban } : {} },
      });
      setNovoNome(""); setNovoIban(""); setMostrarForm(false);
      await carregar();
    } catch { /* silencioso */ }
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    try {
      await requisitarApi(`/negocio/pagamentos/${id}`, { method: "PATCH", body: { ativo: !ativo } });
      await carregar();
    } catch { /* silencioso */ }
  }

  async function definirPrincipal(id: string) {
    try {
      await requisitarApi(`/negocio/pagamentos/${id}`, { method: "PATCH", body: { principal: true } });
      await carregar();
    } catch { /* silencioso */ }
  }

  const ativos = metodos.filter((m) => m.ativo).length;
  const principal = metodos.find((m) => m.principal);

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Configuração · ${metodos.length} método${metodos.length !== 1 ? "s" : ""}`}
        titulo="Métodos de pagamento"
        tamanhoTitulo="sm"
      >
        <BotaoBizy icone={Plus} onClick={() => setMostrarForm(true)}>Adicionar</BotaoBizy>
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard hero icone={CreditCard} rotulo="Total métodos" valor={metodos.length} delta={`${ativos} activo${ativos !== 1 ? "s" : ""}`} deltaPositivo={ativos > 0} />
        <KpiCard icone={CheckCircle2} cor="green" rotulo="Activos" valor={ativos} />
        <KpiCard icone={Star} cor="amber" rotulo="Principal" valor={principal ? 1 : 0} delta={principal?.nome ?? "nenhum"} />
      </KpiGrid>

      {mostrarForm && (
        <div className="bz-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Plus size={18} style={{ color: "var(--green)" }} />
            <strong style={{ fontSize: 14 }}>Novo método de pagamento</strong>
          </div>
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto]">
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value as MetodoPagamentoNegocio["tipo"])}
              className="bz-select"
              style={{ minWidth: 160 }}
            >
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="MULTICAIXA">Multicaixa Express</option>
              <option value="NUMERARIO">Numerário</option>
              <option value="OUTRO">Outro</option>
            </select>
            <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome (ex: BAI Conta Empresa)" />
            <Input value={novoIban} onChange={(e) => setNovoIban(e.target.value)} placeholder="IBAN ou referência (opcional)" />
            <div className="flex gap-2">
              <BotaoBizy icone={Plus} onClick={() => void adicionarMetodo()}>Guardar</BotaoBizy>
              <button type="button" className="bz-btn bz-btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cards de métodos ── */}
      <div className="bz-rec-cards">
        {metodos.length > 0 ? metodos.map((m) => (
          <div key={m.id} className="bz-rec-c" style={{ padding: 20, opacity: m.ativo ? 1 : 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: m.ativo ? "oklch(.95 .02 145)" : "var(--bg-2)",
                color: m.ativo ? "var(--green)" : "var(--ink-3)",
              }}>
                {iconeTipo(m.tipo)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  {m.nome}
                  {m.principal && <Star size={13} style={{ color: "var(--amber)", fill: "var(--amber)" }} />}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{rotuloTipo(m.tipo)}</div>
              </div>
              <StatusBadge cor={m.ativo ? "green" : "mute"}>
                {m.ativo ? "Activo" : "Inactivo"}
              </StatusBadge>
            </div>

            {Object.entries(m.detalhes).length > 0 && (
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 12, padding: "8px 12px", background: "var(--bg-2)", borderRadius: 8 }}>
                {Object.entries(m.detalhes).map(([k, v]) => (
                  <div key={k}><strong style={{ textTransform: "uppercase", fontSize: 10.5, color: "var(--ink-3)" }}>{k}:</strong> {v}</div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="bz-btn bz-btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => void alternarAtivo(m.id, m.ativo)}
              >
                {m.ativo ? "Desativar" : "Ativar"}
              </button>
              {!m.principal && m.ativo && (
                <button
                  type="button"
                  className="bz-btn bz-btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => void definirPrincipal(m.id)}
                >
                  <Star size={12} /> Tornar principal
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="bz-feed-empty" style={{ padding: 40, textAlign: "center" }}>
            {carregando ? "A carregar métodos..." : "Sem métodos de pagamento configurados. Adicione o primeiro."}
          </div>
        )}
      </div>
    </CrmPageMotion>
  );
}
