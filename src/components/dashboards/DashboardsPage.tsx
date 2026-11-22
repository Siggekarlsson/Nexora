"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Blocks, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { dashboards, timeSaved } from "@/data/dashboards";
import { departmentColors, departmentName } from "@/data/departments";
import type { DepartmentId } from "@/lib/types";
import { Sparkline } from "./Sparkline";
import { BrainPanel } from "./BrainPanel";
import { useStore } from "@/lib/store";

const tabs = ["Overview", ...dashboards.map((d) => d.tab)];
const modes = ["Control Room", "Time and Money Saved", "Apps"] as const;

export function DashboardsPage() {
  const [tab, setTab] = useState("Overview");
  const [mode, setMode] = useState<(typeof modes)[number]>("Control Room");
  const list = tab === "Overview" ? dashboards : dashboards.filter((d) => d.tab === tab);
  const needs = dashboards.reduce((n, d) => n + d.needsYou, 0);

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-[1400px] flex-col px-6 pt-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {tabs.map((t) => {
            const d = dashboards.find((x) => x.tab === t);
            const badge = d && (t === "Paid Ads" || t === "Finance") ? d.needsYou : 0;
            return (
              <button key={t} onClick={() => { setTab(t); setMode("Control Room"); }} className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] ${tab === t ? "text-fg" : "text-muted hover:text-fg"}`}>
                {tab === t && <motion.span layoutId="dash-tab" className="absolute inset-0 rounded-xl bg-active" />}
                <span className="relative">{t}</span>
                {badge > 0 && <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff9f4a] px-1 text-[10px] font-semibold text-[#0b0b10]">{badge}</span>}
              </button>
            );
          })}
        </div>
        <div className="glass flex rounded-xl p-1 text-[12.5px]">
          {modes.map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`relative rounded-lg px-3 py-1.5 ${mode === m ? "text-fg" : "text-muted hover:text-fg"}`}>
              {mode === m && <motion.span layoutId="dash-mode" className="absolute inset-0 rounded-lg bg-active" />}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid min-h-0 flex-1 grid-cols-1 gap-5 pb-5 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_440px]">
        <div className="min-h-0 overflow-y-auto pr-1">
          {mode === "Control Room" && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">{tab === "Overview" ? "Every Dashboard" : tab}</h1>
              <p className="mt-1 text-[13px] text-muted">
                {tab === "Overview" ? `${needs} things need you, across ${dashboards.length} dashboards` : `${list[0].needsYou} thing needs you`}
              </p>
              <div className="mt-5 grid gap-4">
                {list.map((d, i) => (
                  <DashCard key={d.id} d={d} big={tab !== "Overview"} index={i} />
                ))}
              </div>
            </>
          )}
          {mode === "Time and Money Saved" && <TimeSaved />}
          {mode === "Apps" && <Apps />}
        </div>
        <div className="hidden min-h-0 md:block">
          <BrainPanel />
        </div>
      </div>
    </div>
  );
}

function DashCard({ d, big, index }: { d: (typeof dashboards)[number]; big: boolean; index: number }) {
  const color = departmentColors[d.ownerDepartmentId];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="glass rounded-2xl p-5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-medium">{d.name}</span>
            {d.sample && <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted">Sample</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {d.source}, owned by {departmentName(d.ownerDepartmentId)}
          </div>
        </div>
        {d.needsYou > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-[#ff9f4a]/15 px-2 py-1 text-[11px] font-medium text-[#ffb46e]">
            <AlertTriangle size={11} /> {d.needsYou} Need{d.needsYou === 1 ? "s" : ""} You
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {d.kpis.map((k) => {
          const up = k.delta >= 0;
          return (
            <div key={k.label} className="rounded-xl bg-hover px-3 py-2.5">
              <div className="text-[11px] text-muted">{k.label}</div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-[20px] font-semibold tracking-tight">{k.value}</span>
                <span className={`flex items-center text-[11px] ${up ? "text-[#5fe08a]" : "text-[#ff6b8b]"}`}>
                  {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {up ? "+" : ""}{k.delta.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-[11px] text-muted">{d.chartLabel}</div>
      <div className={`mt-2 ${big ? "h-56" : "h-24"}`}>
        <Sparkline data={d.series} color={color} height={big ? 220 : 90} />
      </div>
      {d.alert && (big || d.needsYou > 0) && (
        <div className="mt-3 flex gap-2 rounded-xl border border-[#ff9f4a]/25 bg-[#ff9f4a]/8 px-3 py-2 text-[12.5px] text-fg/85">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#ffb46e]" /> {d.alert}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
        <RefreshCw size={11} /> Synced {d.syncedAt}
      </div>
    </motion.div>
  );
}

function TimeSaved() {
  const total = timeSaved.reduce((n, t) => n + t.hours, 0);
  const money = timeSaved.reduce((n, t) => n + t.value, 0);
  const max = Math.max(...timeSaved.map((t) => t.hours));
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Time and Money Saved</h1>
      <p className="mt-1 text-[13px] text-muted">Last 30 days, estimated from completed skill runs.</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-[12px] text-muted"><Clock size={14} /> Hours saved</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">{total} h</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[12px] text-muted">Value at blended hourly cost</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">SEK {(money / 1000).toFixed(0)}k</div>
        </div>
      </div>
      <div className="glass mt-4 space-y-3 rounded-2xl p-5">
        {timeSaved.map((t, i) => {
          const c = departmentColors[t.dept as DepartmentId];
          return (
            <div key={t.dept} className="flex items-center gap-3 text-[13px]">
              <span className="w-24 text-muted">{departmentName(t.dept as DepartmentId)}</span>
              <div className="h-2.5 flex-1 rounded-full bg-hover">
                <motion.div className="h-full rounded-full" style={{ background: c }} initial={{ width: 0 }} animate={{ width: `${(t.hours / max) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.6 }} />
              </div>
              <span className="w-12 text-right font-medium">{t.hours} h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Apps() {
  const integrations = useStore((s) => s.integrations);
  const apps = [
    { id: "meta-ads", name: "Meta Ads", used: "Paid Ads" },
    { id: "hubspot", name: "HubSpot", used: "Pipeline" },
    { id: "accounting", name: "Accounting export", used: "Finance" },
    { id: "newsletter", name: "Newsletter", used: "Content" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Apps</h1>
      <p className="mt-1 text-[13px] text-muted">Where each dashboard gets its numbers.</p>
      <div className="mt-5 space-y-2">
        {apps.map((a) => (
          <div key={a.id} className="glass flex items-center gap-3 rounded-xl px-4 py-3 text-[13px]">
            <Blocks size={16} className="text-muted" />
            <span className="font-medium">{a.name}</span>
            <span className="text-muted">feeds {a.used}</span>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${integrations[a.id] ? "bg-[#5fe08a]/15 text-[#5fe08a]" : "bg-hover text-muted"}`}>
              {integrations[a.id] ? "Connected" : "Sample data"}
            </span>
          </div>
        ))}
        <Link href="/integrations" className="btn btn-glass mt-2">Manage integrations</Link>
      </div>
    </div>
  );
}
