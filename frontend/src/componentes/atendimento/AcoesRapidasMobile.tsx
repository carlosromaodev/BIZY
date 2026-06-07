import {
  Bell,
  CheckCircle2,
  MessageSquare,
  Package,
  Phone,
  Settings2,
  StickyNote,
  Zap
} from "lucide-react";
import type { Conversa } from "../../tipos";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface TileAcao {
  icone: React.ReactNode;
  rotulo: string;
  cor: string;
  accao: () => void;
  visivel: boolean;
}

export function AcoesRapidasMobile({
  conversaAtual,
  aberto,
  onFechar,
  onAbrirRespostasRapidas,
  onAbrirLembrete,
  onAbrirContexto,
  onAbrirGestao,
  onAbrirNota,
  onConfirmarPagamento
}: {
  conversaAtual: Conversa;
  aberto: boolean;
  onFechar: () => void;
  onAbrirRespostasRapidas: () => void;
  onAbrirLembrete: () => void;
  onAbrirContexto: () => void;
  onAbrirGestao: () => void;
  onAbrirNota: () => void;
  onConfirmarPagamento: () => void;
}) {
  const temReservaPendente = conversaAtual.reservaAtual &&
    !["PAID", "CANCELLED", "EXPIRED"].includes(conversaAtual.reservaAtual.estado);

  const tiles: TileAcao[] = [
    {
      icone: <Zap size={20} />,
      rotulo: "Respostas rápidas",
      cor: "#6366F1",
      accao: () => { onFechar(); onAbrirRespostasRapidas(); },
      visivel: true
    },
    {
      icone: <Bell size={20} />,
      rotulo: "Agendar lembrete",
      cor: "#F59E0B",
      accao: () => { onFechar(); onAbrirLembrete(); },
      visivel: true
    },
    {
      icone: <Package size={20} />,
      rotulo: "Consultar produto",
      cor: "#8B5CF6",
      accao: () => { onFechar(); onAbrirContexto(); },
      visivel: true
    },
    {
      icone: <Phone size={20} />,
      rotulo: "Ligar cliente",
      cor: "#10B981",
      accao: () => { onFechar(); window.location.href = `tel:${conversaAtual.telefone}`; },
      visivel: true
    },
    {
      icone: <CheckCircle2 size={20} />,
      rotulo: "Confirmar pagamento",
      cor: "#10B981",
      accao: () => { onFechar(); onConfirmarPagamento(); },
      visivel: Boolean(temReservaPendente)
    },
    {
      icone: <StickyNote size={20} />,
      rotulo: "Nota interna",
      cor: "#78716C",
      accao: () => { onFechar(); onAbrirNota(); },
      visivel: true
    },
    {
      icone: <Settings2 size={20} />,
      rotulo: "Gestão",
      cor: "#78716C",
      accao: () => { onFechar(); onAbrirGestao(); },
      visivel: true
    }
  ];

  const tilesVisiveis = tiles.filter((t) => t.visivel);

  return (
    <Sheet open={aberto} onOpenChange={(v) => { if (!v) onFechar(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="text-left pb-3">
          <SheetTitle style={{ fontFamily: "var(--font-heading)" }}>Acções rápidas</SheetTitle>
          <SheetDescription>{conversaAtual.nomeCliente} · {conversaAtual.telefone}</SheetDescription>
        </SheetHeader>
        <div className="atendimento-drawer-grid">
          {tilesVisiveis.map((tile) => (
            <button
              key={tile.rotulo}
              type="button"
              className="atendimento-drawer-tile"
              onClick={tile.accao}
            >
              <span
                className="atendimento-drawer-tile-icon"
                style={{ background: `color-mix(in srgb, ${tile.cor} 10%, transparent)`, color: tile.cor }}
              >
                {tile.icone}
              </span>
              <span className="atendimento-drawer-tile-label">{tile.rotulo}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
