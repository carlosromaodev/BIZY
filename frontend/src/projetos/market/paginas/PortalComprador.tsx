import {
  Bell, ChevronRight, ClipboardCheck, Heart, KeyRound, LockKeyhole, LogOut, MapPin,
  MessageCircle, PackageCheck, PackageSearch, RefreshCcw, Route, ShieldCheck, ShoppingBag,
  Star, Store, Truck, UserRound, UsersRound
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  atualizarPerfilCompradorBizy,
  confirmarOtpContaBizy,
  encerrarSessaoContaBizy,
  listarCasosProtecaoComprador,
  listarEnderecosCompradorBizy,
  listarSessoesContaBizy,
  obterComprasContaBizy,
  obterPerfilCompradorBizy,
  obterResumoContaBizy,
  obterEstadoContaBizy,
  removerEnderecoCompradorBizy,
  revogarSessaoContaBizy,
  ROTAS_LOJAS,
  salvarEnderecoCompradorBizy,
  solicitarOtpContaBizy
} from "../api";
import type {
  CasoProtecaoCompradorBizy, EnderecoCompradorBizy, FavoritoContaBizy, PerfilCompradorBizy,
  RespostaCompraEstados, ResumoContaBizy, SessaoContaBizyPublica
} from "../api";
import { formatarDataHoraCurta, formatarKwanza } from "../../../utilidades";
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";

const NAVEGACAO_CONTA = [
  ["/conta", "Visão geral", UserRound],
  ["/conta/compras", "Compras", ShoppingBag],
  ["/conta/entregas", "Entregas", Truck],
  ["/conta/devolucoes", "Devoluções", RefreshCcw],
  ["/conta/favoritos", "Favoritos", Heart],
  ["/conta/lojas-seguidas", "Lojas seguidas", Store],
  ["/conta/enderecos", "Endereços", MapPin],
  ["/conta/avaliacoes", "Avaliações", Star],
  ["/conta/notificacoes", "Notificações", Bell],
  ["/conta/mensagens", "Mensagens", MessageCircle],
  ["/conta/afiliacao", "Afiliação", UsersRound],
  ["/conta/seguranca", "Segurança", LockKeyhole],
  ["/conta/privacidade", "Privacidade", ShieldCheck]
] as const;

type DadosConta = {
  resumo: ResumoContaBizy;
  compras: RespostaCompraEstados[];
  perfil: PerfilCompradorBizy;
  favoritos: FavoritoContaBizy[];
  enderecos: EnderecoCompradorBizy[];
  sessoes: SessaoContaBizyPublica[];
  casos: CasoProtecaoCompradorBizy[];
};

const ENDERECO_VAZIO = { rotulo: "Casa", provincia: "", municipio: "", bairro: "", endereco: "", referencia: "", principal: false };

