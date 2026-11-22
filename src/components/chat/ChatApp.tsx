"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus, Sparkles, Wand2 } from "lucide-react";
import type { ChatMessage, DepartmentId, Thread } from "@/lib/types";
import { agentOrder, departmentColors, departmentName } from "@/data/departments";
import { allSkills } from "@/data/tree";
import { agentContext, getState, setState, uid, useStore } from "@/lib/store";
import { routeMessage } from "@/lib/routing";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { Composer, type ComposerTarget } from "./Composer";
import { Markdown } from "./Markdown";
import { siteConfig } from "@/config/site";

const suggestions = [
  "What do our documents say about renewals?",
  "Summarise the most recently uploaded file",
  "Which documents mention pricing?",
];

const builtIn = Object.fromEntries(allSkills.map((s) => [s.id, s]));
const findSkill = (id?: string | null) => (id ? builtIn[id] ?? getState().customSkills.find((s) => s.id === id) : undefined);

async function askAgent(thread: Thread): Promise<string> {
  const skill = findSkill(thread.skillId);
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agent: thread.departmentId,
      skillName: skill?.name,
      ...agentContext(),
      messages: thread.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await res.json().catch(() => null);
  return (data?.content as string) || `The agent couldn't answer (server error ${res.status}).`;
}

function updateThread(id: string, fn: (t: Thread) => Thread) {
  setState((s) => ({ threads: s.threads.map((t) => (t.id === id ? fn(t) : t)) }));
}

