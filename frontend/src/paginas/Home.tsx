import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  Menu,
  MessageCircle,
  Package,
  Radio,
  ReceiptText,
  Smartphone,
  Store,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CTAWithTextMarquee from "@/components/ui/cta-with-text-marquee";
import { FAQSection } from "@/components/ui/faqsection";
import Footer4Col from "@/components/ui/footer-column";
import { HowItWorks } from "@/components/ui/how-it-works";
import { Pricing } from "@/components/ui/single-pricing-card-1";
import {
  Item,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { Marquee } from "@/components/ui/marquee";
import { PROMPT_FONT_FAMILY } from "@/lib/prompt-font";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy, NOME_PRODUTO } from "../marca/bizy";

const MotionDiv = motion.div;
const MotionSection = motion.section;

const modulos = [
  { icone: MessageCircle, titulo: "Atendimento", texto: "Conversas, notas, histórico e reenvio de mensagens no mesmo lugar." },
  { icone: ReceiptText, titulo: "Pedidos", texto: "Reserva, fila, pagamento e expiração com regras de negócio claras." },
  { icone: Package, titulo: "Produtos", texto: "Catálogo pronto para lives, códigos curtos, stock e fotos." },
  { icone: Users, titulo: "Clientes", texto: "Perfil por telefone, username, origem, avatar e comportamento de compra." },
  { icone: BarChart3, titulo: "Operação", texto: "Indicadores que mostram conversão, perdas e oportunidades de recuperação." },
  { icone: Smartphone, titulo: "WhatsApp oficial", texto: "Confirmações, cobranças e suporte pelo número oficial da loja." }
];

const vendedoresAtivos = [
  { iniciais: "MR", nome: "Moda Rosa" },
  { iniciais: "ZA", nome: "Zola Atelier" },
  { iniciais: "KL", nome: "Kia Live" },
  { iniciais: "NA", nome: "Nala Store" },
  { iniciais: "BV", nome: "Bela Veste" }
];

const estatisticasHero = [
  { valor: "200+", label: "comentários organizados", icone: MessageCircle },
  { valor: "10 min", label: "reserva protegida", icone: ReceiptText },
  { valor: "24h", label: "atendimento com contexto", icone: WalletCards },
  { valor: "1 CRM", label: "clientes, pedidos e mensagens", icone: Store }
];

const perguntasOperacao = [
  "Quem pediu o artigo 09 na live?",
  "Qual reserva vence nos próximos 10 minutos?",
  "Que cliente ainda não recebeu WhatsApp?",
  "Qual produto está a vender mais rápido?",
  "Quem mandou comprovativo de pagamento?",
  "Que conversa precisa de resposta agora?",
  "Quais clientes voltaram a comprar?",
  "Qual pedido ficou sem confirmação?",
  "Que artigo precisa de reposição?",
  "Quem comentou número angolano + código?",
  "Qual atendimento está sem responsável?",
  "Que campanha deve ser reenviada?"
];

const featuresSistema = [
  {
    descricao: "O Bizy lê a intenção, liga telefone angolano ao artigo e transforma o comentário em pedido rastreável.",
    icone: MessageCircle,
    titulo: "Comentários sem perda"
  },
  {
    descricao: "Reserva temporária, prazo, pagamento e estado do pedido ficam claros para a equipa e para o cliente.",
    icone: ReceiptText,
    titulo: "Pedidos com regra"
  },
  {
    descricao: "Cada telefone, username, userId, origem e avatar alimenta um perfil único para atendimento e recompra.",
    icone: Users,
    titulo: "Clientes com contexto"
  },
  {
    descricao: "Mensagens oficiais, recuperação de falhas e histórico ficam no mesmo fluxo de atendimento.",
    icone: Smartphone,
    titulo: "WhatsApp oficial"
  }
];

const linksNavegacao = [
  { href: "#onboarding", label: "Conta" },
  { href: "#modulos", label: "Módulos" },
  { href: "#pricing", label: "Preços" },
  { href: "#faq", label: "FAQ" }
];

