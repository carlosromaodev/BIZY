import { Bell, Calendar, Clock3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Conversa, TipoLembrete } from "../../tipos";
import { requisitarApi } from "../../api";

const tiposLembrete: Array<{ valor: TipoLembrete; rotulo: string }> = [
  { valor: "FOLLOW_UP", rotulo: "Follow-up" },
  { valor: "COBRANCA", rotulo: "Cobrança" },
  { valor: "ENTREGA", rotulo: "Entrega" },
  { valor: "CALLBACK", rotulo: "Callback" },
  { valor: "REUNIAO", rotulo: "Reunião" },
  { valor: "OUTRO", rotulo: "Outro" }
];

function obterDataRapida(opcao: "1h" | "amanha" | "3dias"): string {
  const d = new Date();
  if (opcao === "1h") {
    d.setHours(d.getHours() + 1);
  } else if (opcao === "amanha") {
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
  } else {
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
  }
  return d.toISOString().slice(0, 16);
}

function formatarDataLocal(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-AO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function CriarLembretePainel({
  conversaAtual,
  aberto,
  onFechar,
  onCriado
}: {
  conversaAtual: Conversa;
  aberto: boolean;
  onFechar: () => void;
  onCriado: () => void;
}) {
  const [titulo, setTitulo] = useState(`Follow-up: ${conversaAtual.nomeCliente}`);
  const [tipo, setTipo] = useState<TipoLembrete>("FOLLOW_UP");
  const [dataHora, setDataHora] = useState(obterDataRapida("amanha"));
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function criar() {
    if (!titulo.trim() || !dataHora) return;
    setCarregando(true);
    setErro("");
    try {
      await requisitarApi("/lembretes", {
        method: "POST",
        body: {
          titulo: titulo.trim(),
          tipo,
          dataHora: new Date(dataHora).toISOString(),
          clienteNome: conversaAtual.nomeCliente || null,
          conversaId: conversaAtual.conversaCrmId || null,
          pedidoId: conversaAtual.reservaAtual?.id || null,
          observacao: observacao.trim() || null
        }
      });
      onCriado();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar lembrete.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => { if (!v) onFechar(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <Bell size={18} className="text-primary" />
            Agendar lembrete
          </DialogTitle>
          <DialogDescription>
            Ligado a {conversaAtual.nomeCliente}
            {conversaAtual.reservaAtual ? ` · Pedido #${conversaAtual.reservaAtual.codigoPeca}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Título</span>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ligar para confirmar entrega"
              disabled={carregando}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoLembrete)} disabled={carregando}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tiposLembrete.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>{t.rotulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Quando</span>
            <div className="flex gap-1.5 mb-1.5">
              {([
                { opcao: "1h" as const, rotulo: "Daqui 1h" },
                { opcao: "amanha" as const, rotulo: "Amanhã 10h" },
                { opcao: "3dias" as const, rotulo: "Em 3 dias" }
              ]).map(({ opcao, rotulo }) => (
                <Button
                  key={opcao}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={() => setDataHora(obterDataRapida(opcao))}
                  disabled={carregando}
                >
                  <Clock3 size={12} />
                  {rotulo}
                </Button>
              ))}
            </div>
            <Input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              disabled={carregando}
              className="text-sm"
            />
            {dataHora && (
              <p className="text-[0.65rem] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar size={10} />
                {formatarDataLocal(dataHora)}
              </p>
            )}
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Observação (opcional)</span>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Notas adicionais..."
              rows={2}
              disabled={carregando}
              className="text-sm"
            />
          </label>

          {erro && (
            <p className="text-xs text-destructive">{erro}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>Cancelar</Button>
          <Button onClick={() => void criar()} disabled={carregando || !titulo.trim() || !dataHora}>
            <Bell size={14} className="mr-1.5" />
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
