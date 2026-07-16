import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Coins,
  Copy,
  Link2,
  Plus,
  RefreshCcw,
  Share2,
  UserPlus,
  X,
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
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  StatusBadge,
  Money,
  BotaoBizy,
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ResumoAfiliados } from "../tipos";
import { formatarKwanza } from "../utilidades";
import {
  normalizarLinksAfiliados,
  normalizarParceirosAfiliados,
  type LinkAfiliado,
  type ParceiroComercial,
  type RespostaLinksAfiliados,
  type RespostaParceirosAfiliados
} from "./afiliadosDados";

interface ResumoSaldos {
  totais: {
    totalParceiros: number;
    comissaoEstimadaEmKwanza: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoPagaEmKwanza: number;
    saldoPendenteEmKwanza: number;
  };
  saldos: Array<{
    afiliadoId: string;
    codigo: string;
    nomePublico: string;
    saldoPendenteEmKwanza: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoPagaEmKwanza: number;
  }>;
}

interface MarketplaceSellerDados {
  ofertas: Array<{ id: string; codigo: string; titulo: string; estado: string; comissaoTipo: string; comissaoValor: number; stockAmostras: number; produtos: unknown[]; missoes: unknown[] }>;
  candidaturas: Array<{ id: string; ofertaId: string; estado: string; parceiro: { nomePublico: string; tipo: string } | null; mensagem: string | null }>;
  solicitacoes: Array<{ id: string; ofertaId: string | null; estado: string; perfilCreator: { nomePublico: string; estado: string } | null; mensagem: string | null }>;
  amostras: Array<{ id: string; candidaturaId: string; estado: string }>;
}

