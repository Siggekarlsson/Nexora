"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { applyTree } from "@/data/tree";
import { getState, useStore } from "@/lib/store";
import { setOnboardedCookie } from "@/lib/onboarding";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
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
  const path = usePathname();
  const router = useRouter();
  const onboarded = useStore((s) => s.onboarding.done);
  const tree = useStore((s) => s.tree);
  // Bumped when the company tree changes, so pages re-read departments and skills.
  const [treeKey, setTreeKey] = useState(0);

  // Apply the tree written during onboarding before the first paint.
  const applied = useRef(false);
  useIsoLayoutEffect(() => {
    if (!tree && !applied.current) return;
    applied.current = true;
    applyTree(tree);
    // Onboarding itself must not remount (it is what writes the tree); other pages re-read it.
    if (!window.location.pathname.startsWith("/onboarding")) setTreeKey((k) => k + 1);
  }, [tree]);

  // Until onboarding is done every page goes to /onboarding (middleware does the same server side).
  useEffect(() => {
    const done = getState().onboarding.done;
    setOnboardedCookie(done);
    if (!done && !path.startsWith("/onboarding")) router.replace("/onboarding");
  }, [path, router, onboarded]);

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
        <div key={treeKey} className="contents">{children}</div>
        {!path.startsWith("/onboarding") && <CommandPalette />}
      </UIContext.Provider>
    </ThemeProvider>
  );
}
