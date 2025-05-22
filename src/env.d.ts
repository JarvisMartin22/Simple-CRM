/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_SITE_URL: string
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  VITE_SUPABASE_FUNCTIONS_URL: string
  GMAIL_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 