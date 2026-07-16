import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Link2,
  MessageCircle,
  ShieldCheckIcon,
  ShoppingBag,
  Users
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Badge } from "./badge";
import { Button } from "./button";
import { PROMPT_FONT_FAMILY } from "@/lib/prompt-font";

const inclusos = [
  { texto: "Team: clientes, operação e finanças", icone: Users },
  { texto: "Market: loja, carrinho e checkout", icone: ShoppingBag },
  { texto: "Learning: programas e comunidade", icone: BookOpen },
  { texto: "Creators, Smart Links e atribuição", icone: Link2 }
];

const planos = [
  {
    nome: "Mensal",
    etiqueta: "Teste controlado",
    descricao: "Para centralizar operação, vendas e atendimento sem compromisso longo.",
    preco: "24 900",
    periodo: "/mês",
    detalhe: "cancela quando quiseres",
    cta: "Começar mensal",
    destaque: false,
    beneficios: ["Núcleo Team e ContaBizy", "Loja, catálogo e stock", "Market e checkout unificado"]
  },
  {
    nome: "Anual",
    etiqueta: "-33%",
    descricao: "Melhor valor para equipas que querem operar o ecossistema com previsibilidade.",
    preco: "19 900",
    periodo: "/mês",
    detalhe: "238 800 Kz cobrados por ano",
    cta: "Escolher anual",
    destaque: true,
    beneficios: ["Canais, creators e atribuição", "Learning, relatórios e recuperação", "Setup assistido da primeira operação"]
  }
];

export function Pricing() {
  return (
    <section className="bizy-home-section bizy-pricing-section" id="pricing" style={{ fontFamily: PROMPT_FONT_FAMILY }}>
      <div className="bizy-section-head">
        <span>Preços em Kwanza</span>
        <h2>Um preço simples para <em>crescer</em></h2>
        <p>Team, Market e Learning partilham a mesma base operacional. Escolhe o ciclo de cobrança sem reconstruir a operação.</p>
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
            <strong>Feito para operação comercial em Angola</strong>
            <p>Kwanza, telefone angolano, venda social e checkout no mesmo fluxo.</p>
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
          Contrato simples e módulos activados no mesmo contexto de negócio.
        </p>
      </div>
    </section>
  );
}
