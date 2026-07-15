import {
  BadgeDollarSign, BarChart3, BookOpen, Boxes, BriefcaseBusiness, CheckCircle2, ChevronRight,
  CircleDollarSign, ExternalLink, FileVideo, Link2, LogOut, PackageSearch, Radio, Settings,
  ShoppingCart, Sparkles, Target, WalletCards
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmarOtpContaBizy, encerrarSessaoContaBizy, solicitarOtpContaBizy } from "../api/contaBizy";
import { criarSmartLinkCreator, obterCreatorPortal, type CreatorPortalDados } from "../api/creatorPortal";
import { criarConteudoCreator, listarConteudosCreator, type ConteudoCommerceDados } from "../api/conteudoCompravel";
import { MarcaMarket, MarketPublicPage } from "../componentes/MarketChrome";

const NAVEGACAO = [
  ["/creator", "Visão geral", BarChart3],
  ["/creator/oportunidades", "Oportunidades", BriefcaseBusiness],
  ["/creator/produtos", "Produtos", PackageSearch],
  ["/creator/campanhas", "Campanhas", Target],
  ["/creator/conteudos", "Conteúdos", FileVideo],
  ["/creator/links", "Smart Links", Link2],
  ["/creator/carrinhos", "Carrinhos", ShoppingCart],
  ["/creator/missoes", "Missões", CheckCircle2],
  ["/creator/comissoes", "Comissões", CircleDollarSign],
  ["/creator/pagamentos", "Pagamentos", WalletCards],
  ["/creator/desempenho", "Desempenho", BarChart3],
  ["/creator/configuracoes", "Configurações", Settings]
] as const;

const formatarKwanza = (valor: number) => `${new Intl.NumberFormat("pt-AO").format(valor)} Kz`;

