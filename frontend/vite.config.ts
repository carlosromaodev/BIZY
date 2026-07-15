import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const backendUrl =
  process.env.VITE_BACKEND_URL ??
  process.env.BACKEND_URL ??
  `http://localhost:${process.env.PORTA ?? process.env.BACKEND_PORT ?? "3333"}`;

const rotasBackend = [
  "/afiliados",
  "/auth",
  "/atendimento",
  "/auditoria",
  "/automacoes",
  "/campanhas",
  "/clientes",
  "/comentarios",
  "/conta",
  "/actividades",
  "/cotacoes",
  "/diagnosticos",
  "/equipa",
  "/eventos",
  "/evolution",
  "/financas",
  "/formularios",
  "/funil",
  "/instagram",
  "/inteligencia",
  "/integracoes",
  "/lembretes",
  "/learning/team",
  "/learning/programas",
  "/learning/licoes",
  "/learning/progresso",
  "/lives",
  "/loja-publica",
  "/media",
  "/metas",
  "/n8n",
  "/negocio",
  "/onboarding",
  "/painel",
  "/pecas",
  "/pedidos",
  "/pipeline",
  "/projectos",
  "/publico",
  "/recuperacao",
  "/relatorios",
  "/respostas-rapidas",
  "/reservas",
  "/saude",
  "/sequencias",
  "/sms",
  "/social",
  "/tarefas",
  "/team",
  "/webhooks",
  "/whatsapp",
  "/workspaces"
] as const;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-icons": ["lucide-react"],
          "vendor-motion": ["motion/react"],
          "vendor-react": ["react", "react-dom", "react-router-dom"]
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    allowedHosts: true,
    proxy: {
      ...Object.fromEntries(
        rotasBackend.map((rota) => [
          rota,
          {
            target: backendUrl,
            changeOrigin: true,
            secure: false,
            ws: rota === "/eventos"
          }
        ])
      ),
      "^/market/(fornecedor|reembolsos|resumo)": {
        target: backendUrl,
        changeOrigin: true,
        secure: false
      },
      "^/creator/(portal$|links/|conteudos/|carrinhos/|oportunidades/|candidaturas/|missoes/|team/)": {
        target: backendUrl,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
