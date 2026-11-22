"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

export function TrialPill() {
  const [collapsed, setCollapsed] = useState(false);
  const started = useStore((s) => s.trialStarted);
  const path = usePathname();
  if (started || path.startsWith("/chat") || path === "/ready") return null;
  return (
    <motion.div layout className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full glass p-1.5 pl-4 shadow-xl shadow-black/30">
      <AnimatePresence initial={false} mode="popLayout">
        {collapsed ? (
          <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-muted">
            <Sparkles size={15} />
          </motion.span>
        ) : (
          <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
            <span className="whitespace-nowrap text-[13px] text-muted">{siteConfig.trial.label}</span>
            <Link href="/ready" className="whitespace-nowrap rounded-full bg-cta px-3.5 py-1.5 text-[13px] font-medium text-cta-fg hover:opacity-90">
              {siteConfig.trial.cta}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        layout
        onClick={() => setCollapsed((c) => !c)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-fg"
        aria-label={collapsed ? "Expand" : "Collapse"}
      >
        <ChevronLeft size={15} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </motion.button>
    </motion.div>
  );
}
