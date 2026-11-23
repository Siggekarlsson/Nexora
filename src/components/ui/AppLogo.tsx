"use client";

import { addCollection, Icon, type IconifyJSON } from "@iconify/react";
import iconSets from "@/data/logo-icons.json";
import { Blocks } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { integrationById } from "@/data/integrations";

// Bundled subset of the Iconify "logos" and "simple-icons" sets (see scripts/build-logo-icons.mjs), so no network call is needed.
for (const set of iconSets as unknown as IconifyJSON[]) addCollection(set);

/** Composio logo URLs, fetched once per page load and shared by every AppLogo. */
let logos: Record<string, string> = {};
let requested = false;
const listeners = new Set<() => void>();

export function setLogos(next: Record<string, string>) {
  logos = { ...logos, ...next };
  listeners.forEach((l) => l());
}

function useLogos() {
  useEffect(() => {
    if (requested) return;
    requested = true;
    fetch("/api/integrations/logos")
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: Record<string, string>) => setLogos(j))
      .catch(() => {});
  }, []);
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => logos,
    () => logos,
  );
}

/**
 * An app's real logo in a dark rounded tile: Composio's logo first, then the Iconify "logos" icon,
 * then a neutral app icon. Never letters.
 */
export function AppLogo({ id, size = 40, className = "" }: { id: string; size?: number; className?: string }) {
  const all = useLogos();
  const app = integrationById[id];
  const url = all[id];
  const [broken, setBroken] = useState(false);
  const inner = Math.round(size - 16);
  const neutral = <Blocks size={inner * 0.85} className="text-white/60" />;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#15151c] p-2 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {url && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={inner} height={inner} className="h-full w-full object-contain" onError={() => setBroken(true)} />
      ) : app?.icon ? (
        <Icon icon={app.icon} width={inner} height={inner} fallback={neutral} style={app.color ? { color: app.color } : undefined} />
      ) : (
        neutral
      )}
    </span>
  );
}
