import {
  Dribbble,
  Facebook,
  Github,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Twitter,
  type LucideIcon
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy, NOME_PRODUTO } from "@/marca/bizy";

const dadosFooter = {
  empresa: {
    nome: NOME_PRODUTO,
    descricao:
      "CRM+ para lojas, criadores e afiliados venderem por WhatsApp, live, catálogo e loja online com pedidos, stock, clientes e relatórios no mesmo lugar."
  },
  contacto: {
    email: "suporte@bizy.ao",
    telefone: "+244 923 456 789",
    endereco: "Luanda, Angola"
  }
};

const linksSociais: Array<{ icon: LucideIcon; label: string; href: string }> = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/bizy.ao" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/bizy.ao" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/bizy_ao" },
  { icon: Github, label: "GitHub", href: "https://github.com/carlosromaodev" },
  { icon: Dribbble, label: "Dribbble", href: "https://dribbble.com/bizy" }
];

const produtoLinks = [
  { text: "Loja e catálogo", href: "/app/catalogo" },
  { text: "Pedidos", href: "/app/reservas" },
  { text: "WhatsApp", href: "/app/conversas" },
  { text: "Clientes CRM", href: "/app/clientes" }
];

const operacaoLinks = [
  { text: "Afiliados", href: "/app/afiliados" },
  { text: "Pagamentos", href: "/app/reservas" },
  { text: "Campanhas", href: "/app/campanhas" },
  { text: "Relatórios", href: "/app/relatorios" }
];

const suporteLinks = [
  { text: "FAQ", href: "#faq" },
  { text: "Atendimento WhatsApp", href: "/app/conversas", hasIndicator: true },
  { text: "Criar loja", href: "/onboarding" },
  { text: "Conexão WhatsApp", href: "/app/whatsapp" }
];

const contactoInfo: Array<{ icon: LucideIcon; text: string; href: string; isAddress?: boolean }> = [
  { icon: Mail, text: dadosFooter.contacto.email, href: `mailto:${dadosFooter.contacto.email}` },
  { icon: Phone, text: dadosFooter.contacto.telefone, href: "tel:+244923456789" },
  {
    icon: MapPin,
    text: dadosFooter.contacto.endereco,
    href: "https://maps.google.com/?q=Luanda%2C%20Angola",
    isAddress: true
  }
];

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const className = "text-white/64 transition-colors hover:text-[#d8ff72] focus-visible:text-[#d8ff72] focus-visible:outline-none";

  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a className={className} href={href} rel="noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>
        {children}
      </a>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  );
}

function FooterColumn({
  title,
  links
}: {
  title: string;
  links: Array<{ text: string; href: string; hasIndicator?: boolean }>;
}) {
  return (
    <div className="min-w-0 text-left">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8ff72]">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(({ text, href, hasIndicator }) => (
          <li key={text}>
            <FooterLink href={href}>
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                {text}
                {hasIndicator && (
                  <span aria-hidden="true" className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d8ff72] opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#d8ff72]" />
                  </span>
                )}
              </span>
            </FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer4Col() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-[#d8ff72]/20 bg-[#050706] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#d8ff72,transparent)] opacity-70" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1.95fr]">
          <div>
            <Link className="inline-flex items-center gap-3 text-white focus-visible:outline-none" to="/">
              <LogoBizy cores={CORES_LOGO_BIZY_ESCURA} className="h-10 w-auto" />
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/62">{dadosFooter.empresa.descricao}</p>

            <ul className="mt-5 flex flex-wrap gap-3">
              {linksSociais.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    aria-label={label}
                    className="grid size-10 place-items-center border border-white/12 bg-white/[0.06] text-white/72 transition-colors hover:border-[#d8ff72]/50 hover:bg-[#d8ff72]/12 hover:text-[#d8ff72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8ff72]"
                    href={href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <FooterColumn links={produtoLinks} title="Produto" />
            <FooterColumn links={operacaoLinks} title="Operação" />
            <FooterColumn links={suporteLinks} title="Suporte" />

            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8ff72]">Contacto</p>
              <ul className="mt-4 space-y-3 text-sm">
                {contactoInfo.map(({ icon: Icon, text, href, isAddress }) => (
                  <li key={text}>
                    <a
                      className="flex items-start gap-2.5 text-white/64 transition-colors hover:text-[#d8ff72] focus-visible:text-[#d8ff72] focus-visible:outline-none"
                      href={href}
                      rel="noreferrer"
                      target={href.startsWith("http") ? "_blank" : undefined}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-[#d8ff72]" />
                      {isAddress ? <address className="not-italic">{text}</address> : <span>{text}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/52 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 {dadosFooter.empresa.nome}. Todos os direitos reservados.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <FooterLink href="#faq">Privacidade</FooterLink>
            <FooterLink href="#faq">Termos</FooterLink>
            <FooterLink href="/app/whatsapp">
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="size-4 text-[#d8ff72]" />
                Estado do WhatsApp
              </span>
            </FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
