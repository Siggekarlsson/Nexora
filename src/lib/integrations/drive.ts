import type { DriveConn } from "./vault";

/** Drive uses the same Google OAuth client as Gmail. */
export const driveConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const DRIVE_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/drive.readonly"];

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3";
const MAX_CHARS = 20000;

async function token(params: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...params }),
  });
  const t = await res.json();
  if (!res.ok) throw new Error(t.error_description ?? t.error ?? `Google ${res.status}`);
  return t as { access_token: string; refresh_token?: string; expires_in: number; id_token?: string };
}

/** Reads the email claim from Google's id_token (it came straight from Google over TLS, so no signature check is needed here). */
function emailFromIdToken(idToken?: string) {
  try {
    return idToken ? (JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")).email as string) : undefined;
  } catch {
    return undefined;
  }
}

export async function exchangeCode(code: string, redirectUri: string): Promise<DriveConn> {
  const t = await token({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });
  return { refresh: t.refresh_token, access: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000, email: emailFromIdToken(t.id_token) };
}

/** Returns a valid connection, refreshing the access token if needed. `changed` tells the caller to re-save it. */
export async function freshDrive(conn: DriveConn): Promise<{ conn: DriveConn; changed: boolean }> {
  if (conn.expires > Date.now() || !conn.refresh) return { conn, changed: false };
  try {
    const t = await token({ refresh_token: conn.refresh, grant_type: "refresh_token" });
    return { conn: { ...conn, access: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 }, changed: true };
  } catch {
    throw new Error("Google Drive access expired, reconnect Google Drive");
  }
}

export type DriveFile = { id: string; name: string; mimeType: string; modifiedTime: string; webViewLink?: string };

const TEXT_TYPES = ["text/plain", "text/markdown", "text/csv", "text/x-markdown"];
const TEXT_EXT = /\.(txt|md|markdown|csv)$/i;
export const isReadable = (f: DriveFile) => f.mimeType === "application/vnd.google-apps.document" || TEXT_TYPES.includes(f.mimeType) || TEXT_EXT.test(f.name);

/** Most recently modified files, newest first (folders and trashed files left out). */
export async function recentFiles(conn: DriveConn, max = 15): Promise<DriveFile[]> {
  const q = new URLSearchParams({
    pageSize: String(max),
    orderBy: "modifiedTime desc",
    q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
  });
  const res = await fetch(`${API}/files?${q}`, { headers: { authorization: `Bearer ${conn.access}` } });
  if (!res.ok) throw new Error(`Google Drive ${res.status}`);
  return ((await res.json()).files ?? []) as DriveFile[];
}

/** Text of a Google Doc (exported as text/plain) or a txt/md/csv file, capped at ~20,000 characters. */
export async function fileText(conn: DriveConn, f: DriveFile): Promise<string | null> {
  if (!isReadable(f)) return null;
  const url =
    f.mimeType === "application/vnd.google-apps.document"
      ? `${API}/files/${f.id}/export?mimeType=text%2Fplain`
      : `${API}/files/${f.id}?alt=media`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${conn.access}` } });
  if (!res.ok) return null;
  return (await res.text()).slice(0, MAX_CHARS);
}