export function ChatApp() {
  const router = useRouter();
  const params = useSearchParams();
  const threads = useStore((s) => s.threads);
  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [picked, setPicked] = useState<ComposerTarget | null>(null);
  const handled = useRef<string | null>(null);

  const threadId = params.get("thread");
  const thread = threads.find((t) => t.id === threadId) ?? null;

  const send = async (text: string, target: ComposerTarget | null, existing?: Thread | null) => {
    const user: ChatMessage = { id: uid(), role: "user", content: text, createdAt: new Date().toISOString() };
    let t: Thread;
    if (existing) {
      t = { ...existing, messages: [...existing.messages, user], updatedAt: user.createdAt };
      updateThread(existing.id, () => t);
    } else {
      const skill = target?.kind === "skill" ? findSkill(target.id) : undefined;
      const dept: DepartmentId = skill ? skill.departmentId : target?.kind === "agent" ? target.id : routeMessage(text);
      t = {
        id: uid(),
        title: skill ? skill.name : text.length > 42 ? text.slice(0, 40) + "…" : text,
        departmentId: dept,
        skillId: skill?.id,
        updatedAt: user.createdAt,
        messages: [user],
        autoRouted: !target,
      };
      setState((s) => ({ threads: [t, ...s.threads] }));
      router.replace(`/chat?thread=${t.id}`, { scroll: false });
    }
    setPending(t.id);
    try {
      const reply = await askAgent(t);
      updateThread(t.id, (cur) => ({
        ...cur,
        updatedAt: new Date().toISOString(),
        messages: [...cur.messages, { id: uid(), role: "assistant", content: reply, createdAt: new Date().toISOString(), departmentId: cur.departmentId }],
      }));
    } finally {
      setPending(null);
    }
  };

  // Handle deep links: /chat?q=…&agent=… | /chat?skill=… | /chat?agent=…
  useEffect(() => {
    const key = params.toString();
    if (handled.current === key) return;
    handled.current = key;
    const q = params.get("q");
    const agent = params.get("agent") as DepartmentId | null;
    const skillId = params.get("skill");
    const s = findSkill(skillId);
    if (s) {
      const target: ComposerTarget = { kind: "skill", id: s.id, departmentId: s.departmentId, label: s.name, color: departmentColors[s.departmentId] };
      send(q ?? `Start ${s.name}`, target);
    } else if (q) {
      const target: ComposerTarget | null = agent ? { kind: "agent", id: agent, label: departmentName(agent), color: departmentColors[agent] } : null;
      send(q, target);
    } else if (agent) {
      setPicked({ kind: "agent", id: agent, label: departmentName(agent), color: departmentColors[agent] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const newChat = (agent?: DepartmentId) => {
    setPicked(agent ? { kind: "agent", id: agent, label: departmentName(agent), color: departmentColors[agent] } : null);
    handled.current = agent ? `agent=${agent}` : "";
    router.push(agent ? `/chat?agent=${agent}` : "/chat");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 248 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="flex shrink-0 flex-col overflow-hidden border-r border-line bg-bg/40 backdrop-blur-md"
      >
        <div className="flex items-center gap-1 p-3">
          <button onClick={() => setCollapsed((c) => !c)} className="icon-btn" aria-label="Toggle sidebar">
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          {!collapsed && (
            <button onClick={() => newChat()} className="btn btn-glass ml-auto h-8 px-3 text-xs">
              <Plus size={14} /> New
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => newChat()} className="icon-btn mx-auto" aria-label="New chat">
            <Plus size={17} />
          </button>
        )}
        <div className={`px-3 pb-2 pt-3 text-[10px] uppercase tracking-[0.18em] text-faint ${collapsed ? "text-center" : ""}`}>{collapsed ? "·" : "Agents"}</div>
        <nav className="space-y-0.5 px-2">
          {agentOrder.map((id) => {
            const active = (thread?.departmentId ?? picked?.id) === id;
            return (
              <button
                key={id}
                onClick={() => newChat(id)}
                title={departmentName(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] transition ${active ? "bg-active text-fg" : "text-muted hover:bg-hover hover:text-fg"} ${collapsed ? "justify-center" : ""}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${departmentColors[id]}1f` }}>
                  <PixelAvatar id={id} color={departmentColors[id]} size={16} />
                </span>
                {!collapsed && departmentName(id)}
              </button>
            );
          })}
        </nav>
        {!collapsed && (
          <>
            <div className="px-3 pb-2 pt-6 text-[10px] uppercase tracking-[0.18em] text-faint">Threads</div>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/chat?thread=${t.id}`}
                  className={`flex items-center gap-2 truncate rounded-lg px-2.5 py-1.5 text-[12.5px] ${t.id === threadId ? "bg-active text-fg" : "text-muted hover:bg-hover hover:text-fg"}`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: departmentColors[t.departmentId] }} />
                  <span className="truncate">{t.title}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </motion.aside>

      {/* main */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {thread ? (
          <ThreadView thread={thread} pending={pending === thread.id} onSend={(text) => send(text, null, thread)} />
        ) : (
          <EmptyChat picked={picked} setPicked={setPicked} onSend={(text, target) => send(text, target)} />
        )}
      </div>
    </div>
  );
}

function EmptyChat({ picked, setPicked, onSend }: { picked: ComposerTarget | null; setPicked: (t: ComposerTarget | null) => void; onSend: (text: string, t: ComposerTarget | null) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[680px] text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-faint">New Chat</div>
        <h1 className="mt-3 text-[34px] font-semibold tracking-tight">What&apos;s up, {siteConfig.user.firstName}?</h1>
        <p className="mt-2 text-[14px] text-muted">Auto sends it to the right teammate, or pick one yourself below.</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => onSend(s, picked)} className="rounded-full glass px-3.5 py-2 text-[13px] text-muted transition hover:text-fg">
              {s}
            </button>
          ))}
        </div>

        <div className="mt-6 text-left">
          <Composer key={picked ? picked.id : "auto"} initialTarget={picked} autoFocus hint onSubmit={onSend} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <button
            onClick={() => setPicked(null)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${!picked ? "bg-active text-fg" : "text-muted hover:bg-hover"}`}
          >
            <Sparkles size={12} /> Auto
          </button>
          {agentOrder.map((id) => (
            <button
              key={id}
              onClick={() => setPicked({ kind: "agent", id, label: departmentName(id), color: departmentColors[id] })}
              title={departmentName(id)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition ${picked?.id === id ? "bg-active text-fg" : "text-muted hover:bg-hover"}`}
            >
              <PixelAvatar id={id} color={departmentColors[id]} size={13} />
              <span className="hidden lg:inline">{departmentName(id).replace("Company ", "")}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ThreadView({ thread, pending, onSend }: { thread: Thread; pending: boolean; onSend: (text: string) => void }) {
  const color = departmentColors[thread.departmentId];
  const end = useRef<HTMLDivElement>(null);
  const skill = findSkill(thread.skillId);
  const auto = thread.autoRouted;
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages.length, pending]);
  const lastAssistant = useMemo(() => [...thread.messages].reverse().find((m) => m.role === "assistant")?.id, [thread.messages]);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-line px-6 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}22` }}>
          <PixelAvatar id={thread.departmentId} color={color} size={18} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium">{thread.title}</div>
          <div className="text-[11px] text-muted">
            {departmentName(thread.departmentId)} agent
            {skill && <> · <Wand2 size={10} className="inline" /> {skill.name}</>}
            {auto && <span className="ml-1" style={{ color }}>· routed automatically</span>}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] space-y-6 px-6 py-8">
          {thread.messages.length === 0 && (
            <div className="py-16 text-center text-sm text-muted">This is the main thread for {departmentName(thread.departmentId)}. Say hi.</div>
          )}
          {thread.messages.map((m) =>
            m.role === "user" ? (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-active px-4 py-2.5 text-[14.5px] leading-6">{m.content}</div>
              </motion.div>
            ) : (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}22` }}>
                  <PixelAvatar id={thread.departmentId} color={color} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 text-[12px] font-medium" style={{ color }}>{departmentName(thread.departmentId)}</div>
                  {m.id === lastAssistant ? <Reveal text={m.content} /> : <Markdown text={m.content} />}
                </div>
              </motion.div>
            ),
          )}
          <AnimatePresence>
            {pending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}22` }}>
                  <PixelAvatar id={thread.departmentId} color={color} size={18} />
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: color }} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
                <span className="text-xs text-muted">{departmentName(thread.departmentId)} is thinking…</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={end} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[760px] px-6 pb-5">
        <Composer placeholder={`Reply to ${departmentName(thread.departmentId)}…`} hint onSubmit={(t) => onSend(t)} />
      </div>
    </>
  );
}

/** Reveals the newest reply progressively, like it is being typed. */
function Reveal({ text }: { text: string }) {
  const [n, setN] = useState(0);
  const started = useRef(Date.now());
  useEffect(() => {
    // only animate fresh messages
    if (Date.now() - started.current > 2000) return setN(text.length);
    const t = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(t), v) : v + 4)), 12);
    return () => clearInterval(t);
  }, [text]);
  return <Markdown text={text.slice(0, n)} />;
}