export function PaginaPortalComprador() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dados, setDados] = useState<DadosConta | null>(null);
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoSolicitado, setCodigoSolicitado] = useState(false);
  const [codigoDev, setCodigoDev] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const estado = await obterEstadoContaBizy();
      if (!estado.autenticada) {
        setDados(null);
        return;
      }
      const [resumo, compras, perfil, sessoes, protecao] = await Promise.all([
        obterResumoContaBizy(), obterComprasContaBizy(), obterPerfilCompradorBizy(),
        listarSessoesContaBizy(), listarCasosProtecaoComprador()
      ]);
      setDados({
        resumo, compras: compras.compras, perfil: perfil.perfil, favoritos: perfil.favoritos,
        enderecos: perfil.enderecos, sessoes: sessoes.sessoes, casos: protecao.casos
      });
      setErro("");
    } catch {
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function solicitarCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setCarregando(true);
    try {
      const resposta = await solicitarOtpContaBizy({ telefone, finalidade: "LOGIN" });
      setCodigoSolicitado(true); setCodigoDev(resposta.codigoDev ?? "");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível enviar o código.");
    } finally { setCarregando(false); }
  }

  async function confirmarCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setCarregando(true);
    try {
      await confirmarOtpContaBizy({ telefone, codigo, finalidade: "LOGIN" });
      await carregar();
      navigate(destinoInternoSeguro(new URLSearchParams(location.search).get("returnTo")) ?? "/conta", { replace: true });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Código inválido ou expirado.");
    } finally { setCarregando(false); }
  }

  async function sair() {
    await encerrarSessaoContaBizy(); setDados(null); setTelefone(""); setCodigo("");
    setCodigoDev(""); setCodigoSolicitado(false); navigate("/conta/entrar", { replace: true });
  }

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-buyer-portal">
      <CabecalhoMarket />
      {!dados ? (
        <AutenticacaoConta
          telefone={telefone} codigo={codigo} codigoDev={codigoDev} codigoSolicitado={codigoSolicitado}
          carregando={carregando} erro={erro} setTelefone={setTelefone} setCodigo={setCodigo}
          voltarTelefone={() => { setCodigoSolicitado(false); setCodigo(""); setErro(""); }}
          onSubmit={codigoSolicitado ? confirmarCodigo : solicitarCodigo}
        />
      ) : (
        <section className="market-account-layout">
          <aside className="market-account-sidebar">
            <div className="market-account-person">
              <span>{iniciais(dados.resumo.conta.nome)}</span>
              <div><strong>{dados.resumo.conta.nome || "Conta Bizy"}</strong><small>{dados.resumo.conta.telefone || dados.resumo.conta.email}</small></div>
            </div>
            <nav aria-label="Navegação da conta">
              {NAVEGACAO_CONTA.map(([url, rotulo, Icone]) => (
                <Link key={url} to={url} className={location.pathname === url ? "is-active" : ""}>
                  <Icone size={17} /><span>{rotulo}</span><ChevronRight size={14} />
                </Link>
              ))}
            </nav>
            <button type="button" onClick={() => void sair()}><LogOut size={17} /> Terminar sessão</button>
          </aside>
          <section className="market-account-content">
            <ConteudoConta rota={location.pathname} dados={dados} atualizar={carregar} />
          </section>
        </section>
      )}
      <RodapeMarket />
    </main>
  );
}

