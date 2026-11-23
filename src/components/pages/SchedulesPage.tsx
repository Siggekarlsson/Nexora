"use client";

import { motion } from "framer-motion";
import { CalendarClock, Plus } from "lucide-react";
import Link from "next/link";
import { skillById as byId } from "@/data/tree";
import { departmentColors, departmentName } from "@/data/departments";
import { setState, useStore } from "@/lib/store";
import { Toggle } from "@/components/ui/Toggle";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

const schedules = [
  { id: "s1", skill: "research.event-monitor", when: "Every weekday at 07:30", next: "Mon 07:30", last: "Fri 07:30 · 4 events flagged", on: true },
  { id: "s2", skill: "marketing.morning-note", when: "Every weekday at 06:45", next: "Mon 06:45", last: "Fri 06:45 · sent to 2,140", on: true },
  { id: "s3", skill: "sales.pipeline-review", when: "Mondays at 09:00", next: "Mon 09:00", last: "17 Nov · 3 stale deals", on: true },
  { id: "s4", skill: "finance.overdue-chaser", when: "1st and 15th of the month", next: "1 Dec 08:00", last: "15 Nov · 2 reminders", on: true },
  { id: "s5", skill: "marketing.weekly-newsletter", when: "Mondays at 08:00", next: "Mon 08:00", last: "17 Nov · 46.8% opens", on: false },
  { id: "s6", skill: "leadership.weekly-priorities", when: "Fridays at 15:00", next: "Fri 15:00", last: "21 Nov · 5 priorities", on: true },
  { id: "s7", skill: "customer.churn-risk-alert", when: "Daily at 10:00", next: "Mon 10:00", last: "Sun 10:00 · no risks", on: false },
];

export function SchedulesPage() {
  const overrides = useStore((s) => s.schedules);
  return (
    <div className="mx-auto max-w-5xl px-8 pb-24 pt-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Schedules</h1>
          <p className="mt-2 text-[14px] text-muted">Skills that run on their own. Results land in the department&apos;s main thread.</p>
        </div>
        <Link href="/skills" className="btn btn-cta"><Plus size={15} /> New Schedule</Link>
      </div>
      <div className="glass mt-8 overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[1fr_200px_130px_60px] gap-4 border-b border-line px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-faint">
          <span>Skill</span><span>Runs</span><span>Next run</span><span />
        </div>
        {schedules.map((s, i) => {
          const sk = byId[s.skill];
          if (!sk) return null;
          const on = overrides[s.id] ?? s.on;
          const c = departmentColors[sk.departmentId];
          return (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className={`grid grid-cols-[1fr_200px_130px_60px] items-center gap-4 border-b border-line px-5 py-4 last:border-0 ${on ? "" : "opacity-55"}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${c}22`, color: c }}><DynamicIcon name={sk.icon} size={16} /></span>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium">{sk.name}</div>
                  <div className="truncate text-[12px] text-muted">{departmentName(sk.departmentId)} · last: {s.last}</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[13px] text-muted"><CalendarClock size={13} /> {s.when}</span>
              <span className="text-[13px]">{on ? s.next : "Paused"}</span>
              <Toggle on={on} color={c} label="Toggle schedule" onChange={(v) => setState((st) => ({ schedules: { ...st.schedules, [s.id]: v } }))} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
