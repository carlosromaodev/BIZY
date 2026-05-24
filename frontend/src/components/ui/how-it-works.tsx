import { CheckCircle2, MessageCircle, Radio, Store } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";
import { PROMPT_FONT_FAMILY } from "@/lib/prompt-font";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

interface StepCardProps {
  icon: React.ReactNode;
  index: number;
  title: string;
  description: string;
  benefits: string[];
}

const stepsData = [
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Criar conta com contexto",
    description:
      "O vendedor entra com telefone, Gmail ou login estudantil e o Bizy separa a identidade pessoal dos dados comerciais da loja.",
    benefits: [
      "Verificação por código, OAuth ou identidade académica",
      "Perfil pronto para equipa, permissões e histórico",
      "Base limpa para associar clientes, reservas e mensagens"
    ]
  },
  {
    icon: <Store className="h-6 w-6" />,
    title: "Cadastrar negócio e catálogo",
    description:
      "A loja informa segmento, canais, métodos de pagamento, regras de reserva, entrega e produtos que entram nas lives.",
    benefits: [
      "Artigos com código curto, preço, stock e foto",
      "Reserva temporária configurada por regra da operação",
      "Dados de pagamento e entrega preparados antes da live"
    ]
  },
  {
    icon: <Radio className="h-6 w-6" />,
    title: "Atender a live no CRM",
    description:
      "Comentários com telefone angolano e número do artigo viram pedidos, conversas WhatsApp e perfis de clientes com contexto.",
    benefits: [
      "Comentários convertidos em reservas rastreáveis",
      "WhatsApp oficial com reenvio e recuperação de falhas",
      "Histórico do cliente ligado a produto, pedido e pagamento"
    ]
  }
];

function StepCard({ icon, index, title, description, benefits }: StepCardProps) {
  return (
    <article
      className={cn(
        "group relative min-h-full rounded-lg border border-[#d9ded8] bg-white p-4 text-[#06100d] shadow-[0_18px_60px_rgba(6,16,13,0.06)] transition-all duration-300 ease-out sm:p-5",
        "hover:-translate-y-1 hover:border-[#7fb342] hover:bg-[#fbfff2] hover:shadow-[0_24px_80px_rgba(6,16,13,0.12)]"
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#06100d] text-[#d8ff72] shadow-[0_12px_28px_rgba(6,16,13,0.2)] sm:h-12 sm:w-12">
          {icon}
        </div>
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#72806f]">
          Etapa {String(index).padStart(2, "0")}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-tight tracking-tight sm:text-xl" style={{ fontFamily: PROMPT_FONT_FAMILY }}>{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#53615a] md:min-h-[84px]">{description}</p>

      <ul className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
        {benefits.map((benefit) => (
          <li className="flex items-start gap-3" key={benefit}>
            <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d8ff72]/35 ring-1 ring-[#7fb342]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#245c2c]" />
            </span>
            <span className="text-sm leading-5 text-[#53615a]">{benefit}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function HowItWorks({ className, id = "onboarding", ...props }: HowItWorksProps) {
  return (
    <section
      id={id}
      className={cn("w-full overflow-hidden border-y border-[#d8ff72]/35 bg-[#FBFDF8] py-10 sm:py-20", className)}
      {...props}
      style={{ ...props.style, fontFamily: PROMPT_FONT_FAMILY }}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-8 max-w-4xl text-center sm:mb-12">
          <p className="mx-auto mb-4 w-fit border border-[#c5df75] bg-[#f1ffd0] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#23491f]">
            Primeiro acesso
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#06100d] sm:text-4xl" style={{ fontFamily: PROMPT_FONT_FAMILY, color: "#06100d" }}>
            Como o Bizy começa a vender contigo
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#53615a] sm:mt-4 sm:text-lg sm:leading-7">
            O onboarding deixa de ser só cadastro: ele monta a base operacional para transformar live, WhatsApp,
            catálogo e atendimento num CRM de loja.
          </p>
        </div>

        <div className="relative mx-auto mb-5 w-full max-w-4xl sm:mb-8">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 hidden h-px w-[66.6667%] -translate-y-1/2 bg-[#b9c8b4] md:block"
          />
          <div className="relative grid grid-cols-3">
            {stepsData.map((step, index) => (
              <div
                aria-label={`Etapa ${index + 1}: ${step.title}`}
                className="flex h-9 w-9 items-center justify-center justify-self-center rounded-full border border-[#c5df75] bg-[#06100d] font-mono text-sm font-semibold text-[#d8ff72] ring-4 ring-[#FBFDF8]"
                key={step.title}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
          {stepsData.map((step, index) => (
            <StepCard
              benefits={step.benefits}
              description={step.description}
              icon={step.icon}
              index={index + 1}
              key={step.title}
              title={step.title}
            />
          ))}
        </div>

        <div className="mx-auto mt-5 flex max-w-4xl flex-col gap-3 border border-[#d9ded8] bg-white px-4 py-4 text-sm text-[#53615a] shadow-[0_18px_60px_rgba(6,16,13,0.05)] sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-[#06100d]">Resultado esperado</span>
          <span className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#245c2c]" />
            Comentários, reservas, WhatsApp e clientes ligados desde o primeiro dia.
          </span>
        </div>
      </div>
    </section>
  );
}
