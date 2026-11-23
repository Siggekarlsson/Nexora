"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe, Loader2, PenLine, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "@/components/chat/Markdown";
import { departmentColors } from "@/data/departments";
import { COMPANY_TYPES, companyTypeLabel, describeHints, finishOnboarding, helpOptions, NONE_APP, ROLES, WORK_APPS } from "@/lib/onboarding";
import { AppLogo } from "@/components/ui/AppLogo";
import { connectApp } from "@/lib/connect";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { getState, setState, type TreeOverride } from "@/lib/store";
import type { DepartmentId } from "@/lib/types";
import {
  BrainAvatar, ChoiceCard, ContinueButton, Glows, Header, LogoBadge, MiniTree, Question, RotatingLine, TextLink,
} from "./parts";

type StepId = "website" | "company" | "type" | "describe" | "name" | "role" | "goals" | "apps" | "connect" | "identify" | "building" | "money" | "ready";
const STEP_OF: Record<StepId, number> = { website: 0, company: 0, type: 0, describe: 0, goals: 1, name: 1, role: 1, apps: 1, connect: 2, identify: 3, building: 3, money: 3, ready: 3 };

type Candidate = { label: string; name: string; website?: string };
type BuildResult = { brief: string; audit: string; about: string; howWeMakeMoney?: string; facts: string[]; departments: TreeOverride; source: string };

type Draft = {
  step: StepId;
  website: string;
  company: string;
  name: string;
  role: string;
  roleOther: string;
  goals: string[];
  goalOther: string;
  apps: string[];
  connectApp: string;
  connected: string;
  noWebsite: boolean;
  candidates: Candidate[] | null;
  chosen: Candidate | null;
  answer: string;
  result: BuildResult | null;
  /** Company type id from COMPANY_TYPES, or OTHER. */
  companyType: string;
  typeOther: string;
  whatWeDo: string;
  howWeMakeMoney: string;
};

const DRAFT_KEY = "nexora.onboarding.v1";
const SLOTS = ["research", "sales", "marketing", "operations", "customer", "finance", "leadership"] as const;
const OTHER = "__other";

function initialDraft(): Draft {
  const s = getState();
  const p = s.profile;
  const again = !!p.name; // restarted: prefill earlier answers
  const knownType = COMPANY_TYPES.some((t) => t.id === p.companyType);
  return {
    step: "website",
    website: again ? p.website : "",
    company: again ? p.companyName : "",
    name: s.profile.name,
    role: s.profile.role && !ROLES.includes(s.profile.role) ? OTHER : s.profile.role,
    roleOther: s.profile.role && !ROLES.includes(s.profile.role) ? s.profile.role : "",
    goals: s.profile.goals,
    goalOther: "",
    apps: s.profile.apps,
    connectApp: "",
    connected: "",
    noWebsite: false,
    candidates: null,
    chosen: null,
    answer: "",
    result: null,
    companyType: again ? (knownType ? p.companyType : p.companyType ? OTHER : "") : "",
    typeOther: again && !knownType ? p.companyType : "",
    whatWeDo: again ? p.whatWeDo : "",
    howWeMakeMoney: again ? p.howWeMakeMoney : "",
  };
}

const hostOf = (w: string) => w.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
const looksLikeSite = (w: string) => /^[^\s.]+(\.[^\s.]+)+$/.test(hostOf(w));