function AutenticacaoConta(props: {
  telefone: string; codigo: string; codigoDev: string; codigoSolicitado: boolean; carregando: boolean; erro: string;
  setTelefone: (valor: string) => void; setCodigo: (valor: string) => void; voltarTelefone: () => void;
  onSubmit: (evento: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="market-account-auth">
      <div className="market-account-auth-copy">
        <span>Conta pessoal Bizy</span>
        <h1>Entrar ou criar conta</h1>
        <p>Acompanha as tuas compras, guarda produtos, gere endereços e protege o teu acesso.</p>
        <ul><li><ShoppingBag size={17} />Compras de todas as lojas</li><li><ShieldCheck size={17} />Sessões revogáveis</li><li><Route size={17} />Regresso ao fluxo que estavas a concluir</li></ul>
      </div>
      <form onSubmit={props.onSubmit} className="market-account-auth-form">
        <span><ShieldCheck size={15} /> Acesso por código de uso único</span>
        <h2>{props.codigoSolicitado ? "Confirma o código" : "Usa o teu telefone"}</h2>
        <p>{props.codigoSolicitado ? "Insere os seis dígitos enviados por SMS." : "Não precisas de palavra-passe."}</p>
        {props.codigoSolicitado ? (
          <Input value={props.codigo} onChange={(evento) => props.setCodigo(evento.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" aria-label="Código de acesso" />
        ) : (
          <Input value={props.telefone} onChange={(evento) => props.setTelefone(evento.target.value)} placeholder="923 000 000" inputMode="tel" autoComplete="tel" aria-label="Telefone" />
        )}
        <Button type="submit" disabled={props.carregando || (props.codigoSolicitado ? props.codigo.length !== 6 : props.telefone.trim().length < 9)}>
          <KeyRound size={16} /> {props.carregando ? "A processar..." : props.codigoSolicitado ? "Entrar" : "Receber código"}
        </Button>
        {props.codigoDev && <small>Código de desenvolvimento: <strong>{props.codigoDev}</strong></small>}
        {props.codigoSolicitado && <button type="button" onClick={props.voltarTelefone}>Alterar telefone</button>}
        {props.erro && <p role="alert" className="market-account-error">{props.erro}</p>}
      </form>
    </section>
  );
}

function ConteudoConta({ rota, dados, atualizar }: { rota: string; dados: DadosConta; atualizar: () => Promise<void> }) {
  if (rota === "/conta/compras") return <ComprasConta compras={dados.compras} />;
  if (rota === "/conta/entregas") return <EntregasConta compras={dados.compras} />;
  if (rota === "/conta/devolucoes") return <CasosConta casos={dados.casos} />;
  if (rota === "/conta/favoritos") return <FavoritosConta favoritos={dados.favoritos} />;
  if (rota === "/conta/lojas-seguidas") return <EstadoConta icon={Store} titulo="Lojas seguidas" texto="As lojas que seguires aparecerão aqui com novidades de catálogo e entrega." acao="Explorar lojas" destino={ROTAS_LOJAS.lojasMarket} />;
  if (rota === "/conta/enderecos") return <EnderecosConta enderecos={dados.enderecos} atualizar={atualizar} />;
  if (rota === "/conta/avaliacoes") return <AvaliacoesConta compras={dados.compras} />;
  if (rota === "/conta/notificacoes") return <NotificacoesConta compras={dados.compras} casos={dados.casos} />;
  if (rota === "/conta/mensagens") return <EstadoConta icon={MessageCircle} titulo="Mensagens de compras" texto="O atendimento associado a pedidos aparecerá aqui, sem levar a conta pessoal para o Team." acao="Ver compras" destino="/conta/compras" />;
  if (rota === "/conta/afiliacao") return <AfiliacaoConta ativo={dados.resumo.navegacao.creator} />;
  if (rota === "/conta/seguranca") return <SegurancaConta sessoes={dados.sessoes} atualizar={atualizar} />;
  if (rota === "/conta/privacidade") return <PrivacidadeConta perfil={dados.perfil} atualizar={atualizar} />;
  return <VisaoGeralConta dados={dados} atualizar={atualizar} />;
}

function CabecalhoSecao({ titulo, texto }: { titulo: string; texto: string }) {
  return <header className="market-account-section-head"><span>Minha conta</span><h1>{titulo}</h1><p>{texto}</p></header>;
}

function VisaoGeralConta({ dados, atualizar }: { dados: DadosConta; atualizar: () => Promise<void> }) {
  const [nome, setNome] = useState(dados.perfil.nomeExibicao ?? dados.resumo.conta.nome ?? "");
  const [guardando, setGuardando] = useState(false);
  async function guardar(evento: FormEvent) { evento.preventDefault(); setGuardando(true); await atualizarPerfilCompradorBizy({ nomeExibicao: nome }); await atualizar(); setGuardando(false); }
  return <>
    <CabecalhoSecao titulo={`Olá, ${dados.resumo.conta.nome?.split(" ")[0] || "bem-vindo"}`} texto="Compras, dados pessoais e contextos Bizy num único lugar." />
    <div className="market-account-metrics">
      <Link to="/conta/compras"><ShoppingBag size={19} /><strong>{dados.resumo.indicadores.comprasEmCurso}</strong><span>compras em curso</span></Link>
      <Link to="/conta/favoritos"><Heart size={19} /><strong>{dados.resumo.indicadores.favoritos}</strong><span>favoritos</span></Link>
      <Link to="/conta/enderecos"><MapPin size={19} /><strong>{dados.resumo.indicadores.enderecos}</strong><span>endereços</span></Link>
      <Link to="/conta/seguranca"><LockKeyhole size={19} /><strong>{dados.resumo.indicadores.sessoesAtivas}</strong><span>sessões activas</span></Link>
    </div>
    <section className="market-account-panel"><div><span>Perfil pessoal</span><h2>Dados da conta</h2></div><form className="market-account-inline-form" onSubmit={guardar}><label><span>Nome de apresentação</span><Input value={nome} onChange={(e) => setNome(e.target.value)} /></label><Button type="submit" disabled={guardando || nome.trim().length < 2}>{guardando ? "A guardar..." : "Guardar"}</Button></form></section>
    <section className="market-account-panel"><div><span>Contextos disponíveis</span><h2>Onde podes trabalhar</h2></div><div className="market-account-contexts"><Link to="/conta" className="is-active"><UserRound size={18} /><strong>Conta pessoal</strong><small>compras e segurança</small></Link>{dados.resumo.navegacao.creator && <Link to="/creator"><UsersRound size={18} /><strong>Bizy Creator</strong><small>conteúdo e comissões</small></Link>}{dados.resumo.navegacao.team && <Link to="/app"><Store size={18} /><strong>Bizy Team</strong><small>operação empresarial</small></Link>}</div></section>
  </>;
}

function ComprasConta({ compras }: { compras: RespostaCompraEstados[] }) {
  return <><CabecalhoSecao titulo="Compras" texto="Todos os pedidos associados ao teu contacto verificado." /><div className="market-account-list">{compras.map(({ compra, pedidosFilho }) => <Link key={compra.id} to={`/conta/compras/${compra.id}`} className="market-purchase-row"><div><strong>Compra #{compra.numero}</strong><span>{formatarDataHoraCurta(compra.criadoEm)} · {pedidosFilho.length} loja(s)</span><small>Pagamento {compra.estadoPagamento} · {pedidosFilho.filter((p) => p.estadoEntrega === "ENTREGUE").length}/{pedidosFilho.length} entregues</small></div><strong>{formatarKwanza(compra.totalEmKwanza)}</strong></Link>)}{!compras.length && <EstadoConta icon={PackageSearch} titulo="Ainda não existem compras" texto="Quando comprares no Market, o acompanhamento ficará disponível aqui." acao="Explorar produtos" destino={ROTAS_LOJAS.market} compacto />}</div></>;
}

function EntregasConta({ compras }: { compras: RespostaCompraEstados[] }) {
  const pedidos = compras.flatMap((item) => item.pedidosFilho.map((pedido) => ({ ...pedido, compraId: item.compra.id, numero: item.compra.numero })));
  return <><CabecalhoSecao titulo="Entregas" texto="Estado separado por loja dentro de cada compra." /><div className="market-account-list">{pedidos.map((pedido) => <Link key={pedido.id} to={`/conta/compras/${pedido.compraId}`} className="market-account-row"><Truck size={18} /><div><strong>Compra #{pedido.numero}</strong><span>{pedido.estadoEntrega} · {pedido.estado}</span></div><ChevronRight size={16} /></Link>)}{!pedidos.length && <EstadoConta icon={Truck} titulo="Sem entregas activas" texto="Os prazos e estados dos pedidos aparecerão aqui." compacto />}</div></>;
}

function CasosConta({ casos }: { casos: CasoProtecaoCompradorBizy[] }) {
  return <><CabecalhoSecao titulo="Devoluções e protecção" texto="Pedidos de ajuda, evidências e resolução associados à compra." /><div className="market-account-list">{casos.map((caso) => <article key={caso.id} className="market-account-row"><RefreshCcw size={18} /><div><strong>{caso.tipo.replace(/_/g, " ")}</strong><span>{caso.estado} · {formatarDataHoraCurta(caso.criadoEm)}</span><small>{caso.resolucao || caso.descricao}</small></div></article>)}{!casos.length && <EstadoConta icon={ShieldCheck} titulo="Nenhum caso aberto" texto="Abre uma solicitação a partir da compra quando precisares de ajuda." acao="Ver compras" destino="/conta/compras" compacto />}</div></>;
}

function FavoritosConta({ favoritos }: { favoritos: FavoritoContaBizy[] }) {
  return <><CabecalhoSecao titulo="Favoritos" texto="Produtos guardados na tua Conta Bizy e sincronizados entre dispositivos." /><div className="market-account-list">{favoritos.map((item) => <Link key={item.id} to={ROTAS_LOJAS.produtoLoja(item.slugLoja, item.codigoProduto)} className="market-account-row"><Heart size={18} /><div><strong>Produto {item.codigoProduto}</strong><span>{item.slugLoja}</span></div><ChevronRight size={16} /></Link>)}{!favoritos.length && <EstadoConta icon={Heart} titulo="Sem favoritos" texto="Guarda produtos para comparares ou comprares mais tarde." acao="Explorar produtos" destino={ROTAS_LOJAS.market} compacto />}</div></>;
}

function EnderecosConta({ enderecos, atualizar }: { enderecos: EnderecoCompradorBizy[]; atualizar: () => Promise<void> }) {
  const [form, setForm] = useState(ENDERECO_VAZIO); const [guardando, setGuardando] = useState(false);
  async function guardar(evento: FormEvent) { evento.preventDefault(); setGuardando(true); await salvarEnderecoCompradorBizy({ ...form, provincia: form.provincia || null, municipio: form.municipio || null, bairro: form.bairro || null, referencia: form.referencia || null }); setForm(ENDERECO_VAZIO); await atualizar(); setGuardando(false); }
  return <><CabecalhoSecao titulo="Endereços" texto="Dados reutilizáveis no checkout autenticado." /><div className="market-address-grid">{enderecos.map((item) => <article key={item.id} className="market-address-card"><div><MapPin size={18} /><strong>{item.rotulo}{item.principal ? " · Principal" : ""}</strong></div><p>{[item.endereco, item.bairro, item.municipio, item.provincia].filter(Boolean).join(", ")}</p><button type="button" onClick={async () => { await removerEnderecoCompradorBizy(item.id); await atualizar(); }}>Remover</button></article>)}</div><form className="market-account-panel market-address-form" onSubmit={guardar}><div><span>Novo endereço</span><h2>Dados de entrega</h2></div><div className="market-account-form-grid"><Input value={form.rotulo} onChange={(e) => setForm({ ...form, rotulo: e.target.value })} placeholder="Rótulo" /><Input value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} placeholder="Província" /><Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} placeholder="Município" /><Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Bairro" /><Input className="sm:col-span-2" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número ou referência completa" /></div><label className="market-account-check"><input type="checkbox" checked={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.checked })} /> Usar como endereço principal</label><Button type="submit" disabled={guardando || form.endereco.trim().length < 5}>{guardando ? "A guardar..." : "Adicionar endereço"}</Button></form></>;
}

function AvaliacoesConta({ compras }: { compras: RespostaCompraEstados[] }) {
  const entregues = compras.filter((item) => item.pedidosFilho.some((pedido) => pedido.estadoEntrega === "ENTREGUE"));
  return <><CabecalhoSecao titulo="Avaliações" texto="Apenas compras entregues podem receber o selo de compra verificada." /><div className="market-account-list">{entregues.map(({ compra }) => <Link key={compra.id} to={`/conta/compras/${compra.id}`} className="market-account-row"><Star size={18} /><div><strong>Avaliar compra #{compra.numero}</strong><span>Compra entregue e elegível para avaliação</span></div><ChevronRight size={16} /></Link>)}{!entregues.length && <EstadoConta icon={Star} titulo="Nada para avaliar" texto="As compras entregues aparecerão aqui." compacto />}</div></>;
}

function NotificacoesConta({ compras, casos }: { compras: RespostaCompraEstados[]; casos: CasoProtecaoCompradorBizy[] }) {
  const pendentes = compras.filter((item) => item.compra.estadoPagamento !== "CONFIRMADO");
  return <><CabecalhoSecao titulo="Notificações" texto="Actualizações importantes das tuas compras e solicitações." /><div className="market-account-list">{pendentes.map(({ compra }) => <Link key={compra.id} to={`/conta/compras/${compra.id}`} className="market-account-row"><Bell size={18} /><div><strong>Pagamento {compra.estadoPagamento.toLowerCase()}</strong><span>Compra #{compra.numero}</span></div><ChevronRight size={16} /></Link>)}{casos.filter((c) => c.estado !== "ENCERRADA").map((caso) => <article key={caso.id} className="market-account-row"><ShieldCheck size={18} /><div><strong>Protecção {caso.estado.toLowerCase()}</strong><span>{caso.tipo.replace(/_/g, " ")}</span></div></article>)}{!pendentes.length && !casos.length && <EstadoConta icon={Bell} titulo="Tudo em dia" texto="Não existem alertas pendentes nesta conta." compacto />}</div></>;
}

function AfiliacaoConta({ ativo }: { ativo: boolean }) {
  return <><CabecalhoSecao titulo="Afiliação" texto="Transforma recomendações em rendimento com regras e atribuição auditáveis." /><section className="market-affiliate-callout"><div><span>{ativo ? "Perfil Creator activo" : "Bizy Creator"}</span><h2>{ativo ? "Continua no teu portal Creator" : "Cria o teu perfil Creator"}</h2><p>{ativo ? "Acompanha produtos autorizados, Smart Links, comissões e pagamentos." : "Escolhe produtos, solicita afiliação e recebe comissão por vendas atribuídas."}</p></div><Button asChild><Link to={ativo ? "/creator" : "/creator/onboarding"}>{ativo ? "Abrir Bizy Creator" : "Criar perfil Creator"}<ChevronRight size={16} /></Link></Button></section></>;
}

function SegurancaConta({ sessoes, atualizar }: { sessoes: SessaoContaBizyPublica[]; atualizar: () => Promise<void> }) {
  return <><CabecalhoSecao titulo="Segurança" texto="Revoga dispositivos e acessos que já não reconheces." /><div className="market-account-list">{sessoes.map((sessao, indice) => <article key={sessao.id} className="market-account-row"><LockKeyhole size={18} /><div><strong>{indice === 0 ? "Sessão actual ou recente" : "Outro dispositivo"}</strong><span>{sessao.userAgent || "Dispositivo não identificado"}</span><small>Expira em {formatarDataHoraCurta(sessao.expiraEm)}</small></div><Button variant="outline" size="sm" onClick={async () => { await revogarSessaoContaBizy(sessao.id); await atualizar(); }}>Revogar</Button></article>)}</div></>;
}

function PrivacidadeConta({ perfil, atualizar }: { perfil: PerfilCompradorBizy; atualizar: () => Promise<void> }) {
  const [dados, setDados] = useState(perfil.consentimentoDados); const [marketing, setMarketing] = useState(perfil.consentimentoMarketing); const [guardando, setGuardando] = useState(false);
  async function guardar() { setGuardando(true); await atualizarPerfilCompradorBizy({ consentimentoDados: dados, consentimentoMarketing: marketing }); await atualizar(); setGuardando(false); }
  return <><CabecalhoSecao titulo="Privacidade" texto="Controla consentimentos sem afectar o histórico legal das tuas compras." /><section className="market-account-panel market-privacy-panel"><label><span><strong>Dados de commerce</strong><small>Usar preferências e histórico para melhorar a experiência.</small></span><input type="checkbox" checked={dados} onChange={(e) => setDados(e.target.checked)} /></label><label><span><strong>Comunicações de marketing</strong><small>Receber novidades e campanhas relevantes.</small></span><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /></label><Button onClick={() => void guardar()} disabled={guardando}>{guardando ? "A guardar..." : "Guardar preferências"}</Button></section></>;
}

function EstadoConta({ icon: Icone, titulo, texto, acao, destino, compacto = false }: { icon: typeof PackageSearch; titulo: string; texto: string; acao?: string; destino?: string; compacto?: boolean }) {
  return <section className={`market-account-empty${compacto ? " is-compact" : ""}`}><Icone size={26} /><h2>{titulo}</h2><p>{texto}</p>{acao && destino && <Link to={destino}>{acao}<ChevronRight size={15} /></Link>}</section>;
}

function destinoInternoSeguro(valor: string | null) {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return null;
  try { const url = new URL(valor, window.location.origin); return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null; } catch { return null; }
}

function iniciais(nome: string | null) {
  return (nome || "Conta Bizy").split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("");
}
