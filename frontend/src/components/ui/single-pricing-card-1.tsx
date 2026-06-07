import { CheckCircle2, PlusIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Badge } from "./badge";
import { BorderTrail } from "./border-trail";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { PROMPT_FONT_FAMILY } from "@/lib/prompt-font";

const beneficios = [
  "Loja online, catálogo digital e stock",
  "Pedidos vindos de WhatsApp, live, site e links",
  "CRM de clientes com histórico e origem",
  "Afiliados, campanhas, relatórios e recuperação"
];

const planos = [
  {
    nome: "Mensal",
    descricao: "Para lojas que querem organizar vendas, atendimento e catálogo sem compromisso longo.",
    preco: "24 900 Kz",
    periodo: "/mês",
    precoAnterior: "29 900 Kz",
    desconto: "teste controlado",
    cta: "Escolher mensal",
    destaque: false
  },
  {
    nome: "Anual",
    descricao: "Melhor valor para equipas que vendem em vários canais e querem previsibilidade.",
    preco: "19 900 Kz",
    periodo: "/mês",
    precoAnterior: "24 900 Kz",
    desconto: "20% off",
    cta: "Escolher anual",
    destaque: true,
    nota: "238 800 Kz cobrados por ano"
  }
];

export function Pricing() {
  return (
    <section className="relative overflow-hidden bg-[#050706] py-16 text-white sm:py-24" style={{ fontFamily: PROMPT_FONT_FAMILY }}>
      <div id="pricing" className="mx-auto w-full max-w-6xl space-y-8 px-4">
        <motion.div
          className="mx-auto max-w-2xl space-y-5"
          initial={{ opacity: 0.92, y: 12 }}
          transition={{ duration: 0.48, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center">
            <div className="border border-[#d8ff72]/35 bg-[#d8ff72]/10 px-4 py-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ff72]">
              Preços em Kwanza
            </div>
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <span style={{ color: "#ffffff", fontFamily: PROMPT_FONT_FAMILY }}>Um preço simples para vender, atender e crescer.</span>
          </h2>
          <p className="mx-auto max-w-xl text-center text-sm leading-6 text-white/68 sm:text-base">
            O Bizy cobra pelo sistema completo, não por pequenos módulos soltos. A equipa publica produtos, vende, atende clientes e acompanha resultados no mesmo CRM.
          </p>
        </motion.div>

        <div className="relative">
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0",
              "bg-[linear-gradient(to_right,rgba(216,255,114,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(216,255,114,0.12)_1px,transparent_1px)]",
              "bg-[size:32px_32px]",
              "[mask-image:radial-gradient(ellipse_at_center,#000_0%,transparent_72%)]"
            )}
          />

          <motion.div
            className="relative mx-auto w-full max-w-3xl space-y-4"
            initial={{ opacity: 0.94, y: 12 }}
            transition={{ duration: 0.48, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="relative grid border border-[#d8ff72]/25 bg-[#07100d]/92 p-3 shadow-[0_32px_100px_rgba(0,0,0,0.32)] backdrop-blur md:grid-cols-2">
              <PlusIcon className="absolute -left-3 -top-3 size-5 text-[#d8ff72]" />
              <PlusIcon className="absolute -right-3 -top-3 size-5 text-[#d8ff72]" />
              <PlusIcon className="absolute -bottom-3 -left-3 size-5 text-[#d8ff72]" />
              <PlusIcon className="absolute -bottom-3 -right-3 size-5 text-[#d8ff72]" />

              {planos.map((plano) => (
                <div
                  className={cn(
                    "relative w-full px-4 py-5",
                    plano.destaque && "border border-[#d8ff72]/40 bg-[#d8ff72]/[0.06] shadow-[inset_0_0_0_1px_rgba(216,255,114,0.08)]"
                  )}
                  key={plano.nome}
                >
                  {plano.destaque && (
                    <BorderTrail
                      className="bg-[#d8ff72]"
                      size={90}
                      style={{
                        boxShadow:
                          "0 0 40px 16px rgba(216,255,114,0.28), 0 0 88px 38px rgba(120,214,75,0.18)"
                      }}
                    />
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold leading-none text-white" style={{ color: "#ffffff", fontFamily: PROMPT_FONT_FAMILY }}>
                        {plano.nome}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/45 line-through">{plano.precoAnterior}</span>
                        <Badge className={plano.destaque ? "bg-[#d8ff72] text-[#06100d] hover:bg-[#d8ff72]" : "border-[#d8ff72]/25 bg-white/8 text-white hover:bg-white/8"} variant={plano.destaque ? "default" : "outline"}>
                          {plano.desconto}
                        </Badge>
                      </div>
                    </div>
                    <p className="min-h-[48px] text-sm leading-6 text-white/62">{plano.descricao}</p>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-end gap-1 text-xl text-white/62">
                      <span className="-translate-y-1 text-base font-semibold">Kz</span>
                      <span className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                        {plano.preco.replace(" Kz", "")}
                      </span>
                      <span>{plano.periodo}</span>
                    </div>
                    {plano.nota && <p className="text-xs font-semibold text-[#d8ff72]">{plano.nota}</p>}
                    <Button
                      asChild
                      className={cn(
                        "h-11 w-full rounded-none",
                        plano.destaque
                          ? "bg-[#d8ff72] text-[#06100d] hover:bg-[#c9ef62]"
                          : "border-[#d8ff72]/35 bg-transparent text-white hover:bg-[#d8ff72]/10 hover:text-white"
                      )}
                      variant={plano.destaque ? "default" : "outline"}
                    >
                      <Link style={{ color: plano.destaque ? "#06100d" : "#ffffff" }} to="/login">
                        {plano.cta}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center gap-3 text-sm text-white/62 sm:flex-row">
              <span className="inline-flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-[#d8ff72]" />
                Acesso a todas as funções, sem taxa escondida.
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-white/25 sm:block" />
              <span>Setup assistido para primeira loja e canais incluído.</span>
            </div>

            <div className="grid gap-2 text-sm text-white/72 sm:grid-cols-2">
              {beneficios.map((beneficio) => (
                <span className="inline-flex items-start gap-2" key={beneficio}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#d8ff72]" />
                  {beneficio}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
