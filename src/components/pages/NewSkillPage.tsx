"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Wand2 } from "lucide-react";
import Link from "next/link";
import { allSkills, departments } from "@/data/tree";
import type { DepartmentId } from "@/lib/types";
import { setState, uid } from "@/lib/store";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

const icons = ["Sparkles", "FileText", "Mail", "BarChart3", "Users", "Target", "Calendar", "Search", "Megaphone", "Receipt", "Lightbulb", "ShieldCheck"];

export function NewSkillPage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = allSkills.find((s) => s.id === params.get("from"));
  const [name, setName] = useState(from ? `${from.name} (my version)` : "");
  const [dept, setDept] = useState<DepartmentId>(from?.departmentId ?? "research");
  const d = departments.find((x) => x.id === dept)!;
  const [group, setGroup] = useState(from?.subGroupId ?? d.subGroups[0].id);
  const [description, setDescription] = useState(from?.description ?? "");
  const [instructions, setInstructions] = useState("");
  const [icon, setIcon] = useState(from?.icon ?? "Sparkles");
  const groups = useMemo(() => departments.find((x) => x.id === dept)!.subGroups, [dept]);
  const valid = name.trim() && description.trim();

  const field = "mt-1.5 w-full rounded-xl border border-line bg-hover px-3 py-2.5 text-sm outline-none focus:border-fg/25";
  return (
    <div className="mx-auto max-w-3xl px-8 pb-24 pt-8">
      <Link href="/skills" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"><ArrowLeft size={14} /> Skills</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Make a Skill</h1>
      <p className="mt-2 text-[14px] text-muted">Teach a department something new. It shows up in the skills list and in the / menu when you chat.</p>

      <form
        className="glass mt-8 space-y-5 rounded-2xl p-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          setState((s) => ({
            customSkills: [
              { id: `custom.${uid()}`, departmentId: dept, subGroupId: group, name: name.trim(), description: description.trim() + (instructions ? `\n\nInstructions: ${instructions.trim()}` : ""), icon, color: d.color, enabled: true, recommended: false, readyToRun: true, owner: "You" },
              ...s.customSkills,
            ],
          }));
          router.push("/skills");
        }}
      >
        <label className="block text-[13px] text-muted">Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Earnings Call Summary" className={field} /></label>
        <div>
          <div className="text-[13px] text-muted">Department</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {departments.map((x) => (
              <button
                type="button"
                key={x.id}
                onClick={() => { setDept(x.id); setGroup(x.subGroups[0].id); }}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] ${dept === x.id ? "text-fg" : "border-line text-muted"}`}
                style={dept === x.id ? { borderColor: x.color, background: `${x.color}1a` } : undefined}
              >
                <PixelAvatar id={x.id} color={x.color} size={13} /> {x.name}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-[13px] text-muted">
          Sub-group
          <select value={group} onChange={(e) => setGroup(e.target.value)} className={field}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        <div>
          <div className="text-[13px] text-muted">Icon</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {icons.map((i) => (
              <button type="button" key={i} onClick={() => setIcon(i)} className="flex h-10 w-10 items-center justify-center rounded-xl border" style={icon === i ? { borderColor: d.color, background: `${d.color}22`, color: d.color } : { borderColor: "var(--line)", color: "var(--muted)" }}>
                <DynamicIcon name={i} size={17} />
              </button>
            ))}
          </div>
        </div>
        <label className="block text-[13px] text-muted">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What it does, when to use it and what it produces." className={field + " resize-none"} /></label>
        <label className="block text-[13px] text-muted">Instructions<textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} placeholder={"Step by step, how the agent should do it.\n1. Read the latest report on the company\n2. …"} className={field + " resize-none font-mono text-[12.5px]"} /></label>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-faint">Saved to your workspace and switched on.</span>
          <motion.button whileTap={{ scale: 0.97 }} disabled={!valid} className="btn btn-cta disabled:opacity-40"><Wand2 size={15} /> Create skill</motion.button>
        </div>
      </form>
    </div>
  );
}
