import Anthropic from "@anthropic-ai/sdk";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Server-side helper for one-shot JSON answers (onboarding).
 * Uses Anthropic when ANTHROPIC_API_KEY is set (with web search), else Groq, else returns null.
 */

const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "") || undefined;
const GROQ_URL = "https://api.groq.com/openai/v1";

export const aiProvider = () =>
  clean(process.env.ANTHROPIC_API_KEY) ? ("anthropic" as const) : clean(process.env.GROQ_API_KEY) ? ("groq" as const) : null;

/** Pulls the first JSON object out of a model answer. */
export function parseJSON<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export async function askJSON<T>(system: string, user: string, opts: { webSearch?: boolean; maxTokens?: number } = {}): Promise<T | null> {
  const p = aiProvider();
  if (!p) return null;
  const maxTokens = opts.maxTokens ?? 4000;
  if (p === "anthropic") {
    const client = new Anthropic({ apiKey: clean(process.env.ANTHROPIC_API_KEY) });
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
    const tools: Anthropic.ToolUnion[] = opts.webSearch ? [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }] : [];
    const convo: Anthropic.MessageParam[] = [{ role: "user", content: user }];
    const text: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await client.messages.create({ model, max_tokens: maxTokens, system, ...(tools.length ? { tools } : {}), messages: convo });
      for (const b of r.content) if (b.type === "text") text.push(b.text);
      if (r.stop_reason !== "pause_turn") break;
      convo.push({ role: "assistant", content: r.content });
    }
    return parseJSON<T>(text.join(""));
  }
  const key = clean(process.env.GROQ_API_KEY)!;
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  const res = await fetch(`${GROQ_URL}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens: Math.min(maxTokens, 8000),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parseJSON<T>(data.choices?.[0]?.message?.content ?? "");
}

/** Normalises what the user typed ("acme.com", "https://acme.com/x") to an https origin URL, or null. */
export function normaliseSite(input: string): URL | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".") || u.username || u.password || u.port) return null;
    return u;
  } catch {
    return null;
  }
}

function privateIp(ip: string) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/** Fetches a public page as plain text (no private addresses, no redirects off the web, max ~200 KB). */
export async function readPage(url: URL, hops = 0): Promise<string> {
  if (hops > 3) return "";
  if (isIP(url.hostname) || /(^|\.)(localhost|internal|local)$/i.test(url.hostname)) return "";
  const addrs = await lookup(url.hostname, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) return "";
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
    headers: { "user-agent": "Mozilla/5.0 (compatible; NexoraBot/1.0)", accept: "text/html" },
  }).catch(() => null);
  if (!res) return "";
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    const next = loc ? normaliseSite(new URL(loc, url).toString()) : null;
    return next ? readPage(next, hops + 1) : "";
  }
  if (!res.ok || !/html|text/.test(res.headers.get("content-type") ?? "")) return "";
  const html = (await res.text()).slice(0, 200_000);
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? "";
  const meta = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i.exec(html)?.[1] ?? "";
  const body = html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${title}\n${meta}\n${body}`.slice(0, 12_000);
}
