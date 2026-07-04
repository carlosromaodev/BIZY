import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Globe,
  GraduationCap,
  Heart,
  Headphones,
  Layers,
  Link2,
  Menu,
  MessageCircle,
  Package,
  Palette,
  Play,
  Receipt,
  ReceiptText,
  Repeat,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Target,
  Truck,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
import {
  motion,
  useInView,
  useReducedMotion,
  AnimatePresence
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Marquee } from "@/components/ui/marquee";
import { Pricing } from "@/components/ui/single-pricing-card-1";
import { ROTAS_LOJAS } from "../lojas";
import { LogoBizy, NOME_PRODUTO } from "../marca/bizy";

/* ═══════════════════════════════════════════════════════════
   Data — comprehensive Bizy platform features
   ═══════════════════════════════════════════════════════════ */

const beneficiosPrincipais = [
  { icone: Store, titulo: "Loja digital completa", texto: "Catálogo com variantes, fotos, stock e preços. Loja pública com subdomínio próprio, checkout integrado e perfil profissional. Do produto à venda — tudo pronto.", tom: "azul" as const },
  { icone: ShoppingCart, titulo: "Bizy Market — marketplace", texto: "Os teus produtos aparecem no marketplace. Pesquisa por localização, categoria e preço. Checkout multi-loja para o comprador comprar de várias lojas num só pedido.", tom: "verde" as const },
  { icone: Users, titulo: "Team e gestão de clientes", texto: "Cada cliente com histórico de compras, conversas, notas e tags. Funil de vendas, pipeline comercial, score de fiabilidade e perfil enriquecido automaticamente.", tom: "violeta" as const },
  { icone: MessageCircle, titulo: "Inbox omnicanal", texto: "WhatsApp, Instagram e TikTok — todas as conversas num único inbox. Respostas rápidas, sequências automáticas e histórico completo por cliente.", tom: "ambar" as const },
  { icone: Zap, titulo: "Lives que vendem sozinhas", texto: "Cada comentário com palavra-chave vira pedido automático. Stock actualizado em tempo real, checkout preparado e notificação ao comprador — tu focas na câmara.", tom: "rosa" as const },
  { icone: CreditCard, titulo: "Finanças e facturação", texto: "Contas a receber e pagar, cobranças automáticas, risco de inadimplência por cliente, priorização de pagamentos e orçamento mensal. Facturação com recibos PDF.", tom: "azul" as const },
  { icone: Link2, titulo: "Afiliados e parcerias", texto: "Cria links rastreáveis, recruta parceiros e define comissões automáticas por venda. Cada conversão atribuída ao parceiro certo com relatório detalhado.", tom: "verde" as const },
  { icone: BarChart3, titulo: "Inteligência preditiva", texto: "Scoring RFM, alertas de churn VIP, previsão de fluxo de caixa, detecção de anomalias, análise de carga da equipa e funil comercial com sugestões automáticas.", tom: "violeta" as const },
  { icone: Target, titulo: "Equipa e metas", texto: "Gestão de equipa com turnos, presenças, metas de vendas com alertas, bónus e comissões estimadas. Passagem de turno com resumo automático e feed de actividade.", tom: "ambar" as const },
  { icone: Shield, titulo: "Governança e compliance", texto: "Gestão de módulos por negócio, permissões por papel, auditoria de eventos, contratos de plataforma e denúncias no marketplace. Dados protegidos.", tom: "rosa" as const },
];

