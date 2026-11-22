import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { integrationContext } from "@/lib/integrations/context";
import { writeConn } from "@/lib/integrations/vault";
import type { DepartmentId } from "@/lib/types";
import { systemPrompt } from "@/lib/agents";
import { mockReply } from "@/lib/mockReply";

/**
 * Chat endpoint. Provider order:
 * 1. Anthropic (ANTHROPIC_API_KEY, optional ANTHROPIC_MODEL)
 * 2. Groq, OpenAI-compatible (GROQ_API_KEY, optional GROQ_MODEL)
 * 3. Mock reply, so the UI works without any key.
 *
 * GET /api/chat reports which provider is active (never the key itself).
 */

type Msg = { role: "user" | "assistant"; content: string };
type Body = {
  agent: DepartmentId;
  skillName?: string;
  docCount?: number;
  company?: string;
  about?: string;
  docs?: { name: string; text?: string }[];
  messages: Msg[];
};

const GROQ_URL = "https://api.groq.com/openai/v1";
const GROQ_DEFAULT = "llama-3.3-70b-versatile";

const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "") || undefined;

function provider() {
  if (clean(process.env.ANTHROPIC_API_KEY)) return "anthropic" as const;
  if (clean(process.env.GROQ_API_KEY)) return "groq" as const;
  return "mock" as const;
}

class ProviderError extends Error {}

export async function GET() {
  const p = provider();
  const model = p === "anthropic" ? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5" : p === "groq" ? process.env.GROQ_MODEL ?? GROQ_DEFAULT : null;
  return NextResponse.json({ provider: p, model });
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ content: "Bad request.", error: true }, { status: 400 });
  }
  // Providers expect the conversation to start with a user turn.
  const messages = body.messages.filter((m) => m.content?.trim());
  while (messages[0]?.role === "assistant") messages.shift();
  const last = messages[messages.length - 1]?.content ?? "";

  try {
    const p = provider();
    if (p !== "mock") {
      const { context, gmail } = await integrationContext(req, last);
      const system =
        systemPrompt(body.agent, { skillName: body.skillName, company: body.company, about: body.about, docs: body.docs, webSearch: p === "anthropic" }) + context;
      const raw = p === "anthropic" ? await anthropic(system, messages) : await groq(system, messages);
      const content = stripEcho(raw, last);
      const res = NextResponse.json({ content, provider: p });
      if (gmail) writeConn(res, "gmail", gmail);
      return res;
    }
    await new Promise((r) => setTimeout(r, 700));
    const note = "\n\n_Demo reply: no AI key is configured on the server. Add `GROQ_API_KEY` or `ANTHROPIC_API_KEY` in Vercel and redeploy._";
    return NextResponse.json({ content: mockReply(body.agent, last, body.skillName, body.docCount) + note, provider: p, mock: true });
  } catch (e) {
    const reason = e instanceof ProviderError ? e.message : "the AI service could not be reached";
    return NextResponse.json({ content: `The agent couldn't answer: ${reason}.`, error: true });
  }
}

async function anthropic(system: string, messages: Msg[]) {
  const client = new Anthropic({ apiKey: clean(process.env.ANTHROPIC_API_KEY) });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
  const convo: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
  let response: Anthropic.Message | undefined;
  const blocks: Anthropic.ContentBlock[] = [];
  try {
    // Web search runs on Anthropic's servers; a long search turn can pause, so resume it a few times.
    for (let i = 0; i < 4; i++) {
      response = await client.messages.create({
        model,
        max_tokens: 4096,
        system,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
        messages: convo,
      });
      blocks.push(...response.content);
      if (response.stop_reason !== "pause_turn") break;
      convo.push({ role: "assistant", content: response.content });
    }
  } catch (e) {
    if (e instanceof Anthropic.APIError) throw new ProviderError(`Anthropic API ${e.status ?? ""} (${e.message})`);
    throw e;
  }
  const text: string[] = [];
  const sources = new Map<string, string>();
  for (const block of blocks) {
    if (block.type !== "text") continue;
    text.push(block.text);
    for (const c of (block.citations ?? []) as { url?: string; title?: string | null }[]) if (c.url) sources.set(c.url, c.title || c.url);
  }
  let out = text.join("").trim();
  if (sources.size) out += "\n\n**Sources**\n" + [...sources].map(([url, title]) => `- [${title}](${url})`).join("\n");
  return out;
}

async function groq(system: string, messages: Msg[]) {
  const key = clean(process.env.GROQ_API_KEY)!;
  const call = (model: string) =>
    fetch(`${GROQ_URL}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: "system", content: system }, ...messages] }),
    });

  let res = await call(process.env.GROQ_MODEL ?? GROQ_DEFAULT);
  let data = await res.json().catch(() => ({}));

  // If the model was retired or renamed, pick another available chat model and retry once.
  if (!res.ok && (res.status === 404 || res.status === 400) && /model/i.test(JSON.stringify(data))) {
    const fallback = await groqFallbackModel(key);
    if (fallback) {
      res = await call(fallback);
      data = await res.json().catch(() => ({}));
    }
  }
  if (!res.ok) {
    const hint = res.status === 401 ? " – check that GROQ_API_KEY in Vercel is correct and redeploy" : "";
    throw new ProviderError(`Groq API ${res.status}${data?.error?.message ? ` (${data.error.message})` : ""}${hint}`);
  }
  return (data.choices?.[0]?.message?.content as string) ?? "";
}

async function groqFallbackModel(key: string) {
  const res = await fetch(`${GROQ_URL}/models`, { headers: { authorization: `Bearer ${key}` } });
  if (!res.ok) return null;
  const { data } = (await res.json()) as { data: { id: string; active?: boolean }[] };
  const ids = data.filter((m) => m.active !== false).map((m) => m.id).filter((id) => !/whisper|tts|guard|embed|vision/i.test(id));
  return ids.find((id) => /llama.*70b/i.test(id)) ?? ids.find((id) => /llama|gpt-oss|qwen/i.test(id)) ?? ids[0] ?? null;
}

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Drops a first line that just repeats the user's question (e.g. "## Which companies do we cover?"). */
function stripEcho(content: string, question: string) {
  const [first, ...rest] = content.trimStart().split("\n");
  const line = norm(first.replace(/^#+\s*|^\*\*|\*\*$/g, ""));
  const q = norm(question);
  if (line && q && (line === q || (line.length > 8 && q.includes(line)) || (q.length > 8 && line.includes(q) && line.length < q.length + 12))) {
    return rest.join("\n").trimStart();
  }
  return content;
}
