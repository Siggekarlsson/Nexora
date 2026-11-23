import { setState } from "@/lib/store";

/**
 * Starts a connection: the server sends the browser to the app's own sign-in page (via Composio).
 * `force` signs in again even when the app is already connected (for example to grant send access).
 */
export function connectApp(id: string, next?: "/onboarding", force = false) {
  const q = new URLSearchParams({ ...(next ? { next } : {}), ...(force ? { force: "1" } : {}) }).toString();
  window.location.href = `/api/integrations/${encodeURIComponent(id)}/connect${q ? `?${q}` : ""}`;
}

/** Reads which apps are really connected (from Composio) and stores it, so every page shows the same state. */
export async function refreshConnections() {
  try {
    const st = (await fetch("/api/integrations/status", { cache: "no-store" }).then((r) => r.json())) as { apps: Record<string, { connected: boolean }> };
    setState(() => ({ integrations: Object.fromEntries(Object.entries(st.apps).map(([id, a]) => [id, a.connected])) }));
    return st;
  } catch {
    return null;
  }
}
