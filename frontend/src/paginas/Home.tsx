import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Layers,
  Link2,
  Menu,
  MessageCircle,
  Package,
  Radio,
  ReceiptText,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  Target,
  Truck,
  UserCheck,
  Users,
  Wallet,
  Workflow,
  X,
  type LucideIcon
} from "lucide-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Pricing } from "@/components/ui/single-pricing-card-1";
import { ROTAS_LOJAS } from "../lojas";
import { LogoBizy, NOME_PRODUTO } from "../marca/bizy";

const linksNavegacao = [
  { href: "#ecossistema", label: "Ecossistema" },
  { href: "#commerce", label: "Commerce" },
  { href: "#operacao", label: "Operação" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#pricing", label: "Preços" }
];

const sistemas: Array<{
  nome: string;
  tipo: string;
  resumo: string;
  descricao: string;
  itens: string[];
  icone: LucideIcon;
  link: string;
  acao: string;
  tom: "team" | "market" | "learning";
}> = [
  {
    nome: "Bizy Team",
    tipo: "Operação privada",
    resumo: "A fonte de verdade do negócio.",
    descricao: "Clientes, produtos, pedidos, conversas, tarefas, equipa, projectos e dinheiro trabalham no mesmo contexto operacional.",
    itens: ["Clientes e atendimento", "Stock, pedidos e entregas", "Equipa, metas e finanças"],
    icone: Users,
    link: "/login",
    acao: "Entrar no Team",
    tom: "team"
  },
  {
    nome: "Bizy Market",
    tipo: "Descoberta e compra",
    resumo: "Lojas reais num marketplace integrado.",
    descricao: "O comprador encontra produtos, escolhe variantes, combina lojas no mesmo carrinho e acompanha a compra numa conta segura.",
    itens: ["Lojas e produtos", "Checkout multi-loja", "Conta e protecção do comprador"],
    icone: ShoppingBag,
    link: ROTAS_LOJAS.market,
    acao: "Explorar o Market",
    tom: "market"
  },
  {
    nome: "Bizy Learning",
    tipo: "Conhecimento como produto",
    resumo: "Formação ligada à operação.",
    descricao: "Cursos, mentorias, cohorts e comunidades podem ser publicados, vendidos, acompanhados e geridos dentro do mesmo ecossistema.",
    itens: ["Programas e lições", "Avaliações e certificados", "Comunidades e progresso"],
    icone: GraduationCap,
    link: "/learning",
    acao: "Abrir o Learning",
    tom: "learning"
  }
];

const cicloComercial = [
  { nome: "Descobrir", texto: "Market, conteúdo, live e Smart Links", icone: Search },
  { nome: "Converter", texto: "Produto, variante, carrinho e checkout", icone: ShoppingCart },
  { nome: "Executar", texto: "Pedido, pagamento, stock e entrega", icone: Truck },
  { nome: "Reter", texto: "Atendimento, Learning e recuperação", icone: MessageCircle },
  { nome: "Controlar", texto: "Finanças, risco, relatórios e auditoria", icone: Shield }
];

const creatorCommerce = [
  { titulo: "Smart Links", texto: "Links canónicos que preservam campanha, creator, produto e sessão sem expor dados pessoais.", icone: Link2 },
  { titulo: "Conteúdo comprável", texto: "Vídeos, reviews, tutoriais e colecções ligam produtos de uma ou várias lojas ao checkout.", icone: Radio },
  { titulo: "Creator Marketplace", texto: "Ofertas, oportunidades, candidaturas, amostras e missões ligam sellers a criadores.", icone: Target },
  { titulo: "Carrinhos partilháveis", texto: "Creators, afiliados e vendedores preparam selecções prontas para importar e comprar.", icone: ShoppingCart },
  { titulo: "Atribuição explicável", texto: "Primeiro toque, último toque e conversões assistidas ficam registados com regra e versão.", icone: BarChart3 },
  { titulo: "Comissões auditáveis", texto: "Ledger imutável, retenções, reversões e payouts evitam saldos financeiros opacos.", icone: Wallet }
];

const areasOperacao = [
  {
    numero: "01",
    nome: "Vender",
    descricao: "Publica e converte em canais diferentes sem duplicar produto, preço ou stock.",
    itens: ["Bizy Studio", "Market", "WhatsApp", "Live", "Creator commerce"],
    icone: Store
  },
  {
    numero: "02",
    nome: "Atender",
    descricao: "Mantém cliente, conversa, tarefa e histórico comercial ligados à mesma operação.",
    itens: ["Clientes 360", "Social Inbox", "Notas", "Formulários", "Recuperação"],
    icone: MessageCircle
  },
  {
    numero: "03",
    nome: "Entregar",
    descricao: "Confirma variante e stock no servidor, divide pedidos por fornecedor e acompanha o fulfillment.",
    itens: ["Carrinho server-side", "Checkout multi-loja", "Comprovativo privado", "Pedidos-filho", "Reembolsos"],
    icone: Package
  },
  {
    numero: "04",
    nome: "Gerir",
    descricao: "Organiza pessoas, trabalho e dinheiro com ownership, permissões e contexto por negócio.",
    itens: ["Equipa e turnos", "Metas", "Projectos", "Finanças", "Facturação"],
    icone: Workflow
  },
  {
    numero: "05",
    nome: "Aprender",
    descricao: "Transforma conhecimento em programa, produto digital, comunidade e desenvolvimento da equipa.",
    itens: ["Cursos", "Mentorias", "Cohorts", "Avaliações", "Certificados"],
    icone: BookOpen
  }
];

const pilaresConfianca = [
  {
    titulo: "Uma conta, vários contextos",
    texto: "A mesma ContaBizy pode representar comprador, creator, afiliado, seller, produtor Learning e membro de negócio.",
    icone: UserCheck
  },
  {
    titulo: "Acesso passwordless",
    texto: "OTP por telefone, sessões revogáveis e associação segura da compra convidada depois do checkout.",
    icone: CreditCard
  },
  {
    titulo: "Compra protegida",
    texto: "Comprovativo privado, avaliação verificada, casos de risco, disputas e revisão humana em decisões sensíveis.",
    icone: Shield
  },
  {
    titulo: "Dinheiro com histórico",
    texto: "Atribuição, comissões, retenções e pagamentos preservam evidência e não dependem de regras no frontend.",
    icone: ReceiptText
  }
];

const passos = [
  { numero: "01", titulo: "Cria a ContaBizy", texto: "Entra por telefone e usa a mesma identidade nos contextos autorizados.", icone: UserCheck },
  { numero: "02", titulo: "Configura a operação", texto: "Define negócio, equipa, produtos, pagamentos e módulos no Team.", icone: Layers },
  { numero: "03", titulo: "Publica e distribui", texto: "Activa loja, Market, Learning, creators e os canais que fazem sentido.", icone: Store },
  { numero: "04", titulo: "Executa com controlo", texto: "Acompanha vendas, atendimento, entrega, dinheiro, risco e desempenho.", icone: BarChart3 }
];

const perguntasFrequentes: Array<[string, string]> = [
  ["O que é o Bizy hoje?", "O Bizy é um Business Operating System modular para pequenos negócios. Team gere a operação privada, Market cuida da descoberta e compra, Learning transforma conhecimento em produto e Anani aplica inteligência, risco e governança nos bastidores."],
  ["Qual é a diferença entre Team, Market e Learning?", "Team é a fonte de verdade do negócio. Market é a camada pública de lojas, produtos e checkout. Learning é a camada de cursos, mentorias, comunidades, progresso e certificados. Os três partilham identidade e dados operacionais autorizados."],
  ["O comprador precisa criar conta antes de comprar?", "Não. O checkout convidado continua disponível. Depois da compra, o comprador pode confirmar o telefone por OTP e associar o pedido à sua ContaBizy para acompanhar estados e compras futuras."],
  ["Como funciona o creator commerce?", "Creators e afiliados podem descobrir oportunidades, candidatar-se, criar conteúdo comprável, Smart Links e carrinhos partilháveis. Cliques, pedidos, atribuição e comissões ficam ligados à jornada real."],
  ["As comissões são apenas uma estimativa no ecrã?", "Não. O backend mantém um ledger imutável com créditos, retenções, libertações, reversões e payouts. Confirmações bancárias externas continuam sujeitas ao provider e à revisão aplicável."],
  ["O que o Anani faz?", "Anani é o núcleo interno de inteligência, risco, auditoria e governança. Não é um chatbot público: os utilizadores vêem os seus efeitos através de alertas, protecções, tarefas e revisões dentro dos produtos Bizy."],
  ["O Bizy substitui o WhatsApp?", "Não. O WhatsApp é um canal importante, mas cliente, produto, pedido, pagamento, entrega e auditoria permanecem no Bizy. Assim a operação não depende do histórico de um único chat."],
  ["Posso activar apenas o que preciso?", "Sim. O Bizy é modular e o Team controla os módulos activos, papéis e permissões de cada negócio."],
  ["Os meus dados ficam misturados com outras lojas?", "Não. Rotas privadas validam autenticação, tenant, ownership e permissão. Dados de compradores e negócios são expostos apenas no contexto autorizado."]
];

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visivel = useInView(ref, { once: true, amount: 0.12 });
  const reduzirMovimento = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduzirMovimento ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={visivel ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <motion.article className={`bizy-faq-item${aberto ? " is-open" : ""}`} layout>
      <button type="button" onClick={() => setAberto((valor) => !valor)} aria-expanded={aberto}>
        <h3>{pergunta}</h3>
        <motion.span animate={{ rotate: aberto ? 45 : 0 }} transition={{ duration: 0.18 }} className="bizy-faq-toggle">+</motion.span>
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="bizy-faq-answer"
          >
            <p>{resposta}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export function PaginaHome() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const reduzirMovimento = useReducedMotion();

  useEffect(() => {
    const tituloAnterior = document.title;
    const descricao = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const descricaoAnterior = descricao?.content;
    document.title = "Bizy | Team, Market e Learning para o teu negócio";
    if (descricao) descricao.content = "Bizy liga operação, marketplace, learning e creator commerce num sistema feito para negócios em Angola.";

    function aoRolar() {
      setNavScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      document.title = tituloAnterior;
      if (descricao && descricaoAnterior) descricao.content = descricaoAnterior;
    };
  }, []);

  return (
    <main className="bizy-public bizy-home bizy-home-2026">
      <motion.header
        className={`bizy-home-nav${navScrolled ? " is-scrolled" : ""}`}
        initial={reduzirMovimento ? false : { y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <Link className="bizy-home-logo" to="/" aria-label="Página inicial do Bizy"><LogoBizy /></Link>
        <nav className="bizy-home-links" aria-label="Navegação principal">
          {linksNavegacao.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <div className="bizy-home-actions">
          <Link className="bizy-link-muted" to="/learning">Learning</Link>
          <a className="bizy-btn bizy-btn-market" href={ROTAS_LOJAS.market}><ShoppingBag size={15} />Market</a>
          <Link className="bizy-link-muted" to="/login">Entrar</Link>
          <Link className="bizy-btn bizy-btn-primary" to="/login">Começar <ArrowRight size={15} /></Link>
        </div>
        <button
          className="bizy-mobile-menu"
          type="button"
          onClick={() => setMenuAberto((valor) => !valor)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
        >
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
        <AnimatePresence>
          {menuAberto && (
            <motion.nav
              className="bizy-mobile-panel"
              aria-label="Navegação mobile"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {linksNavegacao.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuAberto(false)}>{link.label}</a>)}
              <Link to="/learning" onClick={() => setMenuAberto(false)}>Bizy Learning</Link>
              <a href={ROTAS_LOJAS.market} onClick={() => setMenuAberto(false)}>Bizy Market</a>
              <Link to="/login" onClick={() => setMenuAberto(false)}>Começar no Bizy</Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <section className="bizy-home-hero bizy-home-hero-2026">
        <img className="bizy-hero-media" src="/bizy-login-team.png" alt="Equipa de uma loja angolana a vender em live com o Bizy" />
        <div className="bizy-hero-overlay" aria-hidden="true" />
        <div className="bizy-hero-inner">
          <motion.p className="bizy-hero-eyebrow" initial={reduzirMovimento ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            Business Operating System para Angola
          </motion.p>
          <motion.h1 className="bizy-hero-h1" initial={reduzirMovimento ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            Bizy. Um sistema para <em>vender, operar e crescer.</em>
          </motion.h1>
          <motion.p className="bizy-hero-sub" initial={reduzirMovimento ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            Team organiza o negócio. Market cria descoberta e compra. Learning transforma conhecimento em produto. Uma ContaBizy liga compradores, equipas, sellers e creators com controlo nos bastidores.
          </motion.p>
          <motion.div className="bizy-hero-ctas" initial={reduzirMovimento ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Link className="bizy-btn bizy-btn-lime bizy-btn-large" to="/login">Começar no Bizy <ArrowRight size={16} /></Link>
            <a className="bizy-btn bizy-btn-hero-market bizy-btn-large" href={ROTAS_LOJAS.market}><ShoppingBag size={16} />Explorar o Market</a>
            <Link className="bizy-hero-text-link" to="/learning">Ver Learning <ArrowRight size={15} /></Link>
          </motion.div>
          <motion.div className="bizy-hero-facts" initial={reduzirMovimento ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34 }}>
            <span><UserCheck size={15} />Conta universal por OTP</span>
            <span><CreditCard size={15} />Checkout em Kz</span>
            <span><Store size={15} />Operação multi-loja</span>
          </motion.div>
        </div>
      </section>

      <nav className="bizy-product-switcher" aria-label="Produtos Bizy">
        <a href="#team"><strong>Team</strong><span>Operação do negócio</span></a>
        <a href={ROTAS_LOJAS.market}><strong>Market</strong><span>Descoberta e compra</span></a>
        <Link to="/learning"><strong>Learning</strong><span>Conhecimento e comunidade</span></Link>
        <a href="#anani"><strong>Anani</strong><span>Risco e governança interna</span></a>
      </nav>

      <section className="bizy-home-section bizy-ecosystem" id="ecossistema">
        <Reveal>
          <div className="bizy-section-head bizy-section-head-left">
            <span>Um ecossistema, uma direcção</span>
            <h2>Três produtos visíveis. <em>Uma operação ligada.</em></h2>
            <p>O Bizy deixa de tratar loja, clientes, marketplace e formação como caminhos separados. Cada produto lidera uma responsabilidade clara e devolve dados accionáveis ao Team.</p>
          </div>
        </Reveal>
        <div className="bizy-platform-grid">
          {sistemas.map((sistema, indice) => {
            const Icone = sistema.icone;
            return (
              <Reveal key={sistema.nome} className="bizy-platform-card" delay={indice * 0.06}>
                <article data-system={sistema.tom} id={sistema.tom === "team" ? "team" : undefined}>
                  <div className="bizy-platform-top"><span><Icone size={20} /></span><small>{sistema.tipo}</small></div>
                  <p className="bizy-platform-name">{sistema.nome}</p>
                  <h3>{sistema.resumo}</h3>
                  <p>{sistema.descricao}</p>
                  <ul>{sistema.itens.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul>
                  <Link to={sistema.link}>{sistema.acao} <ArrowRight size={15} /></Link>
                </article>
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <aside className="bizy-anani-band" id="anani">
            <div><span><Shield size={18} /></span><small>Núcleo interno</small><h3>Anani protege a operação sem criar um quarto caminho para o utilizador.</h3></div>
            <p>Políticas, risco, auditoria, incidentes e revisão humana aparecem dentro de Team, Market e Learning como alertas, protecções e tarefas accionáveis.</p>
          </aside>
        </Reveal>
      </section>

      <section className="bizy-loop-section" aria-label="Ciclo comercial Bizy">
        <div className="bizy-loop-intro"><span>O ciclo comercial completo</span><h2>Da descoberta ao controlo.</h2></div>
        <div className="bizy-loop">
          {cicloComercial.map((etapa, indice) => {
            const Icone = etapa.icone;
            return (
              <div className="bizy-loop-step" key={etapa.nome}>
                <span><Icone size={18} /></span>
                <div><strong>{etapa.nome}</strong><small>{etapa.texto}</small></div>
                {indice < cicloComercial.length - 1 && <ArrowRight size={16} aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bizy-commerce-section" id="commerce">
        <div className="bizy-commerce-inner">
          <Reveal className="bizy-commerce-copy">
            <span>Creator commerce</span>
            <h2>Conteúdo que vira venda. Com atribuição que pode ser explicada.</h2>
            <p>O Bizy liga sellers, creators e afiliados numa jornada completa: oportunidade, conteúdo, clique, produto, carrinho, pedido, comissão e payout.</p>
            <div>
              <Link className="bizy-btn bizy-btn-lime" to="/creator">Abrir portal Creator <ArrowRight size={16} /></Link>
              <Link className="bizy-commerce-secondary" to="/login">Gerir no Team</Link>
            </div>
          </Reveal>
          <div className="bizy-commerce-grid">
            {creatorCommerce.map((item, indice) => {
              const Icone = item.icone;
              return (
                <Reveal key={item.titulo} className="bizy-commerce-item" delay={indice * 0.04}>
                  <span><Icone size={19} /></span><div><h3>{item.titulo}</h3><p>{item.texto}</p></div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bizy-home-section bizy-operation-section" id="operacao">
        <Reveal>
          <div className="bizy-section-head bizy-section-head-left">
            <span>Operação sem caminhos paralelos</span>
            <h2>O trabalho diário organizado por <em>resultado.</em></h2>
            <p>Em vez de acumular ferramentas isoladas, o Bizy liga cada acção à mesma fonte de verdade para cliente, produto, pedido, dinheiro e equipa.</p>
          </div>
        </Reveal>
        <div className="bizy-operation-list">
          {areasOperacao.map((area, indice) => {
            const Icone = area.icone;
            return (
              <Reveal key={area.nome} className="bizy-operation-row" delay={indice * 0.04}>
                <span className="bizy-operation-number">{area.numero}</span>
                <span className="bizy-operation-icon"><Icone size={20} /></span>
                <div><h3>{area.nome}</h3><p>{area.descricao}</p></div>
                <div className="bizy-operation-tags">{area.itens.map((item) => <span key={item}>{item}</span>)}</div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="bizy-home-section bizy-trust-section">
        <Reveal>
          <div className="bizy-section-head bizy-section-head-left">
            <span>Identidade, confiança e segurança</span>
            <h2>Crescer sem perder o <em>controlo.</em></h2>
            <p>As novas jornadas de comprador e creator foram construídas no backend, com sessão, ownership, tenant, auditoria e regras financeiras fora do navegador.</p>
          </div>
        </Reveal>
        <div className="bizy-trust-grid">
          {pilaresConfianca.map((pilar, indice) => {
            const Icone = pilar.icone;
            return (
              <Reveal key={pilar.titulo} className="bizy-trust-item" delay={indice * 0.05}>
                <span><Icone size={20} /></span><h3>{pilar.titulo}</h3><p>{pilar.texto}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="bizy-home-section bizy-steps" id="como-funciona">
        <Reveal>
          <div className="bizy-section-head">
            <span>Começar com clareza</span>
            <h2>Uma conta. Quatro passos. <em>Operação real.</em></h2>
            <p>O Bizy cresce com o negócio sem obrigar a criar identidades ou catálogos duplicados para cada produto.</p>
          </div>
        </Reveal>
        <div className="bizy-step-grid bizy-step-grid-2026">
          {passos.map((passo, indice) => {
            const Icone = passo.icone;
            return (
              <Reveal key={passo.numero} className="bizy-step-card" delay={indice * 0.06}>
                <div className="bizy-step-number"><span className="bizy-step-num-text">{passo.numero}</span><span className="bizy-step-icon"><Icone size={16} /></span></div>
                <h3>{passo.titulo}</h3><p>{passo.texto}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <Pricing />

      <section className="bizy-home-band bizy-home-band-2026">
        <div>
          <span>Pronto para centralizar a operação?</span>
          <h2>Começa pelo Team e activa o ecossistema quando fizer sentido.</h2>
          <p>Produtos, vendas, atendimento, Market, Learning, creators, equipa e finanças ligados à mesma base operacional.</p>
        </div>
        <div className="bizy-final-actions">
          <Link className="bizy-btn bizy-btn-lime bizy-btn-large" to="/login">Começar no Bizy <ArrowRight size={17} /></Link>
          <a href={ROTAS_LOJAS.market}>Visitar o Market</a>
        </div>
      </section>

      <section className="bizy-home-section bizy-faq" id="faq">
        <Reveal>
          <div className="bizy-section-head">
            <span>Respostas directas</span>
            <h2>Perguntas frequentes sobre o {NOME_PRODUTO}</h2>
            <p>O que cada produto faz, como a conta funciona e onde entram creators, compradores e segurança.</p>
          </div>
        </Reveal>
        <div className="bizy-faq-grid">
          {perguntasFrequentes.map(([pergunta, resposta], indice) => (
            <Reveal key={pergunta} delay={indice * 0.03}><FaqItem pergunta={pergunta} resposta={resposta} /></Reveal>
          ))}
        </div>
      </section>

      <footer className="bizy-home-footer">
        <div className="bizy-footer-main">
          <div className="bizy-footer-brand">
            <LogoBizy />
            <p>O sistema operacional comercial que liga Team, Market, Learning e creator commerce para negócios em Angola.</p>
            <Link className="bizy-btn bizy-btn-primary" to="/login">Entrar no Bizy <ArrowRight size={16} /></Link>
          </div>
          <nav aria-label="Produtos">
            <strong>Produtos</strong>
            <Link to="/login">Bizy Team</Link>
            <a href={ROTAS_LOJAS.market}>Bizy Market</a>
            <Link to="/learning">Bizy Learning</Link>
            <Link to="/creator">Portal Creator</Link>
          </nav>
          <nav aria-label="Capacidades">
            <strong>Capacidades</strong>
            <a href="#commerce">Creator commerce</a>
            <a href="#operacao">Operação</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#pricing">Preços</a>
          </nav>
          <div className="bizy-footer-contact">
            <strong>Contacto</strong>
            <span>Luanda, Angola</span>
            <a href="mailto:suporte@bizy.ao">suporte@bizy.ao</a>
            <span>Operação em Kwanza, telefone angolano e fluxos comerciais locais.</span>
          </div>
        </div>
        <div className="bizy-footer-bottom">
          <span>© {new Date().getFullYear()} Bizy. Todos os direitos reservados.</span>
          <div><a href="#privacidade">Privacidade</a><a href="#termos">Termos</a></div>
        </div>
      </footer>
    </main>
  );
}
