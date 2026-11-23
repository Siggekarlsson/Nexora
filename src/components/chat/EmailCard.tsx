"use client";

import { Check, ExternalLink, Loader2, Mail, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { EmailDraft } from "@/lib/types";
import { connectApp } from "@/lib/connect";

type Result = { ok: true; link: string; to: string } | { ok: false; error: string; reconnect?: boolean };

/**
 * An email the agent drafted. Nothing is sent until the user clicks "Skicka" (or "Spara som utkast");
 * only then does the page call the send route.
 */
export function EmailCard({ draft, onChange }: { draft: EmailDraft; onChange: (d: EmailDraft) => void }) {
  const [busy, setBusy] = useState<"send" | "draft" | null>(null);
  const [error, setError] = useState<{ text: string; reconnect?: boolean } | null>(null);
  const set = (p: Partial<EmailDraft>) => onChange({ ...draft, ...p });

  if (draft.status === "sent" || draft.status === "saved") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(95,224,138,0.35)] bg-[rgba(95,224,138,0.12)] px-3.5 py-2.5 text-[13.5px] text-[#5fe08a]">
        <Check size={15} strokeWidth={2.5} />
        {draft.status === "sent" ? `Skickat till ${draft.sentTo || draft.to}` : "Sparat som utkast i Gmail"}
        {draft.link && (
          <a href={draft.link} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80">
            Öppna i Gmail <ExternalLink size={12} />
          </a>
        )}
      </div>
    );
  }
  if (draft.status === "cancelled") return <div className="mt-3 text-[12.5px] text-faint">Mejlutkastet avbröts.</div>;

  const submit = async (mode: "send" | "draft") => {
    setBusy(mode);
    setError(null);
    const r = (await fetch("/api/integrations/gmail/send", {
      method: "POST",
      headers: { "content-type": "application/json", "x-nexora-action": "email-card" },
      body: JSON.stringify({ to: draft.to, cc: draft.cc, subject: draft.subject, body: draft.body, threadId: draft.threadId, mode }),
    })
      .then((res) => res.json())
      .catch(() => ({ ok: false, error: "Nexora could not reach the server." }))) as Result;
    setBusy(null);
    if (r.ok) set({ status: mode === "send" ? "sent" : "saved", sentTo: r.to, link: r.link });
    else setError({ text: r.error, reconnect: r.reconnect });
  };

  const field = "w-full rounded-lg border border-line bg-fg/[0.03] px-3 py-2 text-[13.5px] outline-none focus:border-fg/30";
  return (
    <div className="glass mt-3 rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-medium">
        <Mail size={15} className="text-muted" /> {draft.threadId ? "Svar i tråden" : "Nytt mejl"}
        <span className="text-[12px] font-normal text-muted">· skickas först när du klickar Skicka</span>
      </div>
      <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[12.5px] text-muted">
        <label htmlFor="em-to">Till</label>
        <input id="em-to" value={draft.to} onChange={(e) => set({ to: e.target.value })} className={field} placeholder="namn@foretag.se" />
        <label htmlFor="em-cc">Kopia</label>
        <input id="em-cc" value={draft.cc ?? ""} onChange={(e) => set({ cc: e.target.value })} className={field} />
        <label htmlFor="em-subject">Ämne</label>
        <input id="em-subject" value={draft.subject} onChange={(e) => set({ subject: e.target.value })} className={field} />
      </div>
      <textarea
        aria-label="Text"
        value={draft.body}
        onChange={(e) => set({ body: e.target.value })}
        rows={Math.min(14, Math.max(5, draft.body.split("\n").length + 1))}
        className={`${field} mt-2 resize-y leading-relaxed`}
      />
      {error && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#ff6b8b]/30 bg-[#ff6b8b]/10 px-3 py-2 text-[12.5px] text-[#ff9fb4]">
          {error.reconnect ? "Koppla om Gmail för att kunna skicka." : `Det gick inte: ${error.text}`}
          {error.reconnect && (
            <button onClick={() => connectApp("gmail", undefined, true)} className="inline-flex items-center gap-1 rounded-full bg-cta px-3 py-1 text-[12px] font-medium text-cta-fg">
              <RefreshCw size={12} /> Koppla om Gmail
            </button>
          )}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => submit("send")} disabled={!!busy || !draft.to.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-cta px-4 py-1.5 text-[13px] font-medium text-cta-fg transition hover:opacity-90 disabled:opacity-50">
          {busy === "send" && <Loader2 size={13} className="animate-spin" />} Skicka
        </button>
        <button onClick={() => submit("draft")} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-[13px] text-fg/90 hover:bg-hover disabled:opacity-50">
          {busy === "draft" && <Loader2 size={13} className="animate-spin" />} Spara som utkast
        </button>
        <button onClick={() => set({ status: "cancelled" })} disabled={!!busy} className="rounded-full px-3 py-1.5 text-[13px] text-muted hover:bg-hover hover:text-fg">
          Avbryt
        </button>
      </div>
    </div>
  );
}
