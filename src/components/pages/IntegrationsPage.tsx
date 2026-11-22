"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { setState, useStore } from "@/lib/store";
import { departmentColors } from "@/data/departments";
import type { DepartmentId } from "@/lib/types";

const apps: { id: string; name: string; desc: string; mono: string; color: string; dept: DepartmentId; category: string }[] = [
  { id: "shopify", name: "Shopify", desc: "Orders, products and stock levels from your store.", mono: "Sh", color: "#95bf47", dept: "finance", category: "Commerce" },
  { id: "hubspot", name: "HubSpot", desc: "Contacts, deals and the commissioned-research pipeline.", mono: "Hs", color: "#ff7a59", dept: "sales", category: "CRM" },
  { id: "meta-ads", name: "Meta Ads", desc: "Campaign spend, leads and cost per lead for Paid Ads.", mono: "Ma", color: "#4f8cff", dept: "marketing", category: "Ads" },
  { id: "gmail", name: "Gmail", desc: "Let agents read your inbox and summarise client correspondence.", mono: "Gm", color: "#ea5f4f", dept: "operations", category: "Email" },
  { id: "google-drive", name: "Google Drive", desc: "Sync reports, models and memos into the brain.", mono: "Gd", color: "#36b37e", dept: "brain", category: "Files" },
  { id: "slack", name: "Slack", desc: "Talk to your agents and get alerts in channels.", mono: "Sl", color: "#b98bff", dept: "leadership", category: "Chat" },
  { id: "linkedin", name: "LinkedIn", desc: "Publish posts and read engagement on company pages.", mono: "Li", color: "#3b8fd9", dept: "marketing", category: "Social" },
  { id: "outlook", name: "Outlook", desc: "Mail and calendar for teams on Microsoft 365.", mono: "Ol", color: "#3d8bfd", dept: "operations", category: "Email" },
  { id: "accounting", name: "Accounting export", desc: "Invoices and revenue for the Finance dashboard.", mono: "Ac", color: "#5fe08a", dept: "finance", category: "Finance" },
  { id: "newsletter", name: "Newsletter", desc: "Send research and track opens and reads.", mono: "Nl", color: "#ff9f4a", dept: "marketing", category: "Email" },
];

type Live = { configured: boolean; connected: boolean; account: string | null };
type Status = Record<"gmail" | "shopify", Live>;
const LIVE = new Set(["gmail", "shopify"]);

const messages: Record<string, string> = {
  "connected=gmail": "Gmail is connected. Ask an agent about your inbox in Chat.",
  "connected=shopify": "Shopify is connected. Ask an agent about your orders or products in Chat.",
  "error=gmail_denied": "Gmail access was cancelled.",
  "error=gmail_failed": "Gmail could not be connected. Try again.",
  "error=gmail_state": "The Gmail sign-in expired. Try again.",
  "error=gmail_not_configured": "Gmail is not set up on the server yet.",
  "error=shopify_failed": "Shopify could not be connected. Try again.",
  "error=shopify_state": "The Shopify sign-in could not be verified. Try again.",
  "error=shopify_shop": "That store address does not look right. Use your-store.myshopify.com.",
  "error=shopify_not_configured": "Shopify is not set up on the server yet.",
};

