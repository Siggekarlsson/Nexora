import crypto from "node:crypto";
import type { ShopifyConn } from "./vault";

export const shopifyConfigured = () => !!(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET);
export const SHOPIFY_SCOPES = "read_orders,read_products";
const version = () => process.env.SHOPIFY_API_VERSION ?? "2026-07";

/** Accepts "my-store", "my-store.myshopify.com" or a full URL. Returns null if invalid. */
export function normaliseShop(input: string) {
  const s = input.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  const shop = s.endsWith(".myshopify.com") ? s : `${s}.myshopify.com`;
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop) ? shop : null;
}

/** Verifies the hmac Shopify adds to the OAuth callback. */
export function validHmac(params: URLSearchParams) {
  const hmac = params.get("hmac") ?? "";
  const msg = [...params.entries()].filter(([k]) => k !== "hmac" && k !== "signature").sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
  const digest = crypto.createHmac("sha256", process.env.SHOPIFY_API_SECRET!).update(msg).digest("hex");
  return hmac.length === digest.length && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(digest));
}

export async function exchangeCode(shop: string, code: string): Promise<ShopifyConn> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: process.env.SHOPIFY_API_KEY, client_secret: process.env.SHOPIFY_API_SECRET, code }),
  });
  const t = await res.json();
  if (!res.ok || !t.access_token) throw new Error(`Shopify ${res.status}`);
  const conn: ShopifyConn = { shop, token: t.access_token };
  try {
    conn.name = (await gql<{ shop: { name: string } }>(conn, "{ shop { name } }")).shop.name;
  } catch {}
  return conn;
}

async function gql<T>(conn: ShopifyConn, query: string): Promise<T> {
  const res = await fetch(`https://${conn.shop}/admin/api/${version()}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shopify-access-token": conn.token },
    body: JSON.stringify({ query }),
  });
  const j = await res.json();
  if (!res.ok || j.errors) throw new Error(`Shopify ${res.status}`);
  return j.data as T;
}

export async function shopSnapshot(conn: ShopifyConn) {
  type O = { name: string; createdAt: string; displayFinancialStatus: string; totalPriceSet: { shopMoney: { amount: string; currencyCode: string } } };
  type P = { title: string; totalInventory: number | null; status: string };
  const d = await gql<{ shop: { name: string }; orders: { nodes: O[] }; products: { nodes: P[] } }>(
    conn,
    `{ shop { name }
       orders(first: 15, sortKey: CREATED_AT, reverse: true) { nodes { name createdAt displayFinancialStatus totalPriceSet { shopMoney { amount currencyCode } } } }
       products(first: 15, sortKey: UPDATED_AT, reverse: true) { nodes { title totalInventory status } } }`,
  );
  return d;
}
