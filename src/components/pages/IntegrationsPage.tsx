"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { setState, useStore } from "@/lib/store";
import { departmentColors } from "@/data/departments";
import type { DepartmentId } from "@/lib/types";

const apps: { id: string; name: string; desc: string; mono: string; color: string; dept: DepartmentId; category: string }[] = [
  { id: "hubspot", name: "HubSpot", desc: "Contacts, deals and the commissioned-research pipeline.", mono: "Hs", color: "#ff7a59", dept: "sales", category: "CRM" },
  { id: "meta-ads", name: "Meta Ads", desc: "Campaign spend, leads and cost per lead for Paid Ads.", mono: "Ma", color: "#4f8cff", dept: "marketing", category: "Ads" },
  { id: "gmail", name: "Gmail", desc: "Read and draft client correspondence from your inbox.", mono: "Gm", color: "#ea5f4f", dept: "operations", category: "Email" },
  { id: "google-drive", name: "Google Drive", desc: "Sync reports, models and memos into the brain.", mono: "Gd", color: "#36b37e", dept: "brain", category: "Files" },
  { id: "slack", name: "Slack", desc: "Talk to your agents and get alerts in channels.", mono: "Sl", color: "#b98bff", dept: "leadership", category: "Chat" },
  { id: "linkedin", name: "LinkedIn", desc: "Publish posts and read engagement on company pages.", mono: "Li", color: "#3b8fd9", dept: "marketing", category: "Social" },
  { id: "outlook", name: "Outlook", desc: "Mail and calendar for teams on Microsoft 365.", mono: "Ol", color: "#3d8bfd", dept: "operations", category: "Email" },
  { id: "accounting", name: "Accounting export", desc: "Invoices and revenue for the Finance dashboard.", mono: "Ac", color: "#5fe08a", dept: "finance", category: "Finance" },
  { id: "newsletter", name: "Newsletter", desc: "Send research and track opens and reads.", mono: "Nl", color: "#ff9f4a", dept: "marketing", category: "Email" },
];

export function IntegrationsPage() {
  const connected = useStore((s) => s.integrations);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const toggle = (id: string) => {
    if (connected[id]) return setState((s) => ({ integrations: { ...s.integrations, [id]: false } }));
    setBusy(id);
    setTimeout(() => {
      setState((s) => ({ integrations: { ...s.integrations, [id]: true } }));
      setBusy(null);
    }, 1100);
  };
  const list = apps.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const count = apps.filter((a) => connected[a.id]).length;
  return (
    <div className="mx-auto max-w-6xl px-8 pb-24 pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
      <p className="mt-2 text-[14px] text-muted">Connect the tools your team already uses. Agents only see what you connect. {count} connected.</p>
      <label className="glass mt-8 flex h-10 max-w-md items-center gap-2 rounded-xl px-3">
        <Search size={15} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search integrations" className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
      </label>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((a, i) => {
          const on = !!connected[a.id];
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[14px] font-semibold" style={{ background: `${a.color}22`, color: a.color }}>{a.mono}</span>
                <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{a.category}</span>
              </div>
              <div className="mt-4 text-[15px] font-medium">{a.name}</div>
              <p className="mt-1 text-[13px] leading-5 text-muted">{a.desc}</p>
              <div className="mt-auto flex items-center pt-5">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: departmentColors[a.dept] }} /> Used by {a.dept === "brain" ? "Company Brain" : a.dept[0].toUpperCase() + a.dept.slice(1)}
                </span>
                <button
                  onClick={() => toggle(a.id)}
                  disabled={busy === a.id}
                  className={`btn ml-auto h-8 px-3 text-xs ${on ? "btn-glass text-[#5fe08a]" : "btn-cta"}`}
                >
                  {busy === a.id ? <Loader2 size={13} className="animate-spin" /> : on ? <Check size={13} /> : null}
                  {busy === a.id ? "Connecting" : on ? "Connected" : "Connect"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
