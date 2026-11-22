"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChevronDown, Mic, Plus } from "lucide-react";
import { useState } from "react";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { brain } from "@/data/departments";
import { Markdown } from "@/components/chat/Markdown";
import { Popover } from "@/components/ui/Popover";
import { agentContext } from "@/lib/store";

type Msg = { role: "user" | "assistant"; content: string };
const starters = ["What needs me first today?", "Why is cost per lead going up?", "Summarise this week across all dashboards"];
const previous = ["Weekly roll-up, 17 Nov", "Pipeline review, 14 Nov", "Ad spend check, 10 Nov"];

export function BrainPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const send = async (t: string) => {
    if (!t.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next);
    setText("");
    setBusy(true);
    const lower = t.toLowerCase();
    let content: string;
    if (lower.includes("first") || lower.includes("needs me")) {
      content = "### 4 things need you\n- **Paid Ads:** cost per lead up 7.7%, review the webinar campaign\n- **Pipeline:** 3 deals stale for 14 days, ask Sales for next steps\n- **Finance:** 2 invoices over 30 days overdue, approve reminders\n- **Content:** Monday's newsletter isn't scheduled\n\nStart with Finance, it's the only one with cash at stake.";
    } else {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agent: "brain", ...agentContext(), messages: next }) });
      content = (await res.json().catch(() => null))?.content ?? "Company Brain couldn't answer right now.";
    }
    setMsgs((m) => [...m, { role: "assistant", content }]);
    setBusy(false);
  };

  return (
    <div className="glass flex h-full flex-col rounded-2xl">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${brain.color}22` }}>
          <PixelAvatar id="brain" color={brain.color} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="whitespace-nowrap text-[14px] font-medium">Company Brain</div>
          <div className="whitespace-nowrap text-[11px] text-muted">Sees every dashboard</div>
        </div>
        <button onClick={() => setMsgs([])} className="btn btn-glass h-8 px-2.5 text-xs"><Plus size={13} /> New Thread</button>
        <div className="relative">
          <button onClick={() => setPrevOpen((o) => !o)} className="btn btn-glass h-8 px-2.5 text-xs">Previous <ChevronDown size={13} /></button>
          <Popover open={prevOpen} onClose={() => setPrevOpen(false)} className="w-56">
            {previous.map((p) => (
              <button key={p} onClick={() => { setPrevOpen(false); send(`Recap: ${p}`); }} className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-muted hover:bg-hover hover:text-fg">{p}</button>
            ))}
          </Popover>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {msgs.length === 0 ? (
          <div>
            <p className="text-[13.5px] leading-6 text-muted">
              I read every dashboard your team has connected, so you can ask across them. Ask what changed, why a number moved, or what needs you, and I&apos;ll point to the dashboard and the owner.
            </p>
            <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-faint">Start with</div>
            <div className="mt-2 space-y-2">
              {starters.map((s) => (
                <button key={s} onClick={() => send(s)} className="w-full rounded-xl border border-line px-3.5 py-2.5 text-left text-[13px] text-fg/85 transition hover:bg-hover">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-active px-3.5 py-2 text-[13.5px]">{m.content}</div></div>
              ) : (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><Markdown text={m.content} /></motion.div>
              ),
            )}
            <AnimatePresence>{busy && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted">Company Brain is reading your dashboards…</motion.div>}</AnimatePresence>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="m-3 flex items-center gap-2 rounded-2xl border border-line bg-hover py-1.5 pl-4 pr-1.5">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask Company Brain about this tab" className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-faint" />
        <button type="button" onClick={() => setListening((l) => !l)} className={`icon-btn h-8 w-8 ${listening ? "text-[#ff6b8b]" : ""}`} aria-label="Voice input">
          <Mic size={16} className={listening ? "animate-pulse" : ""} />
        </button>
        <button disabled={!text.trim()} className="flex h-8 w-8 items-center justify-center rounded-full bg-cta text-cta-fg disabled:opacity-30" aria-label="Send"><ArrowUp size={15} /></button>
      </form>
    </div>
  );
}
