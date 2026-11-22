import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { integrationContext } from "@/lib/integrations/context";
import { writeConn } from "@/lib/integrations/vault";
import type { DepartmentId } from "@/lib/types";
import { systemPrompt } from "@/lib/agents";
import { mockReply } from "@/lib/mockReply";
import { agentTools, composioConfigured, describe, readUid, type FnTool } from "@/lib/integrations/composio";

/**
 * Chat endpoint. Provider order:
 * 1. Anthropic (ANTHROPIC_API_KEY, optional ANTHROPIC_MODEL)
 * 2. Groq, OpenAI-compatible (GROQ_API_KEY, optional GROQ_MODEL)
 * 3. Mock reply, so the UI works without any key.
 *
 * GET /api/chat reports which provider is active (never the key itself).
 */

type Msg = { role: "user" | "assistant"; content: string };
type Agent = { tools: FnTool[]; run: (name: string, args: Record<string, unknown>) => Promise<string> } | null;
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
      const { context, gmail, drive } = await integrationContext(req, last);
      const uid = readUid(req);
      const agent =
        composioConfigured() && uid
          ? await agentTools(uid).catch((e) => {
              console.error("[composio] agent tools failed:", describe(e));
              return null;
            })
          : null;
      const system =
        systemPrompt(body.agent, { skillName: body.skillName, company: body.company, about: body.about, docs: body.docs, webSearch: p === "anthropic" }) +
        context +
        (agent?.prompt ?? "");
      const raw = p === "anthropic" ? await anthropic(system, messages, agent) : await groq(system, messages, agent);
      const content = stripEcho(raw, last);
      const res = NextResponse.json({ content, provider: p });
      if (gmail) writeConn(res, "gmail", gmail);
      if (drive) writeConn(res, "drive", drive);
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

const parseArgs = (raw: unknown): Record<string, unknown> => {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  try {
    const v = JSON.parse(String(raw || "{}"));
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

async function anthropic(system: string, messages: Msg[], agent: Agent) {
  const client = new Anthropic({ apiKey: clean(process.env.ANTHROPIC_API_KEY) });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
  const convo: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
  let response: Anthropic.Message | undefined;
  const blocks: Anthropic.ContentBlock[] = [];
  const tools: Anthropic.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: 5 },
    ...(agent?.tools ?? []).map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: (t.function.parameters ?? { type: "object", properties: {} }) as Anthropic.Tool.InputSchema,
    })),
  ];
  try {
    // Web search runs on Anthropic's servers and can pause; app tools run here. Loop a few rounds.
    for (let i = 0; i < 8; i++) {
      response = await client.messages.create({ model, max_tokens: 4096, system, tools, messages: convo });
      if (response.stop_reason === "pause_turn") {
        blocks.push(...response.content);
        convo.push({ role: "assistant", content: response.content });
        continue;
      }
      if (response.stop_reason === "tool_use" && agent) {
        convo.push({ role: "assistant", content: response.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const b of response.content) {
          if (b.type === "tool_use") results.push({ type: "tool_result", tool_use_id: b.id, content: await agent.run(b.name, parseArgs(b.input)) });
        }
        convo.push({ role: "user", content: results });
        continue;
      }
      blocks.push(...response.content);
      break;
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

type GroqMsg = Record<string, unknown>;

async function groq(system: string, messages: Msg[], agent: Agent) {
  const key = clean(process.env.GROQ_API_KEY)!;
  let model = process.env.GROQ_MODEL ?? GROQ_DEFAULT;
  const convo: GroqMsg[] = [{ role: "system", content: system }, ...messages];
  for (let i = 0; i < 6; i++) {
    const msg = await groqCall(key, model, convo, agent?.tools, (m) => (model = m));
    const calls = (msg.tool_calls ?? []) as { id: string; function: { name: string; arguments: string } }[];
    if (!calls.length || !agent) return (msg.content as string) ?? "";
    convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
    for (const c of calls) convo.push({ role: "tool", tool_call_id: c.id, content: await agent.run(c.function.name, parseArgs(c.function.arguments)) });
  }
  return "I looked through your connected apps but could not finish the answer. Try a narrower question.";
}

async function groqCall(key: string, model: string, convo: GroqMsg[], tools: FnTool[] | undefined, setModel: (m: string) => void) {
  const call = (m: string) =>
    fetch(`${GROQ_URL}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: m, max_tokens: 1024, messages: convo, ...(tools?.length ? { tools, tool_choice: "auto" } : {}) }),
    });

  let res = await call(model);
  let data = await res.json().catch(() => ({}));

  // If the model was retired or renamed, pick another available chat model and retry once.
  if (!res.ok && (res.status === 404 || res.status === 400) && /model/i.test(JSON.stringify(data))) {
    const fallback = await groqFallbackModel(key);
    if (fallback) {
      setModel(fallback);
      res = await call(fallback);
      data = await res.json().catch(() => ({}));
    }
  }
  if (!res.ok) {
    const hint = res.status === 401 ? " – check that GROQ_API_KEY in Vercel is correct and redeploy" : "";
    throw new ProviderError(`Groq API ${res.status}${data?.error?.message ? ` (${data.error.message})` : ""}${hint}`);
  }
  return (data.choices?.[0]?.message ?? {}) as GroqMsg;
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
