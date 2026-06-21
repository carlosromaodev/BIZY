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
  "/automacoes",
  "/clientes",
  "/comentarios",
  "/actividades",
  "/cotacoes",
  "/diagnosticos",
  "/eventos",
  "/evolution",
  "/formularios",
  "/funil",
  "/instagram",
  "/integracoes",
  "/lembretes",
  "/lives",
  "/loja-publica",
  "/media",
  "/metas",
  "/n8n",
  "/onboarding",
  "/painel",
  "/pecas",
  "/pedidos",
  "/pipeline",
  "/publico",
  "/recuperacao",
  "/relatorios",
  "/respostas-rapidas",
  "/reservas",
  "/saude",
  "/sequencias",
  "/social",
  "/tarefas",
  "/webhooks",
  "/whatsapp"
] as const;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    allowedHosts: true,
    proxy: Object.fromEntries(
      rotasBackend.map((rota) => [
        rota,
        {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: rota === "/eventos"
        }
      ])
    )
  }
});
