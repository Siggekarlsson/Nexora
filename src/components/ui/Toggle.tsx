"use client";
import { motion } from "framer-motion";

export function Toggle({ on, onChange, color = "#5fe08a", label }: { on: boolean; onChange: (v: boolean) => void; color?: string; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      className="relative h-[22px] w-[38px] shrink-0 rounded-full border border-line transition-colors"
      style={{ background: on ? color : "var(--hover)" }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow"
        style={{ left: on ? 18 : 2 }}
      />
    </button>
  );
}
