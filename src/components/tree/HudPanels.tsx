"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { departments, allSkills } from "@/data/tree";
import { useStore } from "@/lib/store";

const activity = [
  { dept: "research", text: "Scanning press releases for 42 covered companies" },
  { dept: "sales", text: "Matched 6 funds to the Hexagon initiation" },
  { dept: "marketing", text: "Drafting Monday morning note" },
  { dept: "finance", text: "2 commissioned-research invoices overdue" },
  { dept: "operations", text: "Compliance check passed: Volvo Cars Q3 preview" },
  { dept: "customer", text: "Renewal reminder queued for 3 subscribers" },
  { dept: "leadership", text: "Weekly priorities ready for review" },
  { dept: "research", text: "Peer table refreshed: Nordic industrials" },
  { dept: "sales", text: "Call prep ready for 14:00 with Carnegie Fonder" },
];

const color = Object.fromEntries(departments.map((d) => [d.id, d.color]));

function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 18);
    return () => clearInterval(t);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="animate-pulse">▍</span>}
    </>
  );
}

export function HudPanels({ visible }: { visible: boolean }) {
  const files = useStore((s) => s.files);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 2600);
    const c = setInterval(() => setNow(new Date().toLocaleTimeString("sv-SE")), 1000);
    setNow(new Date().toLocaleTimeString("sv-SE"));
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, []);
  const ready = allSkills.filter((s) => s.readyToRun).length;
  const log = Array.from({ length: 4 }, (_, i) => activity[(tick + i) % activity.length]).reverse();
  const load = 38 + Math.round(Math.sin(tick / 2) * 9 + (tick % 3) * 3);

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="sys"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16, transition: { delay: 0, duration: 0.25 } }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="pointer-events-none absolute left-6 top-1/2 z-10 hidden w-52 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted xl:block"
          >
            <div className="mb-2 flex items-center gap-2 text-[#7cc4ff]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7cc4ff]" /> System status
            </div>
            <div className="space-y-1.5 border-l border-[#7cc4ff]/30 pl-3">
              <Row k="Agents online" v={`${departments.length}/${departments.length}`} />
              <Row k="Jobs mapped" v={String(allSkills.length)} />
              <Row k="Ready to run" v={String(ready)} />
              <Row k="Brain docs" v={String(files.length)} />
              <Row k="Local time" v={now} />
              <div className="pt-1">
                <div className="flex justify-between"><span>Core load</span><span className="text-fg">{load}%</span></div>
                <div className="mt-1 h-[3px] w-full bg-hover">
                  <motion.div className="h-full bg-[#7cc4ff]" animate={{ width: `${load}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            key="log"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16, transition: { delay: 0, duration: 0.25 } }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="pointer-events-none absolute right-6 top-1/2 z-10 hidden w-60 -translate-y-1/2 font-mono text-[10px] tracking-[0.06em] text-muted xl:block"
          >
            <div className="mb-2 flex items-center justify-end gap-2 uppercase tracking-[0.14em] text-[#b98bff]">
              Agent activity <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b98bff]" />
            </div>
            <div className="space-y-2 border-r border-[#b98bff]/30 pr-3 text-right">
              {log.map((l, i) => (
                <motion.div key={`${tick}-${i}`} layout initial={{ opacity: 0 }} animate={{ opacity: i === 0 ? 1 : 0.45 + i * 0.1 }}>
                  <span className="uppercase" style={{ color: color[l.dept] }}>{l.dept}</span>
                  <div className={i === 0 ? "text-fg" : ""}>{i === 0 ? <Typed text={l.text} /> : l.text}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span>{k}</span>
      <span className="text-fg">{v}</span>
    </div>
  );
}