export function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const [d, setD] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [report, setReport] = useState(false);
  const update = useCallback((patch: Partial<Draft>) => setD((cur) => (cur ? { ...cur, ...patch } : cur)), []);

  // Load the draft (kept in sessionStorage so a sign-in redirect comes back to the same place).
  useEffect(() => {
    let draft: Draft | null = null;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) draft = { ...initialDraft(), ...JSON.parse(raw) };
    } catch {}
    if (!draft && getState().onboarding.done) {
      router.replace("/");
      return;
    }
    draft ??= initialDraft();
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      const app = WORK_APPS.find((a) => a.integration === connected);
      draft = { ...draft, step: draft.noWebsite ? "building" : "identify", connected: connected };
      setNotice(`${app?.name ?? "App"} is connected. I'll use it once your brain is ready.`);
    } else if (error) {
      draft = { ...draft, step: "connect" };
      setNotice(error.endsWith("not_configured") ? "That app can't be connected yet. Pick another one or skip for now." : "The sign-in didn't finish. Try again, pick another app, or skip for now.");
    }
    if (draft.step === "building" && draft.result) draft.step = draft.howWeMakeMoney || draft.result.howWeMakeMoney ? "ready" : "money";
    setD(draft);
    if (connected || error) router.replace("/onboarding");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the draft, and keep the answers in the profile as they come in.
  useEffect(() => {
    if (!d) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
    setState(() => ({ profile: profileOf(d) }));
  }, [d]);

  const go = useCallback((step: StepId) => {
    setNotice(null);
    update({ step });
  }, [update]);

  if (!d) return <div data-onboarding className="fixed inset-0 z-30 bg-bg" />;

  const stepIndex = STEP_OF[d.step];
  const companyName = d.chosen?.name || d.company.trim() || (d.website ? capitalise(hostOf(d.website).split(".")[0]) : "");
  const appInfo = WORK_APPS.find((a) => a.id === d.connectApp) ?? WORK_APPS.find((a) => a.id === d.apps.find((x) => x !== NONE_APP));

  // ---- step actions ----
  const canContinue: Partial<Record<StepId, boolean>> = {
    website: looksLikeSite(d.website) || !d.website.trim(),
    company: d.company.trim().length > 1,
    type: d.companyType === OTHER ? d.typeOther.trim().length > 2 : !!d.companyType,
    describe: d.whatWeDo.trim().length >= 30,
    name: d.name.trim().length > 0,
    role: d.role === OTHER ? d.roleOther.trim().length > 0 : !!d.role,
    goals: d.goals.length > 0 && (!d.goals.includes(OTHER) || d.goals.length > 1 || d.goalOther.trim().length > 0),
    apps: d.apps.length > 0,
  };
  const next: Partial<Record<StepId, () => void>> = {
    website: () => {
      if (!d.website.trim()) return noSite();
      update({ candidates: null, chosen: null, noWebsite: false });
      go("name");
    },
    company: () => { update({ candidates: null, chosen: null }); go("type"); },
    type: () => go("describe"),
    describe: () => go("goals"),
    goals: () => go(d.noWebsite ? "name" : "apps"),
    name: () => go("role"),
    role: () => go(d.noWebsite ? "apps" : "goals"),
    apps: () => afterApps(),
  };
  const back: Partial<Record<StepId, StepId>> = {
    type: "company",
    describe: "type",
    goals: d.noWebsite ? "describe" : "role",
    name: d.noWebsite ? "goals" : "website",
    role: "name",
    apps: d.noWebsite ? "role" : "goals",
  };
  function noSite() {
    update({ website: "", noWebsite: true, candidates: null, chosen: null });
    go("company");
  }
  /** After apps/connect: with a website we confirm which company it is; without one we start building. */
  function afterConnect() {
    if (d!.noWebsite) {
      update({ answer: d!.whatWeDo, result: null, step: "building" });
      setNotice(null);
    } else go("identify");
  }
  function afterApps() {
    const first = d!.apps.find((a) => a !== NONE_APP);
    if (!first) return afterConnect();
    update({ connectApp: first });
    go("connect");
  }

  const primary = () => {
    if (d.step === "money") return d.howWeMakeMoney.trim().length > 2 && go("ready");
    if (canContinue[d.step]) next[d.step]?.();
  };

  return (
    <div data-onboarding className="fixed inset-0 z-30 overflow-hidden bg-bg/0">
      <Glows step={stepIndex} />
      <div className="relative z-10 h-full">
        <Header step={stepIndex} />
        <EnterKey onEnter={primary} />

        <div className="absolute inset-x-0 bottom-[150px] top-[96px] overflow-y-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={d.step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="mx-auto flex min-h-full max-w-[760px] flex-col items-center justify-center gap-7 py-6"
            >
              {d.step === "website" || d.step === "company" || d.step === "name" ? <LogoBadge /> : <BrainAvatar thinking={d.step === "building"} />}
              {notice && (
                <div className="flex items-center gap-2 rounded-full border border-line bg-fg/5 px-4 py-1.5 text-[13px] text-fg/85">
                  {d.connected && d.step !== "connect" ? <Check size={14} className="text-[#5fe08a]" /> : null}
                  {notice}
                </div>
              )}

              {d.step === "website" && (
                <>
                  <Question title="What's your company's website?" sub="I read it to learn your business, and start setting up your brain while you answer a few questions." />
                  <Input icon={<Globe size={17} />} value={d.website} onChange={(v) => update({ website: v })} placeholder="yourcompany.com" autoFocus inputMode="url" />
                </>
              )}
              {d.step === "company" && (
                <>
                  <Question title="What's your company called?" sub="Your team sees this name. I set up your brain from it while you answer a few questions." />
                  <Input value={d.company} onChange={(v) => update({ company: v })} placeholder="Your company name" autoFocus />
                </>
              )}
              {d.step === "type" && (
                <>
                  <Question title={`What does ${d.company.trim() || "your company"} do?`} sub="Pick the closest one. It helps your brain understand your business." />
                  <div className="grid w-full max-w-[620px] grid-cols-2 gap-2.5">
                    {COMPANY_TYPES.map((t) => (
                      <ChoiceCard key={t.id} selected={d.companyType === t.id} onClick={() => update({ companyType: t.id })}>
                        <DynamicIcon name={t.icon} size={16} className="text-muted" /> {t.label}
                      </ChoiceCard>
                    ))}
                    <ChoiceCard wide selected={d.companyType === OTHER} onClick={() => update({ companyType: OTHER })}>
                      <PenLine size={15} className="text-muted" /> Something else
                    </ChoiceCard>
                    {d.companyType === OTHER && (
                      <div className="col-span-2">
                        <Input value={d.typeOther} onChange={(v) => update({ typeOther: v })} placeholder="Describe what your company does" autoFocus wide />
                      </div>
                    )}
                  </div>
                </>
              )}
              {d.step === "describe" && <DescribeStep d={d} update={update} />}
              {d.step === "money" && (
                <>
                  <Question title={`How does ${d.company.trim() || "your company"} make money?`} sub="One or two sentences is enough, for example online sales, subscriptions, sponsors or client projects." />
                  <Input value={d.howWeMakeMoney} onChange={(v) => update({ howWeMakeMoney: v })} placeholder="We make money by…" autoFocus />
                </>
              )}
              {d.step === "name" && (
                <>
                  <Question title="Before we start, what should I call you?" />
                  <Input value={d.name} onChange={(v) => update({ name: v })} placeholder="Your name" autoFocus autoComplete="given-name" />
                </>
              )}
              {d.step === "role" && (
                <>
                  <Question title={`Nice to meet you, ${d.name.trim() || "there"}. What's your role?`} sub="Pick the closest one." />
                  <div className="grid w-full max-w-[620px] grid-cols-2 gap-2.5">
                    {ROLES.map((r) => (
                      <ChoiceCard key={r} selected={d.role === r} onClick={() => update({ role: r })}>{r}</ChoiceCard>
                    ))}
                    <ChoiceCard wide selected={d.role === OTHER} onClick={() => update({ role: OTHER })}>
                      <PenLine size={15} className="text-muted" /> Something else
                    </ChoiceCard>
                    {d.role === OTHER && (
                      <div className="col-span-2">
                        <Input value={d.roleOther} onChange={(v) => update({ roleOther: v })} placeholder="Your role" autoFocus wide />
                      </div>
                    )}
                  </div>
                </>
              )}
              {d.step === "goals" && (
                <>
                  <Question title="How should Nexora help you?" sub="Pick as many as apply." />
                  <div className="grid w-full max-w-[620px] grid-cols-2 gap-2.5">
                    {helpOptions(d.companyType).map((g) => (
                      <ChoiceCard key={g} kind="check" selected={d.goals.includes(g)} onClick={() => update({ goals: toggle(d.goals, g) })}>{g}</ChoiceCard>
                    ))}
                    <ChoiceCard wide kind="check" selected={d.goals.includes(OTHER)} onClick={() => update({ goals: toggle(d.goals, OTHER) })}>
                      <PenLine size={15} className="text-muted" /> Something else
                    </ChoiceCard>
                    {d.goals.includes(OTHER) && (
                      <div className="col-span-2">
                        <Input value={d.goalOther} onChange={(v) => update({ goalOther: v })} placeholder="What else should Nexora help with?" autoFocus wide />
                      </div>
                    )}
                  </div>
                </>
              )}
              {d.step === "apps" && (
                <>
                  <Question title="Where does your team work?" sub="Pick every app you use. I suggest the one to connect first." />
                  <div className="grid w-full max-w-[620px] grid-cols-2 gap-2.5">
                    {WORK_APPS.map((a) => (
                      <ChoiceCard
                        key={a.id}
                        kind="check"
                        selected={d.apps.includes(a.id)}
                        onClick={() => update({ apps: toggle(d.apps.filter((x) => x !== NONE_APP), a.id) })}
                      >
                        <AppLogo id={a.integration} size={36} /> {a.name}
                      </ChoiceCard>
                    ))}
                    <ChoiceCard kind="check" selected={d.apps.includes(NONE_APP)} onClick={() => update({ apps: d.apps.includes(NONE_APP) ? [] : [NONE_APP] })}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#15151c] text-white/50">–</span> None of these
                    </ChoiceCard>
                  </div>
                </>
              )}
              {d.step === "connect" && appInfo && (
                <ConnectStep
                  app={appInfo}
                  picking={d.connectApp === ""}
                  onPick={(id) => update({ connectApp: id })}
                />
              )}
              {d.step === "identify" && (
                <IdentifyStep
                  d={d}
                  companyName={companyName}
                  update={update}
                  onAnswer={(answer, chosen) => {
                    update({ answer, chosen, result: null, step: "building" });
                    setNotice(null);
                  }}
                />
              )}
              {d.step === "building" && (
                <BuildingStep
                  d={d}
                  companyName={companyName}
                  onDone={(result) => {
                    const money = d.howWeMakeMoney || result.howWeMakeMoney || "";
                    update({ result, howWeMakeMoney: money, whatWeDo: d.whatWeDo || result.about || d.answer, step: money ? "ready" : "money" });
                  }}
                />
              )}
              {d.step === "ready" && d.result && <ReadyStep result={d.result} companyName={companyName} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fixed footer: the main button always sits in the same place. */}
        <div className="absolute inset-x-0 bottom-0 flex h-[150px] flex-col items-center justify-start gap-4 pt-5">
          {d.step === "website" && (
            <>
              <ContinueButton enabled={!!canContinue.website} onClick={primary} />
              <TextLink onClick={noSite}>No Website? Use Your Company Name</TextLink>
            </>
          )}
          {d.step === "company" && (
            <>
              <ContinueButton enabled={!!canContinue.company} onClick={primary} />
              <TextLink onClick={() => { update({ noWebsite: false }); go("website"); }}>Use Our Website Instead</TextLink>
            </>
          )}
          {(d.step === "type" || d.step === "describe") && (
            <>
              <ContinueButton enabled={!!canContinue[d.step]} onClick={primary} />
              <TextLink onClick={() => go(back[d.step]!)}>← Back</TextLink>
            </>
          )}
          {d.step === "money" && (
            <>
              <ContinueButton enabled={d.howWeMakeMoney.trim().length > 2} onClick={() => go("ready")} />
              <TextLink onClick={() => go("ready")}>Skip This Question</TextLink>
            </>
          )}
          {d.step === "name" && (
            <>
              <ContinueButton enabled={!!canContinue.name} onClick={primary} />
              <TextLink onClick={() => go(back.name!)}>← Back</TextLink>
            </>
          )}
          {(d.step === "role" || d.step === "goals" || d.step === "apps") && (
            <>
              <ContinueButton enabled={!!canContinue[d.step]} onClick={primary} />
              <div className="flex gap-6">
                <TextLink onClick={() => go(back[d.step]!)}>← Back</TextLink>
                <TextLink onClick={() => (d.step === "apps" ? afterApps() : next[d.step]!())}>Skip This Question</TextLink>
              </div>
            </>
          )}
          {d.step === "connect" && d.connectApp === "" && (
            <div className="flex gap-6 pt-14">
              <TextLink onClick={() => go("apps")}>← Back</TextLink>
              <TextLink onClick={afterConnect}>Skip for Now</TextLink>
            </div>
          )}
          {d.step === "connect" && d.connectApp !== "" && appInfo && (
            <>
              <ContinueButton
                enabled
                label={`Connect ${appInfo.name}`}
                onClick={() => connectApp(appInfo.integration, "/onboarding")}
              />
              <div className="flex gap-6">
                <TextLink onClick={() => update({ connectApp: "" })}>Pick Another App</TextLink>
                <TextLink onClick={afterConnect}>Skip for Now</TextLink>
              </div>
            </>
          )}
          {d.step === "building" && <p className="pt-3 text-[13px] text-muted">You can leave this page; I keep going.</p>}
          {d.step === "ready" && d.result && (
            <>
              <ContinueButton
                enabled
                label="Start Free Trial"
                onClick={() => {
                  done();
                  router.push("/ready");
                }}
              />
              <div className="flex gap-6">
                <TextLink onClick={() => setReport(true)}>Read the Full Report</TextLink>
                <TextLink onClick={() => { done(); router.push("/"); }}>Open My Tree</TextLink>
              </div>
            </>
          )}
        </div>

        {d.step === "identify" && (
          <button onClick={() => { update({ candidates: null, chosen: null, noWebsite: false }); go("website"); }} className="absolute right-6 top-16 text-[13px] text-muted transition hover:text-fg">
            Use a Different Website
          </button>
        )}
      </div>
      <AnimatePresence>{report && d.result && <ReportModal result={d.result} company={companyName} onClose={() => setReport(false)} />}</AnimatePresence>
    </div>
  );

  function done() {
    finishOnboarding();
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }
}

