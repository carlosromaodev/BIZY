import {
  ArrowRight,
  BarChart3,
  Bolt,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  Headphones,
  Link2,
  Menu,
  MessageCircle,
  Play,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  X,
  Zap
} from "lucide-react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { BorderBeam } from "@/components/ui/border-beam";
import { SparklesText } from "@/components/ui/sparkles-text";
import { Meteors } from "@/components/ui/meteors";
import { Pricing } from "@/components/ui/single-pricing-card-1";
import { LogoBizy, NOME_PRODUTO } from "../marca/bizy";

/* ═══════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════ */

const beneficios = [
  { icone: Zap, titulo: "Comentário vira pedido", texto: "Cada \"quero\" na live transforma-se automaticamente num pedido com produto, preço e prazo — sem copiar, sem perder.", tom: "verde" as const },
  { icone: Store, titulo: "Loja pronta em minutos", texto: "Catálogo digital com stock, preço e fotos. Partilha por WhatsApp, link directo ou loja pública com checkout.", tom: "azul" as const },
  { icone: MessageCircle, titulo: "Clientes que voltam", texto: "CRM com histórico, origem e perfil de cada comprador. Sabes quem comprou e como recuperar quem não finalizou.", tom: "violeta" as const },
  { icone: ReceiptText, titulo: "Pagamento sem confusão", texto: "Transferência, cash ou combinado — o checkout gere comprovativo, estado e notifica quando o cliente paga.", tom: "ambar" as const },
  { icone: Link2, titulo: "Afiliados e parceiros", texto: "Cria links por produto ou campanha. Cada venda rastreia a origem e calcula comissão automaticamente.", tom: "rosa" as const },
  { icone: BarChart3, titulo: "Números que orientam", texto: "Conversão, produtos fortes, recompra e oportunidades perdidas. Relatórios reais, não suposições.", tom: "verde" as const },
];

const resultados = [
  { valor: 3, sufixo: "x", label: "mais vendas por live", icone: TrendingUp },
  { valor: 70, sufixo: "%", prefixo: "–", label: "menos tarefas manuais", icone: Clock },
  { valor: 98, sufixo: "%", prefixo: "", label: "dos pedidos sem perda", icone: CheckCircle2 },
  { valor: 24, sufixo: "h", prefixo: "", label: "da conta à loja online", icone: Sparkles },
];

const vendedores = [
  { iniciais: "MK", cor: "#7A63C9" },
  { iniciais: "ZA", cor: "#D98E2B" },
  { iniciais: "KL", cor: "#0E8C68" },
  { iniciais: "BY", cor: "#C9564A" },
  { iniciais: "FS", cor: "#3d7bc0" },
];