const faqsBizyLeft = [
  {
    question: "A plataforma envia WhatsApp automaticamente?",
    answer:
      "Sim. O Bizy usa o provider configurado para iniciar mensagens pelo número oficial da loja, com histórico e estado de entrega visíveis na conversa."
  },
  {
    question: "O Bizy substitui o WhatsApp?",
    answer:
      "Não. Ele organiza a operação por cima do WhatsApp: comentários, reservas, clientes, produtos e mensagens ficam conectados no CRM."
  },
  {
    question: "Preciso cadastrar o negócio antes da live?",
    answer:
      "Sim. O cadastro define regras de reserva, canais, pagamento, entrega, equipa e catálogo para que a live comece com dados consistentes."
  },
  {
    question: "Como o sistema entende um pedido no comentário?",
    answer:
      "Ele procura um número angolano e o número do artigo no comentário. Quando encontra intenção de compra, cria a reserva e inicia o atendimento."
  },
  {
    question: "O que acontece quando o envio falha?",
    answer:
      "A falha fica registada, a equipa vê o motivo disponível e pode reenviar. O fluxo foi pensado para recuperação, não para perder o cliente em silêncio."
  }
];

const faqsBizyRight = [
  {
    question: "Consigo usar Gmail, telefone ou login estudantil?",
    answer:
      "Sim. A conta pode começar por telefone, Gmail ou identidade estudantil quando a integração estiver configurada no backend."
  },
  {
    question: "O catálogo precisa ter códigos curtos?",
    answer:
      "Sim. Códigos como 01, 09 ou 012 tornam a captura da live mais rápida e reduzem confusão entre comentário, artigo e reserva."
  },
  {
    question: "O cliente fica cadastrado automaticamente?",
    answer:
      "Sempre que a API entregar dados disponíveis, o Bizy aproveita telefone, nome, username, userId e avatar para enriquecer o perfil do cliente."
  },
  {
    question: "Posso acompanhar reservas e pagamentos?",
    answer:
      "Sim. Reservas, prazo, comprovativo, pagamento e estado do pedido ficam ligados à conversa e ao produto correspondente."
  },
  {
    question: "O preço é por módulo?",
    answer:
      "Não. Os planos dão acesso ao fluxo completo: live, reservas, WhatsApp, catálogo, clientes e relatórios operacionais."
  }
];

function criarMotion(reduzir: boolean): { item: Variants; painel: Variants } {
  return {
    item: reduzir
      ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
      : {
          hidden: { opacity: 0, y: 18 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }
        },
    painel: reduzir
      ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
      : {
          hidden: { opacity: 0, y: 24, scale: 0.98 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] } }
        }
  };
}

