import {
  BadgeDollarSign,
  Copy,
  Link2,
  Megaphone,
  Plus,
  RefreshCcw,
  Share2,
  Trophy,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion, CrmSection, CrmStatusBadge } from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResumoAfiliados } from "../tipos";
import { formatarDataHoraCurta, formatarKwanza } from "../utilidades";

interface ParceiroComercial {
  id: string;
  tipo: string;
  codigo: string;
  nomePublico: string;
  contacto: string | null;
  estado: string;
  regraComissao: {
    tipo: "PERCENTUAL" | "VALOR_FIXO" | string;
    percentual?: number;
    valorEmKwanza?: number;
  };
  criadoEm: string;
}

interface LinkAfiliado {
  id: string;
  afiliadoId: string;
  codigo: string;
  destinoTipo: string;
  slugLoja: string | null;
  codigoProduto: string | null;
  canal: string | null;
  origemConteudo: string | null;
  ativo: boolean;
  expiraEm: string | null;
  criadoEm: string;
}

interface ResumoSaldos {
  totais: {
    totalParceiros: number;
    comissaoEstimadaEmKwanza: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoPagaEmKwanza: number;
    saldoPendenteEmKwanza: number;
  };
  saldos: Array<{
    afiliadoId: string;
    codigo: string;
    nomePublico: string;
    saldoPendenteEmKwanza: number;
    comissaoConfirmadaEmKwanza: number;
    comissaoPagaEmKwanza: number;
  }>;
}

