"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { restartOnboarding, WORK_APPS } from "@/lib/onboarding";
import { siteConfig } from "@/config/site";
import { Toggle } from "@/components/ui/Toggle";
import { setState, useStore } from "@/lib/store";
import { AppLogo } from "@/components/ui/AppLogo";

const sections = ["Profile", "Workspace", "Appearance", "Notifications", "Data & privacy"] as const;

export function SettingsPage() {
  const [active, setActive] = useState<(typeof sections)[number]>("Profile");
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();
  const [notif, setNotif] = useState({ needsYou: true, digest: true, runs: false, product: false });
  const workspace = useStore((s) => s.workspace);
  const brief = useStore((s) => s.brain.brief);
  const prof = useStore((s) => s.profile);
  const wsOf = () => ({
    company: prof.companyName || workspace.company,
    website: prof.website || workspace.website || "",
    companyType: prof.companyType,
    whatWeDo: prof.whatWeDo || workspace.about,
    howWeMakeMoney: prof.howWeMakeMoney,
    brief,
  });
  const [ws, setWs] = useState(wsOf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setWs(wsOf()), [workspace, prof, brief]);
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("section");
    const hit = sections.find((x) => x === want);
    if (hit) setActive(hit);
  }, []);
  const profile = useStore((s) => s.profile);
  const [pf, setPf] = useState({ name: profile.name, role: profile.role, goals: profile.goals.join(", ") });
  useEffect(() => setPf({ name: profile.name, role: profile.role, goals: profile.goals.join(", ") }), [profile]);
  const router = useRouter();
  const save = () => {
    if (active === "Workspace") {
      const website = ws.website.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      setState((s) => ({
        workspace: { company: ws.company.trim() || siteConfig.user.company, about: ws.whatWeDo.trim().split(/\n/)[0].slice(0, 300), website },
        profile: { ...s.profile, companyName: ws.company.trim(), website, hasWebsite: !!website, companyType: ws.companyType.trim(), whatWeDo: ws.whatWeDo.trim(), howWeMakeMoney: ws.howWeMakeMoney.trim() },
        brain: { ...s.brain, brief: ws.brief },
      }));
    }
    if (active === "Profile")
      setState((s) => ({
        profile: { ...s.profile, name: pf.name.trim(), role: pf.role.trim(), goals: pf.goals.split(",").map((g) => g.trim()).filter(Boolean) },
      }));
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
            <label className="text-[13px] text-muted">First name<input value={pf.name || ""} placeholder={siteConfig.user.firstName} onChange={(e) => setPf({ ...pf, name: e.target.value })} className={field} /></label>
            <label className="text-[13px] text-muted">Last name<input defaultValue={siteConfig.user.lastName} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">Email<input defaultValue={siteConfig.user.email} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">Role<input value={pf.role} placeholder="Your role" onChange={(e) => setPf({ ...pf, role: e.target.value })} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">How Sigge McDulle should help you<input value={pf.goals} placeholder="Separate with commas" onChange={(e) => setPf({ ...pf, goals: e.target.value })} className={field} /></label>
            <div className="col-span-2 text-[13px] text-muted">
              Apps your team uses
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.apps.filter((a) => a !== "none").length ? (
                  profile.apps.filter((a) => a !== "none").map((a) => (
                    <span key={a} className="flex items-center gap-2 rounded-full border border-line bg-hover py-1 pl-1 pr-3 text-[12.5px] text-fg">
                      <AppLogo id={WORK_APPS.find((w) => w.id === a)?.integration ?? a} size={24} className="rounded-full !p-1" />
                      {WORK_APPS.find((w) => w.id === a)?.name ?? a}
                    </span>
                  ))
                ) : (
                  <span className="text-[12.5px]">None picked</span>
                )}
              </div>
            </div>
            <div className="col-span-2 mt-2 flex items-center justify-between rounded-xl border border-line p-4">
              <div>
                <div className="text-[14px] text-fg">Restart onboarding</div>
                <div className="text-[12.5px] text-muted">Answer the setup questions again and rebuild your tree. Your current answers are filled in.</div>
              </div>
              <button
                onClick={() => {
                  restartOnboarding();
                  router.push("/onboarding");
                }}
                className="btn btn-glass"
              >
                <RotateCcw size={14} /> Restart onboarding
              </button>
            </div>
          </div>
        )}
        {active === "Workspace" && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <label className="text-[13px] text-muted">Company name<input value={ws.company} onChange={(e) => setWs({ ...ws, company: e.target.value })} className={field} /></label>
            <label className="text-[13px] text-muted">Website<input value={ws.website} placeholder="No website" onChange={(e) => setWs({ ...ws, website: e.target.value })} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">Type of company<input value={ws.companyType} placeholder="For example Clothing brand" onChange={(e) => setWs({ ...ws, companyType: e.target.value })} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">What you do and sell<textarea rows={4} value={ws.whatWeDo} onChange={(e) => setWs({ ...ws, whatWeDo: e.target.value })} className={field + " resize-y"} /></label>
            <label className="col-span-2 text-[13px] text-muted">How you make money<input value={ws.howWeMakeMoney} onChange={(e) => setWs({ ...ws, howWeMakeMoney: e.target.value })} className={field} /></label>
            <label className="col-span-2 text-[13px] text-muted">
              Company Brief <span className="text-faint">(every agent reads this; Markdown works)</span>
              <textarea rows={10} value={ws.brief} placeholder="Written during onboarding. Describe the company for your agents." onChange={(e) => setWs({ ...ws, brief: e.target.value })} className={field + " resize-y font-mono text-[12.5px] leading-relaxed"} />
            </label>
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
