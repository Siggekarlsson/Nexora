"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, RotateCcw, Wand2 } from "lucide-react";
import type { DepartmentId, Skill } from "@/lib/types";
import { SkillTreeMap, type Offsets } from "./SkillTreeMap";
import { GettingStarted } from "./GettingStarted";
import { HudPanels } from "./HudPanels";
import { DepartmentView } from "./DepartmentView";
import { JobPanel } from "./JobPanel";
import type { TreeMode } from "./layout";
import { Composer } from "@/components/chat/Composer";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { useStore } from "@/lib/store";
import { departmentColors, departmentName } from "@/data/departments";
import { allSkills, radialOrder } from "@/data/tree";

const STORAGE_KEY = "nexora.tree.offsets.v1";

export function SkillTreeHome() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<TreeMode>("radial");
  const [editing, setEditing] = useState(false);
  const [offsets, setOffsets] = useState<Record<TreeMode, Offsets>>({ radial: {}, line: {} });
  const threads = useStore((st) => st.threads);
  const focus = (params.get("dept") as DepartmentId | null) ?? null;
  const jobId = params.get("job");
  const job = jobId ? allSkills.find((s) => s.id === jobId) ?? null : null;
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showDept, setShowDept] = useState(!!focus);
  // let the zoom play before showing the department view
  useEffect(() => {
    if (!focus) return setShowDept(false);
    const t = setTimeout(() => setShowDept(true), showDept ? 0 : 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const i = radialOrder.indexOf(focus as (typeof radialOrder)[number]);
      if (e.key === "Escape") openDept(null);
      if (e.key === "ArrowRight") { setDirection(1); openDept(radialOrder[(i + 1) % radialOrder.length]); }
      if (e.key === "ArrowLeft") { setDirection(-1); openDept(radialOrder[(i - 1 + radialOrder.length) % radialOrder.length]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

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
        <HudPanels visible={!focus && mode === "radial" && !editing} />
        <JobPanel skill={focus && showDept ? job : null} onClose={() => openDept(focus)} />
      </div>

      {/* department view covers the whole page */}
        <AnimatePresence>
          {focus && showDept && (
            <motion.div key="dept" className="absolute inset-0 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.4 }}>
              <DepartmentView
                id={focus}
                direction={direction}
                selectedJob={jobId}
                onBack={() => openDept(null)}
                onNavigate={(id, dir) => { setDirection(dir); openDept(id); }}
                onSelectJob={openJob}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
                  <span className="max-w-[200px] truncate">{departmentName(t.departmentId)} · {t.title}</span>
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

