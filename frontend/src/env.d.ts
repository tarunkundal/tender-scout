interface ImportMetaEnv {
  /** Backend base URL as seen by the browser (default "/api", Vite proxy). */
  readonly VITE_API_BASE_URL?: string
  /** Neon Auth URL of the Neon branch (Console → Auth), ends in "/neondb/auth". */
  readonly VITE_NEON_AUTH_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
