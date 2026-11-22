"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DepartmentId, Skill } from "@/lib/types";
import { getDepartment, neighbours } from "@/data/tree";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

// Arc of the fan, in degrees (180 = left, 270 = up, 360 = right). A little below the horizon on both sides.
const A0 = 168;
const A1 = 372;
const SPACING = 90; // px between job nodes along a row

const rad = (a: number) => (a * Math.PI) / 180;

function useStageSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
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
  const { w: W, h: H } = useStageSize(wrap);
  // geometry in real pixels, fitted to the free area between the top controls and the chat bar
  const C = { x: W / 2, y: H - 92 };
  const R = Math.max(240, Math.min(C.y - 12, W / 2 - 40));
  const R_HUB = R * 0.17;
  const R_LABEL = R * 0.3;
  const ROW0 = R * 0.52;
  const ROW_GAP = (R * 0.98 - ROW0) / 3;
  const RINGS = [R * 0.17, ROW0, ROW0 + ROW_GAP, ROW0 + 2 * ROW_GAP, ROW0 + 3 * ROW_GAP, R * 1.1];
  const at = (r: number, a: number) => ({ x: C.x + Math.cos(rad(a)) * r, y: C.y + Math.sin(rad(a)) * r });
  const [hover, setHover] = useState<string | null>(null);

  // sizes below are in screen pixels, divided by the stage scale
  const u = (n: number) => n;

  const layout = useMemo(() => {
    const spacing = SPACING;
    const weights = d.subGroups.map((g) => Math.max(g.skills.length, 3));
    const total = weights.reduce((a, b) => a + b, 0);
    let cursor = A0;
    return d.subGroups.map((g, i) => {
      const span = ((A1 - A0) * weights[i]) / total;
      const ga = cursor + span / 2;
      cursor += span;
      const hub = at(R_HUB, ga);
      const jobs: { skill: Skill; x: number; y: number }[] = [];
      let rest = [...g.skills];
      for (let r = ROW0; rest.length; r += ROW_GAP) {
        const usable = rad(span * 0.9);
        const cap = Math.max(r > ROW0 + ROW_GAP * 3.5 ? 1 : 0, Math.floor((usable * r) / spacing));
        if (!cap) continue;
        const row = rest.slice(0, cap);
        rest = rest.slice(cap);
        const step = (spacing / r) * (180 / Math.PI);
        row.forEach((skill, j) => jobs.push({ skill, ...at(r, ga + (j - (row.length - 1) / 2) * step) }));
      }
      return { group: g, angle: ga, span, hub, label: at(R_LABEL, ga), jobs };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, W, H]);

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
      <button onClick={onBack} className="btn btn-glass absolute left-24 top-[4.25rem] z-30">
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

          <div ref={wrap} className="absolute inset-x-20 bottom-[140px] top-[7rem]">
            <div
              className="absolute bottom-0 left-1/2"
              style={{ width: W, height: H, transform: "translateX(-50%)", visibility: W ? "visible" : "hidden" }}
            >
              <svg width={W} height={H} className="absolute inset-0 overflow-visible">
                {RINGS.map((r, i) => (
                  <motion.path
                    key={r}
                    d={`M ${at(r, A0).x} ${at(r, A0).y} A ${r} ${r} 0 1 1 ${at(r, A1).x} ${at(r, A1).y}`}
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
                      stroke={d.color} strokeOpacity={0.55} strokeWidth={u(1.4)}
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.25 + gi * 0.08 }}
                    />
                    {l.jobs.map((j, ji) => (
                      <motion.line
                        key={j.skill.id}
                        x1={l.hub.x} y1={l.hub.y} x2={j.x} y2={j.y}
                        stroke={d.color}
                        strokeOpacity={hover === j.skill.id || selectedJob === j.skill.id ? 0.8 : j.skill.readyToRun || j.skill.recommended ? 0.45 : 0.22}
                        strokeWidth={u(1)}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + gi * 0.08 + ji * 0.02 }}
                      />
                    ))}
                    <motion.circle
                      cx={l.hub.x} cy={l.hub.y} r={u(4)} fill={d.color}
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
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center"
                  style={{ left: l.label.x, top: l.label.y, width: Math.max(u(120), rad(l.span) * R_LABEL * 0.95) }}
                >
                  <div className="dept-title leading-tight text-fg" style={{ fontSize: u(14), letterSpacing: "0.22em", textShadow: "0 0 12px var(--bg)" }}>{l.group.name}</div>
                  <div className="dept-title mt-1 text-muted" style={{ fontSize: u(11), letterSpacing: "0.22em" }}>
                    {l.group.skills.length} job{l.group.skills.length === 1 ? "" : "s"}
                  </div>
                </motion.div>
              ))}

              {/* job nodes with their names */}
              {layout.flatMap((l, gi) =>
                l.jobs.map((j, ji) => {
                  const s = j.skill;
                  const rec = !!s.recommended;
                  const lit = s.readyToRun || rec;
                  const sel = selectedJob === s.id;
                  const size = u(rec ? 54 : 36);
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: lit || sel || hover === s.id ? 1 : 0.6, scale: 1 }}
                      transition={{ delay: 0.6 + gi * 0.08 + ji * 0.03, type: "spring", stiffness: 260, damping: 18 }}
                      className="absolute flex flex-col items-center"
                      style={{ left: j.x, top: j.y, width: u(96), marginLeft: -u(48), marginTop: -size / 2 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.12 }}
                        onMouseEnter={() => setHover(s.id)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => onSelectJob(s)}
                        className="relative flex shrink-0 items-center justify-center rounded-full"
                        style={{
                          width: size,
                          height: size,
                          background: rec ? d.color : lit ? `${d.color}30` : "var(--glass-strong)",
                          border: `${u(1)}px solid ${lit || sel ? d.color : "var(--line)"}`,
                          color: rec ? "#0b0b10" : lit || sel ? d.color : "var(--muted)",
                          boxShadow: rec
                            ? `0 0 0 ${u(5)}px var(--bg), 0 0 0 ${u(6.5)}px ${d.color}, 0 0 ${u(34)}px ${d.color}`
                            : sel
                              ? `0 0 0 ${u(4)}px ${d.color}33, 0 0 ${u(24)}px ${d.color}aa`
                              : lit
                                ? `0 0 0 ${u(3)}px ${d.color}1a, 0 0 ${u(16)}px ${d.color}66`
                                : "none",
                        }}
                        aria-label={s.name}
                      >
                        <DynamicIcon name={s.icon} size={u(rec ? 22 : 15)} strokeWidth={rec ? 2 : 1.7} />
                      </motion.button>
                      <span
                        className="mt-1.5 line-clamp-2 text-center leading-tight"
                        style={{ fontSize: u(11.5), color: rec || hover === s.id || sel ? "var(--fg)" : lit ? "var(--fg)" : "var(--muted)", fontWeight: rec ? 600 : 400, textShadow: "0 0 8px var(--bg)" }}
                      >
                        {s.name}
                      </span>
                    </motion.div>
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
                  className="flex items-center justify-center rounded-full"
                  style={{ width: u(84), height: u(84), background: `${d.color}24`, boxShadow: `0 0 0 ${u(1)}px ${d.color}aa, 0 0 0 ${u(10)}px ${d.color}12, 0 0 ${u(60)}px ${d.color}77` }}
                >
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
                    <PixelAvatar id={d.id} color={d.color} size={u(40)} />
                  </motion.div>
                </div>
              </motion.div>
              <div className="absolute -translate-x-1/2 whitespace-nowrap text-center" style={{ left: C.x, top: C.y + u(54) }}>
                <div className="dept-title" style={{ fontSize: u(20) }}>{d.name}</div>
                <div className="mt-1 text-muted" style={{ fontSize: u(13) }}>
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
