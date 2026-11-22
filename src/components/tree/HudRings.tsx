"use client";

import { motion } from "framer-motion";
import { departments } from "@/data/tree";
import { PixelSprite } from "@/components/brand/PixelSprite";

const R_OUT = 478;

function arc(r: number, a0: number, a1: number) {
  const p = (a: number) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** Jarvis-style HUD around the brain: rotating rings, ticks, a radar sweep and orbiting agents. */
export function HudRings({ x, y, visible, ready, jobs }: { x: number; y: number; visible: boolean; ready: number; jobs: number }) {
  const hudText = `NEXORA CORE · ONLINE · ${departments.length} AGENTS · ${jobs} JOBS · ${ready} READY TO RUN · SYNC OK · `;
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0, x, y }}
      transition={{ opacity: { duration: 1.2, delay: visible ? 1.2 : 0 }, x: { type: "spring", stiffness: 70, damping: 18 }, y: { type: "spring", stiffness: 70, damping: 18 } }}
      pointerEvents="none"
    >
      <defs>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7cc4ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#7cc4ff" stopOpacity="0.07" />
        </linearGradient>
        <path id="hud-text-path" d={`M ${-R_OUT - 14} 0 A ${R_OUT + 14} ${R_OUT + 14} 0 1 1 ${R_OUT + 14} 0 A ${R_OUT + 14} ${R_OUT + 14} 0 1 1 ${-R_OUT - 14} 0`} />
      </defs>

      {/* radar sweep */}
      <g className="hud-spin" style={{ animationDuration: "9s" }}>
        <circle r={R_OUT} fill="none" />
        <path d={`M 0 0 L ${R_OUT} 0 A ${R_OUT} ${R_OUT} 0 0 1 ${Math.cos(Math.PI / 7) * R_OUT} ${Math.sin(Math.PI / 7) * R_OUT} Z`} fill="url(#sweep)" />
        <line x1={0} y1={0} x2={R_OUT} y2={0} stroke="#7cc4ff" strokeOpacity={0.25} strokeWidth={0.8} transform={`rotate(${180 / 7})`} />
      </g>

      {/* outer arcs + text, slow */}
      <g className="hud-spin" style={{ animationDuration: "140s" }}>
        <circle r={R_OUT + 30} fill="none" />
        {[0, 120, 240].map((a) => (
          <path key={a} d={arc(R_OUT, a + 8, a + 92)} fill="none" style={{ stroke: "rgba(var(--star),0.16)" }} strokeWidth={1.2} />
        ))}
        {[0, 120, 240].map((a) => (
          <path key={`b${a}`} d={arc(R_OUT - 8, a + 96, a + 112)} fill="none" stroke="#7cc4ff" strokeOpacity={0.35} strokeWidth={2.5} />
        ))}
        <text fontSize={8.5} letterSpacing={5} style={{ fill: "rgba(var(--star),0.28)", fontFamily: "ui-monospace, monospace" }}>
          <textPath href="#hud-text-path">{hudText.repeat(3)}</textPath>
        </text>
      </g>

      {/* tick ring, reverse */}
      <g className="hud-spin-rev" style={{ animationDuration: "90s" }}>
        <circle r={312} fill="none" style={{ stroke: "rgba(var(--star),0.13)" }} strokeWidth={6} strokeDasharray="1 11" />
        <circle r={322} fill="none" style={{ stroke: "rgba(var(--star),0.07)" }} strokeWidth={0.6} />
      </g>

      {/* inner dashed ring */}
      <g className="hud-spin" style={{ animationDuration: "24s" }}>
        <circle r={96} fill="none" stroke="#a78bfa" strokeOpacity={0.35} strokeWidth={0.8} strokeDasharray="10 6 2 6" />
      </g>

      {/* orbiting agents around the brain */}
      <g className="hud-spin" style={{ animationDuration: "48s" }}>
        <circle r={112} fill="none" />
        {departments.map((d, i) => {
          const a = (i / departments.length) * Math.PI * 2;
          const cx = Math.cos(a) * 104;
          const cy = Math.sin(a) * 104;
          return (
            <g key={d.id} transform={`translate(${cx} ${cy})`}>
              <g className="hud-spin-rev" style={{ animationDuration: "48s" }}>
                <circle r={6} fill="none" />
                <PixelSprite id={d.avatar} cx={0} cy={0} size={9} color={d.color} />
              </g>
            </g>
          );
        })}
      </g>

      {/* crosshair ticks */}
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <line x1={R_OUT + 22} y1={0} x2={R_OUT + 36} y2={0} stroke="#7cc4ff" strokeOpacity={0.45} strokeWidth={1} />
          <line x1={R_OUT + 22} y1={-4} x2={R_OUT + 22} y2={4} stroke="#7cc4ff" strokeOpacity={0.45} strokeWidth={1} />
        </g>
      ))}
    </motion.g>
  );
}
