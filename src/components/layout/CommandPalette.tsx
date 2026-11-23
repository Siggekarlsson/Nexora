"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Blocks, CalendarClock, Folder, LayoutDashboard, MessageCircle, MessageSquare, Network, Search, Settings, Wand2, Plus, Zap } from "lucide-react";
import { allSkills } from "@/data/tree";
import { useStore } from "@/lib/store";
import { useUI } from "./Providers";
import { departmentSeeds } from "@/data/departments";
import { PixelAvatar } from "@/components/brand/PixelAvatar";

type Item = { id: string; label: string; group: string; href: string; icon: React.ReactNode; hint?: string; searchOnly?: boolean };

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUI();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const threads = useStore((s) => s.threads);
  const customSkills = useStore((s) => s.customSkills);
  const items: Item[] = useMemo(
    () => [
      { id: "tree", label: "Skill Tree", group: "Go to", href: "/", icon: <Network size={15} /> },
      { id: "chat", label: "Chat", group: "Go to", href: "/chat", icon: <MessageCircle size={15} /> },
      { id: "dash", label: "Dashboards", group: "Go to", href: "/dashboards", icon: <LayoutDashboard size={15} /> },
      { id: "files", label: "Files", group: "Go to", href: "/files", icon: <Folder size={15} /> },
      { id: "skills", label: "Skills", group: "Go to", href: "/skills", icon: <Wand2 size={15} /> },
      { id: "integr", label: "Integrations", group: "Go to", href: "/integrations", icon: <Blocks size={15} /> },
      { id: "sched", label: "Schedules", group: "Go to", href: "/schedules", icon: <CalendarClock size={15} /> },
      { id: "settings", label: "Settings", group: "Go to", href: "/settings", icon: <Settings size={15} /> },
      { id: "new-skill", label: "Make a new skill", group: "Actions", href: "/skills/new", icon: <Plus size={15} /> },
      ...departmentSeeds.map((d) => ({
        id: d.id,
        label: d.name,
        group: "Departments",
        href: `/?dept=${d.id}`,
        icon: <PixelAvatar id={d.avatar} color={d.color} size={15} />,
        hint: d.tagline.join(", "),
      })),
      ...[...allSkills, ...customSkills].map((sk) => ({
        id: `skill-${sk.id}`,
        label: sk.name,
        group: "Skills",
        href: `/chat?skill=${sk.id}`,
        icon: <Zap size={15} />,
        hint: departmentSeeds.find((d) => d.id === sk.departmentId)?.name,
        searchOnly: true,
      })),
      ...threads.map((t) => ({
        id: `thread-${t.id}`,
        label: t.title,
        group: "Threads",
        href: `/chat?thread=${t.id}`,
        icon: <MessageSquare size={15} />,
        hint: departmentSeeds.find((d) => d.id === t.departmentId)?.name ?? "Company Brain",
        searchOnly: true,
      })),
    ],
    // paletteOpen: rebuild on open, so departments and skills from the onboarding tree (applied after first render) are searchable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threads, customSkills, paletteOpen],
  );

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return items.filter((i) => !i.searchOnly);
    const hits = items.filter((i) => i.label.toLowerCase().includes(needle) || i.hint?.toLowerCase().includes(needle));
    // Keep the list short: at most 8 hits per group.
    const per: Record<string, number> = {};
    return hits.filter((i) => (per[i.group] = (per[i.group] ?? 0) + 1) <= 8);
  }, [items, needle]);

  useEffect(() => {
    if (paletteOpen) {
      setQ("");
      setIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [paletteOpen]);

  const go = (item?: Item) => {
    if (!item) return;
    setPaletteOpen(false);
    router.push(item.href);
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[14vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => setPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.16 }}
            className="w-[560px] max-w-[92vw] overflow-hidden rounded-2xl glass-strong shadow-2xl shadow-black/50"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={16} className="text-muted" />
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
                  if (e.key === "Enter") go(filtered[idx]);
                  if (e.key === "Escape") setPaletteOpen(false);
                }}
                placeholder="Search pages, departments, skills…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted">No results</div>}
              {filtered.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <div key={item.id}>
                    {header && <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.18em] text-faint">{header}</div>}
                    <button
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === idx ? "bg-active text-fg" : "text-muted"}`}
                    >
                      <span className="flex w-4 justify-center">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                      {item.hint && <span className="ml-auto shrink-0 truncate pl-3 text-xs text-faint">{item.hint}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
