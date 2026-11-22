import type { GmailConn } from "./vault";

export const gmailConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const GMAIL_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/gmail.readonly"];

export async function exchangeCode(code: string, redirectUri: string): Promise<GmailConn> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const t = await res.json();
  if (!res.ok) throw new Error(t.error_description ?? t.error ?? `Google ${res.status}`);
  const conn: GmailConn = { refresh: t.refresh_token, access: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 };
  const me = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { authorization: `Bearer ${conn.access}` } });
  if (me.ok) conn.email = (await me.json()).emailAddress;
  return conn;
}

/** Returns a valid connection, refreshing the access token if needed. `changed` tells the caller to re-save it. */
export async function freshGmail(conn: GmailConn): Promise<{ conn: GmailConn; changed: boolean }> {
  if (conn.expires > Date.now() || !conn.refresh) return { conn, changed: false };
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: conn.refresh,
      grant_type: "refresh_token",
    }),
  });
  const t = await res.json();
  if (!res.ok) throw new Error("Gmail access expired, reconnect Gmail");
  return { conn: { ...conn, access: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 }, changed: true };
}

export type Mail = { from: string; subject: string; date: string; snippet: string };

export async function recentMail(conn: GmailConn, query = "", max = 10): Promise<Mail[]> {
  const auth = { authorization: `Bearer ${conn.access}` };
  const list = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&q=${encodeURIComponent(query || "in:inbox")}`, { headers: auth });
  if (!list.ok) throw new Error(`Gmail ${list.status}`);
  const ids = ((await list.json()).messages ?? []) as { id: string }[];
  return Promise.all(
    ids.map(async ({ id }) => {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers: auth });
      const m = await r.json();
      const h = (n: string) => (m.payload?.headers ?? []).find((x: { name: string }) => x.name === n)?.value ?? "";
      return { from: h("From"), subject: h("Subject"), date: h("Date"), snippet: m.snippet ?? "" };
    }),
  );
}