/* ---------------------------------------------------------------------------------------------- */

function EnterKey({ onEnter }: { onEnter: () => void }) {
  const ref = useRef(onEnter);
  ref.current = onEnter;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t?.dataset.ownEnter) return;
      if (t?.tagName === "BUTTON" && !t.dataset.choice) return;
      e.preventDefault();
      ref.current();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return null;
}

function Input({
  value, onChange, placeholder, icon, autoFocus, wide, inputMode, autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  autoFocus?: boolean;
  wide?: boolean;
  inputMode?: "url" | "text";
  autoComplete?: string;
}) {
  return (
    <label className={`glass flex h-14 items-center gap-3 rounded-2xl px-5 transition focus-within:border-fg/35 ${wide ? "w-full" : "w-full max-w-[520px]"}`}>
      {icon && <span className="text-muted">{icon}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        inputMode={inputMode}
        autoComplete={autoComplete ?? "off"}
        spellCheck={false}
        className="h-full w-full bg-transparent text-[16px] outline-none placeholder:text-faint"
      />
    </label>
  );
}

function ConnectStep({ app, picking, onPick }: { app: (typeof WORK_APPS)[number]; picking: boolean; onPick: (id: string) => void }) {
  if (picking) {
    return (
      <>
        <Question title="Which app should I connect first?" sub="You can connect the rest later under Integrations." />
        <div className="grid w-full max-w-[620px] grid-cols-2 gap-2.5">
          {WORK_APPS.map((a) => (
            <ChoiceCard key={a.id} selected={false} onClick={() => onPick(a.id)}>
              <AppLogo id={a.integration} size={36} /> {a.name}
            </ChoiceCard>
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <Question title={`Connect ${app.name} so I can work on your real ${app.what}.`} sub="I read what you share and ask before I write anything. You can skip this." />
      <div className="glass flex w-full max-w-[440px] items-center gap-4 rounded-2xl p-5">
        <AppLogo id={app.integration} size={52} />
        <div className="min-w-0">
          <div className="text-[16px] font-medium">{app.name}</div>
          <div className="mt-0.5 text-[13.5px] text-muted">{app.desc}</div>
        </div>
      </div>
    </>
  );
}

function IdentifyStep({
  d, companyName, update, onAnswer,
}: {
  d: Draft;
  companyName: string;
  update: (p: Partial<Draft>) => void;
  onAnswer: (answer: string, chosen: Candidate | null) => void;
}) {
  const [text, setText] = useState("");
  const [details, setDetails] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const loading = d.candidates === null;

  useEffect(() => {
    if (d.candidates !== null) return;
    let live = true;
    fetch("/api/onboarding/identify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ website: d.noWebsite ? "" : d.website, company: d.company }),
    })
      .then((r) => r.json())
      .then((j: { candidates?: Candidate[] }) => live && update({ candidates: j.candidates ?? [] }))
      .catch(() => live && update({ candidates: [] }));
    return () => {
      live = false;
    };
  }, [d.candidates, d.website, d.company, d.noWebsite, update]);

  const send = () => text.trim() && onAnswer(text.trim(), null);
  const where = d.website && !d.noWebsite ? hostOf(d.website) : companyName;

  return (
    <>
      <Question title="Which one is yours?" sub={where ? <>I looked up <span className="text-fg/85">{where}</span>. Pick the right one, or tell me in your own words.</> : "Tell me in a few words what your company does."} />
      <div className="flex max-w-[640px] flex-wrap justify-center gap-2">
        {loading &&
          [0, 1, 2].map((i) => (
            <span key={i} className="glass flex h-10 w-48 animate-pulse items-center justify-center rounded-full text-[13px] text-faint">
              {i === 1 ? <Loader2 size={14} className="animate-spin" /> : null}
            </span>
          ))}
        {!loading &&
          d.candidates!.map((c) => (
            <button key={c.label} onClick={() => onAnswer(c.label, c)} className="glass rounded-full px-4 py-2.5 text-[14px] transition hover:border-fg/35">
              {c.label}
            </button>
          ))}
        {!loading && (
          <>
            <button onClick={() => input.current?.focus()} className="rounded-full border border-dashed border-fg/20 px-4 py-2.5 text-[14px] text-muted transition hover:text-fg">
              Something else
            </button>
            <button
              onClick={() => {
                update({ noWebsite: true });
                input.current?.focus();
              }}
              className={`rounded-full border border-dashed px-4 py-2.5 text-[14px] transition hover:text-fg ${d.noWebsite ? "border-fg/40 text-fg" : "border-fg/20 text-muted"}`}
            >
              I don&apos;t have a website
            </button>
          </>
        )}
      </div>
      <div className="w-full max-w-[600px]">
        <div className="glass flex h-[60px] items-center gap-2 rounded-2xl pl-5 pr-2 focus-within:border-fg/35">
          <input
            ref={input}
            data-own-enter="1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && (e.preventDefault(), send())}
            placeholder={d.noWebsite ? "Or type your own answer: what does your company do?" : "Or type your own answer"}
            className="h-full w-full bg-transparent text-[16px] outline-none placeholder:text-faint"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[14px] font-medium transition ${text.trim() ? "bg-cta text-cta-fg hover:opacity-90" : "bg-fg/10 text-muted"}`}
          >
            Send <span aria-hidden>→</span>
          </button>
        </div>
        <p className="mt-3 text-center text-[13px] text-muted">A short answer is enough. You can change everything from your tree afterwards.</p>
        <div className="mt-2 text-center">
          <TextLink onClick={() => setDetails((v) => !v)}>{details ? "Hide details" : "Show details"}</TextLink>
        </div>
        <AnimatePresence>
          {details && (
            <motion.dl
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-auto mt-3 grid max-w-[420px] grid-cols-[110px_1fr] gap-x-4 gap-y-1.5 overflow-hidden text-[13px]"
            >
              <dt className="text-muted">Website</dt><dd>{d.website && !d.noWebsite ? hostOf(d.website) : "None"}</dd>
              <dt className="text-muted">Company</dt><dd>{companyName || "Not given"}</dd>
              <dt className="text-muted">You</dt><dd>{[d.name, d.role === OTHER ? d.roleOther : d.role].filter(Boolean).join(", ") || "Not given"}</dd>
              <dt className="text-muted">First jobs</dt><dd>{goalList(d).join(", ") || "Not given"}</dd>
              <dt className="text-muted">Apps</dt><dd>{d.apps.filter((a) => a !== NONE_APP).map((a) => WORK_APPS.find((w) => w.id === a)?.name).join(", ") || "None"}</dd>
            </motion.dl>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

const CHECKLIST = ["Reading your website", "Writing the brief", "Shaping the tree", "Remembering the facts", "Writing a short audit"];
const TIPS = [
  "📈 McKinsey 2025 · 88% of companies now use AI",
  "💡 Tip · The brief it writes rides along in every answer, so agents sound like your company.",
  "💡 Tip · Upload a price list or handbook to the Company Brain and every department can use it.",
  "💡 Tip · Rename any department or skill from your tree later. Nothing here is final.",
  "💡 Tip · Schedule a skill to run every Monday and the result lands in that department's thread.",
];

function BuildingStep({ d, companyName, onDone }: { d: Draft; companyName: string; onDone: (r: BuildResult) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [finishAt, setFinishAt] = useState<number | null>(null);
  const started = useRef(Date.now());
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let live = true;
    const role = d.role === OTHER ? d.roleOther : d.role;
    const goals = goalList(d);
    const website = d.noWebsite ? "" : d.chosen?.website || d.website;
    fetch("/api/onboarding/build", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        company: companyName,
        website,
        answer: d.answer,
        role,
        goals,
        apps: d.apps.filter((a) => a !== NONE_APP),
        companyType: typeName(d),
        whatWeDo: d.whatWeDo,
        howWeMakeMoney: d.howWeMakeMoney,
      }),
    })
      .then((r) => r.json())
      .then((r: BuildResult) => {
        if (!live) return;
        const s = getState();
        setState(() => ({
          workspace: { company: companyName || s.workspace.company, about: r.about || d.answer || s.workspace.about, website: website ? hostOf(website) : "" },
          brain: { brief: r.brief, audit: r.audit, facts: r.facts },
          tree: r.departments && Object.keys(r.departments).length ? r.departments : null,
        }));
        setResult(r);
      })
      .catch(() => live && setResult({ brief: "", audit: "", about: d.answer, facts: [], departments: {}, source: "error" }));
    const t = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 250);
    return () => {
      live = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the answer is in (and at least a short tour has played), run the bar to the end.
  useEffect(() => {
    if (result && finishAt === null && elapsed > 9) setFinishAt(elapsed);
  }, [result, elapsed, finishAt]);
  const waiting = Math.min(0.9, 1 - Math.exp(-elapsed / 45));
  const progress = finishAt === null ? waiting : Math.min(1, waiting + ((elapsed - finishAt) / 4) * (1 - waiting));
  useEffect(() => {
    if (progress >= 1 && result) {
      const t = setTimeout(() => doneRef.current(result), 900);
      return () => clearTimeout(t);
    }
  }, [progress >= 1, result]); // eslint-disable-line react-hooks/exhaustive-deps

  const names = Object.values(result?.departments ?? {}).map((x) => x?.name).filter(Boolean) as string[];
  const stage = Math.min(4, Math.floor(progress * 5));
  const statuses = [
    ["Finding the pages that say what you do…", "Reading about your services…"],
    ["Writing the brief…", "Picking out how you sell…"],
    names.length ? names.map((n) => `Filling out ${n}…`) : ["Shaping your departments…", "Filling out Operations…", "Filling out Sales…"],
    ["Remembering the facts…"],
    ["Writing a short audit…"],
  ][stage];
  const status = progress >= 0.97 ? "Finishing up…" : statuses[Math.floor(elapsed / 3) % statuses.length];
  const wrapping = progress >= 0.85;
  const timeText = progress >= 0.85 ? "Almost there" : elapsed > 100 ? "Taking a little longer than usual" : elapsed > 50 ? "About a minute left" : "About 2 minutes left";
  const facts = useMemo(() => [...(result?.facts ?? []).map((f) => `🔍 Found · ${f}`), ...TIPS], [result]);

  return (
    <>
      <Question
        title={wrapping ? "Wrapping up…" : d.noWebsite || !d.website ? `Getting to know ${companyName || "your company"}…` : "Reading your website…"}
        sub={wrapping ? "I'm finishing up." : "I'm working from what you told me about your business."}
      />
      <div className="grid w-full max-w-[720px] grid-cols-1 items-center gap-8 md:grid-cols-[300px_1fr]">
        <div className="flex justify-center text-fg">
          <MiniTree progress={progress} />
        </div>
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[14.5px] text-fg/90">
              {status}
            </motion.div>
          </AnimatePresence>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-fg/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#7cc4ff] via-[#a78bfa] to-[#ff9f4a]" animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ duration: 0.4 }} />
          </div>
          <div className="mt-2 text-[12.5px] text-muted">{timeText}</div>
          <ul className="mt-5 space-y-2.5">
            {CHECKLIST.map((c, i) => {
              const done = progress >= (i + 1) / 5;
              const active = !done && stage === i;
              return (
                <li key={c} className={`flex items-center gap-2.5 text-[14px] ${done ? "text-fg" : active ? "text-fg/85" : "text-muted"}`}>
                  <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border ${done ? "border-[#5fe08a] bg-[#5fe08a] text-[#0b0b10]" : "border-fg/25"}`}>
                    {done ? <Check size={11} strokeWidth={3} /> : active ? <Loader2 size={11} className="animate-spin" /> : null}
                  </span>
                  {c}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="w-full max-w-[640px]">
        <RotatingLine items={facts} />
      </div>
    </>
  );
}

function pickSkills(depts: TreeOverride) {
  const rows: { name: string; dept: string; group: string; color: string }[] = [];
  const lists = SLOTS.map((slot) =>
    (depts[slot]?.groups ?? []).flatMap((g) => g.skills.map((s) => ({ name: s.name, dept: depts[slot]!.name, group: g.name, color: departmentColors[slot as DepartmentId] }))),
  );
  const total = lists.reduce((n, l) => n + l.length, 0);
  for (let i = 0; rows.length < 6 && i < 10; i++) for (const l of lists) if (l[i] && rows.length < 6) rows.push(l[i]);
  return { rows, total };
}

function ReadyStep({ result, companyName }: { result: BuildResult; companyName: string }) {
  const { rows, total } = pickSkills(result.departments ?? {});
  return (
    <>
      <Question title="Your skills are ready." sub={`I set up ${total} skills for ${companyName || "your company"}, ready to run in your tree. Start your free trial to use them.`} />
      <div className="grid w-full max-w-[640px] grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rows.map((r, i) => (
          <motion.div
            key={r.name + i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-medium">{r.name}</div>
              <div className="truncate text-[12.5px] text-muted">{r.dept} · {r.group}</div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[12px] text-[#5fe08a]"><Check size={13} /> Ready</span>
          </motion.div>
        ))}
      </div>
      {total > rows.length && <p className="text-[13.5px] text-muted">And {total - rows.length} more ready in your tree.</p>}
    </>
  );
}

function ReportModal({ result, company, onClose }: { result: BuildResult; company: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative max-h-[80vh] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-line p-7"
      >
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-hover hover:text-fg"><X size={16} /></button>
        <div className="text-[12px] uppercase tracking-[0.14em] text-muted">Company Brain report</div>
        <h2 className="mt-1 text-[22px] font-semibold">{company || "Your company"}</h2>
        <h3 className="mt-6 text-[14px] font-semibold">Brief</h3>
        <div className="mt-2 text-[14px] leading-relaxed text-fg/90"><Markdown text={result.brief || "No brief yet."} /></div>
        {result.audit && (
          <>
            <h3 className="mt-6 text-[14px] font-semibold">Audit</h3>
            <div className="mt-2 text-[14px] leading-relaxed text-fg/90"><Markdown text={result.audit} /></div>
          </>
        )}
        {result.facts.length > 0 && (
          <>
            <h3 className="mt-6 text-[14px] font-semibold">Facts I remembered</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-fg/90">{result.facts.map((f) => <li key={f}>{f}</li>)}</ul>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function typeName(d: Draft) {
  return d.companyType === OTHER ? d.typeOther.trim() : d.companyType ? companyTypeLabel(d.companyType) : "";
}

/** The answers as the stored user profile. */
function profileOf(d: Draft) {
  const site = d.noWebsite ? "" : hostOf(d.chosen?.website || d.website);
  return {
    name: d.name.trim(),
    role: d.role === OTHER ? d.roleOther.trim() : d.role,
    goals: goalList(d),
    apps: d.apps,
    hasWebsite: !!site,
    website: site,
    companyName: d.chosen?.name || d.company.trim() || (site ? capitalise(site.split(".")[0]) : ""),
    companyType: typeName(d),
    whatWeDo: d.whatWeDo.trim() || (d.result?.about ?? "") || d.answer,
    howWeMakeMoney: d.howWeMakeMoney.trim(),
  };
}

function DescribeStep({ d, update }: { d: Draft; update: (p: Partial<Draft>) => void }) {
  const { questions, placeholder } = describeHints(d.companyType);
  const ref = useRef<HTMLTextAreaElement>(null);
  const add = (q: string) => {
    const text = d.whatWeDo.trimEnd();
    update({ whatWeDo: `${text}${text ? "\n" : ""}${q} ` });
    // Focus now so the next keystroke lands in the text box, then move the caret to the end once React has rendered.
    ref.current?.focus();
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };
  const left = 30 - d.whatWeDo.trim().length;
  return (
    <>
      <Question title="Let Company Brain get to know you" sub="The more detail, the better your brain gets. Write it like you'd explain it to a new colleague." />
      <div className="w-full max-w-[620px]">
        <div className="mb-2.5 flex flex-wrap gap-2">
          {questions.map((q) => (
            <button key={q} onClick={() => add(q)} className="rounded-full border border-line bg-fg/5 px-3 py-1.5 text-[12.5px] text-fg/80 transition hover:border-fg/30 hover:text-fg">
              + {q}
            </button>
          ))}
        </div>
        <textarea
          ref={ref}
          data-own-enter="1"
          value={d.whatWeDo}
          onChange={(e) => update({ whatWeDo: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && d.whatWeDo.trim().length >= 30) {
              e.preventDefault();
              update({ step: "goals" });
            }
          }}
          rows={7}
          autoFocus
          placeholder={placeholder}
          className="glass w-full resize-none rounded-2xl px-5 py-4 text-[15px] leading-relaxed outline-none placeholder:text-faint focus:border-fg/35"
        />
        <div className="mt-1.5 text-right text-[12px] text-faint">{left > 0 ? `${left} more characters` : "Looks good"}</div>
      </div>
    </>
  );
}

function goalList(d: Draft) {
  return d.goals.filter((g) => g !== OTHER).concat(d.goals.includes(OTHER) && d.goalOther.trim() ? [d.goalOther.trim()] : []);
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function capitalise(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
