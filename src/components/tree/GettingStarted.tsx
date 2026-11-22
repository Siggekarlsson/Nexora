"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { onboardingSteps } from "@/data/threads";
import { useStore } from "@/lib/store";

export function GettingStarted() {
  const [open, setOpen] = useState(false);
  const hasFiles = useStore((st) => st.files).length > 0;
  const integrations = useStore((st) => st.integrations);
  const connected = Object.entries(integrations).some(([, v]) => v);
  const steps = onboardingSteps.map((s) => ({ ...s, done: s.done || (s.id === "brain" && hasFiles) || (s.id === "integration" && connected) }));
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn btn-glass rounded-full pl-2.5">
        <ProgressRing value={done / total} />
        <span className="text-muted">Getting Started ·</span>
        <span>{done} of {total} Done</span>
      </button>
      <Popover open={open} onClose={() => setOpen(false)} align="left" className="w-80 p-3">
        <div className="px-1 pb-2">
          <div className="text-sm font-medium">Getting started</div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-hover">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7cc4ff] to-[#b98bff]" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
        <ul className="mt-1 space-y-0.5">
          {steps.map((s) => {
            const inner = (
              <>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-transparent bg-finance/20 text-finance" : "border-line"}`}>
                  {s.done && <Check size={12} strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-[13px] ${s.done ? "text-muted line-through decoration-faint" : ""}`}>{s.label}</span>
                {!s.done && <ChevronRight size={14} className="text-muted" />}
              </>
            );
            return (
              <li key={s.id}>
                {s.href && !s.done ? (
                  <Link href={s.href} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-hover">{inner}</Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Popover>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90">
      <circle cx="9" cy="9" r={r} fill="none" stroke="var(--line)" strokeWidth="2" />
      <circle cx="9" cy="9" r={r} fill="none" stroke="#5fe08a" strokeWidth="2" strokeDasharray={c} strokeDashoffset={c * (1 - value)} strokeLinecap="round" />
    </svg>
  );
}