export function PaginaAfiliados() {
  const [parceiros, setParceiros] = useState<ParceiroComercial[]>([]);
  const [links, setLinks] = useState<LinkAfiliado[]>([]);
  const [resumo, setResumo] = useState<ResumoAfiliados | null>(null);
  const [saldos, setSaldos] = useState<ResumoSaldos | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nomePublico, setNomePublico] = useState("");
  const [contacto, setContacto] = useState("");
  const [percentual, setPercentual] = useState("10");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const [respostaResumo, respostaParceiros, respostaLinks, respostaSaldos] = await Promise.allSettled([
        requisitarApi<ResumoAfiliados>("/afiliados/resumo"),
        requisitarApi<ParceiroComercial[]>("/afiliados"),
        requisitarApi<LinkAfiliado[]>("/afiliados/links"),
        requisitarApi<ResumoSaldos>("/afiliados/comissoes/saldos")
      ]);

      setResumo(respostaResumo.status === "fulfilled" ? respostaResumo.value : null);
      setParceiros(respostaParceiros.status === "fulfilled" ? respostaParceiros.value ?? [] : []);
      setLinks(respostaLinks.status === "fulfilled" ? respostaLinks.value ?? [] : []);
      setSaldos(respostaSaldos.status === "fulfilled" ? respostaSaldos.value : null);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar afiliados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const linksPorParceiro = useMemo(() => {
    const mapa = new Map<string, LinkAfiliado[]>();
    links.forEach((link) => mapa.set(link.afiliadoId, [...(mapa.get(link.afiliadoId) ?? []), link]));
    return mapa;
  }, [links]);

  async function criarParceiro() {
    if (!codigo.trim() || !nomePublico.trim()) {
      setMensagem("Informe código e nome público do afiliado.");
      return;
    }

    setMensagem("A criar afiliado...");
    try {
      await requisitarApi("/afiliados", {
        method: "POST",
        body: {
          tipo: "AFILIADO",
          codigo,
          nomePublico,
          contacto: contacto.trim() || null,
          estado: "ATIVO",
          regraComissao: {
            tipo: "PERCENTUAL",
            percentual: Number(percentual) || 0
          },
          metodoPagamento: {}
        }
      });
      setCodigo("");
      setNomePublico("");
      setContacto("");
      await carregar();
      setMensagem("Afiliado criado. Já pode receber links e comissões.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar afiliado.");
    }
  }

  async function criarLinkRapido(parceiro: ParceiroComercial) {
    setMensagem("A criar link de venda...");
    try {
      const link = await requisitarApi<LinkAfiliado>(`/afiliados/${parceiro.id}/links`, {
        method: "POST",
        body: {
          codigo: `${parceiro.codigo}-${Date.now().toString(36).toUpperCase()}`,
          destinoTipo: "LOJA",
          slugLoja: null,
          codigoProduto: null,
          canal: "whatsapp",
          origemConteudo: "crm-afiliados",
          ativo: true
        }
      });
      await navigator.clipboard.writeText(`/publico/links/${link.codigo}`);
      await carregar();
      setMensagem("Link criado e caminho público copiado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar link.");
    }
  }

  async function gerarPacote(parceiro: ParceiroComercial) {
    setMensagem("A gerar pacote de divulgação...");
    try {
      const pacote = await requisitarApi<Record<string, unknown>>(`/afiliados/${parceiro.id}/pacote-divulgacao`);
      await navigator.clipboard.writeText(JSON.stringify(pacote, null, 2));
      setMensagem("Pacote de divulgação copiado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível gerar pacote.");
    }
  }

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Criadores e social commerce" titulo="Afiliados">
        <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo dos afiliados"
        itens={[
          { icone: <Users />, titulo: "Parceiros", valor: Number(resumo?.totalParceiros ?? parceiros.length), detalhe: "afiliados e criadores", tom: parceiros.length ? "principal" : "neutro" },
          { icone: <Link2 />, titulo: "Links", valor: Number(resumo?.totalLinks ?? links.length), detalhe: "rastreáveis por venda", tom: links.length ? "sucesso" : "neutro" },
          { icone: <BadgeDollarSign />, titulo: "Comissão", valor: formatarKwanza(Number(resumo?.comissaoConfirmadaEmKwanza ?? saldos?.totais.comissaoConfirmadaEmKwanza ?? 0)), detalhe: "confirmada", tom: "sucesso" },
          { icone: <Trophy />, titulo: "Saldo", valor: formatarKwanza(Number(saldos?.totais.saldoPendenteEmKwanza ?? 0)), detalhe: "pendente de pagamento", tom: Number(saldos?.totais.saldoPendenteEmKwanza ?? 0) ? "atencao" : "neutro" }
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <CrmSection
          icon={<UserPlus size={20} />}
          title="Novo afiliado"
          description="Cadastra criadores, revendedores ou parceiros e define a regra de comissão."
        >
          <div className="market-form grid gap-3">
            <Input className="market-input" aria-label="Código do afiliado" value={codigo} onChange={(evento) => setCodigo(evento.target.value)} placeholder="Código: CRIADOR01" />
            <Input className="market-input" aria-label="Nome público" value={nomePublico} onChange={(evento) => setNomePublico(evento.target.value)} placeholder="Nome público" />
            <Input className="market-input" aria-label="Contacto" value={contacto} onChange={(evento) => setContacto(evento.target.value)} placeholder="WhatsApp, email ou @username" />
            <Input className="market-input" aria-label="Percentual de comissão" type="number" min="0" max="100" value={percentual} onChange={(evento) => setPercentual(evento.target.value)} placeholder="Comissão %" />
            <Button size="lg" onClick={() => void criarParceiro()}>
              <Plus size={16} />
              Criar afiliado
            </Button>
          </div>
        </CrmSection>

        <CrmSection
          icon={<Megaphone size={20} />}
          title="Parceiros ativos"
          description="Cada parceiro pode receber links específicos de loja, produto ou campanha com tracking e comissão."
        >
          <CrmList>
            {parceiros.length ? parceiros.map((parceiro) => {
              const totalLinks = linksPorParceiro.get(parceiro.id)?.length ?? 0;
              return (
                <CrmListItem
                  key={parceiro.id}
                  media={<Share2 size={18} />}
                  title={parceiro.nomePublico}
                  description={`${parceiro.codigo} · ${parceiro.contacto ?? "sem contacto"}`}
                  tone={parceiro.estado === "ATIVO" ? "sucesso" : "neutro"}
                  meta={formatarDataHoraCurta(parceiro.criadoEm)}
                  badges={(
                    <>
                      <CrmStatusBadge tone={parceiro.estado === "ATIVO" ? "sucesso" : "neutro"}>{parceiro.estado}</CrmStatusBadge>
                      <Badge variant="secondary">{descreverComissao(parceiro)}</Badge>
                    </>
                  )}
                  actions={(
                    <>
                      <Button variant="outline" size="lg" onClick={() => void criarLinkRapido(parceiro)}>
                        <Link2 size={16} />
                        Criar link
                      </Button>
                      <Button size="lg" onClick={() => void gerarPacote(parceiro)}>
                        <Copy size={16} />
                        Pacote
                      </Button>
                    </>
                  )}
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    <CrmMetricMini label="links" value={totalLinks} tone={totalLinks ? "sucesso" : "neutro"} />
                    <CrmMetricMini label="tipo" value={parceiro.tipo} />
                    <CrmMetricMini label="estado" value={parceiro.estado} tone={parceiro.estado === "ATIVO" ? "sucesso" : "neutro"} />
                  </div>
                </CrmListItem>
              );
            }) : (
              <EstadoVazio icone={<Users />} titulo={carregando ? "A carregar afiliados" : "Sem afiliados"} detalhe="Crie parceiros para vender com links rastreáveis, campanhas e comissões." />
            )}
          </CrmList>
        </CrmSection>
      </div>

      <CrmSection
        icon={<Link2 size={20} />}
        title="Links rastreáveis"
        description="Links por loja, produto, campanha ou criador para atribuir resultado e calcular comissões."
      >
        <CrmList columns="three">
          {links.length ? links.map((link) => (
            <CrmListItem
              key={link.id}
              media={<Link2 size={18} />}
              title={link.codigo}
              description={`${link.destinoTipo}${link.codigoProduto ? ` · produto ${link.codigoProduto}` : ""}${link.canal ? ` · ${link.canal}` : ""}`}
              tone={link.ativo ? "sucesso" : "neutro"}
              meta={link.expiraEm ? formatarDataHoraCurta(link.expiraEm) : "Sem expiração"}
              badges={<CrmStatusBadge tone={link.ativo ? "sucesso" : "neutro"}>{link.ativo ? "Ativo" : "Inativo"}</CrmStatusBadge>}
            />
          )) : (
            <EstadoVazio icone={<Link2 />} titulo="Sem links" detalhe="Crie links para medir vendas por criador, campanha, produto e canal." />
          )}
        </CrmList>
      </CrmSection>

      {mensagem && <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function descreverComissao(parceiro: ParceiroComercial) {
  if (parceiro.regraComissao.tipo === "PERCENTUAL") return `${parceiro.regraComissao.percentual ?? 0}% comissão`;
  return `${formatarKwanza(parceiro.regraComissao.valorEmKwanza ?? 0)} comissão`;
}
