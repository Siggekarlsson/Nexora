"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setState, useStore } from "@/lib/store";
import { LogoMark } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";

const plans = [
  { id: "team", name: "Team", price: "$49", per: "per seat / month", features: ["All 7 department agents", "1 GB brain storage", "5 integrations", "Scheduled skills"] },
  { id: "business", name: "Business", price: "$99", per: "per seat / month", features: ["Everything in Team", "10 GB brain storage", "Unlimited integrations", "Custom skills & import", "Priority support"], popular: true },
];

export function ReadyPage() {
  const router = useRouter();
  const started = useStore((s) => s.trialStarted);
  const [plan, setPlan] = useState("business");
  const [loading, setLoading] = useState(false);
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col items-center justify-center px-8 py-12 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}>
        <LogoMark size={64} />
      </motion.div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">{started ? "Your trial is running" : `Start your free ${siteConfig.name} trial`}</h1>
      <p className="mt-3 max-w-lg text-[15px] text-muted">14 days, every department agent, no card needed. Pick the plan you&apos;d like to try; you can change it any time.</p>

      <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <button key={p.id} onClick={() => setPlan(p.id)} className={`glass relative rounded-2xl p-6 text-left transition ${plan === p.id ? "border-fg/40 ring-1 ring-fg/20" : ""}`}>
            {p.popular && <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-[#b98bff]/20 px-2 py-0.5 text-[11px] text-[#cdb2ff]"><Sparkles size={11} /> Popular</span>}
            <div className="text-[15px] font-medium">{p.name}</div>
            <div className="mt-2 flex items-baseline gap-1.5"><span className="text-3xl font-semibold">{p.price}</span><span className="text-[13px] text-muted">{p.per}</span></div>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => <li key={f} className="flex items-center gap-2 text-[13.5px] text-fg/85"><Check size={14} className="text-[#5fe08a]" /> {f}</li>)}
            </ul>
          </button>
        ))}
      </div>

      <button
        disabled={loading || started}
        onClick={() => {
          setLoading(true);
          setTimeout(() => {
            setState(() => ({ trialStarted: true }));
            router.push("/");
          }, 900);
        }}
        className="btn btn-cta mt-8 h-12 px-8 text-[15px] disabled:opacity-60"
      >
        {started ? "Trial active" : loading ? "Starting…" : "Start Free Trial"}
      </button>
      <p className="mt-3 text-xs text-faint">No payment details needed during the trial.</p>
    </div>
  );
}
