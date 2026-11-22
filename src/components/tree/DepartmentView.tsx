"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DepartmentId, Skill } from "@/lib/types";
import { getDepartment, neighbours } from "@/data/tree";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

const W = 1400;
const H = 820;
const C = { x: 700, y: 690 };
const A0 = 196;
const A1 = 344;
const R_HUB = 215;
const ROWS = [395, 475, 555];
const RINGS = [130, 215, 305, 395, 475, 555, 640];

const rad = (a: number) => (a * Math.PI) / 180;
const at = (r: number, a: number) => ({ x: C.x + Math.cos(rad(a)) * r, y: C.y + Math.sin(rad(a)) * r });

function useStageScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [s, setS] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setS(Math.min(e.contentRect.width / W, e.contentRect.height / H)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

interface Props {
  id: DepartmentId;
  selectedJob: string | null;
  onBack: () => void;
  onNavigate: (id: DepartmentId, dir: 1 | -1) => void;
  onSelectJob: (s: Skill) => void;
  direction: 1 | -1;
}

export function DepartmentView({ id, selectedJob, onBack, onNavigate, onSelectJob, direction }: Props) {
  const d = getDepartment(id)!;
  const { prev, next } = neighbours(id);
  const pd = getDepartment(prev)!;
  const nd = getDepartment(next)!;
  const wrap = useRef<HTMLDivElement>(null);
  const scale = useStageScale(wrap);
  const [hover, setHover] = useState<string | null>(null);

  const layout = useMemo(() => {
    const k = d.subGroups.length;
    const span = (A1 - A0) / k;
    return d.subGroups.map((g, i) => {
      const ga = A0 + (i + 0.5) * span;
      const hub = at(R_HUB, ga);
      const jobs: { skill: Skill; x: number; y: number }[] = [];
      let rest = [...g.skills];
      for (const r of ROWS) {
        if (!rest.length) break;
        const arcLen = rad(span * 0.86) * r;
        const cap = Math.max(1, Math.floor(arcLen / 50));
        const row = rest.slice(0, cap);
        rest = rest.slice(cap);
        const step = Math.min(span * 0.86 / Math.max(row.length, 1), (50 / r) * (180 / Math.PI));
        row.forEach((skill, j) => {
          const a = ga + (j - (row.length - 1) / 2) * step;
          jobs.push({ skill, ...at(r, a) });
        });
      }
      return { group: g, angle: ga, hub, label: at(305, ga), jobs };
    });
  }, [d]);

  const neighbourBtn = (side: "left" | "right") => {
    const nb = side === "left" ? pd : nd;
    return (
      <button
        onClick={() => onNavigate(nb.id, side === "left" ? -1 : 1)}
        className={`group absolute top-0 z-20 flex h-full w-20 flex-col items-center justify-center gap-4 ${side === "left" ? "left-0" : "right-0"}`}
        aria-label={`Go to ${nb.name}`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full glass text-muted transition group-hover:text-fg">
          {side === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </span>
        <span
          className="dept-title text-[12px] text-faint transition group-hover:text-fg"
          style={{ writingMode: "vertical-rl", transform: side === "left" ? "rotate(180deg)" : undefined, letterSpacing: "0.5em" }}
        >
          {nb.name}
        </span>
        <span
          className={`absolute bottom-[14%] flex h-28 w-28 items-center justify-center rounded-full opacity-40 transition group-hover:opacity-80 ${side === "left" ? "-left-14" : "-right-14"}`}
          style={{ background: `${nb.color}1f`, boxShadow: `0 0 0 1px ${nb.color}55, 0 0 40px ${nb.color}44` }}
        >
          <PixelAvatar id={nb.id} color={nb.color} size={44} />
        </span>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <button onClick={onBack} className="btn btn-glass absolute left-24 top-5 z-30">
        <ChevronLeft size={15} /> All Departments
      </button>
      {neighbourBtn("left")}
      {neighbourBtn("right")}

      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 120 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -120 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* watermark */}
          <div
            className="dept-title pointer-events-none absolute inset-x-0 top-[6%] select-none text-center leading-none"
            style={{ fontSize: "clamp(80px, 12vw, 220px)", opacity: 0.045, letterSpacing: "0.3em" }}
          >
            {d.name}
          </div>
          {/* glow */}
          <div
            className="pointer-events-none absolute bottom-[-20%] left-1/2 h-[80%] w-[70%] -translate-x-1/2 rounded-full blur-[120px]"
            style={{ background: d.color, opacity: 0.12 }}
          />

          <div ref={wrap} className="absolute inset-x-20 bottom-4 top-16">
            <div
              className="absolute bottom-0 left-1/2"
              style={{ width: W, height: H, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "bottom center" }}
            >
              <svg width={W} height={H} className="absolute inset-0 overflow-visible">
                {RINGS.map((r, i) => (
                  <motion.path
                    key={r}
                    d={`M ${C.x - r} ${C.y} A ${r} ${r} 0 0 1 ${C.x + r} ${C.y}`}
                    fill="none"
                    style={{ stroke: "rgba(var(--star),0.08)" }}
                    strokeDasharray={i % 2 ? "2 6" : undefined}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.1, delay: 0.1 + i * 0.06, ease: "easeOut" }}
                  />
                ))}
                {layout.map((l, gi) => (
                  <g key={l.group.id}>
                    <motion.line
                      x1={C.x} y1={C.y} x2={l.hub.x} y2={l.hub.y}
                      stroke={d.color} strokeOpacity={0.5} strokeWidth={1.2}
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.25 + gi * 0.08 }}
                    />
                    {l.jobs.map((j, ji) => (
                      <motion.line
                        key={j.skill.id}
                        x1={l.hub.x} y1={l.hub.y} x2={j.x} y2={j.y}
                        stroke={d.color}
                        strokeOpacity={hover === j.skill.id || selectedJob === j.skill.id ? 0.7 : j.skill.readyToRun ? 0.35 : 0.12}
                        strokeWidth={0.9}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + gi * 0.08 + ji * 0.02 }}
                      />
                    ))}
                    <motion.circle
                      cx={l.hub.x} cy={l.hub.y} r={5} fill={d.color}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + gi * 0.08, type: "spring" }}
                      style={{ transformBox: "fill-box", transformOrigin: "center", filter: `drop-shadow(0 0 6px ${d.color})` }}
                    />
                  </g>
                ))}
              </svg>

              {/* group labels */}
              {layout.map((l, gi) => (
                <motion.div
                  key={`lbl-${l.group.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + gi * 0.08 }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
                  style={{ left: l.label.x, top: l.label.y }}
                >
                  <div className="dept-title rounded-md bg-bg/40 px-1.5 text-[11px] text-fg/90" style={{ letterSpacing: "0.22em" }}>{l.group.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted">({l.group.skills.length} job{l.group.skills.length === 1 ? "" : "s"})</div>
                </motion.div>
              ))}

              {/* job nodes */}
              {layout.flatMap((l, gi) =>
                l.jobs.map((j, ji) => {
                  const s = j.skill;
                  const lit = s.readyToRun || s.recommended;
                  const sel = selectedJob === s.id;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: lit || sel || hover === s.id ? 1 : 0.5, scale: 1 }}
                      whileHover={{ scale: 1.15 }}
                      transition={{ delay: 0.6 + gi * 0.08 + ji * 0.03, type: "spring", stiffness: 260, damping: 18 }}
                      onMouseEnter={() => setHover(s.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onSelectJob(s)}
                      className="absolute -ml-[21px] -mt-[21px] flex h-[42px] w-[42px] items-center justify-center rounded-full"
                      style={{
                        left: j.x,
                        top: j.y,
                        background: lit ? `${d.color}30` : "var(--glass-strong)",
                        border: `1px solid ${lit || sel ? d.color : "var(--line)"}`,
                        color: lit || sel ? d.color : "var(--muted)",
                        boxShadow: sel
                          ? `0 0 0 4px ${d.color}33, 0 0 24px ${d.color}aa`
                          : lit
                            ? `0 0 0 3px ${d.color}1a, 0 0 18px ${d.color}66`
                            : "none",
                      }}
                      aria-label={s.name}
                    >
                      <DynamicIcon name={s.icon} size={17} strokeWidth={1.7} />
                      {s.recommended && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: d.color }} />
                      )}
                      <AnimatePresence>
                        {hover === s.id && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="pointer-events-none absolute top-full z-30 mt-2 whitespace-nowrap rounded-lg glass-strong px-2.5 py-1 text-[12px] text-fg"
                          >
                            {s.name}
                            {s.readyToRun && <span className="ml-1.5 text-[10px]" style={{ color: d.color }}>● ready</span>}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                }),
              )}

              {/* department node */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 160, damping: 16 }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: C.x, top: C.y }}
              >
                <div
                  className="flex h-[92px] w-[92px] items-center justify-center rounded-full"
                  style={{ background: `${d.color}24`, boxShadow: `0 0 0 1px ${d.color}aa, 0 0 0 10px ${d.color}12, 0 0 60px ${d.color}77` }}
                >
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
                    <PixelAvatar id={d.id} color={d.color} size={44} />
                  </motion.div>
                </div>
              </motion.div>
              <div className="absolute w-[500px] -translate-x-1/2 text-center" style={{ left: C.x, top: C.y + 62 }}>
                <div className="dept-title text-[22px]">{d.name}</div>
                <div className="mt-1 text-[13px] text-muted">
                  {d.tagline.join(" · ")} · <span style={{ color: d.color }}>{d.readyToRun} of {d.jobs} ready to run</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
