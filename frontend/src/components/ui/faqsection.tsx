"use client";

import type React from "react";
import { ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PROMPT_FONT_FAMILY } from "@/lib/prompt-font";
import { cn } from "@/lib/utils";

type FAQItem = {
  question: string;
  answer: string;
};

interface FAQSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  faqsLeft: FAQItem[];
  faqsRight: FAQItem[];
}

export function FAQSection({
  title = "Product & Account Help",
  subtitle = "Frequently Asked Questions",
  description = "Get instant answers to the most common questions about your account, product setup, and updates.",
  buttonLabel = "Browse All FAQs →",
  onButtonClick,
  faqsLeft,
  faqsRight,
  className,
  style,
  ...props
}: FAQSectionProps) {
  const textoBotao = buttonLabel.replace(/\s*→\s*$/, "");

  return (
    <section
      className={cn("mx-auto w-full max-w-5xl px-4 py-16", className)}
      style={{ ...style, fontFamily: PROMPT_FONT_FAMILY }}
      {...props}
    >
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-medium tracking-wide text-muted-foreground">{subtitle}</p>
        <h2 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: "var(--text-title)", fontFamily: PROMPT_FONT_FAMILY }}>
          {title}
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-muted-foreground">{description}</p>
        <Button
          className="justify-center gap-2 rounded-full bg-[#166534] px-5 text-white shadow-[0_12px_28px_rgba(22,101,52,0.22)] hover:bg-[#14532d]"
          onClick={onButtonClick}
          style={{ fontFamily: PROMPT_FONT_FAMILY }}
          type="button"
          variant="default"
        >
          {textoBotao}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-2">
        {[faqsLeft, faqsRight].map((faqColumn, columnIndex) => (
          <Accordion className="space-y-4" collapsible key={columnIndex} type="single">
            {faqColumn.map((faq, index) => (
              <AccordionItem className="border-b border-border/70" key={faq.question} value={`item-${columnIndex}-${index}`}>
                <AccordionTrigger className="py-4 text-center text-base font-medium hover:no-underline">
                  <span className="flex-1 text-center">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-center text-sm leading-relaxed text-muted-foreground">
                  <div className="mx-auto min-h-10 max-w-md text-center transition-all duration-200 ease-in-out">{faq.answer}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
      </div>
    </section>
  );
}
