/** TTL simple para caché Redux de recursos públicos (sin React Query). */
export const PUBLIC_STALE_MS = 5 * 60 * 1000;

export function isFresh(lastFetchedAt, staleMs = PUBLIC_STALE_MS) {
  return typeof lastFetchedAt === "number" && Date.now() - lastFetchedAt < staleMs;
}

/**
 * ¿Hay que despachar el thunk público?
 * - idle / failed → sí
 * - loading → no (evita doble fetch)
 * - succeeded pero stale → sí
 */
export function shouldFetchPublic(status, lastFetchedAt, staleMs = PUBLIC_STALE_MS) {
  if (status === "loading") return false;
  if (status === "idle" || status === "failed") return true;
  if (status === "succeeded") return !isFresh(lastFetchedAt, staleMs);
  return true;
}