export function IntegrationsPage() {
  const connected = useStore((s) => s.integrations);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [live, setLive] = useState<Status | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [shopInput, setShopInput] = useState<string | null>(null);

  const load = () =>
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((st: Status) => {
        setLive(st);
        setState((s) => ({ integrations: { ...s.integrations, gmail: st.gmail.connected, shopify: st.shopify.connected } }));
      })
      .catch(() => {});

  useEffect(() => {
    load();
    const query = window.location.search.slice(1);
    if (messages[query]) {
      setNotice({ text: messages[query], ok: query.startsWith("connected") });
      window.history.replaceState(null, "", "/integrations");
    }
  }, []);

  const toggleDemo = (id: string) => {
    if (connected[id]) return setState((s) => ({ integrations: { ...s.integrations, [id]: false } }));
    setBusy(id);
    setTimeout(() => {
      setState((s) => ({ integrations: { ...s.integrations, [id]: true } }));
      setBusy(null);
    }, 1100);
  };

  const toggleLive = async (id: "gmail" | "shopify") => {
    if (live?.[id].connected) {
      setBusy(id);
      await fetch("/api/integrations/disconnect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      await load();
      return setBusy(null);
    }
    if (id === "shopify") return setShopInput("");
    setBusy(id);
    window.location.href = "/api/integrations/gmail/connect";
  };

  const list = apps.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const count = apps.filter((a) => connected[a.id]).length;
  return (
    <div className="mx-auto max-w-6xl px-8 pb-24 pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
      <p className="mt-2 text-[14px] text-muted">Connect the tools your team already uses. Agents only see what you connect. {count} connected.</p>
      {notice && (
        <div className={`mt-5 rounded-xl border px-4 py-3 text-[13px] ${notice.ok ? "border-[#5fe08a]/40 bg-[#5fe08a]/10" : "border-[#ff6b8b]/40 bg-[#ff6b8b]/10"}`}>
          {notice.text}
        </div>
      )}
      <label className="glass mt-8 flex h-10 max-w-md items-center gap-2 rounded-xl px-3">
        <Search size={15} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search integrations" className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
      </label>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((a, i) => {
          const isLive = LIVE.has(a.id);
          const st = isLive ? live?.[a.id as "gmail" | "shopify"] : undefined;
          const on = isLive ? !!st?.connected : !!connected[a.id];
          const unavailable = isLive && live && !st?.configured;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[14px] font-semibold" style={{ background: `${a.color}22`, color: a.color }}>{a.mono}</span>
                <div className="flex gap-1.5">
                  {isLive ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#5fe08a]/15 px-2 py-0.5 text-[11px] text-[#5fe08a]"><Zap size={10} /> Live</span>
                  ) : (
                    <span className="rounded-full bg-hover px-2 py-0.5 text-[11px] text-muted">Demo</span>
                  )}
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{a.category}</span>
                </div>
              </div>
              <div className="mt-4 text-[15px] font-medium">{a.name}</div>
              <p className="mt-1 text-[13px] leading-5 text-muted">{a.desc}</p>
              {st?.account && <p className="mt-2 truncate text-[12px] text-[#5fe08a]">{st.account}</p>}
              {unavailable && <p className="mt-2 text-[12px] text-faint">Needs setup on the server before it can be connected.</p>}
              {a.id === "shopify" && shopInput !== null && !on && (
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!shopInput.trim()) return;
                    setBusy("shopify");
                    window.location.href = `/api/integrations/shopify/connect?shop=${encodeURIComponent(shopInput)}`;
                  }}
                >
                  <input autoFocus value={shopInput} onChange={(e) => setShopInput(e.target.value)} placeholder="your-store.myshopify.com" className="glass h-8 flex-1 rounded-lg px-2 text-xs outline-none" />
                  <button className="btn btn-cta h-8 px-3 text-xs">Go</button>
                </form>
              )}
              <div className="mt-auto flex items-center pt-5">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: departmentColors[a.dept] }} /> Used by {a.dept === "brain" ? "Company Brain" : a.dept[0].toUpperCase() + a.dept.slice(1)}
                </span>
                <button
                  onClick={() => (isLive ? toggleLive(a.id as "gmail" | "shopify") : toggleDemo(a.id))}
                  disabled={busy === a.id || !!unavailable || (isLive && !live)}
                  className={`btn ml-auto h-8 px-3 text-xs disabled:opacity-50 ${on ? "btn-glass text-[#5fe08a]" : "btn-cta"}`}
                >
                  {busy === a.id ? <Loader2 size={13} className="animate-spin" /> : on ? <Check size={13} /> : null}
                  {busy === a.id ? "Connecting" : on ? (isLive ? "Disconnect" : "Connected") : unavailable ? "Setup needed" : "Connect"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
