"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";

interface UIState {
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
}

const UIContext = createContext<UIState | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within Providers");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpenState] = useState(false);
  const setPaletteOpen = useCallback((v: boolean) => setPaletteOpenState(v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpenState((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <UIContext.Provider value={{ paletteOpen, setPaletteOpen }}>
        {children}
        <CommandPalette />
      </UIContext.Provider>
    </ThemeProvider>
  );
}
