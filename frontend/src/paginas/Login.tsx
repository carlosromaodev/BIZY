import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Phone,
  ShieldCheck
} from "lucide-react";
import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  guardarSessao,
  obterBaseApiUrl,
  obterToken,
  obterUsuario,
  requisitarApi,
  type UsuarioSessao
} from "../api";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy, NOME_PRODUTO } from "../marca/bizy";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Marquee } from "@/components/ui/marquee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Component as AnimatedTabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger
} from "@/components/ui/animated-tabs";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════
   Types & constants
   ═══════════════════════════════════════════════════════════ */

type ModoLogin = "telefone" | "estudante";
type FluxoIdentidade = "criar" | "entrar";
type ProviderEstudantil = "uor" | "isptec";
type TipoIdentificador = "studentNumber" | "username";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CLASSE_CAMPO = "bizy-flow-input";
const CLASSE_BTN_OUTLINE = "bizy-btn bizy-btn-outline";

const capacidadesCanvas = [
  "Pedidos automáticos em live",
  "Loja digital com compra integrada",
  "CRM multi-canal",
  "Bizy Market",
  "Inbox unificado",
  "Pagamentos e rastreio",
  "Programa de afiliados",
  "IA preditiva",
  "Fornecedores B2B",
  "Compliance fiscal",
];

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

function normalizarTelefoneFormulario(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "");
  const semIndicativo = digitos.startsWith("00244")
    ? digitos.slice(5)
    : digitos.startsWith("244")
      ? digitos.slice(3)
      : digitos;
  return /^(91|92|93|94|95|99)\d{7}$/.test(semIndicativo) ? semIndicativo : null;
}

