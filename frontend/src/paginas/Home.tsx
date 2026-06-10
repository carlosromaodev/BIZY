import {
  ArrowRight,
  BarChart3,
  Bolt,
  CheckCircle2,
  Eye,
  GraduationCap,
  Link2,
  Menu,
  MessageCircle,
  ReceiptText,
  ShoppingBag,
  Store,
  Users,
  X
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pricing } from "@/components/ui/single-pricing-card-1";
import { LogoBizy, NOME_PRODUTO } from "../marca/bizy";

const MotionDiv = motion.div;
const MotionSection = motion.section;

const modulos = [
  { icone: Store, titulo: "Loja pronta para vender", texto: "Catálogo digital, stock e links de venda para WhatsApp, redes e site.", tom: "verde" },
  { icone: ShoppingBag, titulo: "Pedidos com controlo", texto: "Cada comentário ou mensagem vira um pedido com pagamento e prazo ligados.", tom: "azul" },
  { icone: MessageCircle, titulo: "CRM de clientes", texto: "Histórico, origem e perfil único para atendimento, recompra e recuperação.", tom: "violeta" },
  { icone: ReceiptText, titulo: "Checkout unificado", texto: "Pagamento, comprovativo, entrega e estado do pedido ligados ao mesmo fluxo.", tom: "ambar" },
  { icone: Link2, titulo: "Afiliados e links", texto: "Links por produto, campanha ou parceiro com origem e resultado rastreáveis.", tom: "rosa" },
  { icone: BarChart3, titulo: "Relatórios comerciais", texto: "Conversão, produtos fortes, clientes recorrentes e oportunidades perdidas.", tom: "verde" }
];

const estatisticas = [
  { valor: "+2 400", label: "lojas ativas" },
  { valor: "98%", label: "pedidos sem perda" },
  { valor: "24h", label: "para lançar a loja" },
  { valor: "3x", label: "mais recompra com CRM" }
];

const vendedores = [
  { iniciais: "MK", cor: "#7A63C9" },
  { iniciais: "ZA", cor: "#D98E2B" },
  { iniciais: "KL", cor: "#0E8C68" },
  { iniciais: "BY", cor: "#C9564A" }
];

const linksNavegacao = [
  { href: "#modulos", label: "Produto" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#pricing", label: "Preços" },
  { href: "#faq", label: "Dúvidas" }
];

function criarMotion(reduzir: boolean): { item: Variants; painel: Variants } {
  return {
    item: reduzir
      ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
      : {
          hidden: { opacity: 0, y: 18 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] } }
        },
    painel: reduzir
      ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
      : {
          hidden: { opacity: 0, y: 24, scale: 0.98 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } }
        }
  };
}

