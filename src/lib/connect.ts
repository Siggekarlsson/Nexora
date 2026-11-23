/** Starts a connection: the server sends the browser to the app's own sign-in page (via Composio). */
export function connectApp(id: string, next?: "/onboarding") {
  window.location.href = `/api/integrations/${encodeURIComponent(id)}/connect${next ? `?next=${next}` : ""}`;
}
