"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DepartmentId, Skill } from "@/lib/types";
import { departments, allSkills } from "@/data/tree";
import { brain } from "@/data/departments";
import { PixelSprite } from "@/components/brand/PixelSprite";
import { lineLayout, radialLayout, VIEW, type TreeMode, type TreeNode } from "./layout";

export type Offsets = Record<string, { x: number; y: number }>;

interface Props {
  mode: TreeMode;
  editing: boolean;
  focus: DepartmentId | null;
  offsets: Offsets;
  onOffsetsChange: (o: Offsets) => void;
  onSelectDept: (id: DepartmentId) => void;
  onSelectJob: (skill: Skill) => void;
  onSelectBrain: () => void;
}

const deptById = Object.fromEntries(departments.map((d) => [d.id, d]));
const skillById = Object.fromEntries(allSkills.map((s) => [s.id, s]));
const spring = { type: "spring" as const, stiffness: 70, damping: 18, mass: 0.9 };

export function SkillTreeMap({ mode, editing, focus, offsets, onOffsetsChange, onSelectDept, onSelectJob, onSelectBrain }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => (mode === "radial" ? radialLayout(departments) : lineLayout(departments)), [mode]);
  const [hoverDept, setHoverDept] = useState<DepartmentId | null>(null);
  const [hoverJob, setHoverJob] = useState<string | null>(null);
  const [drag, setDrag] = useState<null | { key: string; sx: number; sy: number; ox: number; oy: number }>(null);

  const byId = useMemo(() => Object.fromEntries(layout.nodes.map((n) => [n.id, n])), [layout]);

  const off = (k: string) => offsets[k] ?? { x: 0, y: 0 };
  const pos = (n: TreeNode) => {
    if (n.kind === "brain") return { x: n.x + off("brain").x, y: n.y + off("brain").y };
    const d = off(n.deptId);
    const own = n.kind === "dept" ? { x: 0, y: 0 } : off(n.id);
    return { x: n.x + d.x + own.x, y: n.y + d.y + own.y };
  };

  const toSvg = (cx: number, cy: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const toScreen = (x: number, y: number) => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return { left: 0, top: 0 };
    const pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const p = pt.matrixTransform(svg.getScreenCTM()!);
    const r = wrap.getBoundingClientRect();
    return { left: p.x - r.left, top: p.y - r.top };
  };

  const startDrag = (e: React.PointerEvent, n: TreeNode) => {
    if (!editing) return;
    e.stopPropagation();
    const key = n.kind === "dept" ? n.deptId : n.id;
    const p = toSvg(e.clientX, e.clientY);
    const o = off(key);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ key, sx: p.x, sy: p.y, ox: o.x, oy: o.y });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toSvg(e.clientX, e.clientY);
    onOffsetsChange({ ...offsets, [drag.key]: { x: drag.ox + p.x - drag.sx, y: drag.oy + p.y - drag.sy } });
  };

  const posTransition = (key: string) => (drag && (drag.key === key) ? { duration: 0 } : spring);
  const t = (n: TreeNode) => ({
    opacity: { delay: n.order * 1.3, duration: 0.6 },
    scale: { delay: n.order * 1.3, type: "spring" as const, stiffness: 260, damping: 16 },
    cx: posTransition(n.kind === "dept" ? n.deptId : n.id),
    cy: posTransition(n.kind === "dept" ? n.deptId : n.id),
  });
  const draggingDept = (dept: string) => drag?.key === dept;
  const edgeT = (n: TreeNode) => {
    const instant = drag && (draggingDept(n.deptId) || drag.key === n.id || drag.key === n.parent);
    const p = instant ? { duration: 0 } : spring;
    return { pathLength: { delay: n.order * 1.2, duration: 0.8 }, opacity: { delay: n.order * 1.2, duration: 0.4 }, x1: p, y1: p, x2: p, y2: p };
  };

  // focus zoom: animate a progress value and derive the viewBox from it
  const zoom = useMotionValue(0);
  const target = useRef({ x: 0, y: 0 });
  if (focus && byId[focus]) target.current = pos(byId[focus]);
  useEffect(() => {
    const c = animate(zoom, focus ? 1 : 0, { duration: 0.9, ease: [0.65, 0, 0.35, 1] });
    return () => c.stop();
  }, [focus, zoom]);
  const vb = useTransform(zoom, (v) => {
    const z = 1 + v * 2.6;
    const cx = target.current.x * v;
    const cy = target.current.y * v;
    const w = VIEW.w / z;
    const h = VIEW.h / z;
    return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
  });

  const deptNodes = layout.nodes.filter((n) => n.kind === "dept");
  const hovered = hoverDept ? deptById[hoverDept] : null;
  const hoveredJob = hoverJob ? skillById[hoverJob] : null;

  const dim = (deptId: DepartmentId) => (hoverDept && hoverDept !== deptId ? 0.22 : 1);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <motion.svg
        ref={svgRef}
        className={`h-full w-full select-none ${editing ? "cursor-grab" : ""}`}
        viewBox={vb}
        initial={false}
        animate={{ opacity: focus ? 0 : 1 }}
        transition={{ opacity: { duration: 0.35, delay: focus ? 0.45 : 0.1 } }}
        style={{ overflow: "visible" }}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onMove}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        <defs>
          {departments.map((d) => (
            <radialGradient key={d.id} id={`glow-${d.id}`}>
              <stop offset="0%" stopColor={d.color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={d.color} stopOpacity={0} />
            </radialGradient>
          ))}
          <radialGradient id="glow-brain">
            <stop offset="0%" stopColor={brain.color} stopOpacity={0.45} />
            <stop offset="60%" stopColor="#5b3cff" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#5b3cff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="brain-core">
            <stop offset="0%" stopColor="#2a2140" />
            <stop offset="100%" stopColor="#120f1c" />
          </radialGradient>
        </defs>

        {/* nebula glow behind each constellation */}
        <g style={{ opacity: "var(--nebula-opacity)" }}>
          {deptNodes.map((n) => {
            const p = pos(n);
            const k = mode === "radial" ? 1.75 : 1;
            return (
              <motion.circle
                key={`glow-${n.id}`}
                fill={`url(#glow-${n.deptId})`}
                initial={{ opacity: 0, r: 120 }}
                animate={{ opacity: hoverDept === n.deptId ? 1 : 0.75, cx: p.x * k, cy: p.y * (mode === "radial" ? k : 1), r: mode === "radial" ? 230 : 140 }}
                transition={{ opacity: { duration: 1.2, delay: 0.3 }, default: spring }}
              />
            );
          })}
          <motion.circle
            fill="url(#glow-brain)"
            initial={{ r: 0 }}
            animate={{ r: mode === "radial" ? 260 : 160, cx: pos(byId.brain).x, cy: 0 }}
            transition={{ duration: 1.4 }}
          />
        </g>

        {/* edges */}
        {departments.map((d) => (
          <motion.g key={`edges-${d.id}`} animate={{ opacity: dim(d.id) }} transition={{ duration: 0.25 }}>
            {layout.nodes
              .filter((n) => n.deptId === d.id && n.parent)
              .map((n) => {
                const a = pos(byId[n.parent!]);
                const b = pos(n);
                const color =
                  n.kind === "dept" ? d.color : n.kind === "group" ? d.color : undefined;
                return (
                  <motion.line
                    key={`e-${n.id}`}
                    initial={{ pathLength: 0, opacity: 0, x1: a.x, y1: a.y, x2: b.x, y2: b.y }}
                    animate={{ pathLength: 1, opacity: 1, x1: a.x, y1: a.y, x2: b.x, y2: b.y }}
                    transition={edgeT(n)}
                    stroke={color}
                    style={color ? undefined : { stroke: "rgba(var(--star),0.16)" }}
                    strokeOpacity={n.kind === "dept" ? 0.55 : n.kind === "group" ? 0.4 : 1}
                    strokeWidth={n.kind === "dept" ? 1.2 : 0.8}
                  />
                );
              })}
          </motion.g>
        ))}

        {/* group hubs + jobs */}
        {departments.map((d) => (
          <motion.g key={`nodes-${d.id}`} animate={{ opacity: dim(d.id) }} transition={{ duration: 0.25 }}>
            {layout.nodes
              .filter((n) => n.deptId === d.id && (n.kind === "group" || n.kind === "job"))
              .map((n) => {
                const p = pos(n);
                if (n.kind === "group")
                  return (
                    <motion.circle
                      key={n.id}
                      initial={{ opacity: 0, scale: 0, cx: p.x, cy: p.y }}
                      animate={{ opacity: 1, scale: 1, cx: p.x, cy: p.y }}
                      transition={t(n)}
                      r={editing ? 6 : 3.4}
                      fill={d.color}
                      fillOpacity={0.85}
                      stroke={editing ? d.color : "none"}
                      strokeDasharray="2 2"
                      onPointerDown={(e) => startDrag(e, n)}
                      style={{ cursor: editing ? "grab" : "default" }}
                    />
                  );
                const s = skillById[n.id];
                const ready = s.readyToRun;
                const hot = hoverJob === n.id;
                return (
                  <g
                    key={n.id}
                    className={ready ? undefined : "twinkle"}
                    style={{ animationDelay: `${(n.order * 13) % 6}s` }}
                    onPointerEnter={() => setHoverJob(n.id)}
                    onPointerLeave={() => setHoverJob(null)}
                    onPointerDown={(e) => startDrag(e, n)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!editing) onSelectJob(s);
                    }}
                    cursor={editing ? "grab" : "pointer"}
                  >
                    <motion.circle
                      initial={{ opacity: 0, scale: 0, cx: p.x, cy: p.y }}
                      animate={{ opacity: 1, scale: 1, cx: p.x, cy: p.y }}
                      transition={t(n)}
                      r={10}
                      fill="transparent"
                    />
                    {ready && (
                      <motion.circle
                        initial={{ opacity: 0, cx: p.x, cy: p.y }}
                        animate={{ opacity: 0.28, cx: p.x, cy: p.y, r: hot ? 11 : 8 }}
                        transition={t(n)}
                        fill={d.color}
                      />
                    )}
                    <motion.circle
                      initial={{ opacity: 0, scale: 0, cx: p.x, cy: p.y }}
                      animate={{ opacity: 1, scale: 1, cx: p.x, cy: p.y, r: (ready ? 4 : 2.6) * (hot ? 1.5 : 1) }}
                      transition={t(n)}
                      style={ready ? { fill: d.color } : { fill: hot ? d.color : "rgba(var(--star),0.6)" }}
                      stroke={editing ? d.color : "none"}
                      strokeWidth={editing ? 0.8 : 0}
                    />
                  </g>
                );
              })}
          </motion.g>
        ))}

        {/* department nodes */}
        {deptNodes.map((n) => {
          const d = deptById[n.deptId];
          const p = pos(n);
          const active = hoverDept === d.id;
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: dim(d.id) === 1 ? 1 : 0.5, scale: 1 }}
              transition={{ delay: n.order * 1.3 + 0.2, type: "spring", stiffness: 200, damping: 14 }}
              style={{ transformOrigin: `${p.x}px ${p.y}px`, transformBox: "view-box", cursor: editing ? "grab" : "pointer" }}
              onPointerEnter={() => setHoverDept(d.id)}
              onPointerLeave={() => setHoverDept(null)}
              onPointerDown={(e) => startDrag(e, n)}
              onClick={() => !editing && onSelectDept(d.id)}
            >
              <motion.circle
                initial={false}
                animate={{ cx: p.x, cy: p.y, r: active ? 31 : 26 }}
                transition={{ cx: posTransition(d.id), cy: posTransition(d.id), r: { duration: 0.2 } }}
                fill={d.color}
                fillOpacity={0.16}
                stroke={d.color}
                strokeOpacity={active ? 0.95 : 0.6}
                strokeWidth={1.2}
                strokeDasharray={editing ? "4 3" : undefined}
                style={{ filter: `drop-shadow(0 0 ${active ? 16 : 9}px ${d.color}aa)` }}
              />
              <motion.g initial={false} animate={{ x: p.x, y: p.y }} transition={posTransition(d.id)}>
                <PixelSprite id={d.avatar} cx={0} cy={0} size={active ? 26 : 22} color={d.color} />
              </motion.g>
            </motion.g>
          );
        })}

        {/* brain */}
        {(() => {
          const p = pos(byId.brain);
          const r = mode === "radial" ? 66 : 46;
          return (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: hoverDept ? 0.6 : 1, x: p.x, y: p.y }}
              transition={{ opacity: { duration: 0.8 }, x: spring, y: spring }}
              onClick={() => !editing && onSelectBrain()}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => startDrag(e, byId.brain)}
            >
              <motion.circle
                cx={0} cy={0}
                fill="none" stroke={brain.color}
                initial={{ r, opacity: 0.5 }}
                animate={{ r: [r, r + 34], opacity: [0.45, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.circle
                cx={0} cy={0}
                initial={{ r: 0 }}
                animate={{ r }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                fill="url(#brain-core)"
                stroke={brain.color}
                strokeOpacity={0.55}
                style={{ filter: `drop-shadow(0 0 18px ${brain.color}88)` }}
              />
              <PixelSprite id="brain" cx={0} cy={mode === "radial" ? -22 : -14} size={mode === "radial" ? 18 : 14} color={brain.color} />
              <text textAnchor="middle" y={mode === "radial" ? 6 : 6} fontSize={mode === "radial" ? 9.5 : 7} letterSpacing={mode === "radial" ? 2.2 : 1.4} style={{ fontFamily: "var(--font-display)", fill: "#ecebf2" }}>
                FEED THE BRAIN
              </text>
              <text textAnchor="middle" y={mode === "radial" ? 22 : 19} fontSize={mode === "radial" ? 9 : 7.5} style={{ fill: "#8d8a99" }}>
                No documents yet
              </text>
            </motion.g>
          );
        })()}

        {/* labels */}
        {layout.labels.map((l) => {
          const d = deptById[l.deptId];
          const o = off(l.deptId);
          return (
            <motion.g
              key={`label-${l.deptId}`}
              initial={{ opacity: 0, x: l.x + o.x, y: l.y + o.y }}
              animate={{ opacity: hoverDept && hoverDept !== l.deptId ? 0.3 : 1, x: l.x + o.x, y: l.y + o.y }}
              transition={{ opacity: { delay: hoverDept !== null ? 0 : 1.1, duration: 0.5 }, x: posTransition(l.deptId), y: posTransition(l.deptId) }}
              onPointerEnter={() => setHoverDept(l.deptId)}
              onPointerLeave={() => setHoverDept(null)}
              onClick={() => !editing && onSelectDept(l.deptId)}
              style={{ cursor: "pointer" }}
            >
              <text textAnchor={l.anchor} fontSize={mode === "radial" ? 16 : 13} letterSpacing={mode === "radial" ? 7 : 5} style={{ fontFamily: "var(--font-display)", fill: hoverDept === l.deptId ? d.color : "var(--fg)", transition: "fill .2s" }}>
                {d.name.toUpperCase()}
              </text>
              <text textAnchor={l.anchor} y={mode === "radial" ? 20 : 16} fontSize={mode === "radial" ? 10.5 : 9.5} letterSpacing={0.4} style={{ fill: "var(--muted)" }}>
                {d.tagline.join(" · ")}
              </text>
            </motion.g>
          );
        })}

        {/* group labels (line mode) */}
        <AnimatePresence>
          {layout.groupLabels.map((g) => (
            <motion.text
              key={`gl-${g.id}`}
              x={g.x}
              y={g.y}
              dominantBaseline="middle"
              fontSize={9}
              letterSpacing={1.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              style={{ fill: "var(--muted)", textTransform: "uppercase" }}
            >
              {g.name.toUpperCase()}
            </motion.text>
          ))}
        </AnimatePresence>
      </motion.svg>

      {/* tooltips */}
      <AnimatePresence>
        {hovered && !hoveredJob && !drag && !focus && (() => {
          const hp = pos(byId[hovered.id]);
          const s = toScreen(hp.x, hp.y);
          const above = hp.y < 0;
          return (
            <motion.div
              key={`tt-${hovered.id}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`pointer-events-none absolute z-20 w-56 -translate-x-1/2 rounded-xl glass-strong p-3 shadow-xl shadow-black/40 ${above ? "-translate-y-full" : ""}`}
              style={{ left: s.left, top: above ? s.top - 40 : s.top + 40 }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: hovered.color }} />
                <span className="text-[13px] font-medium">{hovered.name}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-hover px-2 py-1.5">
                  <div className="text-base font-semibold">{hovered.jobs}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted">jobs</div>
                </div>
                <div className="rounded-lg bg-hover px-2 py-1.5">
                  <div className="text-base font-semibold" style={{ color: hovered.color }}>{hovered.readyToRun}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted">ready to run</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-faint">Click to open department</div>
            </motion.div>
          );
        })()}
        {hoveredJob && !drag && !focus && (() => {
          const s = toScreen(pos(byId[hoveredJob.id]).x, pos(byId[hoveredJob.id]).y);
          return (
            <motion.div
              key={`tj-${hoveredJob.id}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-lg glass-strong px-2.5 py-1.5 text-xs shadow-lg shadow-black/40"
              style={{ left: s.left, top: s.top + 14 }}
            >
              <span className="font-medium">{hoveredJob.name}</span>
              {hoveredJob.readyToRun && <span className="ml-2 text-[10px]" style={{ color: hoveredJob.color }}>● ready</span>}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