export function PaginaHome() {
  const [menuAberto, setMenuAberto] = useState(false);
  const reduzirMovimento = useReducedMotion();
  const motionPreset = useMemo(() => criarMotion(Boolean(reduzirMovimento)), [reduzirMovimento]);

  return (
    <main className="bizy-public bizy-home">
      <header className="bizy-home-nav">
        <Link className="bizy-home-logo" to="/" aria-label="Bizy home">
          <LogoBizy />
        </Link>

        <nav className="bizy-home-links" aria-label="Navegação principal">
          {linksNavegacao.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <div className="bizy-home-actions">
          <Link className="bizy-link-muted" to="/login">Entrar</Link>
          <Link className="bizy-btn bizy-btn-primary" to="/login">
            Criar conta
            <ArrowRight size={16} />
          </Link>
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

        {menuAberto ? (
          <nav className="bizy-mobile-panel" aria-label="Navegação mobile">
            {linksNavegacao.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuAberto(false)}>{item.label}</a>
            ))}
            <Link to="/login" onClick={() => setMenuAberto(false)}>Criar conta</Link>
          </nav>
        ) : null}
      </header>

      <MotionSection className="bizy-home-hero" initial="hidden" animate="visible">
        <MotionDiv className="bizy-home-copy" variants={motionPreset.item}>
          <span className="bizy-live-pill"><span />Para quem vende ao vivo e nas redes</span>
          <h1>Venda pelo <em>WhatsApp</em>, live e loja online sem perder pedidos.</h1>
          <p>
            O {NOME_PRODUTO} junta catálogo, stock, pedidos, conversas, pagamentos e entregas num CRM feito para vender nas redes sociais.
          </p>
          <div className="bizy-home-cta">
            <Link className="bizy-btn bizy-btn-primary bizy-btn-large" to="/login">
              Começar grátis
              <ArrowRight size={17} />
            </Link>
            <a className="bizy-btn bizy-btn-ghost bizy-btn-large" href="#modulos">
              <Eye size={17} />
              Ver demo
            </a>
          </div>
          <div className="bizy-home-avatars">
            <span className="bizy-avatar-stack">
              {vendedores.map((vendedor) => (
                <span key={vendedor.iniciais} style={{ backgroundColor: vendedor.cor }}>{vendedor.iniciais}</span>
              ))}
            </span>
            <span><strong>+2 400 lojas</strong> já vendem com atendimento organizado.</span>
          </div>
        </MotionDiv>

        <MotionDiv className="bizy-home-photo-card" variants={motionPreset.painel}>
          <img src="/bizy-live-commerce-hero.png" alt="Vendedora em live commerce atendendo pedidos pelo Bizy" />
          <div className="bizy-home-proof">
            <span className="bizy-proof-icon"><Bolt size={18} /></span>
            <div>
              <strong><span>@sofia_a</span> reservou na live</strong>
              <small>Vestido verde · agora mesmo</small>
            </div>
            <b>18 000 Kz</b>
          </div>
        </MotionDiv>
      </MotionSection>

      <section className="bizy-home-strip" aria-label="Resultados Bizy">
        {estatisticas.map((item) => (
          <div key={item.label}>
            <strong>{item.valor}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="bizy-home-section" id="modulos">
        <div className="bizy-section-head">
          <span>Social commerce</span>
          <h2>Tudo o que a loja precisa para <em>vender</em></h2>
          <p>Canais, produtos, pedidos, clientes e relatórios ligados. Interesse vira venda acompanhada.</p>
        </div>

        <div className="bizy-feature-grid">
          {modulos.map((modulo) => {
            const Icone = modulo.icone;
            return (
              <article className="bizy-feature-card" data-tone={modulo.tom} key={modulo.titulo}>
                <span><Icone size={21} /></span>
                <h3>{modulo.titulo}</h3>
                <p>{modulo.texto}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bizy-home-section bizy-steps" id="como-funciona">
        <div className="bizy-section-head">
          <span>Lançamento assistido</span>
          <h2>Da conta criada à loja pronta em poucos passos</h2>
          <p>O fluxo de entrada apresenta as funções principais e monta a loja digital dentro do CRM.</p>
        </div>
        <div className="bizy-step-grid">
          {[
            ["01", "Criar acesso", "Telefone, Gmail, modo teste ou identidade académica."],
            ["02", "Completar loja", "Nome, segmento, contacto, canais e pagamento."],
            ["03", "Publicar produto", "Primeiro produto com preço, stock e preview da loja."],
            ["04", "Entrar no CRM", "Pedidos, conversas, clientes e relatórios já conectados."]
          ].map(([numero, titulo, texto]) => (
            <article className="bizy-step-card" key={numero}>
              <span>{numero}</span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </article>
          ))}
        </div>
      </section>

      <Pricing />

      <section className="bizy-student-band">
        <div>
          <span><GraduationCap size={15} />Login estudantil incluído</span>
          <h2>Quem vem da UOR ou ISPTEC entra com a identidade académica.</h2>
          <p>O Bizy permite começar com telefone, Gmail ou identidade académica e mantém os dados pessoais separados da operação comercial.</p>
        </div>
        <div>
          {["Telefone", "Gmail", "UOR/ISPTEC"].map((item) => (
            <span key={item}><CheckCircle2 size={16} />{item}</span>
          ))}
        </div>
      </section>

      <section className="bizy-home-band">
        <div>
          <h2>Transforma conversas em pedidos e pedidos em clientes.</h2>
          <p>Começa com a loja organizada e cresce com WhatsApp, catálogo, afiliados e relatórios no mesmo lugar.</p>
        </div>
        <Link className="bizy-btn bizy-btn-lime bizy-btn-large" to="/login">
          Começar agora
          <ArrowRight size={17} />
        </Link>
      </section>

      <section className="bizy-home-section bizy-faq" id="faq">
        <div className="bizy-section-head">
          <span>Dúvidas rápidas</span>
          <h2>O essencial antes de começar</h2>
        </div>
        <div className="bizy-faq-grid">
          {[
            ["O Bizy serve apenas para lives?", "Não. A live é um canal; o Bizy também organiza WhatsApp, catálogo, loja online, links, campanhas e afiliados."],
            ["Consigo começar sem configurar tudo?", "Sim. O lançamento cria a base da loja e deixa a publicação sob controlo do vendedor."],
            ["O cliente compra pelo WhatsApp ou site?", "Os dois caminhos funcionam: o cliente pode comprar pela loja digital e a equipa continua no CRM."]
          ].map(([pergunta, resposta]) => (
            <article key={pergunta}>
              <h3>{pergunta}</h3>
              <p>{resposta}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="bizy-home-footer">
        <div className="bizy-footer-main">
          <div className="bizy-footer-brand">
            <LogoBizy />
            <p>CRM comercial para lojas que vendem por WhatsApp, live, catálogo e loja digital.</p>
            <Link className="bizy-btn bizy-btn-primary" to="/login">
              Começar agora
              <ArrowRight size={16} />
            </Link>
          </div>

          <nav aria-label="Produto">
            <strong>Produto</strong>
            <a href="#modulos">Módulos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#pricing">Preços</a>
            <a href="#faq">Dúvidas</a>
          </nav>

          <nav aria-label="Loja digital">
            <strong>Loja digital</strong>
            <span>Perfil público</span>
            <span>Checkout unificado</span>
            <span>Shopping center Bizy</span>
            <span>Catálogos internos</span>
          </nav>

          <div className="bizy-footer-contact">
            <strong>Contacto</strong>
            <span>Luanda, Angola</span>
            <a href="mailto:suporte@bizy.ao">suporte@bizy.ao</a>
            <span>WhatsApp, live e CRM no mesmo fluxo.</span>
          </div>
        </div>

        <div className="bizy-footer-bottom">
          <span>© 2026 Bizy · Luanda, Angola</span>
          <div>
            <a href="#privacidade">Privacidade</a>
            <a href="#termos">Termos</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
