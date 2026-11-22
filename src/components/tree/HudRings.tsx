"use client";

import { motion } from "framer-motion";
import { departments } from "@/data/tree";
import { PixelSprite } from "@/components/brand/PixelSprite";

/** Soft HUD around the brain: a faint dashed ring and the agents slowly orbiting it. */
export function HudRings({ x, y, visible }: { x: number; y: number; visible: boolean }) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0, x, y }}
      transition={{ opacity: { duration: 1.2, delay: visible ? 1.2 : 0 }, x: { type: "spring", stiffness: 70, damping: 18 }, y: { type: "spring", stiffness: 70, damping: 18 } }}
      pointerEvents="none"
    >
      <g className="hud-spin" style={{ animationDuration: "40s" }}>
        <circle r={104} fill="none" stroke="#a78bfa" strokeOpacity={0.18} strokeWidth={0.6} strokeDasharray="8 6 2 6" />
      </g>
      <g className="hud-spin" style={{ animationDuration: "60s" }}>
        <circle r={122} fill="none" />
        {departments.map((d, i) => {
          const a = (i / departments.length) * Math.PI * 2;
          return (
            <g key={d.id} transform={`translate(${Math.cos(a) * 116} ${Math.sin(a) * 116})`} opacity={0.55}>
              <g className="hud-spin-rev" style={{ animationDuration: "60s" }}>
                <circle r={5} fill="none" />
                <PixelSprite id={d.avatar} cx={0} cy={0} size={7} color={d.color} />
              </g>
            </g>
          );
        })}
      </g>
    </motion.g>
  );
}
