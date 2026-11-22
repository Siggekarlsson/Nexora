"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Loader2, Search, Wrench, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { LIVE_INTEGRATIONS, setState } from "@/lib/store";
import { departmentColors } from "@/data/departments";
import type { DepartmentId } from "@/lib/types";

const apps: { id: string; name: string; desc: string; mono: string; color: string; dept: DepartmentId; category: string }[] = [
  { id: "shopify", name: "Shopify", desc: "Orders, products and stock levels from your store.", mono: "Sh", color: "#95bf47", dept: "finance", category: "Commerce" },
  { id: "hubspot", name: "HubSpot", desc: "Contacts, deals and the commissioned-research pipeline.", mono: "Hs", color: "#ff7a59", dept: "sales", category: "CRM" },
  { id: "meta-ads", name: "Meta Ads", desc: "Campaign spend, leads and cost per lead for Paid Ads.", mono: "Ma", color: "#4f8cff", dept: "marketing", category: "Ads" },
  { id: "gmail", name: "Gmail", desc: "Let agents read your inbox and summarise client correspondence.", mono: "Gm", color: "#ea5f4f", dept: "operations", category: "Email" },
  { id: "drive", name: "Google Drive", desc: "Let agents read your latest reports, models and memos.", mono: "Gd", color: "#36b37e", dept: "brain", category: "Files" },
  { id: "slack", name: "Slack", desc: "Talk to your agents and get alerts in channels.", mono: "Sl", color: "#b98bff", dept: "leadership", category: "Chat" },
  { id: "linkedin", name: "LinkedIn", desc: "Publish posts and read engagement on company pages.", mono: "Li", color: "#3b8fd9", dept: "marketing", category: "Social" },
  { id: "outlook", name: "Outlook", desc: "Mail and calendar for teams on Microsoft 365.", mono: "Ol", color: "#3d8bfd", dept: "operations", category: "Email" },
  { id: "accounting", name: "Accounting export", desc: "Invoices and revenue for the Finance dashboard.", mono: "Ac", color: "#5fe08a", dept: "finance", category: "Finance" },
  { id: "newsletter", name: "Newsletter", desc: "Send research and track opens and reads.", mono: "Nl", color: "#ff9f4a", dept: "marketing", category: "Email" },
];

type LiveId = string;
type Live = { configured: boolean; connected: boolean; account: string | null; via?: "composio" | "oauth" };
type Status = Record<string, Live | undefined>;
/** Apps with their own setup steps when Composio cannot connect them. */
const CORE = new Set(["gmail", "drive", "shopify"]);

const messages: Record<string, string> = {
  "connected=gmail": "Gmail is connected. Ask an agent about your inbox in Chat.",
  "connected=drive": "Google Drive is connected. Ask an agent about your files, reports or memos in Chat.",
  "connected=shopify": "Shopify is connected. Ask an agent about your orders or products in Chat.",
  "error=gmail_denied": "Gmail access was cancelled.",
  "error=gmail_failed": "Gmail could not be connected. Try again.",
  "error=gmail_state": "The Gmail sign-in expired. Try again.",
  "error=gmail_not_configured": "Gmail is not set up on the server yet.",
  "error=drive_denied": "Google Drive access was cancelled.",
  "error=drive_failed": "Google Drive could not be connected. Try again.",
  "error=drive_state": "The Google Drive sign-in expired. Try again.",
  "error=drive_not_configured": "Google Drive is not set up on the server yet.",
  "error=shopify_failed": "Shopify could not be connected. Try again.",
  "error=shopify_state": "The Shopify sign-in could not be verified. Try again.",
  "error=shopify_shop": "That store address does not look right. Use your-store.myshopify.com.",
  "error=shopify_not_configured": "Shopify is not set up on the server yet.",
};

