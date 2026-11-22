"use client";

import { useTheme } from "next-themes";
import { useState } from "react";
import { Check } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Toggle } from "@/components/ui/Toggle";
import { setState, useStore } from "@/lib/store";

const sections = ["Profile", "Workspace", "Appearance", "Notifications", "Data & privacy"] as const;

export function SettingsPage() {
  const [active, setActive] = useState<(typeof sections)[number]>("Profile");
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();
  const [notif, setNotif] = useState({ needsYou: true, digest: true, runs: false, product: false });
  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };
  const field = "mt-1.5 w-full rounded-xl border border-line bg-hover px-3 py-2.5 text-sm outline-none focus:border-fg/25";
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[200px_1fr] gap-10 px-8 pb-24 pt-10">
      <nav className="space-y-1">
        <h1 className="mb-5 text-3xl font-semibold tracking-tight">Settings</h1>
        {sections.map((s) => (
          <button key={s} onClick={() => setActive(s)} className={`w-full rounded-lg px-3 py-2 text-left text-[13.5px] ${active === s ? "bg-active text-fg" : "text-muted hover:bg-hover hover:text-fg"}`}>{s}</button>
        ))}
      </nav>
      <div className="glass mt-14 rounded-2xl p-7">
        <h2 className="text-lg font-semibold">{active}</h2>
        {active === "Profile" && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <label className="text-[13px] text-muted">First name<input defaultValue={siteConfig.user.firstName} className={field} /></label>
            <label className="text-[13px] text-muted">Last name<input defaultValue={siteConfig.user.lastName} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">Email<input defaultValue={siteConfig.user.email} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">Role<input defaultValue="Head of Research" className={field} /></label>
          </div>
        )}
        {active === "Workspace" && (
          <div className="mt-5 grid gap-4">
            <label className="text-[13px] text-muted">Company name<input defaultValue={siteConfig.user.company} className={field} /></label>
            <label className="text-[13px] text-muted">What does your company do?<textarea rows={3} defaultValue="Independent equity research on Nordic listed companies: commissioned research, investor events and distribution to institutional investors." className={field + " resize-none"} /></label>
            <label className="text-[13px] text-muted">Default language<select className={field} defaultValue="en"><option value="en">English</option><option value="sv">Svenska</option></select></label>
          </div>
        )}
        {active === "Appearance" && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={`rounded-2xl border p-4 text-left ${theme === t ? "border-fg/40" : "border-line"}`}>
                <div className={`h-20 rounded-xl ${t === "dark" ? "bg-[#0b0b10]" : "bg-[#f5f4f8]"} border border-line`} />
                <div className="mt-3 flex items-center gap-2 text-[13.5px] capitalize">{theme === t && <Check size={14} />} {t}</div>
              </button>
            ))}
          </div>
        )}
        {active === "Notifications" && (
          <div className="mt-5 divide-y divide-line">
            {([
              ["needsYou", "When a dashboard needs me", "Alerts from Control Room"],
              ["digest", "Daily digest", "One email at 07:00 with what changed"],
              ["runs", "Every scheduled run", "Notify when a schedule finishes"],
              ["product", "Product news", "New features and tips"],
            ] as const).map(([k, t, d]) => (
              <div key={k} className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <div className="text-[14px]">{t}</div>
                  <div className="text-[12.5px] text-muted">{d}</div>
                </div>
                <Toggle on={notif[k]} onChange={(v) => setNotif((n) => ({ ...n, [k]: v }))} label={t} />
              </div>
            ))}
          </div>
        )}
        {active === "Data & privacy" && <DataPrivacy />}
        {active !== "Appearance" && active !== "Data & privacy" && (
          <div className="mt-7 flex justify-end">
            <button onClick={save} className="btn btn-cta">{saved ? <><Check size={14} /> Saved</> : "Save changes"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DataPrivacy() {
  const files = useStore((s) => s.files);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mt-5 space-y-4 text-[13.5px]">
      <p className="text-muted">Your documents are only used to answer questions inside this workspace. They are never used to train models.</p>
      <div className="flex items-center justify-between rounded-xl border border-line p-4">
        <div>
          <div>Reset local demo data</div>
          <div className="text-[12.5px] text-muted">Clears chats, {files.length} uploaded file{files.length === 1 ? "" : "s"}, and skill changes stored in this browser.</div>
        </div>
        {confirm ? (
          <button
            onClick={() => {
              localStorage.removeItem("nexora.state.v1");
              localStorage.removeItem("nexora.tree.offsets.v1");
              setState(() => ({ files: [], customSkills: [], skillEnabled: {}, schedules: {}, trialStarted: false }));
              location.reload();
            }}
            className="btn bg-[#ff6b8b] text-white"
          >
            Yes, reset
          </button>
        ) : (
          <button onClick={() => setConfirm(true)} className="btn btn-glass text-[#ff6b8b]">Reset</button>
        )}
      </div>
    </div>
  );
}
