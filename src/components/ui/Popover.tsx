"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

export function Popover({
  open,
  onClose,
  children,
  className = "",
  align = "right",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          data-popover
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={`absolute top-full z-[80] mt-2 rounded-2xl glass-strong p-2 shadow-2xl shadow-black/40 ${
            align === "right" ? "right-0" : "left-0"
          } ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
