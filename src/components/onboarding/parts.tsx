"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { sprites } from "@/components/brand/PixelAvatar";
import { siteConfig } from "@/config/site";

export const STEP_NAMES = ["Your company", "About you", "Connect", "Your brain"];

/** Nebula glows over the star field; they get stronger with every step. */
export function Glows({ step }: { step: number }) {
  const o = 0.35 + step * 0.2;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: "var(--nebula-opacity)" }}>
      <motion.div animate={{ opacity: o }} transition={{ duration: 1.2 }} className="absolute inset-0">
        <div className="absolute -left-[12%] top-[18%] h-[60vh] w-[42vw] rounded-full bg-[#2f7bff] opacity-[0.16] blur-[140px]" />
        <div className="absolute -right-[8%] top-[8%] h-[55vh] w-[38vw] rounded-full bg-[#6d3cff] opacity-[0.16] blur-[140px]" />
        <div className="absolute bottom-[-18%] left-[8%] h-[50vh] w-[40vw] rounded-full bg-[#16c99a] opacity-[0.12] blur-[150px]" />
        <div className="absolute bottom-[-12%] right-[4%] h-[50vh] w-[38vw] rounded-full bg-[#ff8a3c] opacity-[0.12] blur-[150px]" />
      </motion.div>
    </div>
  );
}

export function Header({ step }: { step: number }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      <div className="absolute left-6 top-5 flex items-center gap-2">
        <LogoMark size={22} />
        <span className="font-display text-[15px] font-semibold uppercase tracking-[0.18em]">{siteConfig.name}</span>
      </div>
      <button
        aria-label="Toggle light and dark"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="absolute right-6 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-hover hover:text-fg"
      >
        {mounted && resolvedTheme === "light" ? <Moon size={17} /> : <Sun size={17} />}
      </button>
      <div className="absolute left-1/2 top-7 flex -translate-x-1/2 flex-col items-center gap-2.5">
        <div className="flex gap-1.5">
          {STEP_NAMES.map((_, i) => (
            <div key={i} className="h-[3px] w-10 overflow-hidden rounded-full bg-fg/15">
              <motion.div className="h-full rounded-full bg-fg" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>
          ))}
        </div>
        <div className="text-[12px] text-fg/80">
          Step {step + 1} of 4 <span className="ml-1.5 text-muted">{STEP_NAMES[step]}</span>
        </div>
      </div>
    </>
  );
}

/** Logo in a round dark circle (first questions). */
export function LogoBadge() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-[#0b0b10]/80 shadow-lg shadow-black/30">
      <LogoMark size={30} />
    </div>
  );
}

