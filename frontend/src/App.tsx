import { type ReactNode, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EVENTO_SESSAO_ATUALIZADA, EVENTO_SESSAO_EXPIRADA, obterUsuario } from "./api";
import { NativeFeedbackProvider } from "./componentes/NativeFeedbackProvider";
import { ProvedorNotificacoes } from "./componentes/Notificacoes";
import { Shell } from "./componentes/Shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { rotasPrivadas, rotasPrivadasOcultas, rotasPublicas, usuarioPodeVerAdminSistema } from "./rotasApp";

function RotaPrivada({ children, requerAdminSistema = false }: { children: ReactNode; requerAdminSistema?: boolean }) {
  const [autenticado, setAutenticado] = useState(() => Boolean(obterUsuario()));
  const usuario = obterUsuario();

  useEffect(() => {
    const atualizarSessao = () => setAutenticado(Boolean(obterUsuario()));
    window.addEventListener(EVENTO_SESSAO_ATUALIZADA, atualizarSessao);
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, atualizarSessao);
    window.addEventListener("storage", atualizarSessao);

    return () => {
      window.removeEventListener(EVENTO_SESSAO_ATUALIZADA, atualizarSessao);
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, atualizarSessao);
      window.removeEventListener("storage", atualizarSessao);
    };
  }, []);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const jaExistia = Boolean(meta);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      if (!jaExistia && meta) meta.remove();
      else if (meta) meta.setAttribute("content", "index, follow");
    };
  }, []);

  if (!autenticado) return <Navigate to="/login" replace />;
  if (requerAdminSistema && !usuarioPodeVerAdminSistema(usuario?.papel)) return <Navigate to="/app" replace />;

  return <>{children}</>;
}

function LayoutApp({ children, requerAdminSistema = false }: { children: ReactNode; requerAdminSistema?: boolean }) {
  return (
    <RotaPrivada requerAdminSistema={requerAdminSistema}>
      <Shell>{children}</Shell>
    </RotaPrivada>
  );
}

export function App() {
  return (
    <TooltipProvider>
      <NativeFeedbackProvider>
        <ProvedorNotificacoes>
          <BrowserRouter>
            <Routes>
              {rotasPublicas.map((rota) => (
                <Route key={rota.caminho} path={rota.caminho} element={rota.elemento} />
              ))}

              {rotasPrivadas.map((rota) => (
                <Route
                  key={rota.caminho}
                  path={rota.caminho}
                  element={<LayoutApp requerAdminSistema={rota.requerAdminSistema}>{rota.elemento}</LayoutApp>}
                />
              ))}

              {rotasPrivadasOcultas.map((rota) => (
                <Route key={rota.caminho} path={rota.caminho} element={<RotaPrivada>{rota.elemento}</RotaPrivada>} />
              ))}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ProvedorNotificacoes>
      </NativeFeedbackProvider>
    </TooltipProvider>
  );
}
