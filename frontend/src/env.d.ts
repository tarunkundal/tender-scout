interface ImportMetaEnv {
  /** Base URL of the FastAPI backend (added later). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
