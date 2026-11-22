import { NextResponse } from "next/server";
import type { DepartmentId } from "@/lib/types";
import { systemPrompt } from "@/lib/agents";
import { mockReply } from "@/lib/mockReply";

/**
 * Chat endpoint. Uses the Anthropic Messages API when ANTHROPIC_API_KEY is set,
 * otherwise Groq (OpenAI-compatible) when GROQ_API_KEY is set, otherwise
 * returns a mock reply so the UI works out of the box.
 */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch {
    return NextResponse.json({ content: "The agent couldn't reach the AI service right now. Try again in a moment.", error: true });
  }
}

async function handle(req: Request) {
  const body = (await req.json()) as {
    agent: DepartmentId;
    skillName?: string;
    docCount?: number;
    messages: { role: "user" | "assistant"; content: string }[];
  };
  const last = body.messages[body.messages.length - 1]?.content ?? "";
  const key = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!key && groqKey) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [{ role: "system", content: systemPrompt(body.agent, body.skillName) }, ...body.messages],
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ content: `The ${body.agent} agent couldn't answer right now (API ${res.status}).`, error: true }, { status: 200 });
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? "" });
  }

  if (!key) {
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json({ content: mockReply(body.agent, last, body.skillName, body.docCount), mock: true });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 1024,
      system: systemPrompt(body.agent, body.skillName),
      messages: body.messages,
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ content: `The ${body.agent} agent couldn't answer right now (API ${res.status}).`, error: true }, { status: 200 });
  }
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const content = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return NextResponse.json({ content });
}