const modulosPlataforma: { icone: LucideIcon; titulo: string; itens: string[] }[] = [
  { icone: Store, titulo: "Loja digital", itens: ["Catálogo com variantes e stock", "Loja pública com slug", "Colecções manuais e automáticas", "Compra assistida por WhatsApp", "Cupões e promoções", "SEO por loja e produto", "Sistema de seguidores"] },
  { icone: Globe, titulo: "Bizy Market", itens: ["Marketplace multi-loja", "Pesquisa por localização e preço", "Compra unificada multi-fornecedor", "Produtos patrocinados e destaques", "Repasses financeiros automáticos", "Reembolsos parciais e totais", "Denúncias e moderação"] },
  { icone: Users, titulo: "Team comercial completo", itens: ["Ficha de cliente com histórico", "Fluxo e funil de vendas", "Tags, notas e segmentação", "Score de fiabilidade privado", "Partilha de perfil com consentimento", "Recuperação de clientes inativos", "Playbooks automáticos"] },
  { icone: Receipt, titulo: "Finanças e facturação", itens: ["Contas a receber e pagar", "Cobranças automáticas de vencidos", "Risco de inadimplência por cliente", "Priorização de pagamentos", "Orçamento mensal por categoria", "Recibos e facturas em PDF", "Metas de vendas com comissões"] },
  { icone: BarChart3, titulo: "Inteligência preditiva", itens: ["Scoring RFM de clientes", "Alertas de churn VIP", "Previsão de fluxo de caixa", "Detecção de anomalias", "Análise de carga da equipa", "Funil comercial com sugestões", "LTV por cliente"] },
  { icone: CalendarCheck, titulo: "Equipa e operação", itens: ["Turnos e registo de presenças", "Metas com alertas e bónus", "Passagem de turno automática", "Feed de actividade da equipa", "Comissão estimada diária/mensal", "Convites e papéis por membro", "Notas com menções e notificações"] },
];

const resultados = [
  { valor: "25+", label: "módulos integrados", icone: Layers },
  { valor: "100", label: "funcionalidades", icone: Compass },
  { valor: "5", label: "canais de venda", icone: Globe },
  { valor: "24h", label: "da conta à primeira venda", icone: Clock },
];

const vendedores = [
  { iniciais: "MK", cor: "#7A63C9" },
  { iniciais: "ZA", cor: "#D98E2B" },
  { iniciais: "KL", cor: "#0E8C68" },
  { iniciais: "BY", cor: "#C9564A" },
  { iniciais: "FS", cor: "#3d7bc0" },
];

const linksNavegacao = [
  { href: "#plataforma", label: "Plataforma" },
  { href: "#modulos", label: "Módulos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#pricing", label: "Preços" },
  { href: "#faq", label: "Dúvidas" },
];

const capacidades = [
  "Loja digital com checkout",
  "Bizy Market — marketplace",
  "Team e perfil de cliente",
  "Inbox WhatsApp + Instagram",
  "Lives com captura automática",
  "Finanças e facturação",
  "Cobranças automáticas",
  "Checkout multi-loja",
  "Programa de afiliados",
  "Inteligência preditiva",
  "Scoring RFM e churn",
  "Previsão de fluxo de caixa",
  "Turnos e presenças",
  "Metas com bónus",
  "Passagem de turno",
  "Comissões estimadas",
  "Detecção de anomalias",
  "Gestão de equipa",
  "Risco de inadimplência",
  "Auditoria e compliance",
  "SEO e descoberta",
  "Colecções e catálogos",
  "Recibos e facturas PDF",
  "Feed de actividade",
];

const canaisVenda = [
  { nome: "Loja digital", desc: "Perfil público com subdomínio, catálogo e checkout", icone: Store },
  { nome: "Bizy Market", desc: "Marketplace com milhares de compradores", icone: ShoppingBag },
  { nome: "WhatsApp", desc: "Checkout assistido directo no chat", icone: MessageCircle },
  { nome: "Instagram", desc: "Comentários e DMs que geram pedidos", icone: Heart },
  { nome: "Lives", desc: "Captura automática por palavra-chave", icone: Zap },
];

const testemunhos = [
  { texto: "Antes perdia metade dos pedidos na live. Agora o Bizy captura tudo e eu foco em apresentar os produtos.", nome: "Marlene K.", papel: "Vendedora de moda, Luanda", iniciais: "MK", cor: "#7A63C9" },
  { texto: "O Team mostrou-me que 40% dos meus clientes eram recorrentes. Comecei a fazer ofertas e as vendas dispararam.", nome: "Zeca A.", papel: "Electrónica e acessórios", iniciais: "ZA", cor: "#D98E2B" },
  { texto: "Configurei a loja num sábado à noite e na segunda já estava a receber pedidos pelo link. Simples assim.", nome: "Keyla L.", papel: "Cosmética natural, Viana", iniciais: "KL", cor: "#0E8C68" },
  { texto: "O marketplace trouxe-me clientes que nunca teria encontrado sozinha. E o checkout multi-loja é genial para o comprador.", nome: "Beatriz Y.", papel: "Artesanato, Benguela", iniciais: "BY", cor: "#C9564A" },
  { texto: "O programa de afiliados criou-me uma rede de vendedores que promovem os meus produtos. Comissão automática, sem stress.", nome: "Fábio S.", papel: "Suplementos e fitness", iniciais: "FS", cor: "#3d7bc0" },
];

