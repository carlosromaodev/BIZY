import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ConfirmarAcaoProps {
  aberto: boolean;
  descricao: string;
  onCancelar: () => void;
  onConfirmar: () => void;
  textoBotao?: string;
  titulo: string;
  variante?: "default" | "destructive";
}

export function ConfirmarAcao({
  aberto,
  descricao,
  onCancelar,
  onConfirmar,
  textoBotao = "Confirmar",
  titulo,
  variante = "default",
}: ConfirmarAcaoProps) {
  return (
    <AlertDialog open={aberto} onOpenChange={(abrir) => { if (!abrir) onCancelar(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={variante === "destructive" ? "bg-[var(--rose-tint)] text-[var(--rose-ink)]" : "bg-[var(--green-tint)] text-[var(--green-ink)]"}>
            {variante === "destructive" ? <AlertTriangle /> : <CheckCircle2 />}
          </AlertDialogMedia>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelar}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={variante} onClick={onConfirmar}>
            {textoBotao}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
