import {
  Copy,
  Download,
  Megaphone,
  MessageCircle,
  RefreshCcw,
  Send,
  Users,
  WalletCards
} from "lucide-react";
import { useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { clientesParaCsv, montarClientesCrm, montarSegmentosCampanha, type ClienteCrm, type SegmentoCampanha } from "../crm";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Peca, Reserva, RespostaConversas } from "../tipos";
import { formatarKwanza } from "../utilidades";

function baixarCsv(nome: string, conteudo: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

function telefonesDoSegmento(clientes: ClienteCrm[]): string {
  return clientes.map((cliente) => cliente.telefoneFormatado).join("\n");
}

export function PaginaCampanhas() {
  const [segmentos, setSegmentos] = useState<SegmentoCampanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const [respostaConversas, reservas, pecas] = await Promise.all([
        requisitarApi<RespostaConversas>("/atendimento/conversas"),
        requisitarApi<Reserva[]>("/reservas"),
        requisitarApi<Peca[]>("/pecas")
      ]);
      const clientes = montarClientesCrm({ conversas: respostaConversas.conversas, reservas, pecas });
      setSegmentos(montarSegmentosCampanha(clientes));
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar campanhas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const totalClientes = new Set(segmentos.flatMap((segmento) => segmento.clientes.map((cliente) => cliente.telefone))).size;
  const alcanceQuente = segmentos.find((segmento) => segmento.id === "compradores")?.clientes.length ?? 0;
  const pendentes = segmentos.find((segmento) => segmento.id === "pagamento-pendente")?.clientes.length ?? 0;
  const valorPendente = segmentos.find((segmento) => segmento.id === "pagamento-pendente")?.valorEstimado ?? 0;

  async function copiarSegmento(segmento: SegmentoCampanha) {
    await navigator.clipboard.writeText(telefonesDoSegmento(segmento.clientes));
    setMensagem(`${segmento.clientes.length} contactos copiados.`);
  }

  function exportarSegmento(segmento: SegmentoCampanha) {
    baixarCsv(`campanha-${segmento.id}-bizy.csv`, clientesParaCsv(segmento.clientes));
    setMensagem(`${segmento.clientes.length} contactos exportados.`);
  }

  return (
    <>
      <CabecalhoPagina rotulo="WhatsApp comercial" titulo="Campanhas">
        <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo das campanhas"
        itens={[
          { icone: <Users />, titulo: "Base ativa", valor: totalClientes, detalhe: "clientes segmentados", tom: "principal" },
          { icone: <MessageCircle />, titulo: "Alcance quente", valor: alcanceQuente, detalhe: "clientes que já compraram", tom: "sucesso" },
          { icone: <Send />, titulo: "Pendentes", valor: pendentes, detalhe: "contactos para cobrança", tom: pendentes ? "atencao" : "neutro" },
          { icone: <WalletCards />, titulo: "Valor em aberto", valor: formatarKwanza(valorPendente), detalhe: "reservas por fechar" }
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {segmentos.length ? (
          segmentos.map((segmento) => (
            <Card key={segmento.id}>
              <CardContent className="grid gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Megaphone size={19} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{segmento.titulo}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">{segmento.foco}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <strong className="block text-2xl">{segmento.clientes.length}</strong>
                    <span className="text-sm text-muted-foreground">contactos</span>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <strong className="block text-2xl">{formatarKwanza(segmento.valorEstimado)}</strong>
                    <span className="text-sm text-muted-foreground">potencial</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {segmento.clientes.slice(0, 4).map((cliente) => (
                    <Badge key={cliente.telefone} variant="secondary">{cliente.nome}</Badge>
                  ))}
                  {segmento.clientes.length > 4 && <Badge variant="outline">+{segmento.clientes.length - 4}</Badge>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="lg" onClick={() => void copiarSegmento(segmento)} disabled={!segmento.clientes.length}>
                    <Copy size={16} />
                    Copiar
                  </Button>
                  <Button size="lg" onClick={() => exportarSegmento(segmento)} disabled={!segmento.clientes.length}>
                    <Download size={16} />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <EstadoVazio
              icone={<Megaphone />}
              titulo={carregando ? "A preparar segmentos" : "Sem base para campanhas"}
              detalhe={carregando ? "A ler clientes e pedidos." : "Os segmentos aparecem depois das primeiras conversas ou vendas."}
            />
          </Card>
        )}
      </section>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}