const perguntasFrequentes: [string, string][] = [
  ["O Bizy serve apenas para lives?", "De todo. O Bizy é uma plataforma completa: loja digital, marketplace, Team, finanças, inteligência preditiva, gestão de equipa com turnos e metas, facturação PDF, afiliados e relatórios. As lives são apenas um dos canais de venda."],
  ["O que é o Bizy Market?", "É o marketplace integrado onde os teus produtos ficam visíveis a milhares de compradores. Funciona como um shopping digital — o comprador pode comprar de várias lojas num único checkout, com pagamento unificado e repasse automático a cada fornecedor."],
  ["Como funciona o Team comercial?", "Cada cliente tem uma ficha completa: histórico de compras, conversas, notas privadas, tags e score de fiabilidade. O pipeline de vendas acompanha cada oportunidade. Quando um cliente fica inactivo, o sistema sugere playbooks de recuperação."],
  ["O que é a inteligência preditiva?", "O motor analisa os teus dados e gera scoring RFM dos clientes, alertas de churn VIP, previsão de fluxo de caixa com cenários, detecção de anomalias em receitas e despesas, análise de carga da equipa e funil comercial com sugestões."],
  ["Como funciona a gestão de equipa?", "Crias membros com papéis e permissões, defines turnos e registos de presença, estabeleces metas de vendas com alertas automáticos e bónus por atingimento. O sistema calcula comissões estimadas e gera passagens de turno com resumo."],
  ["Como funcionam as finanças?", "Contas a receber e pagar, cobranças automáticas de vencidos, risco de inadimplência por cliente, priorização de pagamentos, orçamento mensal por categoria, recibos e facturas em PDF — tudo com auditoria completa."],
  ["Preciso de saber programar?", "Zero código. O assistente guia-te na criação da loja em minutos — nome, produtos, pagamento e publicação."],
  ["Existe plano gratuito?", "Sim. Começas grátis com todas as funcionalidades base. Só passas para plano pago quando precisares de mais."],
  ["Os meus dados estão protegidos?", "Sim. O sistema segue os princípios da Lei 22/11 angolana: dados de clientes são privados por loja, partilha apenas com consentimento, auditoria completa e permissões por papel."],
];

const passos = [
  { numero: "01", titulo: "Cria a tua conta", texto: "Telefone, Gmail ou identidade académica. Sem cartão, sem compromisso.", icone: Headphones },
  { numero: "02", titulo: "Monta a tua loja", texto: "Nome, segmento, fotos e pagamento. O assistente IA guia todo o processo.", icone: Store },
  { numero: "03", titulo: "Publica os produtos", texto: "Fotos, variantes, preços e stock. A loja fica online com catálogo profissional.", icone: Package },
  { numero: "04", titulo: "Liga os canais", texto: "WhatsApp, Instagram, lives — activa os canais onde os teus clientes já estão.", icone: MessageCircle },
  { numero: "05", titulo: "Vende e gere tudo", texto: "Pedidos, clientes, conversas, pagamentos e relatórios — tudo numa plataforma.", icone: TrendingUp },
] as const;

const diferenciais = [
  { icone: Globe, titulo: "Multi-canal nativo", texto: "Não é um plugin — cada canal (loja, market, WhatsApp, Instagram, live) está integrado de raiz." },
  { icone: UserCheck, titulo: "Team com identidade", texto: "Um cliente, um perfil global. Cada loja tem a sua relação privada — dados protegidos por design." },
  { icone: BarChart3, titulo: "Inteligência preditiva", texto: "RFM, churn VIP, previsão de caixa e detecção de anomalias — o sistema antecipa problemas antes que aconteçam." },
  { icone: Search, titulo: "Descoberta no Market", texto: "Os teus produtos aparecem a compradores que ainda não te conhecem. SEO, filtros e destaques." },
  { icone: CalendarCheck, titulo: "Equipa organizada", texto: "Turnos, presenças, metas de vendas com bónus, comissões estimadas e passagem de turno com resumo automático." },
  { icone: ReceiptText, titulo: "Finanças e facturação", texto: "Contas a receber, cobranças automáticas, risco de inadimplência, facturas PDF e orçamento mensal — tudo auditável." },
];

