import { NextResponse } from "next/server";
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
type Body = { agent: DepartmentId; skillName?: string; docCount?: number; messages: Msg[] };

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

export async function POST(req: Request) {
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
  const system = systemPrompt(body.agent, body.skillName);

  try {
    const p = provider();
    if (p === "anthropic") return NextResponse.json({ content: await anthropic(system, messages), provider: p });
    if (p === "groq") return NextResponse.json({ content: await groq(system, messages), provider: p });
    await new Promise((r) => setTimeout(r, 700));
    const note = "\n\n_Demo reply: no AI key is configured on the server. Add `GROQ_API_KEY` or `ANTHROPIC_API_KEY` in Vercel and redeploy._";
    return NextResponse.json({ content: mockReply(body.agent, last, body.skillName, body.docCount) + note, provider: p, mock: true });
  } catch (e) {
    const reason = e instanceof ProviderError ? e.message : "the AI service could not be reached";
    return NextResponse.json({ content: `The agent couldn't answer: ${reason}.`, error: true });
  }
}

async function anthropic(system: string, messages: Msg[]) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": clean(process.env.ANTHROPIC_API_KEY)!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5", max_tokens: 1024, system, messages }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ProviderError(`Anthropic API ${res.status}${data?.error?.message ? ` (${data.error.message})` : ""}`);
  return (data.content as { type: string; text?: string }[]).filter((b) => b.type === "text").map((b) => b.text).join("\n");
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