function parseUsuarioHash(valor: string | null): UsuarioSessao | null {
  if (!valor) return null;
  try { return JSON.parse(valor) as UsuarioSessao; } catch { return null; }
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.479 14.265v-3.279h11.049c.108.571.164 1.247.164 1.979 0 2.46-.672 5.502-2.84 7.669C18.744 22.829 16.051 24 12.483 24 5.869 24 .308 18.613.308 12S5.869 0 12.483 0c3.659 0 6.265 1.436 8.223 3.307L18.392 5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65 3.279 3.873 7.171 3.873 12s3.777 8.721 8.606 8.721c3.132 0 4.916-1.258 6.059-2.401.927-.927 1.537-2.251 1.777-4.059l-7.836.004z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════ */

export function PaginaLogin() {
  const navigate = useNavigate();
  const rm = useReducedMotion();
  const [fluxoIdentidade, setFluxoIdentidade] = useState<FluxoIdentidade>("criar");
  const [modo, setModo] = useState<ModoLogin>("telefone");
  const [telefone, setTelefone] = useState(import.meta.env.DEV ? "923456789" : "");
  const [nome, setNome] = useState(import.meta.env.DEV ? `Vendedor ${NOME_PRODUTO}` : "");
  const [codigo, setCodigo] = useState("");
  const [codigoDev, setCodigoDev] = useState<string | null>(null);
  const [etapaTelefone, setEtapaTelefone] = useState<"telefone" | "codigo">("telefone");
  const [providerEstudantil, setProviderEstudantil] = useState<ProviderEstudantil>("uor");
  const [tipoIdentificador, setTipoIdentificador] = useState<TipoIdentificador>("studentNumber");
  const [identificador, setIdentificador] = useState("");
  const [palavraPasse, setPalavraPasse] = useState("");
  const [mostrarPasse, setMostrarPasse] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [mensagem, setMensagem] = useState("");

  const apiBase = obterBaseApiUrl();
  const rotuloIdentificador = tipoIdentificador === "username" && providerEstudantil === "uor"
    ? "Nome de utilizador" : "Número de estudante";
  const estaCriandoConta = fluxoIdentidade === "criar";
  const tituloFormulario = estaCriandoConta ? "Cria a tua conta" : "Entra na tua conta";
  const descricaoFormulario = estaCriandoConta
    ? "Validamos o teu contacto e preparamos o teu negócio em seguida."
    : "Usa o canal que já está ligado ao teu perfil Bizy.";
  const rotuloGmail = estaCriandoConta ? "Continuar com Gmail" : "Entrar com Gmail";
  const rotuloTelefone = estaCriandoConta ? "Criar conta" : "Enviar código";
  const rotuloEstudantil = estaCriandoConta ? "Criar com login estudantil" : "Entrar com login estudantil";
  const destinoAposAutenticacao = estaCriandoConta ? "/onboarding" : "/app";

  /* ── Auth effects ── */

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = parametros.get("bizy_token");
    const usuario = parseUsuarioHash(parametros.get("bizy_usuario"));
    const sessaoPorCookie = parametros.get("bizy_auth") === "cookie";
    const erro = parametros.get("bizy_erro");
    const destinoSolicitado = new URLSearchParams(window.location.search).get("pos_auth");
    const destinoHash = destinoSolicitado === "/app" ? "/app" : "/onboarding";
    let cancelado = false;

    if (sessaoPorCookie) {
      setCarregando(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      void requisitarApi<{ usuario: UsuarioSessao }>("/auth/sessao")
        .then((r) => { if (!cancelado) { guardarSessao(null, r.usuario); navigate(destinoHash, { replace: true }); } })
        .catch((f) => { if (!cancelado) setMensagem(f instanceof Error ? f.message : "Sessão Gmail inválida ou expirada."); })
        .finally(() => { if (!cancelado) setCarregando(false); });
      return () => { cancelado = true; };
    }
    if (token && usuario) {
      guardarSessao(token, usuario);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      navigate(destinoHash, { replace: true });
      return;
    }
    if (erro) { setMensagem(erro); window.history.replaceState(null, "", window.location.pathname + window.location.search); return; }
    if (obterToken() || obterUsuario()) navigate("/app", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const id = window.setInterval(() => setSegundosRestantes((v) => Math.max(v - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [segundosRestantes]);

  /* ── Handlers ── */

  function alterarFluxo(valor: FluxoIdentidade) {
    if (valor === fluxoIdentidade) return;
    setFluxoIdentidade(valor); setEtapaTelefone("telefone"); setCodigo(""); setCodigoDev(null); setSegundosRestantes(0); setMensagem("");
  }

  async function enviarCodigo() {
    const tel = normalizarTelefoneFormulario(telefone);
    if (!tel) { setMensagem("Informe um número móvel angolano válido, como 923456789."); return; }
    if (estaCriandoConta && nome.trim().length < 2) { setMensagem("Informe o teu nome para criarmos a conta."); return; }
    setCarregando(true); setMensagem(estaCriandoConta ? "A criar acesso e enviar código..." : "A enviar código...");
    try {
      const r = await requisitarApi<{ sucesso: boolean; codigoDev?: string; codigoFinal: string; minutosExpiracao: number }>(
        "/auth/telefone/solicitar-codigo", { method: "POST", body: { telefone: tel, ...(estaCriandoConta ? { nome: nome.trim() } : {}) } }, false
      );
      setTelefone(tel); setEtapaTelefone("codigo"); setCodigo(""); setCodigoDev(r.codigoDev ?? null); setSegundosRestantes(r.minutosExpiracao * 60);
      setMensagem(`Código enviado. Expira em ${r.minutosExpiracao} minutos.`);
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Não foi possível enviar o código."); }
    finally { setCarregando(false); }
  }

  async function confirmarCodigo(ev: FormEvent) {
    ev.preventDefault();
    const tel = normalizarTelefoneFormulario(telefone);
    if (!tel) { setMensagem("Telefone inválido."); return; }
    setCarregando(true); setMensagem("A validar código...");
    try {
      const r = await requisitarApi<{ token: string; usuario: UsuarioSessao }>("/auth/telefone/confirmar-codigo", { method: "POST", body: { telefone: tel, codigo } }, false);
      guardarSessao(r.token, r.usuario); navigate(destinoAposAutenticacao, { replace: true });
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Código inválido."); }
    finally { setCarregando(false); }
  }

  async function entrarEstudante(ev: FormEvent) {
    ev.preventDefault();
    const id = tipoIdentificador === "username" && providerEstudantil === "uor" ? identificador.trim() : identificador.replace(/\D/g, "");
    if (!id) { setMensagem("Informe o número de estudante ou nome de utilizador."); return; }
    setCarregando(true); setMensagem(estaCriandoConta ? "A criar perfil académico..." : "A validar conta académica...");
    try {
      const r = await requisitarApi<{ token: string; usuario: UsuarioSessao }>("/auth/estudantil/login", {
        method: "POST", body: { provider: providerEstudantil, identificador: id, tipoIdentificador: providerEstudantil === "isptec" ? "studentNumber" : tipoIdentificador, palavraPasse }
      }, false);
      guardarSessao(r.token, r.usuario); navigate(destinoAposAutenticacao, { replace: true });
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Não foi possível validar o login estudantil."); }
    finally { setCarregando(false); }
  }

  async function entrarComGmail() {
    setCarregando(true); setMensagem("A preparar Gmail...");
    try {
      const s = await requisitarApi<{ configurado: boolean; mensagem: string }>("/auth/google/status", {}, false);
      if (!s.configurado) { setMensagem(s.mensagem); return; }
      window.location.href = `${apiBase}/auth/google/iniciar?redirect=${encodeURIComponent(`/login?pos_auth=${encodeURIComponent(destinoAposAutenticacao)}`)}`;
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Não foi possível iniciar login com Gmail."); }
    finally { setCarregando(false); }
  }

  function entrarModoTeste() {
    guardarSessao(null, { id: "usuario-teste-bizy", nome: nome.trim() || `Vendedor ${NOME_PRODUTO}`, telefone: normalizarTelefoneFormulario(telefone) ?? "923456789", email: "teste@bizy.local", papel: "ADMIN", origemCadastro: "Modo teste", perfilCompletoEm: null });
    navigate("/onboarding", { replace: true });
  }

  /* ═══════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════ */

  return (
    <main className="bizy-public bizy-auth">
      {/* ══════════ BRAND CANVAS ══════════ */}
      <aside className="bizy-auth-canvas">
        <div className="bizy-auth-canvas-grain" />

        <motion.div
          className="bizy-auth-canvas-top"
          initial={rm ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <LogoBizy cores={CORES_LOGO_BIZY_ESCURA} />
          <span className="bizy-auth-live-badge"><span />Ao vivo agora</span>
        </motion.div>

        <motion.div
          className="bizy-auth-canvas-copy"
          initial={rm ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
        >
          <span className="bizy-auth-canvas-tag">Sistema operativo para comércio social</span>
          <h2>Vende em qualquer canal.{"\n"}Gere <em>tudo</em> a partir daqui.</h2>
        </motion.div>

        <motion.div
          className="bizy-auth-canvas-marquee"
          initial={rm ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Marquee pauseOnHover className="[--duration:30s] [--gap:0rem]">
            {capacidadesCanvas.map((c) => (
              <span key={c} className="bizy-auth-pill">{c}</span>
            ))}
          </Marquee>
        </motion.div>

        <motion.div
          className="bizy-auth-canvas-stats"
          initial={rm ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.6, ease: EASE }}
        >
          <div><strong>+2 400</strong><span>negócios ativos</span></div>
          <div><strong>98%</strong><span>pedidos sem perda</span></div>
          <div><strong>5 canais</strong><span>num só inbox</span></div>
        </motion.div>
      </aside>

      {/* ══════════ FORM SIDE ══════════ */}
      <section className="bizy-auth-form">
        <motion.div
          className="bizy-auth-form-top"
          initial={rm ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <span className="bizy-auth-mobile-wordmark">bizy<span>.</span></span>
          <Button asChild variant="ghost" className="bizy-auth-home-link">
            <Link to="/" style={{ color: "inherit" }}><ArrowLeft size={16} /> Home</Link>
          </Button>
          <span className="bizy-auth-help">Precisas de ajuda?</span>
        </motion.div>

        <div className="bizy-auth-body">
          {/* ── Heading ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={fluxoIdentidade}
              className="bizy-auth-heading"
              initial={rm ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <h1>{tituloFormulario}<span>.</span></h1>
              <p>{descricaoFormulario}</p>
            </motion.div>
          </AnimatePresence>

          {/* ── Flow toggle (AnimatedTabs as segment) ── */}
          <motion.div
            initial={rm ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.12, ease: EASE }}
          >
            <AnimatedTabs value={fluxoIdentidade} onValueChange={(v) => alterarFluxo(v as FluxoIdentidade)} className="bizy-auth-flow-tabs">
              <TabsList className="bizy-auth-flow-list" style={{ "--animated-tabs-active-bg": "var(--bizy-surface)", "--animated-tabs-active-ring": "var(--bizy-line)" } as CSSProperties}>
                <TabsTrigger value="criar" className="bizy-auth-flow-trigger">Criar conta</TabsTrigger>
                <TabsTrigger value="entrar" className="bizy-auth-flow-trigger">Entrar</TabsTrigger>
              </TabsList>
              {/* content rendered outside — tabs only for the toggle */}
              <TabsContents className="bizy-auth-flow-content-hidden">
                <TabsContent value="criar"><span /></TabsContent>
                <TabsContent value="entrar"><span /></TabsContent>
              </TabsContents>
            </AnimatedTabs>
          </motion.div>

          {/* ── Form content ── */}
          <motion.div
            className="bizy-auth-form-content"
            initial={rm ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2, ease: EASE }}
          >
            {/* Gmail */}
            <button type="button" className="bizy-gmail-btn" onClick={() => void entrarComGmail()} disabled={carregando}>
              <GoogleIcon className="bizy-gmail-icon" />
              <span>{rotuloGmail}</span>
              {carregando ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} className="bizy-gmail-arrow" />}
            </button>

            {/* Separator */}
            <div className="bizy-auth-divider"><span>ou</span></div>

            {/* Method tabs */}
            <AnimatedTabs value={modo} onValueChange={(v) => setModo(v as ModoLogin)} className="bizy-auth-method-tabs">
              <TabsList className="bizy-auth-method-list" style={{ "--animated-tabs-active-bg": "var(--bizy-surface)", "--animated-tabs-active-ring": "var(--bizy-line)" } as CSSProperties}>
                <TabsTrigger value="telefone" className="bizy-auth-method-trigger"><Phone size={14} />Telefone</TabsTrigger>
                <TabsTrigger value="estudante" className="bizy-auth-method-trigger"><GraduationCap size={14} />Estudante</TabsTrigger>
              </TabsList>

              <TabsContents className="bizy-auth-method-content">
                {/* ── Telefone ── */}
                <TabsContent value="telefone" className="mt-0">
                  <AnimatePresence mode="wait">
                    {etapaTelefone === "telefone" ? (
                      <motion.form key="tel-input" onSubmit={(e: FormEvent) => { e.preventDefault(); void enviarCodigo(); }} className="bizy-auth-fields"
                        initial={rm ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.18, ease: EASE }}
                      >
                        {estaCriandoConta && (
                          <div className="bizy-auth-field">
                            <Label htmlFor="nomeLogin">Nome</Label>
                            <Input id="nomeLogin" className={CLASSE_CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="O teu nome" />
                          </div>
                        )}
                        <div className="bizy-auth-field">
                          <Label htmlFor="telefoneLogin">Telefone</Label>
                          <div className="bizy-auth-tel-wrap">
                            <span className="bizy-auth-tel-prefix">+244</span>
                            <Input className={cn(CLASSE_CAMPO, "bizy-auth-tel-input")} id="telefoneLogin" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="923 456 789" />
                          </div>
                        </div>
                        <Button className="bizy-btn bizy-btn-primary bizy-auth-submit" size="lg" disabled={carregando}>
                          {carregando ? <Loader2 className="animate-spin" size={16} /> : null}
                          {carregando ? "A enviar..." : rotuloTelefone}
                        </Button>
                      </motion.form>
                    ) : (
                      <motion.form key="tel-code" onSubmit={confirmarCodigo} className="bizy-auth-fields"
                        initial={rm ? false : { opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18, ease: EASE }}
                      >
                        <div className="bizy-auth-field">
                          <Label htmlFor="codigoLogin">Código de verificação</Label>
                          <Input className={cn(CLASSE_CAMPO, "bizy-auth-code-input")} id="codigoLogin" inputMode="numeric" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="000000" />
                        </div>
                        {codigoDev && <div className="bizy-inline-note">Código dev: <strong>{codigoDev}</strong></div>}
                        {segundosRestantes > 0 && <div className="bizy-inline-note">Reenvio em {Math.floor(segundosRestantes / 60)}:{String(segundosRestantes % 60).padStart(2, "0")}</div>}
                        <Button className="bizy-btn bizy-btn-primary bizy-auth-submit" size="lg" disabled={carregando || codigo.trim().length < 4}>
                          {carregando ? <Loader2 className="animate-spin" size={16} /> : null}
                          {carregando ? "A validar..." : "Validar e continuar"}
                        </Button>
                        <div className="bizy-auth-secondary-actions">
                          <button type="button" className="bizy-auth-link-btn" onClick={() => void enviarCodigo()} disabled={carregando || segundosRestantes > 0}>Reenviar código</button>
                          <span className="bizy-auth-dot" />
                          <button type="button" className="bizy-auth-link-btn" onClick={() => { setEtapaTelefone("telefone"); setCodigo(""); setCodigoDev(null); setSegundosRestantes(0); }}>Alterar telefone</button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </TabsContent>

                {/* ── Estudante ── */}
                <TabsContent value="estudante" className="mt-0">
                  <form onSubmit={entrarEstudante} className="bizy-auth-fields">
                    <div className="grid grid-cols-2 gap-2">
                      {(["uor", "isptec"] as const).map((p) => (
                        <Button key={p} type="button" variant="ghost"
                          className={cn("bizy-choice-button", providerEstudantil === p ? "is-active" : "")}
                          onClick={() => { setProviderEstudantil(p); setTipoIdentificador("studentNumber"); setIdentificador(""); }}
                          aria-pressed={providerEstudantil === p}
                        >{p === "uor" ? "UOR" : "ISPTEC"}</Button>
                      ))}
                    </div>
                    {providerEstudantil === "uor" && (
                      <div className="bizy-segment">
                        {([ ["studentNumber", "Número"], ["username", "Username"] ] as const).map(([v, r]) => (
                          <Button key={v} type="button" variant="ghost"
                            className={cn("bizy-segment-option", tipoIdentificador === v ? "is-active" : "")}
                            onClick={() => { setTipoIdentificador(v); setIdentificador(""); }}
                            aria-pressed={tipoIdentificador === v}
                          >{r}</Button>
                        ))}
                      </div>
                    )}
                    <div className="bizy-auth-field">
                      <Label htmlFor="idEstudante">{rotuloIdentificador}</Label>
                      <Input className={CLASSE_CAMPO} id="idEstudante" autoComplete="username"
                        inputMode={tipoIdentificador === "username" && providerEstudantil === "uor" ? "text" : "numeric"}
                        value={identificador}
                        onChange={(e) => setIdentificador(tipoIdentificador === "username" && providerEstudantil === "uor" ? e.target.value.slice(0, 40) : e.target.value.replace(/\D/g, "").slice(0, 12))}
                        placeholder={tipoIdentificador === "username" ? "ex: carlosromaodev" : "ex: 20243454"}
                      />
                    </div>
                    <div className="bizy-auth-field">
                      <Label htmlFor="passeEstudante">Palavra-passe</Label>
                      <div className="relative">
                        <Input id="passeEstudante" type={mostrarPasse ? "text" : "password"} autoComplete="current-password"
                          value={palavraPasse} onChange={(e) => setPalavraPasse(e.target.value)} className={cn(CLASSE_CAMPO, "pr-11")}
                        />
                        <button type="button"
                          className="bizy-auth-eye-toggle"
                          onClick={() => setMostrarPasse((v) => !v)} aria-label={mostrarPasse ? "Ocultar" : "Mostrar"}
                        >{mostrarPasse ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                      </div>
                    </div>
                    <Button className="bizy-btn bizy-btn-primary bizy-auth-submit" size="lg" disabled={carregando || !identificador || !palavraPasse}>
                      {carregando ? <Loader2 className="animate-spin" size={16} /> : null}
                      {carregando ? "A validar..." : rotuloEstudantil}
                    </Button>
                  </form>
                </TabsContent>
              </TabsContents>
            </AnimatedTabs>

            {/* Alert */}
            <AnimatePresence>
              {mensagem && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.2, ease: EASE }}>
                  <Alert className="bizy-auth-alert"><AlertDescription className="text-sm leading-6">{mensagem}</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Footer ── */}
          <motion.div
            className="bizy-auth-card-footer"
            initial={rm ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <button type="button" className="bizy-testmode-link" onClick={entrarModoTeste}>
              <Bolt size={12} />
              <span>Modo de teste</span> — entrar sem conta
            </button>
            <div className="bizy-trust-row">
              <span><ShieldCheck size={11} />Encriptado</span>
              <span><KeyRound size={11} />2 min</span>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
