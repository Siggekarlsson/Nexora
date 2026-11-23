"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

const green = "border-[rgba(95,224,138,0.35)] bg-[rgba(95,224,138,0.12)] text-[#5fe08a]";

/** The green "✓ Connected" badge, used on Integrations, onboarding and dashboards. */
export function ConnectedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${green} ${className}`}>
      <Check size={13} strokeWidth={2.5} /> Connected
    </span>
  );
}

/**
 * Green "✓ Connected" button. On hover it turns into a red "Disconnect",
 * and a click asks "Disconnect {name}?" before anything is removed.
 */
export function ConnectedButton({ name, busy, onDisconnect }: { name: string; busy?: boolean; onDisconnect: () => void }) {
  const [asking, setAsking] = useState(false);
  if (busy) {
    return (
      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] ${green}`}>
        <Loader2 size={13} className="animate-spin" /> Disconnecting
      </span>
    );
  }
  if (asking) {
    return (
      <div className="flex basis-full items-center justify-end gap-1.5 pt-1 text-[12.5px]">
        <span className="text-fg/85">Disconnect {name}?</span>
        <button onClick={() => { setAsking(false); onDisconnect(); }} className="rounded-full border border-[#ff6b8b]/40 bg-[#ff6b8b]/12 px-2.5 py-1 font-medium text-[#ff6b8b] hover:bg-[#ff6b8b]/20">
          Disconnect
        </button>
        <button onClick={() => setAsking(false)} className="rounded-full px-2 py-1 text-muted hover:bg-hover hover:text-fg">Cancel</button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setAsking(true)}
      aria-label={`${name} is connected. Disconnect`}
      className={`group inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${green} hover:border-[#ff6b8b]/40 hover:bg-[#ff6b8b]/12 hover:text-[#ff6b8b]`}
    >
      <span className="flex items-center gap-1 group-hover:hidden"><Check size={13} strokeWidth={2.5} /> Connected</span>
      <span className="hidden group-hover:inline">Disconnect</span>
    </button>
  );
}
