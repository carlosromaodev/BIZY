import { type ReactNode, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EVENTO_SESSAO_EXPIRADA, obterToken } from "./api";
import { ProvedorNotificacoes } from "./componentes/Notificacoes";
import { Shell } from "./componentes/Shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { rotasPrivadas, rotasPrivadasOcultas, rotasPublicas } from "./rotasApp";

function RotaPrivada({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(() => Boolean(obterToken()));

  useEffect(() => {
    const atualizarSessao = () => setAutenticado(Boolean(obterToken()));
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, atualizarSessao);
    window.addEventListener("storage", atualizarSessao);

    return () => {
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, atualizarSessao);
      window.removeEventListener("storage", atualizarSessao);
    };
  }, []);

  return autenticado ? <>{children}</> : <Navigate to="/login" replace />;
}

function LayoutApp({ children }: { children: ReactNode }) {
  return (
    <RotaPrivada>
      <Shell>{children}</Shell>
    </RotaPrivada>
  );
}

export function App() {
  return (
    <TooltipProvider>
      <ProvedorNotificacoes>
        <BrowserRouter>
          <Routes>
            {rotasPublicas.map((rota) => (
              <Route key={rota.caminho} path={rota.caminho} element={rota.elemento} />
            ))}

            {rotasPrivadas.map((rota) => (
              <Route key={rota.caminho} path={rota.caminho} element={<LayoutApp>{rota.elemento}</LayoutApp>} />
            ))}

            {rotasPrivadasOcultas.map((rota) => (
              <Route key={rota.caminho} path={rota.caminho} element={<RotaPrivada>{rota.elemento}</RotaPrivada>} />
            ))}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ProvedorNotificacoes>
    </TooltipProvider>
  );
}
