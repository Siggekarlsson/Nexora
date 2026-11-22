"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { DepartmentId } from "@/lib/types";
import { departments, allSkills } from "@/data/tree";
import { brain, departmentColors } from "@/data/departments";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

export type ComposerTarget =
  | { kind: "agent"; id: DepartmentId; label: string; color: string }
  | { kind: "skill"; id: string; departmentId: DepartmentId; label: string; color: string };

type Option = ComposerTarget & { sub: string; icon?: string };

const agentOptions: Option[] = [
  { kind: "agent", id: "brain", label: brain.name, color: brain.color, sub: "Searches every document" },
  ...departments.map((d) => ({ kind: "agent" as const, id: d.id, label: d.name, color: d.color, sub: d.tagline.join(" · ") })),
];
const skillOptions: Option[] = allSkills
  .filter((s) => s.enabled)
  .map((s) => ({ kind: "skill" as const, id: s.id, departmentId: s.departmentId, label: s.name, color: departmentColors[s.departmentId], sub: s.subGroupId.split(".")[1].replace(/-/g, " "), icon: s.icon }));

interface Props {
  placeholder?: string;
  onSubmit: (text: string, target: ComposerTarget | null) => void;
  hint?: boolean;
  autoFocus?: boolean;
  className?: string;
  initialTarget?: ComposerTarget | null;
}

export function Composer({ placeholder = "Ask anything, or type / for an agent or skill", onSubmit, hint, autoFocus, className = "", initialTarget = null }: Props) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<ComposerTarget | null>(initialTarget);
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  const slash = /(?:^|\s)\/([\w-]*)$/.exec(text);
  const query = slash?.[1]?.toLowerCase() ?? "";
  const options = useMemo(() => {
    if (!slash) return [];
    const a = agentOptions.filter((o) => o.label.toLowerCase().includes(query));
    const s = skillOptions.filter((o) => o.label.toLowerCase().includes(query)).slice(0, query ? 8 : 5);
    return [...a, ...s];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, !!slash]);

  const pick = (o: Option) => {
    setTarget(o.kind === "agent" ? { kind: "agent", id: o.id, label: o.label, color: o.color } : { kind: "skill", id: o.id, departmentId: o.departmentId, label: o.label, color: o.color });
    setText((t) => t.replace(/(?:^|\s)\/[\w-]*$/, (m) => (m.startsWith(" ") ? " " : "")));
    setIdx(0);
    ref.current?.focus();
  };

  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), target);
    setText("");
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-full left-0 right-0 z-30 mb-2 max-h-80 overflow-y-auto rounded-2xl glass-strong p-1.5 shadow-2xl shadow-black/50"
          >
            {options.map((o, i) => {
              const header = i === 0 && o.kind === "agent" ? "Agents" : (i === 0 || options[i - 1].kind === "agent") && o.kind === "skill" ? "Skills" : null;
              return (
                <div key={o.kind + o.id}>
                  {header && <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.18em] text-faint">{header}</div>}
                  <button
                    onMouseEnter={() => setIdx(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(o);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${i === idx ? "bg-active" : ""}`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${o.color}22`, color: o.color }}>
                      {o.kind === "agent" ? <PixelAvatar id={o.id} color={o.color} size={14} /> : <DynamicIcon name={o.icon!} size={13} />}
                    </span>
                    <span className="text-[13px]">{o.label}</span>
                    <span className="ml-auto truncate text-[11px] capitalize text-faint">{o.sub}</span>
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass flex items-end gap-2 rounded-[22px] py-2 pl-3 pr-2 shadow-xl shadow-black/20 focus-within:border-fg/20">
        {target && (
          <span className="mb-1 flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-2 pr-1 text-xs" style={{ background: `${target.color}22`, color: target.color }}>
            {target.kind === "agent" ? <PixelAvatar id={target.id} color={target.color} size={12} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: target.color }} />}
            {target.label}
            <button onClick={() => setTarget(null)} className="rounded-full p-0.5 hover:bg-hover" aria-label="Remove">
              <X size={11} />
            </button>
          </span>
        )}
        <textarea
          ref={ref}
          rows={1}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setIdx(0);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
          }}
          onKeyDown={(e) => {
            if (options.length) {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => (i + 1) % options.length); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => (i - 1 + options.length) % options.length); return; }
              if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(options[idx]); return; }
              if (e.key === "Escape") { setText((t) => t.replace(/\/[\w-]*$/, "")); return; }
            }
            if (e.key === "Backspace" && !text && target) setTarget(null);
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={target ? `Message ${target.label}…` : placeholder}
          className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[14px] leading-5 outline-none placeholder:text-faint"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cta text-cta-fg transition-opacity disabled:opacity-30"
          aria-label="Send"
        >
          <ArrowUp size={17} strokeWidth={2.2} />
        </button>
      </div>
      {hint && <div className="mt-2 text-center text-[11px] text-faint">Enter to send · Shift + Enter for a new line</div>}
    </div>
  );
}