/* ═══════════════════════════════════════════════════════════
   Primitives
   ═══════════════════════════════════════════════════════════ */

function Reveal({ children, className, delay = 0, ...props }: {
  children: ReactNode; className?: string; delay?: number; [k: string]: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const rm = useReducedMotion();
  return (
    <motion.div ref={ref} className={className} {...props}
      initial={rm ? { opacity: 1 } : { opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <motion.article className={`bizy-faq-item${aberto ? " is-open" : ""}`} layout>
      <button type="button" onClick={() => setAberto((v) => !v)}>
        <h3>{pergunta}</h3>
        <motion.span animate={{ rotate: aberto ? 45 : 0 }} transition={{ duration: 0.2 }} className="bizy-faq-toggle">+</motion.span>
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="bizy-faq-answer"
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
  const rm = useReducedMotion();

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
        initial={rm ? false : { y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
          <a className="bizy-btn bizy-btn-market" href={ROTAS_LOJAS.market}>
            <ShoppingBag size={15} /> Bizy Market
          </a>
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
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              {linksNavegacao.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuAberto(false)}>{l.label}</a>
              ))}
              <a href={ROTAS_LOJAS.market} onClick={() => setMenuAberto(false)}>Bizy Market</a>
              <Link to="/login" onClick={() => setMenuAberto(false)}>Começar grátis</Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══════════ HERO ══════════ */}
      <section className="bizy-home-hero">
        <div className="bizy-hero-inner">
          <motion.p
            className="bizy-hero-eyebrow"
            initial={rm ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >Loja + Marketplace + Team + Finanças + Inteligência + Equipa</motion.p>

          <motion.h1
            className="bizy-hero-h1"
            initial={rm ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            A plataforma completa{"\n"}para o teu <em>negócio</em>.
          </motion.h1>

          <motion.p
            className="bizy-hero-sub"
            initial={rm ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            Loja digital, marketplace, Team, finanças com cobranças automáticas, inteligência preditiva, gestão de equipa com turnos e metas, facturação PDF, afiliados e relatórios — tudo integrado numa única plataforma feita para Angola.
          </motion.p>

          <motion.div
            className="bizy-hero-ctas"
            initial={rm ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link className="bizy-btn bizy-btn-hero" to="/login">
              Começar grátis <ArrowRight size={16} />
            </Link>
            <a className="bizy-btn bizy-btn-market bizy-btn-market-hero" href={ROTAS_LOJAS.market}>
              <ShoppingBag size={16} /> Ver Bizy Market
            </a>
            <a className="bizy-btn bizy-btn-ghost" href="#plataforma">
              <Play size={14} /> Explorar a plataforma
            </a>
          </motion.div>

          <motion.div
            className="bizy-hero-proof"
            initial={rm ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.42 }}
          >
            <span className="bizy-avatar-stack">
              {vendedores.map((v) => (
                <span key={v.iniciais} style={{ backgroundColor: v.cor }}>{v.iniciais}</span>
              ))}
            </span>
            <span><strong>+2 400</strong> empreendedores já usam o {NOME_PRODUTO}</span>
          </motion.div>
        </div>
      </section>

      {/* ══════════ MARQUEE ══════════ */}
      <div className="bizy-marquee-strip">
        <Marquee pauseOnHover className="[--duration:50s] [--gap:0rem]">
          {capacidades.map((c) => (
            <span key={c} className="bizy-marquee-item">{c}</span>
          ))}
        </Marquee>
      </div>

      {/* ══════════ STATS ══════════ */}
      <section className="bizy-home-strip">
        {resultados.map((r, i) => {
          const Icone = r.icone;
          return (
            <Reveal key={r.label} className="bizy-stat-cell" delay={i * 0.06}>
              <span className="bizy-strip-icon"><Icone size={16} /></span>
              <strong>{r.valor}</strong>
              <span>{r.label}</span>
            </Reveal>
          );
        })}
      </section>

      {/* ══════════ 5 CANAIS DE VENDA ══════════ */}
      <section className="bizy-home-section" id="plataforma">
        <Reveal>
          <div className="bizy-section-head">
            <span>Vende em todo o lado</span>
            <h2>5 canais de venda, <em>uma plataforma</em></h2>
            <p>Não importa onde o teu cliente está — a venda acontece e os dados convergem num único lugar.</p>
          </div>
        </Reveal>
        <div className="bizy-channels-grid">
          {canaisVenda.map((c, i) => {
            const Icone = c.icone;
            return (
              <Reveal key={c.nome} className="bizy-channel-card" delay={i * 0.06}>
                <span className="bizy-channel-icon"><Icone size={24} /></span>
                <h3>{c.nome}</h3>
                <p>{c.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ══════════ PROBLEMA → SOLUÇÃO ══════════ */}
      <section className="bizy-home-section bizy-problem-section">
        <Reveal>
          <div className="bizy-section-head">
            <span>O antes e depois</span>
            <h2>Sem sistema, <em>perdes vendas</em></h2>
          </div>
        </Reveal>
        <div className="bizy-problem-grid">
          <Reveal className="bizy-problem-card" delay={0.1}>
            <span className="bizy-problem-label">Sem Bizy</span>
            <ul>
              <li>Pedidos perdidos em comentários e mensagens</li>
              <li>Copiar e colar dados entre WhatsApp e Excel</li>
              <li>Sem saber quem pagou, quem deve, quem desistiu</li>
              <li>Clientes espalhados sem histórico</li>
              <li>Sem loja online, sem marketplace, sem visibilidade</li>
              <li>Comissões de afiliados calculadas à mão</li>
            </ul>
          </Reveal>
          <Reveal className="bizy-solution-card" delay={0.18}>
            <span className="bizy-solution-label"><Sparkles size={14} />Com Bizy</span>
            <ul>
              <li>Cada comentário e mensagem vira pedido automático</li>
              <li>Finanças com cobranças automáticas e risco por cliente</li>
              <li>Inteligência preditiva: churn, RFM, previsão de caixa</li>
              <li>Equipa com turnos, metas, bónus e passagem de turno</li>
              <li>Loja digital + marketplace com milhares de compradores</li>
              <li>Facturas e recibos PDF gerados automaticamente</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ══════════ FUNCIONALIDADES PRINCIPAIS ══════════ */}
      <section className="bizy-home-section" id="beneficios">
        <Reveal>
          <div className="bizy-section-head">
            <span>Plataforma completa</span>
            <h2>Tudo o que o {NOME_PRODUTO} faz <em>por ti</em></h2>
            <p>Loja, marketplace, Team, finanças, inteligência preditiva, gestão de equipa, facturação, afiliados e muito mais — integrado de raiz.</p>
          </div>
        </Reveal>
        <div className="bizy-feature-grid">
          {beneficiosPrincipais.map((b, i) => {
            const Icone = b.icone;
            return (
              <Reveal className="bizy-feature-card" data-tone={b.tom} key={b.titulo} delay={i * 0.05}>
                <span className="bizy-feature-icon"><Icone size={22} /></span>
                <h3>{b.titulo}</h3>
                <p>{b.texto}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ══════════ MÓDULOS DETALHADOS ══════════ */}
      <section className="bizy-home-section bizy-modules" id="modulos">
        <Reveal>
          <div className="bizy-section-head">
            <span>Dentro da plataforma</span>
            <h2>6 módulos, <em>dezenas</em> de funcionalidades</h2>
            <p>Cada módulo resolve uma área completa do teu negócio. Activa só o que precisas.</p>
          </div>
        </Reveal>
        <div className="bizy-modules-grid">
          {modulosPlataforma.map((m, i) => {
            const Icone = m.icone;
            return (
              <Reveal key={m.titulo} className="bizy-module-card" delay={i * 0.06}>
                <div className="bizy-module-header">
                  <span className="bizy-module-icon"><Icone size={20} /></span>
                  <h3>{m.titulo}</h3>
                </div>
                <ul>
                  {m.itens.map((item) => (
                    <li key={item}><CheckCircle2 size={14} />{item}</li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ══════════ DIFERENCIAIS ══════════ */}
      <section className="bizy-home-section">
        <Reveal>
          <div className="bizy-section-head">
            <span>Porquê o Bizy</span>
            <h2>O que nos torna <em>diferentes</em></h2>
          </div>
        </Reveal>
        <div className="bizy-diff-grid">
          {diferenciais.map((d, i) => {
            const Icone = d.icone;
            return (
              <Reveal key={d.titulo} className="bizy-diff-card" delay={i * 0.05}>
                <Icone size={20} />
                <h3>{d.titulo}</h3>
                <p>{d.texto}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ══════════ COMO FUNCIONA ══════════ */}
      <section className="bizy-home-section bizy-steps" id="como-funciona">
        <Reveal>
          <div className="bizy-section-head">
            <span>Pronto em minutos</span>
            <h2>Da conta criada ao negócio a funcionar</h2>
            <p>Sem tutoriais longos, sem configurações técnicas. O assistente guia-te em cada passo.</p>
          </div>
        </Reveal>
        <div className="bizy-step-grid">
          <div className="bizy-step-line" aria-hidden="true" />
          {passos.map((p, i) => {
            const Icone = p.icone;
            return (
              <Reveal key={p.numero} className="bizy-step-card" delay={i * 0.08}>
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
            <h2>Histórias de quem <em>vende com o Bizy</em></h2>
          </div>
        </Reveal>
        <div className="bizy-testimonial-grid">
          {testemunhos.map((t, i) => (
            <Reveal className="bizy-testimonial-card" key={t.nome} delay={i * 0.06}>
              <div className="bizy-quote-mark" aria-hidden="true">"</div>
              <p>{t.texto}</p>
              <footer>
                <span className="bizy-testimonial-avatar" style={{ backgroundColor: t.cor }}>{t.iniciais}</span>
                <div><strong>{t.nome}</strong><small>{t.papel}</small></div>
              </footer>
            </Reveal>
          ))}
        </div>
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
          <div>
            <h2>O teu negócio merece mais do que um caderno e o WhatsApp.</h2>
            <p>Loja, marketplace, Team, pagamentos, relatórios e muito mais — tudo pronto para começares hoje. Grátis.</p>
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
            <h2>Perguntas frequentes sobre o {NOME_PRODUTO}</h2>
            <p>Se a tua dúvida não está aqui, fala connosco pelo WhatsApp.</p>
          </div>
        </Reveal>
        <div className="bizy-faq-grid">
          {perguntasFrequentes.map(([p, r], i) => (
            <Reveal key={p} delay={i * 0.04}>
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
            <p>A plataforma completa de comércio para empreendedores angolanos — loja, marketplace, Team, finanças, inteligência e equipa.</p>
            <Link className="bizy-btn bizy-btn-primary" to="/login">Começar agora <ArrowRight size={16} /></Link>
          </div>
          <nav aria-label="Plataforma">
            <strong>Plataforma</strong>
            <a href="#plataforma">Canais de venda</a>
            <a href="#beneficios">Funcionalidades</a>
            <a href="#modulos">Módulos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#pricing">Preços</a>
          </nav>
          <nav aria-label="Produto">
            <strong>Produto</strong>
            <span>Loja digital</span>
            <span>Bizy Market</span>
            <span>Team e clientes</span>
            <span>Finanças e facturação</span>
            <span>Inteligência preditiva</span>
            <span>Gestão de equipa</span>
          </nav>
          <div className="bizy-footer-contact">
            <strong>Contacto</strong>
            <span>Luanda, Angola</span>
            <a href="mailto:suporte@bizy.ao">suporte@bizy.ao</a>
            <span>Loja, marketplace, Team, finanças, inteligência — tudo num lugar.</span>
          </div>
        </div>
        <div className="bizy-footer-bottom">
          <span>© 2026 Bizy · Luanda, Angola</span>
          <div><a href="#privacidade">Privacidade</a><a href="#termos">Termos</a></div>
        </div>
      </footer>
    </main>
  );
}
