import crypto from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Stores OAuth tokens per browser in an encrypted, httpOnly cookie.
 * Swap for a database table (e.g. Supabase) once users can log in.
 */

export type GmailConn = { refresh?: string; access: string; expires: number; email?: string };
export type ShopifyConn = { shop: string; token: string; name?: string };
type Conns = { gmail: GmailConn; shopify: ShopifyConn };
export type IntegrationId = keyof Conns;

function secret() {
  const s = process.env.INTEGRATIONS_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? process.env.SHOPIFY_API_SECRET;
  if (!s) throw new Error("No secret configured for integrations");
  return crypto.createHash("sha256").update(s).digest();
}

export function seal(value: unknown) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", secret(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64url");
}

export function unseal<T>(raw?: string): T | null {
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, "base64url");
    const d = crypto.createDecipheriv("aes-256-gcm", secret(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}

const cookieName = (id: IntegrationId) => `nx_${id}`;
const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export function readConn<K extends IntegrationId>(req: NextRequest, id: K): Conns[K] | null {
  return unseal<Conns[K]>(req.cookies.get(cookieName(id))?.value);
}

export function writeConn<K extends IntegrationId>(res: NextResponse, id: K, value: Conns[K]) {
  res.cookies.set(cookieName(id), seal(value), { ...opts, maxAge: 60 * 60 * 24 * 180 });
}

export function clearConn(res: NextResponse, id: IntegrationId) {
  res.cookies.set(cookieName(id), "", { ...opts, maxAge: 0 });
}

/** One-time OAuth state, kept in a short-lived cookie to stop forged callbacks. */
export function newState(res: NextResponse, id: IntegrationId, extra = "") {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookies.set(`nx_state_${id}`, `${state}:${extra}`, { ...opts, maxAge: 600 });
  return state;
}

export function checkState(req: NextRequest, id: IntegrationId, state: string | null) {
  const saved = req.cookies.get(`nx_state_${id}`)?.value ?? "";
  const [s, extra] = saved.split(":");
  if (!state || !s || s.length !== state.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(state))) return null;
  return extra ?? "";
}

export const origin = (req: NextRequest) => process.env.APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
