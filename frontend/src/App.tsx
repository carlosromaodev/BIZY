import { type ReactNode, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EVENTO_SESSAO_ATUALIZADA, EVENTO_SESSAO_EXPIRADA, EVENTO_WORKSPACE_ALTERADO, obterUsuario, requisitarApi } from "./api";
import { NativeFeedbackProvider } from "./componentes/NativeFeedbackProvider";
import { ProvedorNotificacoes } from "./componentes/Notificacoes";
import { Shell } from "./componentes/Shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { rotasPrivadas, rotasPrivadasOcultas, rotasPublicas, usuarioPodeGovernarAnani, usuarioPodeVerAdminSistema } from "./rotasApp";

type EstadoModuloRota = "liberado" | "bloqueado" | "verificando";

function RotaPrivada({
  children,
  modulo,
  requerAdminSistema = false,
  requerGovernancaAnani = false
}: {
  children: ReactNode;
  modulo?: string;
  requerAdminSistema?: boolean;
  requerGovernancaAnani?: boolean;
}) {
  const [autenticado, setAutenticado] = useState(() => Boolean(obterUsuario()));
  const [versaoWorkspace, setVersaoWorkspace] = useState(0);
  const [estadoModulo, setEstadoModulo] = useState<EstadoModuloRota>(() => (modulo ? "verificando" : "liberado"));
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
    const atualizarWorkspace = () => setVersaoWorkspace((versao) => versao + 1);
    window.addEventListener(EVENTO_WORKSPACE_ALTERADO, atualizarWorkspace);
    return () => window.removeEventListener(EVENTO_WORKSPACE_ALTERADO, atualizarWorkspace);
  }, []);

  useEffect(() => {
    if (!modulo || !autenticado) {
      setEstadoModulo("liberado");
      return;
    }

    let ativo = true;
    setEstadoModulo("verificando");

    requisitarApi<{ modulosAtivos?: string[] }>("/negocio/modulos")
      .then((resposta) => {
        if (!ativo) return;
        setEstadoModulo((resposta.modulosAtivos ?? []).includes(modulo) ? "liberado" : "bloqueado");
      })
      .catch(() => {
        if (ativo) setEstadoModulo("bloqueado");
      });

    return () => {
      ativo = false;
    };
  }, [autenticado, modulo, versaoWorkspace]);

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
  if (requerGovernancaAnani && !usuarioPodeGovernarAnani(usuario?.papel)) return <Navigate to="/app" replace />;
  if (requerAdminSistema && !usuarioPodeVerAdminSistema(usuario?.papel)) return <Navigate to="/app" replace />;
  if (estadoModulo === "verificando") return null;
  if (estadoModulo === "bloqueado") return <Navigate to="/app" replace />;

  return <>{children}</>;
}

function LayoutApp({
  children,
  modulo,
  requerAdminSistema = false,
  requerGovernancaAnani = false
}: {
  children: ReactNode;
  modulo?: string;
  requerAdminSistema?: boolean;
  requerGovernancaAnani?: boolean;
}) {
  return (
    <RotaPrivada modulo={modulo} requerAdminSistema={requerAdminSistema} requerGovernancaAnani={requerGovernancaAnani}>
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
                  element={<LayoutApp modulo={rota.modulo} requerAdminSistema={rota.requerAdminSistema}>{rota.elemento}</LayoutApp>}
                />
              ))}

              {rotasPrivadasOcultas.map((rota) => (
                <Route
                  key={rota.caminho}
                  path={rota.caminho}
                  element={<RotaPrivada modulo={rota.modulo} requerGovernancaAnani={rota.requerGovernancaAnani}>{rota.elemento}</RotaPrivada>}
                />
              ))}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ProvedorNotificacoes>
      </NativeFeedbackProvider>
    </TooltipProvider>
  );
}
