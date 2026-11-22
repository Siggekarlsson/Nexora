"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText, FolderOpen, LayoutGrid, List, Mail, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import type { FileItem } from "@/lib/types";
import { setState, uid, useStore } from "@/lib/store";
import { Popover } from "@/components/ui/Popover";

const SUPPORTED = ["pdf", "docx", "xlsx", "txt", "eml", "md"] as const;
type Ext = (typeof SUPPORTED)[number];
const BASE_USED = 14 * 1024 * 1024;
const QUOTA = 1024 * 1024 * 1024;

const typeMeta: Record<Ext, { color: string; icon: typeof FileText }> = {
  pdf: { color: "#ff6b8b", icon: FileText },
  docx: { color: "#7cc4ff", icon: FileText },
  xlsx: { color: "#5fe08a", icon: FileSpreadsheet },
  txt: { color: "#8d8a99", icon: FileText },
  eml: { color: "#ff9f4a", icon: Mail },
  md: { color: "#b98bff", icon: FileText },
};

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FilesPage() {
  const files = useStore((s) => s.files);
  const [q, setQ] = useState("");
  const [type, setType] = useState<Ext | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [drag, setDrag] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const used = BASE_USED + files.reduce((n, f) => n + f.sizeBytes, 0);
  const visible = useMemo(() => files.filter((f) => (!type || f.type === type) && (!q || f.name.toLowerCase().includes(q.toLowerCase()))), [files, q, type]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const ok: FileItem[] = [];
    const bad: string[] = [];
    Array.from(list).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() as Ext;
      if (!SUPPORTED.includes(ext)) return bad.push(f.name);
      // Metadata only for now; later: upload to Supabase Storage + embed into the brain.
      ok.push({ id: uid(), name: f.name, type: ext, sizeBytes: f.size, uploadedAt: new Date().toISOString() });
    });
    if (ok.length) setState((s) => ({ files: [...ok, ...s.files] }));
    setRejected(bad);
  };

  return (
    <div
      className="relative mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-8 pb-24 pt-10"
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        add(e.dataTransfer.files);
      }}
    >
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Files</h1>
          <div className="mt-3 flex items-center gap-3 text-[13px] text-muted">
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-hover">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#7cc4ff] to-[#b98bff]" animate={{ width: `${Math.max(1.5, (used / QUOTA) * 100)}%` }} />
            </div>
            {fmt(used)} of 1 GB used
          </div>
        </div>
        <button onClick={() => input.current?.click()} className="btn btn-cta"><Plus size={15} /> New</button>
        <input ref={input} type="file" multiple accept={SUPPORTED.map((s) => "." + s).join(",")} className="hidden" onChange={(e) => add(e.target.files)} />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <label className="glass flex h-10 flex-1 items-center gap-2 rounded-xl px-3">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in Files" className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
        </label>
        <div className="relative">
          <button onClick={() => setTypeOpen((o) => !o)} className="btn btn-glass h-10">
            {type ? type.toUpperCase() : "Type"} <ChevronDown size={14} />
          </button>
          <Popover open={typeOpen} onClose={() => setTypeOpen(false)} className="w-40">
            <button onClick={() => { setType(null); setTypeOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-muted hover:bg-hover hover:text-fg">All types</button>
            {SUPPORTED.map((t) => (
              <button key={t} onClick={() => { setType(t); setTypeOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-muted hover:bg-hover hover:text-fg">
                <span className="h-2 w-2 rounded-full" style={{ background: typeMeta[t].color }} /> {t.toUpperCase()}
              </button>
            ))}
          </Popover>
        </div>
        <div className="glass flex rounded-xl p-1">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-lg p-1.5 ${view === v ? "bg-active text-fg" : "text-muted"}`} aria-label={v}>
              {v === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
            </button>
          ))}
        </div>
      </div>

      {rejected.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#ff6b8b]/30 bg-[#ff6b8b]/10 px-4 py-2 text-[13px] text-[#ff9fb4]">
          Not supported: {rejected.join(", ")}. Supported: pdf, docx, xlsx, txt, eml, md.
        </div>
      )}

      {files.length === 0 ? (
        <button onClick={() => input.current?.click()} className="mt-10 flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-line py-24 text-center transition hover:bg-hover">
          <FolderOpen size={44} strokeWidth={1.2} className="text-muted" />
          <div className="mt-4 text-lg font-medium">No files yet</div>
          <p className="mt-1 max-w-md text-[13px] text-muted">Drop files here or use New to teach your assistant. Supported: pdf, docx, xlsx, txt, eml, md.</p>
        </button>
      ) : view === "grid" ? (
        <motion.div layout className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {visible.map((f) => <FileCard key={f.id} f={f} />)}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-2xl">
          {visible.map((f) => {
            const M = typeMeta[f.type];
            return (
              <div key={f.id} className="group flex items-center gap-3 border-b border-line px-4 py-3 text-[13px] last:border-0">
                <M.icon size={16} style={{ color: M.color }} />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="w-16 text-muted">{f.type.toUpperCase()}</span>
                <span className="w-20 text-right text-muted">{fmt(f.sizeBytes)}</span>
                <span className="w-32 text-right text-muted">{new Date(f.uploadedAt).toLocaleDateString("sv-SE")}</span>
                <button onClick={() => remove(f.id)} className="icon-btn h-7 w-7 opacity-0 group-hover:opacity-100" aria-label="Delete"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
      {files.length > 0 && visible.length === 0 && <div className="py-16 text-center text-sm text-muted">No files match.</div>}
      {files.length > 0 && <p className="mt-6 text-center text-xs text-faint">{files.length} file{files.length === 1 ? "" : "s"} feeding Company Brain</p>}

      <AnimatePresence>
        {drag && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 top-14 z-50 flex items-center justify-center bg-bg/70 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-[#b98bff] px-20 py-14">
              <UploadCloud size={40} className="text-[#b98bff]" />
              <div className="mt-3 text-lg font-medium">Drop to feed the brain</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function remove(id: string) {
  setState((s) => ({ files: s.files.filter((f) => f.id !== id) }));
}

function FileCard({ f }: { f: FileItem }) {
  const M = typeMeta[f.type];
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass group relative rounded-2xl p-4">
      <div className="flex h-24 items-center justify-center rounded-xl" style={{ background: `${M.color}14` }}>
        <M.icon size={30} strokeWidth={1.4} style={{ color: M.color }} />
      </div>
      <div className="mt-3 truncate text-[13px] font-medium">{f.name}</div>
      <div className="mt-0.5 text-[11px] text-muted">{f.type.toUpperCase()} · {fmt(f.sizeBytes)}</div>
      <button onClick={() => remove(f.id)} className="icon-btn absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100" aria-label="Delete"><Trash2 size={14} /></button>
    </motion.div>
  );
}
