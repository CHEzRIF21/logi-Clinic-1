/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_STOCK_SUPABASE_URL?: string;
  readonly VITE_STOCK_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Déclaration globale pour Node.js process (compatibilité de transition)
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
    REACT_APP_SUPABASE_URL?: string;
    REACT_APP_SUPABASE_ANON_KEY?: string;
    REACT_APP_STOCK_SUPABASE_URL?: string;
    REACT_APP_STOCK_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  };
} | undefined;

