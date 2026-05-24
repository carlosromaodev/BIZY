import {
  Bell,
  CircleAlert,
  CircleCheck,
  MessageSquareWarning,
  ShieldAlert,
  TriangleAlert
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle
} from "@/components/ui/alert-1";

export const EVENTO_NOTIFICACAO_SITE = "bizy:notificacao";

export type VarianteNotificacao = "secondary" | "primary" | "destructive" | "success" | "info" | "warning";

export type EntradaNotificacao = {
  descricao?: string;
  duracao?: number;
  id?: string;
  titulo: string;
  variante?: VarianteNotificacao;
};

type Notificacao = EntradaNotificacao & {
  criadaEm: number;
  id: string;
};

type ContextoNotificacoes = {
  limpar: () => void;
  notificar: (entrada: EntradaNotificacao) => string;
  remover: (id: string) => void;
};

const NotificacoesContexto = createContext<ContextoNotificacoes | null>(null);

const iconesNotificacao = {
  destructive: TriangleAlert,
  info: Bell,
  primary: MessageSquareWarning,
  secondary: CircleAlert,
  success: CircleCheck,
  warning: ShieldAlert
} satisfies Record<VarianteNotificacao, typeof Bell>;

function criarIdNotificacao() {
  return `notificacao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ProvedorNotificacoes({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const remover = useCallback((id: string) => {
    setNotificacoes((atuais) => atuais.filter((notificacao) => notificacao.id !== id));
  }, []);

  const limpar = useCallback(() => {
    setNotificacoes([]);
  }, []);

  const notificar = useCallback(
    (entrada: EntradaNotificacao) => {
      const id = entrada.id ?? criarIdNotificacao();
      const proxima: Notificacao = {
        criadaEm: Date.now(),
        duracao: 5200,
        variante: "secondary",
        ...entrada,
        id
      };

      setNotificacoes((atuais) => [proxima, ...atuais.filter((notificacao) => notificacao.id !== id)].slice(0, 4));

      if (proxima.duracao !== 0) {
        window.setTimeout(() => remover(id), proxima.duracao);
      }

      return id;
    },
    [remover]
  );

  useEffect(() => {
    function aoReceberNotificacao(evento: Event) {
      const detalhe = (evento as CustomEvent<EntradaNotificacao>).detail;
      if (!detalhe?.titulo) return;
      notificar(detalhe);
    }

    window.addEventListener(EVENTO_NOTIFICACAO_SITE, aoReceberNotificacao);
    return () => window.removeEventListener(EVENTO_NOTIFICACAO_SITE, aoReceberNotificacao);
  }, [notificar]);

  const valor = useMemo(() => ({ limpar, notificar, remover }), [limpar, notificar, remover]);

  return (
    <NotificacoesContexto.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="toaster fixed right-4 top-4 z-[100] flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-2 [--width:min(calc(100vw-2rem),24rem)] sm:bottom-5 sm:right-5 sm:top-auto"
      >
        {notificacoes.map((notificacao) => {
          const variante = notificacao.variante ?? "secondary";
          const Icone = iconesNotificacao[variante];

          return (
            <Alert
              appearance="light"
              close
              key={notificacao.id}
              onClose={() => remover(notificacao.id)}
              size="md"
              variant={variante}
              className="animate-in fade-in-0 slide-in-from-top-2 sm:slide-in-from-bottom-2"
            >
              <AlertIcon>
                <Icone />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>{notificacao.titulo}</AlertTitle>
                {notificacao.descricao ? (
                  <AlertDescription>{notificacao.descricao}</AlertDescription>
                ) : null}
              </AlertContent>
            </Alert>
          );
        })}
      </div>
    </NotificacoesContexto.Provider>
  );
}

export function useNotificacoes() {
  const contexto = useContext(NotificacoesContexto);
  if (!contexto) throw new Error("useNotificacoes deve ser usado dentro de ProvedorNotificacoes.");
  return contexto;
}

export function notificarSite(notificacao: EntradaNotificacao) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_NOTIFICACAO_SITE, { detail: notificacao }));
}