export function PaginaAfiliados() {
  const [parceiros, setParceiros] = useState<ParceiroComercial[]>([]);
  const [links, setLinks] = useState<LinkAfiliado[]>([]);
  const [resumo, setResumo] = useState<ResumoAfiliados | null>(null);
  const [saldos, setSaldos] = useState<ResumoSaldos | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nomePublico, setNomePublico] = useState("");
  const [contacto, setContacto] = useState("");
  const [percentual, setPercentual] = useState("10");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [marketplace, setMarketplace] = useState<MarketplaceSellerDados>({ ofertas: [], candidaturas: [], solicitacoes: [], amostras: [] });
  const [tituloOferta, setTituloOferta] = useState("");
  const [codigoProdutoOferta, setCodigoProdutoOferta] = useState("");
  const [comissaoOferta, setComissaoOferta] = useState("10");
  const [stockAmostras, setStockAmostras] = useState("0");
  const [missaoOferta, setMissaoOferta] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const [respostaResumo, respostaParceiros, respostaLinks, respostaSaldos, respostaMarketplace] = await Promise.allSettled([
        requisitarApi<ResumoAfiliados>("/afiliados/resumo"),
        requisitarApi<RespostaParceirosAfiliados | ParceiroComercial[]>("/afiliados"),
        requisitarApi<RespostaLinksAfiliados | LinkAfiliado[]>("/afiliados/links"),
        requisitarApi<ResumoSaldos>("/afiliados/comissoes/saldos"),
        requisitarApi<MarketplaceSellerDados>("/creator/team/ofertas")
      ]);

      setResumo(respostaResumo.status === "fulfilled" ? respostaResumo.value : null);
      setParceiros(respostaParceiros.status === "fulfilled" ? normalizarParceirosAfiliados(respostaParceiros.value) : []);
      setLinks(respostaLinks.status === "fulfilled" ? normalizarLinksAfiliados(respostaLinks.value) : []);
      setSaldos(respostaSaldos.status === "fulfilled" ? respostaSaldos.value : null);
      setMarketplace(respostaMarketplace.status === "fulfilled" ? respostaMarketplace.value : { ofertas: [], candidaturas: [], solicitacoes: [], amostras: [] });
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar afiliados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const linksPorParceiro = useMemo(() => {
    const mapa = new Map<string, LinkAfiliado[]>();
    links.forEach((link) => mapa.set(link.afiliadoId, [...(mapa.get(link.afiliadoId) ?? []), link]));
    return mapa;
  }, [links]);

  const saldosPorId = useMemo(() => {
    const mapa = new Map<string, ResumoSaldos["saldos"][number]>();
    saldos?.saldos?.forEach((s) => mapa.set(s.afiliadoId, s));
    return mapa;
  }, [saldos]);

  async function criarParceiro() {
    if (!codigo.trim() || !nomePublico.trim()) {
      setMensagem("Informe código e nome público do afiliado.");
      return;
    }

    setMensagem("A criar afiliado...");
    try {
      await requisitarApi("/afiliados", {
        method: "POST",
        body: {
          tipo: "AFILIADO",
          codigo,
          nomePublico,
          contacto: contacto.trim() || null,
          estado: "ATIVO",
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: Number(percentual) || 0
          },
          metodoPagamento: {}
        }
      });
      setCodigo("");
      setNomePublico("");
      setContacto("");
      setMostrarForm(false);
      await carregar();
      setMensagem("Afiliado criado. Já pode receber links e comissões.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar afiliado.");
    }
  }

  async function criarLinkRapido(parceiro: ParceiroComercial) {
    setMensagem("A criar link de venda...");
    try {
      const link = await requisitarApi<LinkAfiliado>(`/afiliados/${parceiro.id}/links`, {
        method: "POST",
        body: {
          codigo: `${parceiro.codigo}-${Date.now().toString(36).toUpperCase()}`,
          destinoTipo: "LOJA",
          slugLoja: null,
          codigoProduto: null,
          canal: "whatsapp",
          origemConteudo: "team-afiliados",
          ativo: true
        }
      });
      await navigator.clipboard.writeText(link.urlPublica || `/go/${link.codigo}`);
      await carregar();
      setMensagem("Link criado e caminho público copiado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar link.");
    }
  }

  async function criarOferta() {
    if (!tituloOferta.trim() || !codigoProdutoOferta.trim()) { setMensagem("Informe título e código do produto elegível."); return; }
    try {
      await requisitarApi("/creator/team/ofertas", { method: "POST", body: {
        codigo: `OFFER-${Date.now().toString(36).toUpperCase()}`, titulo: tituloOferta,
        descricao: `Oportunidade Creator para promover ${tituloOferta} com conteúdo original e divulgação comercial.`,
        comissaoTipo: "PERCENTUAL", comissaoValor: Math.round((Number(comissaoOferta) || 0) * 100),
        stockAmostras: Number(stockAmostras) || 0, produtos: [{ codigoProduto: codigoProdutoOferta }],
        missoes: missaoOferta.trim() ? [{ titulo: missaoOferta, descricao: "Produzir e publicar o conteúdo conforme os critérios da campanha.", bonusEmKwanza: 0 }] : []
      } });
      setTituloOferta(""); setCodigoProdutoOferta(""); setMissaoOferta(""); await carregar(); setMensagem("Oferta criada em rascunho.");
    } catch (erro) { setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar a oferta."); }
  }

  async function publicarOferta(id: string, publicar: boolean) { await requisitarApi(`/creator/team/ofertas/${id}/publicacao`, { method: "PATCH", body: { publicar } }); await carregar(); }
  async function decidirCandidatura(id: string, aprovar: boolean) { await requisitarApi(`/creator/team/candidaturas/${id}/decisao`, { method: "PATCH", body: { aprovar } }); await carregar(); }

  /* ── KPIs ── */
  const totalVendas = Number(resumo?.receitaAtribuidaEmKwanza ?? 0);
  const parceirosAtivos = parceiros.filter((p) => p.estado === "ATIVO").length;
  const comissaoAPagar = Number(saldos?.totais.saldoPendenteEmKwanza ?? 0);
  const topAfiliado = parceiros.length > 0
    ? parceiros.reduce((melhor, p) => {
      const saldo = saldosPorId.get(p.id);
      const melhorSaldo = saldosPorId.get(melhor.id);
      return (saldo?.comissaoConfirmadaEmKwanza ?? 0) > (melhorSaldo?.comissaoConfirmadaEmKwanza ?? 0) ? p : melhor;
    }, parceiros[0])
    : null;

  /* ── Ordenar parceiros para leaderboard ── */
  const parceirosOrdenados = useMemo(() => {
    return [...parceiros].sort((a, b) => {
      const sa = saldosPorId.get(a.id)?.comissaoConfirmadaEmKwanza ?? 0;
      const sb = saldosPorId.get(b.id)?.comissaoConfirmadaEmKwanza ?? 0;
      return sb - sa;
    });
  }, [parceiros, saldosPorId]);

  const maxVendas = useMemo(() => {
    return Math.max(1, ...parceirosOrdenados.map((p) => linksPorParceiro.get(p.id)?.length ?? 0));
  }, [parceirosOrdenados, linksPorParceiro]);

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Quem vende por si · ${parceiros.length} parceiro${parceiros.length !== 1 ? "s" : ""}`}
        titulo="Afiliados"
        tamanhoTitulo="sm"
      >
        <BotaoBizy icone={Plus} onClick={() => setMostrarForm(true)}>Convidar afiliado</BotaoBizy>
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard
          hero
          icone={Coins}
          rotulo="Vendas via afiliados"
          valor={new Intl.NumberFormat("pt-AO").format(totalVendas)}
          unidade="Kz"
          delta={resumo ? `+${resumo.totalLinks ?? 0} links activos` : undefined}
          deltaPositivo
          rodape={`${resumo?.pedidosAtribuidos ?? 0} pedidos atribuídos`}
        />
        <KpiCard
          icone={Share2}
          cor="violet"
          rotulo="Afiliados ativos"
          valor={parceirosAtivos}
          delta={parceiros.length - parceirosAtivos > 0 ? `${parceiros.length - parceirosAtivos} pendente` : "todos ativos"}
        />
        <KpiCard
          icone={Coins}
          cor="amber"
          rotulo="Comissões a pagar"
          valor={new Intl.NumberFormat("pt-AO").format(comissaoAPagar)}
          unidade="Kz"
          delta={comissaoAPagar > 0 ? "fecho pendente" : "em dia"}
          deltaPositivo={comissaoAPagar > 0 ? false : undefined}
        />
        <KpiCard
          icone={ArrowUpRight}
          cor="green"
          rotulo="Top afiliado"
          valor={topAfiliado?.nomePublico ?? "—"}
          delta={topAfiliado ? `${linksPorParceiro.get(topAfiliado.id)?.length ?? 0} vendas` : undefined}
          deltaPositivo
        />
      </KpiGrid>

      <section className="bz-panel" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}><div><span className="bz-eyebrow">Creator Marketplace</span><h2 style={{ margin: "4px 0 0", fontSize: 18 }}>Ofertas e candidaturas</h2></div><BriefcaseBusiness size={20} /></div>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_.6fr_.6fr_1fr_auto]">
          <Input value={tituloOferta} onChange={(e) => setTituloOferta(e.target.value)} placeholder="Título da oferta" />
          <Input value={codigoProdutoOferta} onChange={(e) => setCodigoProdutoOferta(e.target.value)} placeholder="Código do produto" />
          <Input type="number" min="0.01" max="100" value={comissaoOferta} onChange={(e) => setComissaoOferta(e.target.value)} placeholder="Comissão %" />
          <Input type="number" min="0" value={stockAmostras} onChange={(e) => setStockAmostras(e.target.value)} placeholder="Amostras" />
          <Input value={missaoOferta} onChange={(e) => setMissaoOferta(e.target.value)} placeholder="Missão opcional" />
          <BotaoBizy icone={Plus} onClick={() => void criarOferta()}>Criar oferta</BotaoBizy>
        </div>
        <div className="grid gap-3 lg:grid-cols-2" style={{ marginTop: 18 }}>
          <div>{marketplace.ofertas.map((oferta) => <div className="creator-row" key={oferta.id}><div><strong>{oferta.titulo}</strong><span>{oferta.comissaoValor / 100}% · {oferta.produtos.length} produto(s) · {oferta.stockAmostras} amostra(s)</span></div><button type="button" className="bz-btn bz-btn-ghost" onClick={() => void publicarOferta(oferta.id, oferta.estado !== "PUBLICADA")}>{oferta.estado === "PUBLICADA" ? "Encerrar" : "Publicar"}</button></div>)}{!marketplace.ofertas.length && <p className="bz-feed-empty">Sem ofertas criadas.</p>}</div>
          <div>{marketplace.candidaturas.map((candidatura) => <div className="creator-row" key={candidatura.id}><div><strong>{candidatura.parceiro?.nomePublico ?? "Creator"}</strong><span>{candidatura.estado} · {candidatura.mensagem || "Sem mensagem"}</span></div>{candidatura.estado === "PENDENTE" && <div className="flex gap-1"><button type="button" className="bz-iconbtn" title="Aprovar" onClick={() => void decidirCandidatura(candidatura.id, true)}><Check size={15} /></button><button type="button" className="bz-iconbtn" title="Rejeitar" onClick={() => void decidirCandidatura(candidatura.id, false)}><X size={15} /></button></div>}</div>)}{!marketplace.candidaturas.length && <p className="bz-feed-empty">Sem candidaturas recebidas.</p>}</div>
          <div>{marketplace.solicitacoes.map((solicitacao) => <div className="creator-row" key={solicitacao.id}><div><strong>{solicitacao.perfilCreator?.nomePublico ?? "Creator"}</strong><span>{solicitacao.estado} · {solicitacao.mensagem || "Solicitação de afiliação"}</span></div>{solicitacao.estado === "PENDENTE" && <div className="flex gap-1"><button type="button" className="bz-iconbtn" title="Aprovar solicitação" onClick={() => void decidirCandidatura(solicitacao.id, true)}><Check size={15} /></button><button type="button" className="bz-iconbtn" title="Rejeitar solicitação" onClick={() => void decidirCandidatura(solicitacao.id, false)}><X size={15} /></button></div>}</div>)}{!marketplace.solicitacoes.length && !marketplace.candidaturas.length && <p className="bz-feed-empty">Sem solicitações recebidas.</p>}</div>
        </div>
      </section>

      {/* ── Novo afiliado (inline form) ── */}
      {mostrarForm && (
        <div className="bz-panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <UserPlus size={18} style={{ color: "var(--green)" }} />
            <strong style={{ fontSize: 14 }}>Novo afiliado</strong>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código: CRIADOR01" />
            <Input value={nomePublico} onChange={(e) => setNomePublico(e.target.value)} placeholder="Nome público" />
            <Input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="WhatsApp ou @username" />
            <Input type="number" min="0" max="100" value={percentual} onChange={(e) => setPercentual(e.target.value)} placeholder="Comissão %" />
            <div className="flex gap-2">
              <BotaoBizy icone={Plus} onClick={() => void criarParceiro()}>Criar</BotaoBizy>
              <button type="button" className="bz-btn bz-btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard Table ── */}
      <TableCard
        titulo="Parceiros e links"
        descricao="Crie links por afiliado, acompanhe receita atribuida e mantenha comissões visíveis para pagamento."
      >
        <Table>
          <TableHead>
            <Th>#</Th>
            <Th>Afiliado</Th>
            <Th>Vendas</Th>
            <Th right>Receita gerada</Th>
            <Th right>Comissão</Th>
            <Th>Link</Th>
            <Th>Estado</Th>
          </TableHead>
          <tbody>
            {parceirosOrdenados.length > 0 ? parceirosOrdenados.map((parceiro, i) => {
              const rank = i + 1;
              const totalLinks = linksPorParceiro.get(parceiro.id)?.length ?? 0;
              const saldo = saldosPorId.get(parceiro.id);
              const ranking = resumo?.ranking?.find((item) => item.afiliadoId === parceiro.id);
              const receita = ranking?.receitaAtribuidaEmKwanza ?? 0;
              const comissao = saldo?.comissaoConfirmadaEmKwanza ?? 0;
              const barWidth = Math.round((totalLinks / maxVendas) * 100);
              const primeiroLink = linksPorParceiro.get(parceiro.id)?.[0];

              return (
                <tr key={parceiro.id}>
                  <Td>
                    <span className={`bz-rank ${rank <= 3 ? `r${rank}` : ""}`}>{rank}</span>
                  </Td>
                  <Td>
                    <div className="bz-cli">
                      <AvatarBizy iniciais={obterIniciais(parceiro.nomePublico)} cor={obterCorAvatar(parceiro.nomePublico)} tamanho={34} />
                      <div>
                        <div className="bz-cli-name">{parceiro.nomePublico}</div>
                        <div className="bz-cli-at">{parceiro.contacto ?? parceiro.codigo}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="bz-minibar-cell">
                      <span className="bz-minibar"><i style={{ width: `${barWidth}%` }} /></span>
                      <span className="bz-tnum" style={{ fontWeight: 700 }}>{totalLinks}</span>
                    </div>
                  </Td>
                  <Td right>
                    <Money valor={receita} />
                  </Td>
                  <Td right>
                    <span className="bz-commission bz-tnum">{formatarKwanza(comissao)}</span>
                  </Td>
                  <Td>
                    {primeiroLink ? (
                      <button
                        type="button"
                        className="bz-aff-link"
                        onClick={() => void criarLinkRapido(parceiro)}
                        title="Copiar link"
                      >
                        <Link2 size={12} />/{parceiro.codigo.toLowerCase()}
                      </button>
                    ) : (
                      <button type="button" className="bz-aff-link" onClick={() => void criarLinkRapido(parceiro)}>
                        <Plus size={12} />Criar link
                      </button>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge cor={parceiro.estado === "ATIVO" ? "green" : "mute"}>
                      {parceiro.estado === "ATIVO" ? "Ativo" : parceiro.estado}
                    </StatusBadge>
                  </Td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="bz-feed-empty">
                  {carregando ? "A carregar afiliados..." : "Sem afiliados. Crie parceiros para vender com links rastreáveis."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>

      {mensagem && <footer className="bz-panel" style={{ padding: "12px 18px", fontSize: 13.5, color: "var(--ink-2)" }} aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}