export function IntegrationsPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [live, setLive] = useState<Status | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [shopInput, setShopInput] = useState<string | null>(null);
  const [setup, setSetup] = useState<"google" | "shopify" | null>(null);

  const load = () =>
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((st: Status) => {
        setLive(st);
        // only real connections are stored; old simulated ones are dropped
        setState(() => ({ integrations: Object.fromEntries(LIVE_INTEGRATIONS.map((id) => [id, !!st[id]?.connected])) }));
      })
      .catch(() => {});

  useEffect(() => {
    load();
    const query = window.location.search.slice(1);
    const name = apps.find((a) => a.id === query.split("=")[1])?.name;
    const text =
      messages[query] ??
      (name && query.startsWith("connected=") ? `${name} is connected. Ask an agent about it in Chat.` : name && query.startsWith("error=") ? `${name} could not be connected. Try again.` : undefined);
    if (text) {
      setNotice({ text, ok: query.startsWith("connected") });
      window.history.replaceState(null, "", "/integrations");
    }
  }, []);

  const toggleLive = async (id: LiveId) => {
    if (live?.[id]?.connected) {
      setBusy(id);
      await fetch("/api/integrations/disconnect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      await load();
      return setBusy(null);
    }
    if (id === "shopify" && live?.shopify?.via !== "composio") return setShopInput("");
    setBusy(id);
    window.location.href = `/api/integrations/${id}/connect`;
  };

  const list = apps.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const count = live ? LIVE_INTEGRATIONS.filter((id) => live[id]?.connected).length : 0;
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
          const st = live?.[a.id];
          // Gmail, Drive and Shopify can also use their own keys; the rest are live when Composio can connect them.
          const isLive = CORE.has(a.id) || !!st?.configured;
          const on = !!st?.connected;
          const needsSetup = isLive && !!live && !st?.configured;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`glass flex flex-col rounded-2xl p-5 ${isLive ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-[14px] font-semibold" style={{ background: `${a.color}22`, color: a.color }}>{a.mono}</span>
                <div className="flex gap-1.5">
                  {isLive ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#5fe08a]/15 px-2 py-0.5 text-[11px] text-[#5fe08a]"><Zap size={10} /> Live</span>
                  ) : (
                    <span className="rounded-full bg-hover px-2 py-0.5 text-[11px] text-muted">Coming soon</span>
                  )}
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{a.category}</span>
                </div>
              </div>
              <div className="mt-4 text-[15px] font-medium">{a.name}</div>
              <p className="mt-1 text-[13px] leading-5 text-muted">{a.desc}</p>
              {st?.account && <p className="mt-2 truncate text-[12px] text-[#5fe08a]">{st.account}</p>}
              {needsSetup && <p className="mt-2 text-[12px] text-faint">Needs {a.id === "shopify" ? "Shopify keys" : "a Composio key"} on the server before it can be connected.</p>}
              {a.id === "shopify" && shopInput !== null && !on && !needsSetup && (
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
                {!isLive ? (
                  <button disabled className="btn btn-glass ml-auto h-8 cursor-not-allowed px-3 text-xs opacity-60">Coming soon</button>
                ) : needsSetup ? (
                  <button onClick={() => setSetup(a.id === "shopify" ? "shopify" : "google")} className="btn btn-glass ml-auto h-8 px-3 text-xs">
                    <Wrench size={13} /> How to set up
                  </button>
                ) : (
                  <button
                    onClick={() => toggleLive(a.id as LiveId)}
                    disabled={busy === a.id || !live}
                    className={`btn ml-auto h-8 px-3 text-xs disabled:opacity-50 ${on ? "btn-glass text-[#5fe08a]" : "btn-cta"}`}
                  >
                    {busy === a.id ? <Loader2 size={13} className="animate-spin" /> : on ? <Check size={13} /> : null}
                    {busy === a.id ? "Connecting" : on ? "Disconnect" : "Connect"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <SetupModal kind={setup} onClose={() => setSetup(null)} />
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-hover px-3 py-2">
      <code className="min-w-0 flex-1 truncate text-[12px]">{value}</code>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted hover:bg-active hover:text-fg"
        aria-label={`Copy ${value}`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function SetupModal({ kind, onClose }: { kind: "google" | "shopify" | null; onClose: () => void }) {
  const [origin, setOrigin] = useState("https://your-site");
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kind, onClose]);

  const host = origin.replace(/^https?:\/\//, "");
  const step = "flex gap-3 text-[13.5px] leading-6 text-fg/90";
  const num = "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-active text-[11px] text-muted";

  return (
    <AnimatePresence>
      {kind && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-[8vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={kind === "google" ? "Set up Gmail and Google Drive" : "Set up Shopify"}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="glass-strong w-[620px] max-w-full rounded-2xl p-6 shadow-2xl shadow-black/50"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{kind === "google" ? "Set up Gmail and Google Drive" : "Set up Shopify"}</h2>
                <p className="mt-1 text-[13px] text-muted">
                  {kind === "google"
                    ? "The easiest way is Composio: one key on the server, then Gmail and Google Drive can be connected."
                    : "Shopify needs its own app before a store can be connected. Composio has no shared Shopify app."}
                </p>
              </div>
              <button onClick={onClose} className="icon-btn" aria-label="Close"><X size={16} /></button>
            </div>

            {kind === "google" ? (
              <>
            <ol className="mt-5 space-y-3.5">
              <li className={step}><span className={num}>1</span><span>Create a free account at <a className="text-[#7cc4ff] hover:underline" href="https://dashboard.composio.dev" target="_blank" rel="noopener noreferrer">dashboard.composio.dev</a>. Composio handles the Google and Shopify sign-in, so you don&apos;t need your own Google or Shopify app.</span></li>
              <li className={step}><span className={num}>2</span><span>Go to <b>Settings → API Keys</b> and copy your API key.</span></li>
              <li className={step}>
                <span className={num}>3</span>
                <div className="min-w-0 flex-1">
                  In <b>Vercel → Project → Settings → Environment Variables</b>, add <code>COMPOSIO_API_KEY</code> and <code>APP_URL</code> (your fixed address, e.g. {host}). Then <b>Redeploy</b>.
                  <CopyField value={`APP_URL=${origin}`} />
                </div>
              </li>
              <li className={step}><span className={num}>4</span><span>Back here, click <b>Connect</b> on Gmail, Google Drive or Shopify and sign in.</span></li>
            </ol>
                <details className="mt-6 rounded-xl border border-line px-4 py-3">
                  <summary className="cursor-pointer text-[13px] text-muted">Advanced: use your own Google app instead</summary>
                  <ol className="mt-5 space-y-3.5">
                <li className={step}><span className={num}>1</span><span>Go to <a className="text-[#7cc4ff] hover:underline" href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">console.cloud.google.com</a> and create a project, for example &quot;Nexora&quot;.</span></li>
                <li className={step}><span className={num}>2</span><span>Go to <b>APIs &amp; Services → Library</b> and enable <b>Gmail API</b> and <b>Google Drive API</b>.</span></li>
                <li className={step}><span className={num}>3</span><span>Go to <b>OAuth consent screen</b>: choose <b>External</b>, fill in the app name and email, and add your own Gmail as a <b>Test user</b>.</span></li>
                <li className={step}>
                  <span className={num}>4</span>
                  <div className="min-w-0 flex-1">
                    Go to <b>Credentials → Create credentials → OAuth client ID → Web application</b>. Add both redirect URIs under <b>Authorized redirect URIs</b>:
                    <CopyField value={`${origin}/api/integrations/gmail/callback`} />
                    <CopyField value={`${origin}/api/integrations/drive/callback`} />
                  </div>
                </li>
                <li className={step}><span className={num}>5</span><span>Copy the <b>Client ID</b> and <b>Client secret</b>.</span></li>
                <li className={step}>
                  <span className={num}>6</span>
                  <div className="min-w-0 flex-1">
                    In <b>Vercel → Project → Settings → Environment Variables</b>, add <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> and <code>APP_URL</code> (your fixed address, e.g. {host}). Then <b>Redeploy</b>.
                    <CopyField value={`APP_URL=${origin}`} />
                  </div>
                </li>
              </ol>
                </details>
              </>
            ) : (
              <ol className="mt-5 space-y-3.5">
                <li className={step}><span className={num}>1</span><span>Go to <a className="text-[#7cc4ff] hover:underline" href="https://dev.shopify.com" target="_blank" rel="noopener noreferrer">dev.shopify.com</a> and create a free account. Create a dev store if you don&apos;t have a store.</span></li>
                <li className={step}>
                  <span className={num}>2</span>
                  <div className="min-w-0 flex-1">
                    Create a new <b>app</b>. Set the App URL and the redirect URL:
                    <CopyField value={origin} />
                    <CopyField value={`${origin}/api/integrations/shopify/callback`} />
                  </div>
                </li>
                <li className={step}><span className={num}>3</span><span>Under access scopes, add <code>read_orders</code> and <code>read_products</code>. Release a version of the app.</span></li>
                <li className={step}><span className={num}>4</span><span>Copy the <b>Client ID</b> and <b>Client secret</b>.</span></li>
                <li className={step}>
                  <span className={num}>5</span>
                  <div className="min-w-0 flex-1">
                    In <b>Vercel → Project → Settings → Environment Variables</b>, add <code>SHOPIFY_API_KEY</code> (Client ID), <code>SHOPIFY_API_SECRET</code> (Client secret) and <code>APP_URL</code>. Then <b>Redeploy</b>.
                    <CopyField value={`APP_URL=${origin}`} />
                  </div>
                </li>
                <li className={step}><span className={num}>6</span><span>Back here, click <b>Connect</b> on Shopify and enter <code>your-store.myshopify.com</code>.</span></li>
              </ol>
            )}
            <p className="mt-5 text-[12px] text-faint">Never paste keys or secrets into a chat. They only belong in Vercel.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