/** Company Brain pixel avatar that blinks and "thinks". */
export function BrainAvatar({ size = 64, thinking = false }: { size?: number; thinking?: boolean }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3200);
    return () => clearInterval(t);
  }, []);
  const rows = sprites.brain;
  const color = "#a78bfa";
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <div className="absolute inset-2 rounded-full bg-[#a78bfa]/20 blur-xl" />
      <motion.svg
        viewBox="0 -3 9 11"
        width={size}
        height={(size * 11) / 9}
        shapeRendering="crispEdges"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
        aria-hidden
      >
        {rows.map((row, y) =>
          row.split("").map((c, x) =>
            c === "." ? null : (
              <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={c === "o" ? (blink ? color : "#0b0b10") : color} />
            ),
          ),
        )}
        {[0, 1, 2].map((i) => (
          <motion.rect
            key={i}
            x={5.5 + i * 1.2}
            y={-2.4 + (i === 1 ? -0.4 : 0)}
            width={0.8}
            height={0.8}
            fill="#d8c8ff"
            animate={{ opacity: thinking ? [0.15, 1, 0.15] : [0.1, 0.5, 0.1] }}
            transition={{ duration: thinking ? 0.9 : 2.4, repeat: Infinity, delay: i * (thinking ? 0.2 : 0.5) }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

export function Question({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="text-center">
      <h1 className="mx-auto max-w-[640px] text-[30px] font-semibold leading-tight tracking-tight">{title}</h1>
      {sub && <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

export function ContinueButton({ enabled, onClick, label = "Continue" }: { enabled: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      disabled={!enabled}
      onClick={onClick}
      className={`flex h-12 w-[320px] items-center justify-center gap-2 rounded-full text-[15px] font-medium transition ${
        enabled ? "bg-cta text-cta-fg shadow-lg shadow-black/20 hover:opacity-90" : "cursor-not-allowed bg-fg/10 text-muted"
      }`}
    >
      {label} <span aria-hidden>→</span>
    </button>
  );
}

export function TextLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-[13px] text-muted transition hover:text-fg">
      {children}
    </button>
  );
}

/** Rounded glass card with a radio circle or checkbox on the right. */
export function ChoiceCard({
  selected,
  onClick,
  children,
  kind = "radio",
  wide,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  kind?: "radio" | "check";
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      data-choice="1"
      className={`glass flex min-h-[54px] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-[14.5px] transition ${
        wide ? "col-span-2" : ""
      } ${selected ? "border-fg/40 ring-1 ring-fg/25" : "hover:border-fg/20"}`}
    >
      <span className="flex min-w-0 items-center gap-3">{children}</span>
      {kind === "radio" ? (
        <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${selected ? "border-fg" : "border-fg/30"}`}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-fg" />}
        </span>
      ) : (
        <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${selected ? "border-fg bg-fg text-bg" : "border-fg/30"}`}>
          {selected && <Check size={12} strokeWidth={3} />}
        </span>
      )}
    </button>
  );
}

export function AppBadge({ mono, color, size = 32 }: { mono: string; color: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `${color}22`, color }}
    >
      {mono}
    </span>
  );
}

const DEPT_COLORS = ["#7cc4ff", "#ff9f4a", "#b98bff", "#3fd9c9", "#ff6b8b", "#5fe08a", "#8b7bff"];

/** Radial mini tree map that grows while the brain is being set up (progress 0..1). */
export function MiniTree({ progress }: { progress: number }) {
  const size = 300;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="max-w-full">
      <circle cx={c} cy={c} r={128} fill="none" stroke="currentColor" strokeOpacity={0.07} />
      <circle cx={c} cy={c} r={84} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeDasharray="2 5" />
      {DEPT_COLORS.map((color, i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const show = progress > i * 0.1;
        const grow = Math.max(0, Math.min(1, (progress - i * 0.1) / 0.35));
        const dx = c + Math.cos(a) * 62;
        const dy = c + Math.sin(a) * 62;
        return (
          <g key={i}>
            <motion.line x1={c} y1={c} x2={dx} y2={dy} stroke={color} strokeOpacity={0.5} strokeWidth={1.2} initial={{ pathLength: 0 }} animate={{ pathLength: show ? 1 : 0 }} transition={{ duration: 0.8 }} />
            {[-0.22, 0, 0.22].map((off, j) => {
              const ga = a + off;
              const gx = c + Math.cos(ga) * 100;
              const gy = c + Math.sin(ga) * 100;
              const vis = grow > (j + 1) / 4;
              return (
                <g key={j}>
                  <motion.line x1={dx} y1={dy} x2={gx} y2={gy} stroke={color} strokeOpacity={0.35} strokeWidth={0.8} initial={{ pathLength: 0 }} animate={{ pathLength: vis ? 1 : 0 }} transition={{ duration: 0.6 }} />
                  <motion.circle cx={gx} cy={gy} r={3} fill={color} initial={{ scale: 0, opacity: 0 }} animate={{ scale: vis ? 1 : 0, opacity: vis ? 0.9 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} />
                  {[0, 1].map((k) => {
                    const ja = ga + (k ? 0.07 : -0.07);
                    const jv = grow > 0.85 + k * 0.07;
                    return (
                      <motion.circle key={k} cx={c + Math.cos(ja) * 126} cy={c + Math.sin(ja) * 126} r={1.8} fill={color} initial={{ opacity: 0 }} animate={{ opacity: jv ? 0.7 : 0 }} transition={{ duration: 0.5 }} />
                    );
                  })}
                </g>
              );
            })}
            <motion.circle cx={dx} cy={dy} r={6} fill={color} initial={{ scale: 0 }} animate={{ scale: show ? 1 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 12 }} />
          </g>
        );
      })}
      <motion.circle cx={c} cy={c} r={14} fill="#a78bfa" animate={{ r: [13, 16, 13], opacity: [0.85, 1, 0.85] }} transition={{ duration: 2, repeat: Infinity }} />
      <circle cx={c} cy={c} r={24} fill="none" stroke="#a78bfa" strokeOpacity={0.3} />
    </svg>
  );
}

/** Line of facts and tips that changes every few seconds. */
export function RotatingLine({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => n + 1), 5500);
    return () => clearInterval(t);
  }, []);
  const text = items.length ? items[i % items.length] : "";
  return (
    <div className="relative h-6 w-full overflow-hidden text-center text-[13px] text-muted">
      <AnimatePresence mode="wait">
        <motion.div key={text} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="truncate">
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
