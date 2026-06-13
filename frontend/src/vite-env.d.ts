/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_N8N_URL?: string;
  readonly VITE_PUBLIC_MARKET_URL?: string;
  readonly VITE_PUBLIC_STORE_DOMAIN?: string;
  readonly VITE_TIKTOK_LIVE_USERNAME_PADRAO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
