/**
 * Data access layer.
 *
 * ALL data access for the app lives in this file as async, typed functions
 * (e.g. `getTenders()`, `getTender(id)`, `getEligibility(id)`).
 * Components and hooks never call `fetch` directly.
 *
 * Phase 1: functions return mock data from `src/mocks`.
 * Phase 2: the same functions call the FastAPI backend at `VITE_API_BASE_URL`,
 * so swapping mocks for real data does not change any component.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