const linksNavegacao = [
  { href: "#beneficios", label: "Benefícios" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#pricing", label: "Preços" },
  { href: "#faq", label: "Dúvidas" },
];

const testemunhos = [
  { texto: "Antes perdia metade dos pedidos na live. Agora o Bizy captura tudo e eu foco em apresentar os produtos.", nome: "Marlene K.", papel: "Vendedora de moda, Luanda", iniciais: "MK", cor: "#7A63C9" },
  { texto: "O CRM mostrou-me que 40% dos meus clientes eram recorrentes. Comecei a fazer ofertas para eles e as vendas dispararam.", nome: "Zeca A.", papel: "Electrónica e acessórios", iniciais: "ZA", cor: "#D98E2B" },
  { texto: "Configurei a loja num sábado à noite e na segunda já estava a receber pedidos pelo link. Simples assim.", nome: "Keyla L.", papel: "Cosmética natural, Viana", iniciais: "KL", cor: "#0E8C68" },
];

const perguntasFrequentes: [string, string][] = [
  ["O Bizy serve apenas para lives?", "Não. A live é o ponto forte, mas o Bizy organiza WhatsApp, catálogo, loja online, links de afiliados e campanhas. Tudo no mesmo CRM."],
  ["Preciso de saber programar?", "Zero código. O assistente de criação monta a tua loja em minutos — nome, produtos, pagamento e publicação."],
  ["O meu cliente compra pelo WhatsApp ou pelo site?", "Os dois caminhos funcionam. O cliente compra pela loja digital ou directo pelo WhatsApp com link de checkout."],
  ["E se eu já tiver uma loja noutra plataforma?", "O Bizy funciona em paralelo. Começa com os produtos que vendes nas lives e vai expandindo."],
  ["Como funciona o pagamento?", "Transferência bancária, dinheiro na entrega ou personalizado. O checkout gere comprovativo, notificações e estado."],
  ["Existe plano gratuito?", "Sim. Começas grátis com todas as funcionalidades base. Só passas para plano pago quando precisares de mais."],
];

const passos = [
  { numero: "01", titulo: "Cria a tua conta", texto: "Telefone, Gmail ou identidade académica. Sem cartão.", icone: Headphones },
  { numero: "02", titulo: "Monta a loja", texto: "Nome, segmento, contacto e pagamento. O assistente faz o resto.", icone: Store },
  { numero: "03", titulo: "Publica o produto", texto: "Foto, preço e stock. A loja fica online com preview em tempo real.", icone: ShoppingBag },
  { numero: "04", titulo: "Começa a vender", texto: "Pedidos, clientes, conversas e relatórios já ligados.", icone: Zap },
] as const;

const proofItems = [
  { user: "@sofia_a", action: "reservou na live", produto: "Vestido verde", valor: "18 000 Kz" },
  { user: "@carlos_m", action: "finalizou checkout", produto: "Tênis branco", valor: "12 500 Kz" },
  { user: "@ana_b", action: "pedido confirmado", produto: "Bolsa preta", valor: "9 800 Kz" },
];

/* ═══════════════════════════════════════════════════════════
   Animated primitives
   ═══════════════════════════════════════════════════════════ */

function Reveal({ children, className, delay = 0, y = 36 }: {
  children: ReactNode; className?: string; delay?: number; y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });
  const rm = useReducedMotion();
  return (
    <motion.div ref={ref} className={className}
      initial={rm ? { opacity: 1 } : { opacity: 0, y, filter: "blur(8px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >{children}</motion.div>
  );
}

function StaggerWrap({ children, className, staggerDelay = 0.07 }: {
  children: ReactNode; className?: string; staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={isInView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.12 } } }}
    >{children}</motion.div>
  );
}

function TiltCard({ children, className, delay = 0, ...rest }: {
  children: ReactNode; className?: string; delay?: number; [k: string]: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rm = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 22 });
  const sry = useSpring(ry, { stiffness: 180, damping: 22 });

  function onMove(e: React.MouseEvent) {
    if (rm || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -10);
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
  }
  function onLeave() { rx.set(0); ry.set(0); }

  return (
    <motion.div ref={ref} className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 } as CSSProperties}
      onMouseMove={onMove} onMouseLeave={onLeave}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } },
      }}
      {...rest}
    >{children}</motion.div>
  );
}

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const start = performance.now();
    const dur = 1400;
    function step(now: number) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.round(eased * target));
      if (p < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function AnimatedProof() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % proofItems.length), 3200);
    return () => clearInterval(t);
  }, []);
  const item = proofItems[idx];
  return (
    <div className="bizy-hero-toast">
      <span className="bizy-toast-icon"><Bolt size={15} /></span>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
          <strong><span>{item.user}</span> {item.action}</strong>
          <small>{item.produto} · capturado automaticamente</small>
        </motion.div>
      </AnimatePresence>
      <b>{item.valor}</b>
    </div>
  );
}

/* ── Dashboard mockup (hero visual) ── */

function HeroDashboard() {
  return (
    <div className="bizy-hero-dashboard">
      <BorderBeam size={120} duration={8} colorFrom="#0e8c68" colorTo="#c9f25e" borderWidth={1.5} />

      {/* Topbar */}
      <div className="bizy-dash-topbar">
        <span className="bizy-dash-dots"><i /><i /><i /></span>
        <span className="bizy-dash-title">Bizy · Dashboard</span>
        <span className="bizy-dash-live"><span />LIVE</span>
      </div>

      {/* KPI row */}
      <div className="bizy-dash-kpis">
        {[
          { label: "Pedidos hoje", valor: "47", delta: "+12%", up: true },
          { label: "Receita", valor: "892K Kz", delta: "+24%", up: true },
          { label: "Conversão", valor: "68%", delta: "+5%", up: true },
          { label: "Novos clientes", valor: "18", delta: "+8", up: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} className="bizy-dash-kpi"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.12, duration: 0.5 }}
          >
            <small>{kpi.label}</small>
            <strong>{kpi.valor}</strong>
            <span className="bizy-dash-delta">{kpi.delta}</span>
          </motion.div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="bizy-dash-chart">
        <svg viewBox="0 0 280 60" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e8c68" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0e8c68" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0 50 Q20 45 40 38 T80 30 T120 20 T160 25 T200 15 T240 12 T280 8"
            stroke="#0e8c68" strokeWidth="2" fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
          />
          <motion.path
            d="M0 50 Q20 45 40 38 T80 30 T120 20 T160 25 T200 15 T240 12 T280 8 V60 H0 Z"
            fill="url(#chartGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
          />
        </svg>
      </div>

      {/* Activity feed */}
      <div className="bizy-dash-feed">
        {[
          { t: "agora", txt: "@maria reservou 2x Vestido Flora", tag: "live" },
          { t: "2min", txt: "Checkout #412 confirmado", tag: "venda" },
          { t: "5min", txt: "@joão pagou via transferência", tag: "pago" },
        ].map((ev, i) => (
          <motion.div key={i} className="bizy-dash-event"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 + i * 0.15, duration: 0.4 }}
          >
            <span className={`bizy-dash-tag bizy-tag-${ev.tag}`}>{ev.tag}</span>
            <span>{ev.txt}</span>
            <small>{ev.t}</small>
          </motion.div>
        ))}
      </div>

      {/* Proof toast overlay */}
      <AnimatedProof />
    </div>
  );
}

