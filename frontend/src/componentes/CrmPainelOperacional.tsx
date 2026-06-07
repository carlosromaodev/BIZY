import type { ReactNode } from "react";
import { ArrowRight, CalendarClock, ClipboardCheck, Command, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TomCrmPlus = "neutro" | "info" | "sucesso" | "atencao" | "perigo";

export interface SinalCrmPlus {
  detalhe?: string;
  rotulo: string;
  tom?: TomCrmPlus;
  valor: string;
}

export interface AcaoCrmPlus {
  detalhe: string;
  destino?: string;
  icone?: ReactNode;
  prioridade?: "alta" | "media" | "baixa";
  rotuloAcao?: string;
  titulo: string;
}

export interface AtributoCrmPlus {
  detalhe?: string;
  rotulo: string;
  tom?: TomCrmPlus;
  valor: string;
}

export function CrmPainelOperacional({
  acoes = [],
  atalhoAtivo,
  atributos = [],
  className,
  modulo,
  proximaAcao,
  sinais = [],
  subtitulo,
  titulo
}: {
  acoes?: AcaoCrmPlus[];
  atalhoAtivo: string;
  atributos?: AtributoCrmPlus[];
  className?: string;
  modulo: string;
  proximaAcao: AcaoCrmPlus;
  sinais?: SinalCrmPlus[];
  subtitulo?: string;
  titulo: string;
}) {
  const indicadores = sinais.slice(0, 4);
  const resumo = atributos.slice(0, 4);
  const acoesVisiveis = acoes.slice(0, 3);

  return (
    <section className={cn("crm-plus-command", className)} aria-label={`Painel operacional ${modulo}`}>
      <div className="crm-plus-command-main">
        <div className="crm-plus-command-kicker">
          <ClipboardCheck size={14} />
          <span>{modulo}</span>
        </div>

        <div className="crm-plus-command-head">
          <div className="min-w-0">
            <h2 className="crm-plus-command-title">{titulo}</h2>
            {subtitulo && <p className="crm-plus-command-subtitle">{subtitulo}</p>}
          </div>
          <div className="crm-plus-shortcut" title="Comando rápido">
            <Command size={14} />
            <span>{atalhoAtivo}</span>
          </div>
        </div>

        <article className={cn("crm-plus-next", `crm-plus-next--${proximaAcao.prioridade ?? "media"}`)}>
          <span className="crm-plus-next-icon">
            {proximaAcao.icone ?? <ListChecks size={16} />}
          </span>
          <div className="min-w-0">
            <p className="crm-plus-next-label">Ação prioritária</p>
            <h3>{proximaAcao.titulo}</h3>
            <p>{proximaAcao.detalhe}</p>
          </div>
          {proximaAcao.destino && (
            <Button asChild variant="default" size="sm" className="crm-plus-next-action">
              <Link to={proximaAcao.destino}>
                {proximaAcao.rotuloAcao ?? "Abrir"}
                <ArrowRight size={14} />
              </Link>
            </Button>
          )}
        </article>
      </div>

      <div className="crm-plus-command-side">
        {indicadores.length > 0 && (
          <div className="crm-plus-side-block">
            <div className="crm-plus-side-title">
              <ListChecks size={14} />
              <span>Indicadores</span>
            </div>
            <div className="crm-plus-signal-grid">
              {indicadores.map((sinal) => (
                <div key={`${sinal.rotulo}-${sinal.valor}`} className={cn("crm-plus-signal", `crm-plus-signal--${sinal.tom ?? "neutro"}`)}>
                  <span>{sinal.rotulo}</span>
                  <strong>{sinal.valor}</strong>
                  {sinal.detalhe && <small>{sinal.detalhe}</small>}
                </div>
              ))}
            </div>
          </div>
        )}

        {resumo.length > 0 && (
          <div className="crm-plus-attributes">
            {resumo.map((atributo) => (
              <div key={`${atributo.rotulo}-${atributo.valor}`} className={cn("crm-plus-attribute", `crm-plus-attribute--${atributo.tom ?? "neutro"}`)}>
                <span>{atributo.rotulo}</span>
                <strong>{atributo.valor}</strong>
                {atributo.detalhe && <small>{atributo.detalhe}</small>}
              </div>
            ))}
          </div>
        )}

        {acoesVisiveis.length > 0 && (
          <div className="crm-plus-actions">
            {acoesVisiveis.map((acao) => (
              acao.destino ? (
                <Button key={acao.titulo} asChild variant="outline" size="sm">
                  <Link to={acao.destino}>
                    {acao.icone ?? <CalendarClock size={14} />}
                    {acao.rotuloAcao ?? acao.titulo}
                  </Link>
                </Button>
              ) : (
                <Button key={acao.titulo} type="button" variant="outline" size="sm">
                  {acao.icone ?? <CalendarClock size={14} />}
                  {acao.rotuloAcao ?? acao.titulo}
                </Button>
              )
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
