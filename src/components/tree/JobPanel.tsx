"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Skill } from "@/lib/types";
import { getDepartment } from "@/data/tree";
import { skillSections } from "@/lib/skillText";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

export function JobPanel({ skill, onClose }: { skill: Skill | null; onClose: () => void }) {
  const router = useRouter();
  return (
    <AnimatePresence>
      {skill && (
        <motion.aside
          key="job-panel"
          initial={{ x: -460, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -460, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed bottom-4 left-4 top-[4.5rem] z-50 flex w-[420px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl glass-strong shadow-2xl shadow-black/50"
        >
          <PanelBody skill={skill} onClose={onClose} onStart={() => router.push(`/chat?skill=${encodeURIComponent(skill.id)}`)} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PanelBody({ skill, onClose, onStart }: { skill: Skill; onClose: () => void; onStart: () => void }) {
  const d = getDepartment(skill.departmentId)!;
  const g = d.subGroups.find((x) => x.id === skill.subGroupId)!;
  const sections = skillSections(skill, g.name);
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-5 py-4 text-[13px] text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }} />
        <span>{d.name}</span>
        <span className="text-faint">›</span>
        <span className="text-fg">{g.name}</span>
        <button onClick={onClose} className="icon-btn ml-auto h-8 w-8" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <motion.div key={skill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-0 flex-1 flex-col">
        <div className="px-6 pt-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${d.color}24`, color: d.color }}>
            <DynamicIcon name={skill.icon} size={20} />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{skill.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted">
              <BrainCircuit size={12} /> Runs on your brain
            </span>
            {(skill.recommended || skill.readyToRun) && (
              <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: `${d.color}22`, color: d.color }}>
                → {skill.recommended ? "Recommended next" : "Ready to run"}
              </span>
            )}
          </div>
        </div>
        <div className="mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
          {sections.map((s) => (
            <section key={s.title}>
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-faint">{s.title}</h3>
              <p className="mt-1.5 text-[14px] leading-6 text-fg/85">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="border-t border-line p-4">
          <button onClick={onStart} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cta text-[15px] font-medium text-cta-fg transition hover:opacity-90">
            Start <ArrowRight size={17} />
          </button>
        </div>
      </motion.div>
    </>
  );
}