export function PaginaCreatorPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dados, setDados] = useState<CreatorPortalDados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [otpSolicitado, setOtpSolicitado] = useState(false);
  const [erro, setErro] = useState("");

  const itemAtual = NAVEGACAO.find(([rota]) => rota === location.pathname) ?? NAVEGACAO[0];

  async function carregar() {
    setCarregando(true);
    try {
      setDados(await obterCreatorPortal());
      setErro("");
    } catch {
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function submeterOtp(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    try {
      if (!otpSolicitado) {
        await solicitarOtpContaBizy({ telefone, finalidade: "LOGIN" });
        setOtpSolicitado(true);
        return;
      }
      await confirmarOtpContaBizy({ telefone, codigo, finalidade: "LOGIN" });
      await carregar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível iniciar sessão.");
    }
  }

  async function sair() {
    await encerrarSessaoContaBizy();
    setDados(null);
    navigate("/creator");
  }

  if (carregando) return <MarketPublicPage className="creator-public"><div className="creator-loading">A carregar portal...</div></MarketPublicPage>;

  if (!dados) {
    return (
      <MarketPublicPage className="creator-public">
        <header className="creator-auth-header"><Link to="/market"><MarcaMarket /></Link><span>Creator</span></header>
        <section className="creator-auth-shell">
          <div className="creator-auth-copy"><span>Bizy Creator</span><h1>Conteúdo, vendas e comissão no mesmo lugar.</h1><p>Entre com o telefone verificado associado ao seu perfil de afiliado ou criador.</p></div>
          <form className="creator-auth-form" onSubmit={submeterOtp}>
            <h2>{otpSolicitado ? "Confirmar código" : "Aceder ao portal"}</h2>
            <label htmlFor="creator-telefone">Telefone</label>
            <input id="creator-telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} autoComplete="tel" disabled={otpSolicitado} required />
            {otpSolicitado && <><label htmlFor="creator-codigo">Código de 6 dígitos</label><input id="creator-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required /></>}
            {erro && <p role="alert">{erro}</p>}
            <button type="submit">{otpSolicitado ? "Entrar" : "Receber código"}<ChevronRight size={17} /></button>
          </form>
        </section>
      </MarketPublicPage>
    );
  }

  return (
    <MarketPublicPage className="creator-public creator-app">
      <header className="creator-topbar">
        <Link to="/market" className="creator-brand"><MarcaMarket /><span>Creator</span></Link>
        <div className="creator-account"><span>{dados.conta.nome || dados.parceiros[0]?.nomePublico || "Creator"}</span><button type="button" onClick={sair} aria-label="Terminar sessão"><LogOut size={18} /></button></div>
      </header>
      <div className="creator-layout">
        <aside className="creator-sidebar"><nav aria-label="Portal Creator">{NAVEGACAO.map(([rota, rotulo, Icone]) => <Link key={rota} to={rota} className={location.pathname === rota ? "active" : ""}><Icone size={18} /><span>{rotulo}</span></Link>)}</nav></aside>
        <main className="creator-main">
          <header className="creator-page-head"><div><span>Portal Creator</span><h1>{itemAtual[1]}</h1></div><div className="creator-profile-state"><CheckCircle2 size={16} />{dados.parceiros.length} perfil(is) ligado(s)</div></header>
          <ConteudoCreator rota={location.pathname} dados={dados} atualizar={carregar} />
        </main>
      </div>
    </MarketPublicPage>
  );
}

function ConteudoCreator({ rota, dados, atualizar }: { rota: string; dados: CreatorPortalDados; atualizar: () => Promise<void> }) {
  const m = dados.metricas;
  const metricas = useMemo(() => [
    ["Receita atribuída", formatarKwanza(m.receitaAtribuidaEmKwanza), "Pedidos com atribuição confirmada no sistema"],
    ["Comissão estimada", formatarKwanza(m.comissaoEstimadaEmKwanza), "Ainda sujeita a confirmação"],
    ["Saldo disponível", formatarKwanza(m.saldoDisponivelEmKwanza), "Comissão confirmada e elegível"],
    ["Total pago", formatarKwanza(m.comissaoPagaEmKwanza), "Pagamentos registados"]
  ], [m]);

  if (rota === "/creator/links") return <LinksCreator dados={dados} atualizar={atualizar} />;
  if (rota === "/creator/conteudos") return <ConteudosCreator dados={dados} />;
  if (rota === "/creator/comissoes") return <TabelaComissoes dados={dados} />;
  if (rota === "/creator/pagamentos") return <TabelaPagamentos dados={dados} />;
  if (rota === "/creator/desempenho") return <FunilCreator dados={dados} />;
  if (rota === "/creator/configuracoes") return <section className="creator-panel"><h2>Perfis comerciais</h2>{dados.parceiros.map((p) => <div className="creator-row" key={p.id}><div><strong>{p.nomePublico}</strong><span>{p.tipo} · {p.codigo}</span></div><span className="creator-status">{p.estado}</span></div>)}</section>;
  if (rota !== "/creator") return <EstadoDominio rota={rota} />;

  return <>
    <section className="creator-kpis">{metricas.map(([rotulo, valor, nota]) => <article key={rotulo}><span>{rotulo}</span><strong>{valor}</strong><small>{nota}</small></article>)}</section>
    <section className="creator-grid-two"><FunilCreator dados={dados} /><section className="creator-panel"><div className="creator-panel-head"><div><span>Ativos</span><h2>Smart Links recentes</h2></div><Link to="/creator/links">Ver todos</Link></div>{dados.links.slice(0, 5).map((link) => <div className="creator-row" key={link.id}><div><strong>{link.codigo}</strong><span>{link.destinoTipo} · {link.codigoProduto || link.slugLoja || link.destinoId || "Destino geral"}</span></div><ExternalLink size={16} /></div>)}{!dados.links.length && <p className="creator-empty">Ainda não existem links neste perfil.</p>}</section></section>
  </>;
}

function FunilCreator({ dados }: { dados: CreatorPortalDados }) {
  const m = dados.metricas;
  return <section className="creator-panel"><div className="creator-panel-head"><div><span>Jornada real</span><h2>Funil comercial</h2></div><BadgeDollarSign size={20} /></div><div className="creator-funnel">{[["Visualizações", m.visualizacoes], ["Cliques válidos", m.cliquesValidos], ["Checkouts", m.checkouts], ["Pedidos", m.pedidos]].map(([r, v]) => <div key={r}><span>{r}</span><strong>{v}</strong></div>)}</div></section>;
}

function LinksCreator({ dados, atualizar }: { dados: CreatorPortalDados; atualizar: () => Promise<void> }) {
  const [parceiroId, setParceiroId] = useState(dados.parceiros[0]?.id ?? "");
  const [destinoTipo, setDestinoTipo] = useState<"LOJA" | "PRODUTO">("PRODUTO");
  const [destino, setDestino] = useState("");
  async function criar(evento: FormEvent) { evento.preventDefault(); await criarSmartLinkCreator({ parceiroId, destinoTipo, ...(destinoTipo === "PRODUTO" ? { codigoProduto: destino } : { slugLoja: destino }) }); setDestino(""); await atualizar(); }
  return <section className="creator-panel"><div className="creator-panel-head"><div><span>Rastreamento</span><h2>Smart Links</h2></div><Link2 size={20} /></div><form className="creator-link-form" onSubmit={criar}><label>Perfil<select value={parceiroId} onChange={(e) => setParceiroId(e.target.value)}>{dados.parceiros.map((p) => <option key={p.id} value={p.id}>{p.nomePublico}</option>)}</select></label><label>Destino<select value={destinoTipo} onChange={(e) => setDestinoTipo(e.target.value as "LOJA" | "PRODUTO")}><option value="PRODUTO">Produto</option><option value="LOJA">Loja</option></select></label><label>Código ou slug<input value={destino} onChange={(e) => setDestino(e.target.value)} required /></label><button type="submit">Criar link</button></form>{dados.links.map((link) => <div className="creator-row" key={link.id}><div><strong>{link.codigo}</strong><span>{link.destinoTipo} · {link.codigoProduto || link.slugLoja || link.destinoId}</span></div><span className="creator-status">{link.ativo ? "ATIVO" : "INATIVO"}</span></div>)}</section>;
}

function TabelaComissoes({ dados }: { dados: CreatorPortalDados }) { return <section className="creator-panel"><h2>Movimentos de comissão</h2><div className="creator-table-wrap"><table><thead><tr><th>Pedido</th><th>Estado</th><th>Base atribuída</th><th>Comissão</th></tr></thead><tbody>{dados.comissoes.map((c) => <tr key={c.id}><td>{c.pedidoId.slice(0, 8)}</td><td>{c.status}</td><td>{formatarKwanza(c.baseEmKwanza)}</td><td>{formatarKwanza(c.valorEmKwanza)}</td></tr>)}</tbody></table></div>{!dados.comissoes.length && <p className="creator-empty">Nenhuma comissão registada.</p>}</section>; }
function TabelaPagamentos({ dados }: { dados: CreatorPortalDados }) { return <section className="creator-panel"><h2>Histórico de pagamentos</h2>{dados.pagamentos.map((p) => <div className="creator-row" key={p.id}><div><strong>{p.referencia}</strong><span>{new Date(p.criadoEm).toLocaleDateString("pt-AO")} · {p.status}</span></div><strong>{formatarKwanza(p.valorEmKwanza)}</strong></div>)}{!dados.pagamentos.length && <p className="creator-empty">Nenhum pagamento registado.</p>}</section>; }

function ConteudosCreator({ dados }: { dados: CreatorPortalDados }) {
  const [conteudos, setConteudos] = useState<ConteudoCommerceDados[]>([]); const [titulo, setTitulo] = useState(""); const [slug, setSlug] = useState(""); const [produtos, setProdutos] = useState(""); const [erro, setErro] = useState("");
  const carregar = () => listarConteudosCreator().then((r) => setConteudos(r.conteudos));
  useEffect(() => { void carregar(); }, []);
  async function criar(evento: FormEvent) { evento.preventDefault(); setErro(""); try { const referencias = produtos.split("\n").map((linha) => linha.split(",").map((v) => v.trim())).filter((p) => p[0] && p[1]).map(([slugLoja, codigoProduto]) => ({ slugLoja, codigoProduto })); await criarConteudoCreator({ parceiroId: dados.parceiros[0]?.id, slug, tipo: "PUBLICACAO", titulo, divulgacaoComercial: true, produtos: referencias }); setTitulo(""); setSlug(""); setProdutos(""); await carregar(); } catch (falha) { setErro(falha instanceof Error ? falha.message : "Conteúdo inválido."); } }
  return <section className="creator-panel"><div className="creator-panel-head"><div><span>Social commerce</span><h2>Conteúdos compráveis</h2></div><FileVideo size={20} /></div><form className="creator-content-form" onSubmit={criar}><label>Título<input value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></label><label>Slug<input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="guia-de-verao" required /></label><label className="wide">Produtos, um por linha no formato loja,código<textarea value={produtos} onChange={(e) => setProdutos(e.target.value)} placeholder={"minha-loja,PROD-01\noutra-loja,PROD-22"} required /></label>{erro && <p role="alert">{erro}</p>}<button type="submit">Enviar para revisão</button></form>{conteudos.map((item) => <div className="creator-row" key={item.id}><div><strong>{item.titulo}</strong><span>{item.tipo} · {item.produtos.length} produto(s) · /c/{item.slug}</span></div><span className="creator-status">{item.estado}</span></div>)}{!conteudos.length && <p className="creator-empty">Ainda não existem conteúdos neste perfil.</p>}</section>;
}

function EstadoDominio({ rota }: { rota: string }) {
  const config: Record<string, [string, string, typeof Boxes]> = {
    "/creator/oportunidades": ["Oportunidades", "Ofertas abertas para parceria comercial.", BriefcaseBusiness],
    "/creator/produtos": ["Produtos elegíveis", "Produtos disponíveis para criação e afiliação.", Boxes],
    "/creator/campanhas": ["Campanhas", "Campanhas em que o perfil participa.", Target],
    "/creator/conteudos": ["Conteúdos", "Publicações compráveis ligadas ao perfil.", BookOpen],
    "/creator/carrinhos": ["Carrinhos", "Carrinhos partilháveis criados pelo perfil.", ShoppingCart],
    "/creator/missoes": ["Missões", "Entregas comerciais e respetivos critérios.", Sparkles]
  };
  const [titulo, texto, Icone] = config[rota] ?? ["Área Creator", "Dados comerciais do perfil.", Radio];
  return <section className="creator-panel creator-domain-state"><Icone size={28} /><h2>{titulo}</h2><p>{texto}</p><span>Sem registos disponíveis.</span></section>;
}

export default PaginaCreatorPortal;
