import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolverUrlMedia } from "../api";

const CORES_AVATAR = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return nome.slice(0, 2).toUpperCase();
}

function corPorNome(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CORES_AVATAR[Math.abs(hash) % CORES_AVATAR.length];
}

interface AvatarUsuarioProps {
  nome: string;
  avatarUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function AvatarUsuario({ nome, avatarUrl, size = "default", className }: AvatarUsuarioProps) {
  const iniciais = obterIniciais(nome);
  const cor = corPorNome(nome);
  const urlResolvida = resolverUrlMedia(avatarUrl);

  return (
    <Avatar size={size} className={className}>
      {urlResolvida && <AvatarImage src={urlResolvida} alt={nome} />}
      <AvatarFallback className={`font-semibold ${cor}`}>
        {iniciais}
      </AvatarFallback>
    </Avatar>
  );
}
