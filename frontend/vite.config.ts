import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const backendUrl =
  process.env.VITE_BACKEND_URL ??
  process.env.BACKEND_URL ??
  `http://localhost:${process.env.PORTA ?? process.env.BACKEND_PORT ?? "3333"}`;

const rotasBackend = [
  "/auth",
  "/atendimento",
  "/automacoes",
  "/comentarios",
  "/diagnosticos",
  "/eventos",
  "/evolution",
  "/integracoes",
  "/lives",
  "/media",
  "/n8n",
  "/painel",
  "/pecas",
  "/relatorios",
  "/reservas",
  "/saude",
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
