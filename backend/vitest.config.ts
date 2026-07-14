import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: true,
    env: {
      MODULOS_TODOS_ATIVOS: "true",
      AUTH_SECRET: "test-secret-for-vitest-32chars00",
      AUTH_ALLOW_LEGACY_TOKENS: "true",
      LOGIN_SMS_DEV_MODE: "true",
      LOGIN_SMS_EXPOR_CODIGO_DEV: "true",
      WHATSAPP_PROVIDER: "console"
    }
  }
});
