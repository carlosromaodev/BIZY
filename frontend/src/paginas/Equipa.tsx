import {
  Crown,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { requisitarApi } from "../api";
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
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  BotaoBizy,
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";
import type {
  MembroNegocio,
  PapelNegocio,
  RespostaMembros,
  RespostaPapeis,
} from "../tipos";

export function PaginaEquipa() {
  const [membros, setMembros] = useState<MembroNegocio[]>([]);
  const [papeis, setPapeis] = useState<PapelNegocio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoPapel, setNovoPapel] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const [rm, rp] = await Promise.allSettled([
        requisitarApi<RespostaMembros>("/negocio/membros"),
        requisitarApi<RespostaPapeis>("/negocio/papeis"),
      ]);
      setMembros(rm.status === "fulfilled" ? rm.value.membros : []);
      setPapeis(rp.status === "fulfilled" ? rp.value.papeis : []);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(); }, []);

  async function convidarMembro() {
    if (!novoNome.trim() || !novoEmail.trim()) return;
    try {
      await requisitarApi("/negocio/membros", {
        method: "POST",
        body: { nome: novoNome, email: novoEmail, papel: novoPapel || "MEMBRO" },
      });
      setNovoNome(""); setNovoEmail(""); setNovoPapel(""); setMostrarForm(false);
      await carregar();
    } catch { /* silencioso */ }
  }

  const ativos = membros.filter((m) => m.estado === "ATIVO").length;
  const convidados = membros.filter((m) => m.estado === "CONVIDADO").length;

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Gestão de equipa · ${membros.length} membro${membros.length !== 1 ? "s" : ""}`}
        titulo="Equipa"
        tamanhoTitulo="sm"
      >
        <BotaoBizy icone={UserPlus} onClick={() => setMostrarForm(true)}>Convidar</BotaoBizy>
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard hero icone={Users} rotulo="Total membros" valor={membros.length} delta={`${ativos} activo${ativos !== 1 ? "s" : ""}`} deltaPositivo />
        <KpiCard icone={Crown} cor="amber" rotulo="Papéis" valor={papeis.length} />
        <KpiCard icone={UserPlus} cor="blue" rotulo="Convites pendentes" valor={convidados} delta={convidados > 0 ? "aguardando" : "nenhum"} />
        <KpiCard icone={Shield} cor="violet" rotulo="Permissões" valor={new Set(membros.flatMap((m) => m.permissoes)).size} delta="tipos únicos" />
      </KpiGrid>

      {mostrarForm && (
        <div className="bz-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <UserPlus size={18} style={{ color: "var(--green)" }} />
            <strong style={{ fontSize: 14 }}>Convidar membro</strong>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome" />
            <Input value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="Email" type="email" />
            <Input value={novoPapel} onChange={(e) => setNovoPapel(e.target.value)} placeholder="Papel (ex: GESTOR)" />
            <div className="flex gap-2">
              <BotaoBizy icone={Plus} onClick={() => void convidarMembro()}>Enviar</BotaoBizy>
              <button type="button" className="bz-btn bz-btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Membros ── */}
      <TableCard>
        <Table>
          <TableHead>
            <Th>Membro</Th>
            <Th>Papel</Th>
            <Th>Contacto</Th>
            <Th>Último acesso</Th>
            <Th>Estado</Th>
          </TableHead>
          <tbody>
            {membros.length > 0 ? membros.map((m) => (
              <tr key={m.id}>
                <Td>
                  <div className="bz-cli">
                    <AvatarBizy iniciais={obterIniciais(m.nome)} cor={obterCorAvatar(m.nome)} tamanho={34} />
                    <div>
                      <div className="bz-cli-name">{m.nome}</div>
                      <div className="bz-cli-at">{m.email ?? "—"}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <StatusBadge cor={m.papel.includes("ADMIN") || m.papel.includes("DONO") ? "amber" : "blue"}>
                    {m.papel}
                  </StatusBadge>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, color: "var(--ink-2)" }}>
                    {m.telefone && <><Phone size={12} />{m.telefone}</>}
                    {m.email && <><Mail size={12} />{m.email}</>}
                    {!m.telefone && !m.email && "—"}
                  </div>
                </Td>
                <Td>
                  <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                    {m.ultimoAcesso ? new Date(m.ultimoAcesso).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Nunca"}
                  </span>
                </Td>
                <Td>
                  <StatusBadge cor={m.estado === "ATIVO" ? "green" : m.estado === "CONVIDADO" ? "amber" : "mute"}>
                    {m.estado === "ATIVO" ? "Ativo" : m.estado === "CONVIDADO" ? "Convidado" : "Inativo"}
                  </StatusBadge>
                </Td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="bz-feed-empty">
                  {carregando ? "A carregar equipa..." : "Sem membros. Convide a sua equipa para colaborar."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>

      {/* ── Papéis ── */}
      {papeis.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 28, marginBottom: 12, color: "var(--ink)" }}>Papéis e permissões</h3>
          <div className="bz-rec-cards">
            {papeis.map((p) => (
              <div key={p.id} className="bz-rec-c">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Shield size={16} style={{ color: "var(--violet)" }} />
                  <strong style={{ fontSize: 14 }}>{p.nome}</strong>
                </div>
                {p.descricao && <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 8 }}>{p.descricao}</div>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.permissoes.slice(0, 6).map((perm) => (
                    <span key={perm} style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 6, background: "var(--bg-2)", color: "var(--ink-2)" }}>{perm}</span>
                  ))}
                  {p.permissoes.length > 6 && <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>+{p.permissoes.length - 6}</span>}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)" }}>{p.totalMembros} membro{p.totalMembros !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </CrmPageMotion>
  );
}
