"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, Copy, Download, Pencil, Play, Plus, Search, Settings2, Trash2, Upload, X } from "lucide-react";
import { allSkills, departments } from "@/data/tree";
import { departmentColors, departmentName } from "@/data/departments";
import type { DepartmentId, Skill } from "@/lib/types";
import { setState, uid, useStore } from "@/lib/store";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Toggle } from "@/components/ui/Toggle";
import { Popover } from "@/components/ui/Popover";

type Filter = "all" | "on" | "off";

export function SkillsPage() {
  const overrides = useStore((s) => s.skillEnabled);
  const custom = useStore((s) => s.customSkills);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dept, setDept] = useState<DepartmentId | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const skills = useMemo(
    () => [...custom, ...allSkills].map((s) => ({ ...s, enabled: overrides[s.id] ?? s.enabled })),
    [custom, overrides],
  );
  const on = skills.filter((s) => s.enabled).length;
  const visible = skills.filter(
    (s) =>
      (filter === "all" || (filter === "on") === s.enabled) &&
      (!dept || s.departmentId === dept) &&
      (!q || (s.name + " " + s.description).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-6xl px-8 pb-24 pt-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Skills</h1>
          <p className="mt-2 max-w-xl text-[14px] text-muted">Everything your brain can do. A skill that is switched off can&apos;t be used by anyone until it is back on.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setImportOpen(true)} className="btn btn-glass"><Upload size={15} /> Import a Skill</button>
          <Link href="/skills/new" className="btn btn-cta"><Plus size={15} /> Make a Skill</Link>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="glass flex h-10 flex-1 items-center gap-2 rounded-xl px-3">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search skills" className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
        </label>
        <div className="glass flex rounded-xl p-1 text-[13px]">
          {([
            ["all", `All ${skills.length}`],
            ["on", `On ${on}`],
            ["off", `Off ${skills.length - on}`],
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={`relative rounded-lg px-3 py-1.5 ${filter === k ? "text-fg" : "text-muted hover:text-fg"}`}>
              {filter === k && <motion.span layoutId="skill-filter" className="absolute inset-0 rounded-lg bg-active" />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setDept(null)}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition ${dept === null ? "border-fg/30 bg-active text-fg" : "border-line text-muted hover:text-fg"}`}
        >
          All
          <span className="text-faint">{skills.length}</span>
        </button>
        {departments.map((d) => {
          const count = skills.filter((s) => s.departmentId === d.id).length;
          const active = dept === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDept(active ? null : d.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition ${active ? "text-fg" : "border-line text-muted hover:text-fg"}`}
              style={active ? { borderColor: d.color, background: `${d.color}1a` } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
              {d.name}
              <span className="text-faint">{count}</span>
            </button>
          );
        })}
      </div>

      <motion.div layout className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </AnimatePresence>
      </motion.div>
      {visible.length === 0 && <div className="py-20 text-center text-sm text-muted">No skills match your filters.</div>}

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const [menu, setMenu] = useState(false);
  const color = departmentColors[skill.departmentId];
  const custom = skill.owner === "You";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      style={{ zIndex: menu ? 30 : undefined, position: "relative" }}
      className={`glass group flex flex-col rounded-2xl p-5 transition hover:border-fg/15 ${skill.enabled ? "" : "opacity-60"}`}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}22`, color }}>
          <DynamicIcon name={skill.icon} size={18} />
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-[12px]">
          <span className={skill.enabled ? "text-fg" : "text-muted"}>{skill.enabled ? "On" : "Off"}</span>
        <Toggle
          on={skill.enabled}
          color={color}
          label={`Turn ${skill.name} ${skill.enabled ? "off" : "on"}`}
          onChange={(v) => setState((s) => ({ skillEnabled: { ...s.skillEnabled, [skill.id]: v } }))}
        />
        </label>
      </div>
      <div className="mt-4 text-[15px] font-medium">{skill.name}</div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">{skill.description}</p>
      <div className="mt-auto flex items-center gap-2 pt-5 text-xs text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {departmentName(skill.departmentId)}
        <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px]">{skill.owner}</span>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} className="flex h-7 items-center gap-0.5 rounded-lg border border-line px-1.5 text-muted transition hover:bg-hover hover:text-fg" aria-label="Skill settings">
            <Settings2 size={13} />
            <ChevronDown size={12} />
          </button>
          <Popover open={menu} onClose={() => setMenu(false)} className="w-44">
            <Link href={`/chat?skill=${encodeURIComponent(skill.id)}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-hover hover:text-fg"><Play size={14} /> Run</Link>
            <Link href={`/skills/new?from=${encodeURIComponent(skill.id)}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-hover hover:text-fg"><Pencil size={14} /> Edit copy</Link>
            <button
              onClick={() => {
                setState((s) => ({ customSkills: [{ ...skill, id: `custom.${uid()}`, name: `${skill.name} (copy)`, owner: "You" }, ...s.customSkills] }));
                setMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-hover hover:text-fg"
            >
              <Copy size={14} /> Duplicate
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(skill, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${skill.name}.skill.json`;
                a.click();
                setMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-hover hover:text-fg"
            >
              <Download size={14} /> Export
            </button>
            {custom && (
              <button
                onClick={() => setState((s) => ({ customSkills: s.customSkills.filter((x) => x.id !== skill.id) }))}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#ff6b8b] hover:bg-hover"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </Popover>
        </div>
      </div>
    </motion.div>
  );
}

function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const doImport = (raw: string) => {
    try {
      const s = JSON.parse(raw) as Partial<Skill>;
      if (!s.name || !s.departmentId) throw new Error("Missing name or departmentId");
      setState((st) => ({
        customSkills: [
          {
            id: `custom.${uid()}`,
            departmentId: s.departmentId!,
            subGroupId: s.subGroupId ?? `${s.departmentId}.custom`,
            name: s.name!,
            description: s.description ?? "",
            icon: s.icon ?? "Sparkles",
            enabled: true,
            recommended: false,
            readyToRun: true,
            owner: "You",
          },
          ...st.customSkills,
        ],
      }));
      setText("");
      setError("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid skill file");
    }
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }} onMouseDown={(e) => e.stopPropagation()} className="w-[520px] rounded-2xl glass-strong p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Import a Skill</h2>
              <button onClick={onClose} className="icon-btn"><X size={16} /></button>
            </div>
            <p className="mt-1 text-sm text-muted">Upload a <code>.skill.json</code> file exported from {""}another workspace, or paste its contents.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line py-6 text-sm text-muted hover:bg-hover">
              <Upload size={18} />
              <span className="mt-2">Choose file</span>
              <input type="file" accept=".json" className="hidden" onChange={async (e) => e.target.files?.[0] && doImport(await e.target.files[0].text())} />
            </label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder='{"name": "My Skill", "departmentId": "research", "description": "…"}' className="mt-3 w-full resize-none rounded-xl border border-line bg-hover p-3 font-mono text-xs outline-none" />
            {error && <div className="mt-2 text-xs text-[#ff6b8b]">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="btn btn-glass">Cancel</button>
              <button onClick={() => doImport(text)} disabled={!text.trim()} className="btn btn-cta disabled:opacity-40">Import</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