/* ── FAQ Accordion ── */

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <motion.article className={`bizy-faq-item${aberto ? " is-open" : ""}`} layout>
      <button type="button" onClick={() => setAberto((v) => !v)}>
        <h3>{pergunta}</h3>
        <motion.span animate={{ rotate: aberto ? 45 : 0 }} transition={{ duration: 0.25 }} className="bizy-faq-toggle">+</motion.span>
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="bizy-faq-answer"
          ><p>{resposta}</p></motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════ */

export function PaginaHome() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOp = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    function onScroll() { setNavScrolled(window.scrollY > 20); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bizy-public bizy-home">
      {/* ══════════ NAV ══════════ */}
      <motion.header
        className={`bizy-home-nav${navScrolled ? " is-scrolled" : ""}`}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <Link className="bizy-home-logo" to="/" aria-label="Bizy home">
          <LogoBizy />
        </Link>

        <nav className="bizy-home-links" aria-label="Navegação principal">
          {linksNavegacao.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="bizy-home-actions">
          <Link className="bizy-link-muted" to="/login">Entrar</Link>
          <Link className="bizy-btn bizy-btn-primary" to="/login">
            Começar grátis <ArrowRight size={15} />
          </Link>
        </div>

        <button className="bizy-mobile-menu" type="button" onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"} aria-expanded={menuAberto}
        >{menuAberto ? <X size={20} /> : <Menu size={20} />}</button>

        <AnimatePresence>
          {menuAberto && (
            <motion.nav className="bizy-mobile-panel" aria-label="Navegação mobile"
              initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }} transition={{ duration: 0.25 }}
            >
              {linksNavegacao.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuAberto(false)}>{l.label}</a>
              ))}
              <Link to="/login" onClick={() => setMenuAberto(false)}>Começar grátis</Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══════════ HERO ══════════ */}
      <motion.section className="bizy-home-hero" ref={heroRef}>
        {/* Background layers */}
        <div className="bizy-hero-grid" aria-hidden="true">
          <svg width="100%" height="100%"><defs>
            <pattern id="hgrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.6" />
            </pattern>
          </defs><rect width="100%" height="100%" fill="url(#hgrid)" /></svg>
        </div>
        <div className="bizy-hero-orb bizy-hero-orb-1" aria-hidden="true" />
        <div className="bizy-hero-orb bizy-hero-orb-2" aria-hidden="true" />
        <div className="bizy-hero-orb bizy-hero-orb-3" aria-hidden="true" />
        <Meteors number={12} angle={215} minDuration={4} maxDuration={12} className="bizy-hero-meteor" />

        <motion.div className="bizy-hero-inner" style={{ y: heroY, opacity: heroOp }}>
          {/* Copy */}
          <motion.div className="bizy-home-copy"
            initial={{ opacity: 0, y: 44, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Pill */}
            <motion.span className="bizy-hero-pill"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="bizy-pill-dot" />
              Automação de vendas em live
              <ChevronRight size={14} />
            </motion.span>

            <h1>
              Pára de perder vendas.{" "}
              <SparklesText className="bizy-hero-em" sparklesCount={8} colors={{ first: "#0e8c68", second: "#c9f25e" }}>
                Começa a capturá-las.
              </SparklesText>
            </h1>

            <p>
              O {NOME_PRODUTO} transforma cada "quero" em venda confirmada — catálogo, stock, pagamento e entrega ligados, enquanto tu focas no que fazes melhor: vender ao vivo.
            </p>

            <motion.div className="bizy-home-cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}>
              <Link className="bizy-btn bizy-btn-glow bizy-btn-large" to="/login">
                Começar grátis <ArrowRight size={16} />
              </Link>
              <a className="bizy-btn bizy-btn-glass bizy-btn-large" href="#como-funciona">
                <Play size={15} /> Ver como funciona
              </a>
            </motion.div>

            <motion.div className="bizy-home-avatars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
              <span className="bizy-avatar-stack">
                {vendedores.map((v) => (
                  <span key={v.iniciais} style={{ backgroundColor: v.cor }}>{v.iniciais}</span>
                ))}
              </span>
              <span><strong>+2 400 empreendedores</strong> já vendem com o Bizy.</span>
            </motion.div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div className="bizy-hero-visual"
            initial={{ opacity: 0, scale: 0.92, y: 30, rotateY: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroDashboard />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ══════════ STATS ══════════ */}
      <section className="bizy-home-strip">
        {resultados.map((r, i) => {
          const Icone = r.icone;
          return (
            <Reveal key={r.label} className="bizy-stat-cell" delay={i * 0.08} y={16}>
              <span className="bizy-strip-icon"><Icone size={16} /></span>
              <strong><AnimatedCounter target={r.valor} prefix={r.prefixo} suffix={r.sufixo} /></strong>
              <span>{r.label}</span>
            </Reveal>
          );
        })}
      </section>

      {/* ══════════ PROBLEMA → SOLUÇÃO ══════════ */}
      <section className="bizy-home-section bizy-problem-section">
        <Reveal>
          <div className="bizy-section-head">
            <span>O antes e depois</span>
            <h2>Sem automação, <em>vendes menos</em></h2>
          </div>
        </Reveal>
        <div className="bizy-problem-grid">
          <Reveal className="bizy-problem-card" delay={0.1} y={24}>
            <span className="bizy-problem-label">Sem Bizy</span>
            <ul>
              <li>Comentários perdidos na velocidade da live</li>
              <li>Copiar e colar pedidos para o WhatsApp</li>
              <li>Confusão entre quem pagou e quem não pagou</li>
              <li>Sem ideia de quais produtos vendem mais</li>
              <li>Clientes que não voltam</li>
            </ul>
          </Reveal>
          <Reveal className="bizy-solution-card" delay={0.22} y={24}>
            <span className="bizy-solution-label"><Sparkles size={14} />Com Bizy</span>
            <ul>
              <li>Cada comentário vira pedido automático</li>
              <li>Checkout com link directo para o cliente</li>
              <li>Pagamento, comprovativo e estado num só lugar</li>
              <li>Relatórios de conversão e produtos fortes</li>
              <li>CRM com recompra e recuperação</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ══════════ BENEFÍCIOS ══════════ */}
      <section className="bizy-home-section" id="beneficios">
        <Reveal>
          <div className="bizy-section-head">
            <span>Menos tarefas, mais vendas</span>
            <h2>O que o {NOME_PRODUTO} faz <em>por ti</em></h2>
            <p>Cada funcionalidade existe para te libertar de trabalho repetitivo e transformar engajamento em receita.</p>
          </div>
        </Reveal>
        <StaggerWrap className="bizy-feature-grid">
          {beneficios.map((b, i) => {
            const Icone = b.icone;
            return (
              <TiltCard className="bizy-feature-card" data-tone={b.tom} key={b.titulo} delay={i * 0.07}>
                <span className="bizy-feature-icon"><Icone size={22} /></span>
                <h3>{b.titulo}</h3>
                <p>{b.texto}</p>
                <div className="bizy-card-shine" aria-hidden="true" />
              </TiltCard>
            );
          })}
        </StaggerWrap>
      </section>

      {/* ══════════ COMO FUNCIONA ══════════ */}
      <section className="bizy-home-section bizy-steps" id="como-funciona">
        <Reveal>
          <div className="bizy-section-head">
            <span>Pronto em minutos</span>
            <h2>Da conta criada à primeira venda</h2>
            <p>Sem tutoriais longos, sem configurações técnicas. O assistente guia-te até à loja publicada.</p>
          </div>
        </Reveal>
        <div className="bizy-step-grid">
          <div className="bizy-step-line" aria-hidden="true" />
          {passos.map((p, i) => {
            const Icone = p.icone;
            return (
              <Reveal key={p.numero} className="bizy-step-card" delay={i * 0.1} y={24}>
                <div className="bizy-step-number">
                  <span className="bizy-step-num-text">{p.numero}</span>
                  <span className="bizy-step-icon"><Icone size={16} /></span>
                </div>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ══════════ TESTEMUNHOS ══════════ */}
      <section className="bizy-home-section bizy-testimonials">
        <Reveal>
          <div className="bizy-section-head">
            <span>Quem já usa</span>
            <h2>Histórias de quem <em>vende ao vivo</em></h2>
          </div>
        </Reveal>
        <StaggerWrap className="bizy-testimonial-grid">
          {testemunhos.map((t) => (
            <TiltCard className="bizy-testimonial-card" key={t.nome}>
              <div className="bizy-quote-mark" aria-hidden="true">"</div>
              <p>{t.texto}</p>
              <footer>
                <span className="bizy-testimonial-avatar" style={{ backgroundColor: t.cor }}>{t.iniciais}</span>
                <div><strong>{t.nome}</strong><small>{t.papel}</small></div>
              </footer>
            </TiltCard>
          ))}
        </StaggerWrap>
      </section>

      {/* ══════════ PREÇOS ══════════ */}
      <Pricing />

      {/* ══════════ ESTUDANTES ══════════ */}
      <Reveal>
        <section className="bizy-student-band">
          <div>
            <span><GraduationCap size={15} />Entrada académica incluída</span>
            <h2>Estudantes da UOR e ISPTEC entram com a identidade da universidade.</h2>
            <p>Começa com telefone, Gmail ou login académico. Os dados pessoais ficam sempre separados da operação comercial.</p>
          </div>
          <div>
            {["Telefone", "Gmail", "UOR/ISPTEC"].map((item) => (
              <span key={item}><CheckCircle2 size={16} />{item}</span>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ══════════ CTA FINAL ══════════ */}
      <Reveal>
        <section className="bizy-home-band">
          <div className="bizy-band-orb" aria-hidden="true" />
          <div>
            <h2>A tua próxima live pode ser a mais organizada de sempre.</h2>
            <p>Enquanto apresentas, o Bizy captura pedidos, gere stock e prepara o checkout. Tu vendes — o resto é automático.</p>
          </div>
          <Link className="bizy-btn bizy-btn-lime bizy-btn-large" to="/login">
            Começar grátis agora <ArrowRight size={17} />
          </Link>
        </section>
      </Reveal>

      {/* ══════════ FAQ ══════════ */}
      <section className="bizy-home-section bizy-faq" id="faq">
        <Reveal>
          <div className="bizy-section-head">
            <span>Dúvidas rápidas</span>
            <h2>Perguntas que os vendedores fazem</h2>
            <p>Se a tua dúvida não está aqui, fala connosco pelo WhatsApp.</p>
          </div>
        </Reveal>
        <div className="bizy-faq-grid">
          {perguntasFrequentes.map(([p, r], i) => (
            <Reveal key={p} delay={i * 0.05} y={16}>
              <FaqItem pergunta={p} resposta={r} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bizy-home-footer">
        <div className="bizy-footer-main">
          <div className="bizy-footer-brand">
            <LogoBizy />
            <p>A plataforma de automação de vendas em live para empreendedores que querem vender mais com menos stress.</p>
            <Link className="bizy-btn bizy-btn-primary" to="/login">Começar agora <ArrowRight size={16} /></Link>
          </div>
          <nav aria-label="Produto"><strong>Produto</strong><a href="#beneficios">Benefícios</a><a href="#como-funciona">Como funciona</a><a href="#pricing">Preços</a><a href="#faq">Dúvidas</a></nav>
          <nav aria-label="Loja digital"><strong>Loja digital</strong><span>Perfil público</span><span>Checkout unificado</span><span>Bizy Market</span><span>Catálogos e colecções</span></nav>
          <div className="bizy-footer-contact"><strong>Contacto</strong><span>Luanda, Angola</span><a href="mailto:suporte@bizy.ao">suporte@bizy.ao</a><span>Vendas, lives e CRM no mesmo lugar.</span></div>
        </div>
        <div className="bizy-footer-bottom">
          <span>© 2026 Bizy · Luanda, Angola</span>
          <div><a href="#privacidade">Privacidade</a><a href="#termos">Termos</a></div>
        </div>
      </footer>
    </main>
  );
}