export function PaginaHome() {
  const [menuAberto, setMenuAberto] = useState(false);
  const reduzirMovimento = useReducedMotion();
  const motionPreset = useMemo(() => criarMotion(Boolean(reduzirMovimento)), [reduzirMovimento]);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#FBFDF8] text-foreground" style={{ fontFamily: PROMPT_FONT_FAMILY }}>
      <header className="absolute inset-x-0 top-0 z-40 bg-transparent text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link className="flex items-center gap-2 font-bold" to="/">
            <LogoBizy cores={CORES_LOGO_BIZY_ESCURA} />
          </Link>

          <NavigationMenu className="hidden flex-none md:flex">
            <NavigationMenuList className="gap-5 space-x-0 bg-transparent p-0 text-sm font-medium text-white/78 shadow-none">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 rounded-none !bg-transparent px-0 text-sm font-semibold text-white/78 shadow-none hover:bg-transparent hover:text-white data-[state=open]:bg-transparent data-[state=open]:text-white">
                  Produto
                </NavigationMenuTrigger>
                <NavigationMenuContent className="p-0">
                  <div className="grid w-[520px] gap-3 rounded-2xl border bg-white/95 p-4 shadow-[0_24px_70px_rgba(17,24,39,0.14)] backdrop-blur-xl">
                    <div className="rounded-xl bg-primary/10 p-4">
                      <span className="text-xs font-bold uppercase text-primary">Fluxo Bizy</span>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        Comentário, reserva, conversa e pagamento a trabalhar como uma só operação.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {modulos.slice(0, 4).map((item) => {
                        const Icone = item.icone;
                        return (
                          <NavigationMenuLink key={item.titulo} asChild>
                            <a
                              href="#modulos"
                              className="group grid gap-2 rounded-xl p-3 text-left transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                            >
                              <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                                <Icone size={16} className="text-primary" />
                                {item.titulo}
                              </span>
                              <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.texto}</span>
                            </a>
                          </NavigationMenuLink>
                        );
                      })}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              {linksNavegacao.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <a
                      href={item.href}
                      className="inline-flex h-9 items-center rounded-none px-0 text-sm font-semibold text-white/78 transition-colors hover:text-white focus:text-white focus:outline-none"
                    >
                      {item.label}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" className="text-white/88 hover:bg-white/10 hover:text-white">
              <Link to="/login" style={{ color: "#ffffff" }}>Entrar</Link>
            </Button>
            <Button asChild className="rounded-full bg-white px-4 text-[#111111] shadow-[0_10px_28px_rgba(0,0,0,0.22)] hover:bg-white/92">
              <Link to="/login" style={{ color: "#111111" }}>
                Criar conta
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>

          <Button className="border-white/20 bg-white/10 text-white hover:bg-white/15 md:hidden" variant="outline" size="icon-lg" onClick={() => setMenuAberto((valor) => !valor)} aria-label="Abrir menu">
            {menuAberto ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {menuAberto && (
          <div className="border-t border-white/10 bg-black/72 p-4 text-white backdrop-blur-xl md:hidden">
            <nav className="grid gap-2">
              {[{ href: "#produto", label: "Produto" }, ...linksNavegacao].map(({ href, label }) => (
                <a key={href} className="rounded-xl px-3 py-2 text-sm font-semibold text-white/86 hover:bg-white/10 hover:text-white" href={href} onClick={() => setMenuAberto(false)}>
                  {label}
                </a>
              ))}
              <Button asChild className="mt-2 bg-white text-[#111111] hover:bg-white/92">
                <Link to="/login" style={{ color: "#111111" }}>Criar conta</Link>
              </Button>
            </nav>
          </div>
        )}
      </header>

      <LiveCommerceHero motionPreset={motionPreset} />

      <HowItWorks />

      <BizyFeaturesSection />

      <Pricing />

      <section className="border-y border-[#d8ff72]/20 bg-[#06100d] text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-2">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              <GraduationCap size={14} />
              Login estudantil incluído
            </Badge>
            <h2 className="text-3xl font-medium tracking-tight" style={{ color: "#ffffff", fontFamily: PROMPT_FONT_FAMILY }}>Quem vem da UOR ou ISPTEC entra com a identidade académica.</h2>
            <p className="max-w-2xl text-sm leading-6" style={{ color: "rgb(255 255 255 / 0.72)" }}>
              O Bizy aproveita dados confiáveis quando disponíveis, mas separa perfil pessoal dos dados comerciais da loja.
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            {["Telefone", "Gmail", "UOR/ISPTEC"].map((item) => (
              <Item key={item} className="border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15">
                <ItemMedia className="size-7 bg-success/20 text-success">
                  <CheckCircle2 size={16} />
                </ItemMedia>
                <ItemTitle className="text-white">{item}</ItemTitle>
              </Item>
            ))}
          </div>
        </div>
      </section>

      <CTAWithTextMarquee />

      <FAQSection
        buttonLabel="Ver preços"
        description="Tudo que uma loja precisa saber antes de ligar comentários, reservas e WhatsApp num fluxo único de atendimento."
        faqsLeft={faqsBizyLeft}
        faqsRight={faqsBizyRight}
        id="faq"
        onButtonClick={() => document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" })}
        subtitle="Perguntas frequentes"
        title="Suporte do produto Bizy"
      />

      <Footer4Col />
    </main>
  );
}

function AvatarStack() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {vendedoresAtivos.map((vendedor, index) => (
          <Avatar
            aria-label={vendedor.nome}
            className="h-12 w-12 border-2 border-[#d8ff72] bg-neutral-800 shadow-[0_10px_22px_rgba(0,0,0,0.22)]"
            key={vendedor.iniciais}
            style={{ zIndex: vendedoresAtivos.length - index }}
          >
            <AvatarFallback className="bg-neutral-700 text-xs font-black text-white">
              {vendedor.iniciais}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="max-w-44 text-xs font-semibold leading-5 text-white/75">
        Lojas em live a vender com atendimento organizado.
      </span>
    </div>
  );
}

function BizyFeaturesSection() {
  const primeiraLinha = perguntasOperacao.slice(0, perguntasOperacao.length / 3);
  const segundaLinha = perguntasOperacao.slice(perguntasOperacao.length / 3, (perguntasOperacao.length / 3) * 2);
  const terceiraLinha = perguntasOperacao.slice((perguntasOperacao.length / 3) * 2);

  const linhas = [
    { dados: primeiraLinha, duracao: "44s", reverse: false },
    { dados: segundaLinha, duracao: "52s", reverse: true },
    { dados: terceiraLinha, duracao: "42s", reverse: false }
  ];

  return (
    <section
      id="modulos"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#06100d_0%,#0d1512_52%,#050706_100%)] pt-20 text-white sm:pt-32"
    >
      <div className="mx-auto max-w-full">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center space-y-4 px-5 text-center md:px-10">
          <Badge className="rounded-none border-[#d8ff72]/30 bg-[#d8ff72]/10 px-3 py-1.5 text-[#d8ff72] hover:bg-[#d8ff72]/10" variant="outline">
            Operação diária
          </Badge>
          <h2
            className="max-w-3xl text-3xl font-medium leading-[1.05] tracking-normal sm:text-4xl lg:text-5xl"
            style={{ color: "#ffffff", fontFamily: PROMPT_FONT_FAMILY }}
          >
            Removendo o ruído entre comentário, pedido e <span className="text-[#d8ff72]">atendimento</span>.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-white/72 md:text-lg">
            O Bizy filtra o caos da live, mostra o que importa e entrega uma base operacional para vender com contexto,
            prazo e relacionamento.
          </p>

          <div className="relative mx-auto max-w-3xl overflow-hidden pt-3">
            <div className="absolute left-0 z-10 h-full w-20 bg-[linear-gradient(to_right,#06100d,transparent)]" />
            <div className="absolute right-0 z-10 h-full w-20 bg-[linear-gradient(to_left,#06100d,transparent)]" />

            <div className="-mx-6 flex w-screen flex-col gap-2 md:-mx-10 lg:-mx-16">
              {linhas.map((linha) => (
                <Marquee
                  className="[--gap:0.75rem]"
                  key={linha.duracao}
                  repeat={4}
                  reverse={linha.reverse}
                  style={{ "--duration": linha.duracao } as CSSProperties}
                >
                  {linha.dados.map((pergunta) => (
                    <Badge
                      className="h-auto rounded-none border-[#26372f] bg-[#16231d] px-3 py-1.5 text-[0.78rem] font-semibold text-[#d8ff72] hover:bg-[#16231d]"
                      key={pergunta}
                      variant="outline"
                    >
                      {pergunta}
                    </Badge>
                  ))}
                </Marquee>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 divide-dashed divide-[#d8ff72]/25 border-y border-dashed border-[#d8ff72]/25 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {featuresSistema.map((feature) => {
            const Icone = feature.icone;
            return (
              <div
                className="flex flex-col gap-5 border-b border-dashed border-[#d8ff72]/25 px-5 py-8 last:border-b-0 sm:border-b-0 lg:px-6 lg:py-10"
                key={feature.titulo}
              >
                <Icone className="size-12 text-[#d8ff72]" strokeWidth={1.6} />

                <div className="flex flex-col gap-2 pt-10 lg:pt-20">
                  <h3 className="text-2xl font-medium tracking-tight sm:text-3xl" style={{ color: "#ffffff", fontFamily: PROMPT_FONT_FAMILY }}>
                    {feature.titulo}
                  </h3>
                  <p className="leading-relaxed text-white/70">{feature.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatsMarquee() {
  return (
    <Marquee
      className="w-full border-y border-white/15 bg-black/30 py-2 backdrop-blur-sm [--duration:30s] [--gap:2rem]"
      pauseOnHover
      repeat={4}
    >
      {estatisticasHero.map((stat) => {
        const Icone = stat.icone;
        return (
          <div className="flex items-center gap-3 whitespace-nowrap" key={stat.label}>
            <Icone className="text-[#d8ff72]" size={16} />
            <span className="font-mono text-sm font-black tracking-wide text-[#d8ff72]">{stat.valor}</span>
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              {stat.label}
            </span>
          </div>
        );
      })}
    </Marquee>
  );
}

function LiveCommerceHero({ motionPreset }: { motionPreset: ReturnType<typeof criarMotion> }) {
  return (
    <MotionSection
      animate="visible"
      className="relative flex min-h-[100svh] w-full flex-col items-start justify-end overflow-hidden border-b border-black/10 bg-black text-white"
      id="produto"
      initial="hidden"
      style={{ fontFamily: PROMPT_FONT_FAMILY }}
    >
      <img
        alt="Jovem empreendedora em live no TikTok vendendo roupas com comentarios e reservas no Bizy"
        className="absolute inset-0 h-full w-full object-cover object-[52%_center]"
        decoding="async"
        src="/bizy-live-commerce-hero.png"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.28)_48%,rgba(0,0,0,0.12)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.08)_56%,rgba(0,0,0,0.28)_100%)]" />

      <div className="relative z-10 w-full max-w-4xl px-4 text-white sm:px-8 lg:px-16">
        <MotionDiv className="space-y-4" variants={motionPreset.item}>
          <AvatarStack />
          <StatsMarquee />
        </MotionDiv>
      </div>

      <div className="relative z-10 w-full px-4 pb-16 pt-6 sm:px-8 sm:pb-24 lg:px-16 lg:pb-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <MotionDiv className="w-full space-y-4 sm:w-1/2" variants={motionPreset.item}>
            <Badge className="w-fit gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-white shadow-sm backdrop-blur-sm hover:bg-black/20">
              <Radio size={14} />
              CRM para vendas em live e WhatsApp
            </Badge>
            <h1
              className="text-3xl font-medium leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
              style={{ color: "#ffffff", fontFamily: PROMPT_FONT_FAMILY, textShadow: "0 4px 28px rgb(0 0 0 / 0.48)" }}
            >
              Vende na <span className="text-[#d8ff72]">live</span>. O{" "}
              <span className="text-[#d8ff72]">{NOME_PRODUTO}</span> cuida do pedido, da conversa e do cliente.
            </h1>
            <div className="flex">
              <Button asChild size="lg" className="h-12 !rounded-none bg-white py-0 pl-5 pr-0 text-lg font-normal text-black hover:bg-white/95">
                <Link style={{ borderRadius: 0, color: "#111111", fontFamily: PROMPT_FONT_FAMILY }} to="/login">
                  <span style={{ color: "#111111" }}>Criar conta operacional</span>
                  <span className="ml-4 grid h-12 w-12 place-items-center border-l border-neutral-500/40" style={{ color: "#111111" }}>
                    <ArrowRight size={20} aria-hidden="true" />
                  </span>
                </Link>
              </Button>
            </div>
          </MotionDiv>

          <MotionDiv className="w-full sm:w-1/2" variants={motionPreset.painel}>
            <p
              className="text-base font-medium italic leading-7 text-[#d8ff72] sm:text-right md:text-2xl md:leading-9"
              style={{ fontFamily: PROMPT_FONT_FAMILY }}
            >
              Comentários viram reservas, reservas viram conversas e cada conversa fica ligada ao produto, pagamento e histórico do cliente.
            </p>
          </MotionDiv>
        </div>
      </div>
    </MotionSection>
  );
}
