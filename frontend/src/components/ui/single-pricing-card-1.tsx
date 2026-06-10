import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageCircle,
  ShieldCheckIcon,
  ShoppingBag,
  Store,
  Users
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Badge } from "./badge";
import { Button } from "./button";
import { PROMPT_FONT_FAMILY } from "@/lib/prompt-font";

const inclusos = [
  { texto: "Loja online, catálogo digital e stock", icone: Store },
  { texto: "Pedidos de WhatsApp, live, site e links", icone: ShoppingBag },
  { texto: "CRM de clientes com histórico e origem", icone: Users },
  { texto: "Relatórios, recuperação e afiliados", icone: BarChart3 }
];

const planos = [
  {
    nome: "Mensal",
    etiqueta: "Teste controlado",
    descricao: "Para organizar vendas, atendimento e catálogo sem compromisso longo.",
    preco: "24 900",
    periodo: "/mês",
    detalhe: "cancela quando quiseres",
    cta: "Começar mensal",
    destaque: false,
    beneficios: ["Todas as funções incluídas", "Loja online, catálogo e stock", "WhatsApp e checkout unificado"]
  },
  {
    nome: "Anual",
    etiqueta: "-33%",
    descricao: "Melhor valor para equipas multicanal que querem previsibilidade e setup assistido.",
    preco: "19 900",
    periodo: "/mês",
    detalhe: "238 800 Kz cobrados por ano",
    cta: "Escolher anual",
    destaque: true,
    beneficios: ["Pedidos de WhatsApp, live e site", "Afiliados, relatórios e recuperação", "Setup assistido da primeira loja"]
  }
];

export function Pricing() {
  return (
    <section className="bizy-home-section bizy-pricing-section" id="pricing" style={{ fontFamily: PROMPT_FONT_FAMILY }}>
      <div className="bizy-section-head">
        <span>Preços em Kwanza</span>
        <h2>Um preço simples para <em>crescer</em></h2>
        <p>Sistema completo, sem módulos soltos nem taxas escondidas. A loja entra com catálogo, pedidos, clientes e checkout no mesmo CRM.</p>
      </div>

      <motion.div
        className="bizy-price-grid"
        initial={{ opacity: 0.94, y: 14 }}
        transition={{ duration: 0.52, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        {planos.map((plano) => (
          <article className={plano.destaque ? "bizy-plan bizy-plan-featured" : "bizy-plan"} key={plano.nome}>
            <div className="bizy-plan-topline">
              <div>
                <div className="bizy-plan-head">
                  <span>{plano.nome}</span>
                  <Badge className={plano.destaque ? "bizy-plan-badge is-featured" : "bizy-plan-badge"} variant="outline">
                    {plano.etiqueta}
                  </Badge>
                </div>
                <p>{plano.descricao}</p>
              </div>
            </div>

            <div className="bizy-price">
              <small>Kz</small>
              <strong>{plano.preco}</strong>
              <span>{plano.periodo}</span>
            </div>
            <p className="bizy-plan-note">{plano.detalhe}</p>

            <ul>
              {plano.beneficios.map((beneficio) => (
                <li key={beneficio}>
                  <CheckCircle2 size={15} />
                  {beneficio}
                </li>
              ))}
            </ul>

            <Button asChild className={plano.destaque ? "bizy-btn bizy-btn-lime" : "bizy-btn bizy-btn-ghost"} variant={plano.destaque ? "default" : "outline"}>
              <Link to="/login">
                {plano.cta}
                {plano.destaque ? <ArrowRight size={16} /> : null}
              </Link>
            </Button>
          </article>
        ))}
      </motion.div>

      <div className="bizy-pricing-assurance">
        <div className="bizy-pricing-proof">
          <span><MessageCircle size={17} /></span>
          <div>
            <strong>Feito para venda social em Angola</strong>
            <p>WhatsApp, live, loja digital, pedidos e clientes no mesmo fluxo.</p>
          </div>
        </div>

        <div className="bizy-pricing-included" aria-label="Funcionalidades incluídas nos planos">
          {inclusos.map((item) => {
            const Icone = item.icone;
            return (
              <span key={item.texto}>
                <Icone size={15} />
                {item.texto}
              </span>
            );
          })}
        </div>

        <p>
          <ShieldCheckIcon size={15} />
          Acesso a todas as funções principais, sem taxa escondida.
        </p>
      </div>
    </section>
  );
}
