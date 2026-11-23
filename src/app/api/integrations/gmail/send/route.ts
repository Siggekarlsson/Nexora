import { NextResponse, type NextRequest } from "next/server";
import { composioConfigured, readUid, sendGmail, type EmailDraft } from "@/lib/integrations/composio";

/**
 * Sends an email, or saves it as a Gmail draft, after the user clicked "Skicka" or "Spara som utkast"
 * in the chat's email card. The chat agent has no way to call this: it only returns a draft.
 * Requests must come from Nexora's own page (same origin) and carry the card's header.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (req.headers.get("x-nexora-action") !== "email-card" || !origin || new URL(origin).host !== req.headers.get("host")) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  }
  const uid = readUid(req);
  if (!composioConfigured() || !uid) return NextResponse.json({ ok: false, error: "Gmail is not connected.", reconnect: true }, { status: 400 });

  const b = (await req.json().catch(() => null)) as (Partial<EmailDraft> & { mode?: string }) | null;
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  if (!b) return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  const draft: EmailDraft = { to: s(b.to, 2000), cc: s(b.cc, 2000), subject: s(b.subject, 500), body: s(b.body, 50_000), threadId: s(b.threadId, 100) || undefined };
  const result = await sendGmail(uid, draft, b.mode === "draft" ? "draft" : "send");
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
