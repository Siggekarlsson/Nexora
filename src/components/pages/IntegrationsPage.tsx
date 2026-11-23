"use client";

import { Check, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLogo, setLogos } from "@/components/ui/AppLogo";
import { appsIn, CATEGORIES, INTEGRATIONS, integrationById, type CategoryId, type Integration } from "@/data/integrations";
import { setState } from "@/lib/store";
import { connectApp } from "@/lib/connect";

type AppState = { connected: boolean; setup: boolean; account?: string | null };
type Status = { composio: boolean; apps: Record<string, AppState>; logos: Record<string, string> };
type SectionId = "connected" | CategoryId;


export function IntegrationsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [active, setActive] = useState<SectionId>("connected");
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const clickScroll = useRef(false);

  const load = useCallback(
    () =>
      fetch("/api/integrations/status")
        .then((r) => r.json())
        .then((st: Status) => {
          setStatus(st);
          setLogos(st.logos ?? {});
          setState(() => ({ integrations: Object.fromEntries(Object.entries(st.apps).map(([id, a]) => [id, a.connected])) }));
        })
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    load();
    const p = new URLSearchParams(window.location.search);
    const connected = p.get("connected");
    const error = p.get("error");
    if (connected || error) {
      const id = connected ?? error!.replace(/_(failed|denied|state|not_configured)$/, "");
      const name = integrationById[id]?.name ?? "The app";
      setNotice(
        connected
          ? { text: `${name} is connected. Ask an agent about it in Chat.`, ok: true }
          : { text: /not_configured$/.test(error!) ? `${name} can't be connected yet: it needs setup on the server.` : `${name} could not be connected. Try again.`, ok: false },
      );
      window.history.replaceState(null, "", "/integrations");
    }
  }, [load]);

  const connectedApps = useMemo(() => INTEGRATIONS.filter((a) => status?.apps[a.id]?.connected), [status]);
  const match = (a: Integration) => !q.trim() || `${a.name} ${a.desc}`.toLowerCase().includes(q.trim().toLowerCase());
  const lists: { id: SectionId; name: string; apps: Integration[] }[] = [
    { id: "connected", name: "Connected", apps: connectedApps },
    ...CATEGORIES.map((c) => ({ id: c.id as SectionId, name: c.name, apps: appsIn(c.id) })),
  ];

  // Highlight the section in view while scrolling.
  useEffect(() => {
    const onScroll = () => {
      if (clickScroll.current) return;
      let current: SectionId = "connected";
      for (const l of lists) {
        const el = sections.current[l.id];
        if (el && el.getBoundingClientRect().top < 160) current = l.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  const jump = (id: SectionId) => {
    setActive(id);
    clickScroll.current = true;
    const el = sections.current[id];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
    setTimeout(() => (clickScroll.current = false), 700);
  };

  const disconnect = async (id: string) => {
    setBusy(id);
    await fetch("/api/integrations/disconnect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setBusy(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-8 pb-24 pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
      <p className="mt-2 text-[14px] text-muted">Connect your business tools so the brain can read them and your agents can work with them.</p>
      {notice && (
        <div className={`mt-5 rounded-xl border px-4 py-3 text-[13px] ${notice.ok ? "border-[#5fe08a]/40 bg-[#5fe08a]/10" : "border-[#ff6b8b]/40 bg-[#ff6b8b]/10"}`}>{notice.text}</div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
        <nav className="hidden md:block">
          <div className="sticky top-20">
            <div className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">App types</div>
            <ul className="space-y-0.5">
              {lists.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => jump(l.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[13px] transition ${active === l.id ? "bg-active text-fg" : "text-muted hover:bg-hover hover:text-fg"}`}
                  >
                    <span className="truncate">{l.name}</span>
                    <span className="ml-2 text-[12px] text-faint">{l.apps.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="min-w-0">
          <label className="glass flex h-11 items-center gap-2 rounded-xl px-3.5">
            <Search size={15} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools" className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
          </label>

          {lists.map((l) => {
            const apps = l.apps.filter(match);
            if (q.trim() && !apps.length) return null;
            return (
              <section key={l.id} ref={(el) => void (sections.current[l.id] = el)} className="mt-9 scroll-mt-24">
                <h2 className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.14em] text-faint">{l.name}</h2>
                {l.id === "connected" && !apps.length ? (
                  <div className="rounded-2xl border border-dashed border-line px-5 py-6 text-[13.5px] text-muted">Nothing is connected yet. Pick an app below to connect it.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {apps.map((a) => (
                      <AppCard key={`${l.id}-${a.id}`} app={a} st={status?.apps[a.id]} loaded={!!status} busy={busy === a.id} onConnect={() => (setBusy(a.id), connectApp(a.id))} onDisconnect={() => disconnect(a.id)} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AppCard({
  app, st, loaded, busy, onConnect, onDisconnect,
}: {
  app: Integration;
  st?: AppState;
  loaded: boolean;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const soon = app.category === "soon";
  const setup = !soon && loaded && (!st || st.setup);
  return (
    <div className={`glass flex items-center gap-3.5 rounded-2xl px-4 py-3.5 ${soon ? "opacity-55" : ""}`}>
      <AppLogo id={app.id} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-medium">{app.name}</div>
        <div className="line-clamp-2 text-[12.5px] leading-snug text-muted">{st?.connected && st.account ? st.account : app.desc}</div>
      </div>
      {soon ? (
        <button disabled className="shrink-0 cursor-not-allowed rounded-full bg-fg/10 px-3.5 py-1.5 text-[12.5px] text-muted">Coming Soon</button>
      ) : st?.connected ? (
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1 text-[12.5px] text-[#5fe08a]"><Check size={13} /> Connected</span>
          <button onClick={onDisconnect} disabled={busy} className="rounded-full px-2.5 py-1.5 text-[12.5px] text-muted hover:bg-hover hover:text-fg">
            {busy ? <Loader2 size={13} className="animate-spin" /> : "Disconnect"}
          </button>
        </div>
      ) : setup ? (
        <span className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted" title="This app needs its own auth config in Composio before it can be connected.">Setup needed</span>
      ) : (
        <button onClick={onConnect} disabled={busy} className="flex shrink-0 items-center gap-1.5 rounded-full bg-cta px-4 py-1.5 text-[13px] font-medium text-cta-fg transition hover:opacity-90">
          {busy && <Loader2 size={13} className="animate-spin" />} Connect
        </button>
      )}
    </div>
  );
}
