"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, Pencil, RotateCcw, Wand2 } from "lucide-react";
import type { DepartmentId, Skill } from "@/lib/types";
import { SkillTreeMap, type Offsets } from "./SkillTreeMap";
import { GettingStarted } from "./GettingStarted";
import type { TreeMode } from "./layout";
import { Composer } from "@/components/chat/Composer";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { threads } from "@/data/threads";
import { departmentColors, departmentName } from "@/data/departments";
import { getDepartment } from "@/data/tree";

const STORAGE_KEY = "nexora.tree.offsets.v1";

export function SkillTreeHome() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<TreeMode>("radial");
  const [editing, setEditing] = useState(false);
  const [offsets, setOffsets] = useState<Record<TreeMode, Offsets>>({ radial: {}, line: {} });
  const focus = (params.get("dept") as DepartmentId | null) ?? null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOffsets(JSON.parse(raw));
    } catch {}
  }, []);
  const saveOffsets = useCallback(
    (o: Offsets) =>
      setOffsets((cur) => {
        const next = { ...cur, [mode]: o };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }),
    [mode],
  );

  const openDept = (id: DepartmentId | null) => router.push(id ? `/?dept=${id}` : "/", { scroll: false });
  const openJob = (s: Skill) => router.push(`/?dept=${s.departmentId}&job=${encodeURIComponent(s.id)}`, { scroll: false });

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* top controls */}
      <AnimatePresence>
        {!focus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-6 pt-5"
          >
            <GettingStarted />
            <div className="flex gap-2">
              <Link href="/skills/new" className="btn btn-glass">
                <Wand2 size={15} strokeWidth={1.8} /> New Skill
              </Link>
              <button onClick={() => setEditing((e) => !e)} className={`btn ${editing ? "btn-cta" : "btn-glass"}`}>
                {editing ? <Check size={15} /> : <Pencil size={15} strokeWidth={1.8} />}
                {editing ? "Done" : "Edit Tree"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && !focus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full glass px-4 py-2 text-xs text-muted"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff9f4a]" />
            Editing tree · drag departments, groups or jobs to rearrange
            <button
              onClick={() => saveOffsets({})}
              className="ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-fg hover:bg-hover"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* map */}
      <div className="relative min-h-0 flex-1 px-4 pt-14">
        <SkillTreeMap
          mode={mode}
          editing={editing}
          focus={focus}
          offsets={offsets[mode]}
          onOffsetsChange={saveOffsets}
          onSelectDept={(id) => openDept(id)}
          onSelectJob={openJob}
          onSelectBrain={() => router.push("/files")}
        />
        <AnimatePresence>{focus && <DepartmentPreview id={focus} onBack={() => openDept(null)} />}</AnimatePresence>
      </div>

      {/* bottom: recent + composer */}
      {(
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: focus ? 0 : 1, y: focus ? 20 : 0 }}
            transition={{ delay: focus ? 0 : 0.2 }}
            style={{ pointerEvents: focus ? "none" : "auto" }}
            className="relative z-20 mx-auto w-full max-w-[720px] px-4 pb-6"
          >
            <div className="mb-3 flex items-center gap-2 overflow-x-auto">
              <span className="mr-1 text-[11px] uppercase tracking-[0.18em] text-faint">Recent</span>
              {threads.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  href={`/chat?thread=${t.id}`}
                  className="flex shrink-0 items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-muted transition-colors hover:text-fg"
                >
                  <PixelAvatar id={t.departmentId} color={departmentColors[t.departmentId]} size={13} />
                  {departmentName(t.departmentId)} · {t.title}
                </Link>
              ))}
            </div>
            <Composer
              onSubmit={(text, target) => {
                const q = new URLSearchParams({ q: text });
                if (target) q.set(target.kind, target.id);
                router.push(`/chat?${q.toString()}`);
              }}
            />
          </motion.div>
      )}

      {/* radial / line toggle */}
      {!focus && (
        <div className="fixed bottom-6 right-6 z-30 flex rounded-full glass p-1 text-xs">
          {(["radial", "line"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative rounded-full px-3.5 py-1.5 capitalize transition-colors ${mode === m ? "text-fg" : "text-muted hover:text-fg"}`}
            >
              {mode === m && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-active" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Temporary department view — replaced by the full department view in step 3. */
function DepartmentPreview({ id, onBack }: { id: DepartmentId; onBack: () => void }) {
  const d = getDepartment(id);
  if (!d) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ delay: 0.75, duration: 0.45 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
    >
      <button onClick={onBack} className="btn btn-glass absolute left-6 top-5">
        <ChevronLeft size={15} /> All Departments
      </button>
      <div className="dept-title pointer-events-none absolute inset-x-0 top-[18%] text-center text-[9vw] leading-none opacity-[0.05]">{d.name}</div>
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: `${d.color}22`, boxShadow: `0 0 0 1px ${d.color}88, 0 0 50px ${d.color}66` }}
      >
        <PixelAvatar id={d.id} color={d.color} size={38} />
      </div>
      <div className="dept-title mt-5 text-xl">{d.name}</div>
      <div className="mt-1 text-sm text-muted">{d.tagline.join(" · ")}</div>
      <div className="mt-6 rounded-full glass px-3 py-1 text-xs text-muted">Department view with sub-groups and job panel comes in step 3</div>
    </motion.div>
  );
}
