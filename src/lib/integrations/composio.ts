import { randomUUID } from "node:crypto";
import { Composio } from "@composio/core";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Composio handles the OAuth sign-in for Gmail, Google Drive and Shopify with its own
 * verified apps, so no Google Cloud or Shopify app setup is needed. Only COMPOSIO_API_KEY.
 *
 * There is no login yet, so each browser gets a random user id in an httpOnly cookie,
 * and Composio keeps that user's connections.
 */

export type AppId = "gmail" | "drive" | "shopify";
export const TOOLKIT: Record<AppId, string> = { gmail: "gmail", drive: "googledrive", shopify: "shopify" };
const APPS = Object.keys(TOOLKIT) as AppId[];

const key = () => process.env.COMPOSIO_API_KEY?.trim().replace(/^["']|["']$/g, "") || undefined;
export const composioConfigured = () => !!key();

let client: Composio | null = null;
const composio = () => (client ??= new Composio({ apiKey: key(), allowTracking: false }));

const UID = "nx_uid";
const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };

/** The browser's user id, or null if it has none yet. */
export const readUid = (req: NextRequest) => {
  const v = req.cookies.get(UID)?.value;
  return v && /^nx_[0-9a-f-]{36}$/.test(v) ? v : null;
};

/** The browser's user id, creating one (and setting the cookie on `res`) if needed. */
export function ensureUid(req: NextRequest, res: NextResponse) {
  const existing = readUid(req);
  if (existing) return existing;
  const uid = `nx_${randomUUID()}`;
  res.cookies.set(UID, uid, cookieOpts);
  return uid;
}

const session = (uid: string) => composio().create(uid, { toolkits: Object.values(TOOLKIT) });

/** Starts a sign-in and returns the URL to send the browser to. */
export async function connectUrl(uid: string, app: AppId, callbackUrl: string) {
  const s = await session(uid);
  const req = await s.authorize(TOOLKIT[app], { callbackUrl });
  if (!req.redirectUrl) throw new Error("Composio returned no sign-in link");
  return req.redirectUrl;
}

type AppStatus = { connected: boolean; accountId?: string };

/** Which of the apps this user has an active connection for. */
export async function appStatus(uid: string): Promise<Record<AppId, AppStatus>> {
  const s = await session(uid);
  const { items } = await s.toolkits({ toolkits: Object.values(TOOLKIT) });
  const out = {} as Record<AppId, AppStatus>;
  for (const app of APPS) {
    const item = items.find((i) => i.slug === TOOLKIT[app]);
    out[app] = { connected: !!item?.connection?.isActive, accountId: item?.connection?.connectedAccount?.id };
  }
  return out;
}

export async function disconnect(uid: string, app: AppId) {
  const { accountId } = (await appStatus(uid))[app];
  if (accountId) await composio().connectedAccounts.delete(accountId);
}

/** Runs one Composio tool as this user and returns its data, or throws with the reason. */
async function run(s: Awaited<ReturnType<typeof session>>, slug: string, args: Record<string, unknown>) {
  const r = await s.execute(slug, args);
  if (r.resultType !== "completed") throw new Error(typeof r.error === "string" && r.error ? r.error : `${slug} ${r.resultType}`);
  return r.data as Record<string, unknown>;
}

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
/** Finds the first array under any of the given keys, also one level down (tools wrap results differently). */
function pick(data: Record<string, unknown>, keys: string[]) {
  for (const k of keys) if (Array.isArray(data[k])) return arr(data[k]);
  for (const v of Object.values(data)) if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of keys) if (Array.isArray((v as Record<string, unknown>)[k])) return arr((v as Record<string, unknown>)[k]);
  }
  return [];
}

const MAX_FILE = 20_000;
const READABLE = /^(application\/vnd\.google-apps\.document|text\/(plain|markdown|csv))$/;

