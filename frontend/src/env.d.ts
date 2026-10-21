interface ImportMetaEnv {
  /** Base URL of the FastAPI backend (added later). */
  readonly VITE_API_BASE_URL?: string
  /** "true" makes `src/lib/api.ts` return mock data from `src/mocks`. */
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