/** Live data for the chat: what's connected and relevant to the message. */
export async function composioContext(uid: string, want: Record<AppId, boolean>) {
  if (!APPS.some((a) => want[a])) return [];
  const status = await appStatus(uid);
  const s = await session(uid);
  const parts: string[] = [];

  if (want.gmail && status.gmail.connected) {
    try {
      const data = await run(s, "GMAIL_FETCH_EMAILS", { max_results: 15, label_ids: ["INBOX"], verbose: false, include_payload: false });
      const mails = pick(data, ["messages"]);
      parts.push(
        `Live data from the user's Gmail, latest ${mails.length} inbox messages:\n` +
          mails
            .map((m, i) => `${i + 1}. From: ${str(m.sender ?? m.from)} | Subject: ${str(m.subject)} | ${str(m.messageTimestamp ?? m.date)}\n   ${str(m.preview && typeof m.preview === "object" ? (m.preview as { body?: string }).body : m.snippet ?? m.messageText).slice(0, 300)}`)
            .join("\n"),
      );
    } catch (e) {
      parts.push(`Gmail is connected but could not be read (${(e as Error).message}). Tell the user.`);
    }
  }

  if (want.drive && status.drive.connected) {
    try {
      const data = await run(s, "GOOGLEDRIVE_FIND_FILE", {
        q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
        orderBy: "modifiedTime desc",
        pageSize: 15,
      });
      const files = pick(data, ["files"]);
      const readable = files.filter((f) => READABLE.test(str(f.mimeType))).slice(0, 3);
      const texts = await Promise.all(
        readable.map(async (f) => {
          try {
            const d = await run(s, "GOOGLEDRIVE_DOWNLOAD_FILE", {
              fileId: str(f.id),
              ...(str(f.mimeType).startsWith("application/vnd.google-apps") ? { mime_type: "text/plain" } : {}),
            });
            return fileContent(d);
          } catch {
            return null;
          }
        }),
      );
      parts.push(
        `Live data from the user's Google Drive, ${files.length} most recently modified files:\n` +
          files.map((f) => `- ${str(f.name)} | ${str(f.mimeType)} | modified ${str(f.modifiedTime).slice(0, 10)}${f.webViewLink ? ` | ${str(f.webViewLink)}` : ""}`).join("\n") +
          readable.map((f, i) => (texts[i] ? `\n\n<drive_file name="${str(f.name)}">\n${texts[i]}\n</drive_file>` : "")).join(""),
      );
    } catch (e) {
      parts.push(`Google Drive is connected but could not be read (${(e as Error).message}). Tell the user.`);
    }
  }

  if (want.shopify && status.shopify.connected) {
    try {
      const [o, p] = await Promise.all([
        run(s, "SHOPIFY_GET_ORDERS_WITH_FILTERS", { status: "any", limit: 15, fields: "name,created_at,total_price,currency,financial_status,fulfillment_status" }),
        run(s, "SHOPIFY_GET_PRODUCTS_PAGINATED", { limit: 15, fields: "title,status,variants" }),
      ]);
      const orders = pick(o, ["orders"]);
      const products = pick(p, ["products"]);
      const stock = (prod: Record<string, unknown>) => {
        const v = arr(prod.variants).map((x) => Number(x.inventory_quantity)).filter((n) => !Number.isNaN(n));
        return v.length ? v.reduce((a, b) => a + b, 0) : "n/a";
      };
      parts.push(
        `Live data from the user's Shopify store:\nLatest orders:\n` +
          orders.map((x) => `- ${str(x.name)} ${str(x.created_at).slice(0, 10)} ${str(x.total_price)} ${str(x.currency)} (${str(x.financial_status)}, ${str(x.fulfillment_status) || "unfulfilled"})`).join("\n") +
          `\nProducts:\n` +
          products.map((x) => `- ${str(x.title)} | stock ${stock(x)} | ${str(x.status)}`).join("\n"),
      );
    } catch (e) {
      parts.push(`Shopify is connected but could not be read (${(e as Error).message}). Tell the user.`);
    }
  }
  return parts;
}

/** GOOGLEDRIVE_DOWNLOAD_FILE returns the content inline or as a short-lived file URL. */
async function fileContent(d: Record<string, unknown>) {
  const f = (d.downloaded_file_content ?? d.file ?? d) as Record<string, unknown> | string;
  if (typeof f === "string") return f.slice(0, MAX_FILE);
  for (const k of ["content", "text", "data"]) if (typeof f[k] === "string") return (f[k] as string).slice(0, MAX_FILE);
  const url = str(f.s3url ?? f.s3_url ?? f.url);
  if (/^https:\/\/[^/]*(amazonaws\.com|composio\.dev)\//.test(url)) {
    const res = await fetch(url);
    if (res.ok) return (await res.text()).slice(0, MAX_FILE);
  }
  return null;
}

/** Connect route via Composio: sends the browser to Composio's sign-in page for the app. */
export async function composioConnect(req: NextRequest, app: AppId, appOrigin: string) {
  const res = NextResponse.redirect(`${appOrigin}/integrations`);
  try {
    const uid = ensureUid(req, res);
    const url = await connectUrl(uid, app, `${appOrigin}/api/integrations/composio/callback?app=${app}`);
    res.headers.set("location", url);
  } catch {
    res.headers.set("location", `${appOrigin}/integrations?error=${app}_failed`);
  }
  return res;
}
