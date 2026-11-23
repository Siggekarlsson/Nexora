"use client";

/**
 * Tiny client-side store persisted to localStorage.
 * Swap the implementation of `load`/`persist` for Supabase calls later — the hooks stay the same.
 */
import { useSyncExternalStore } from "react";
import type { DepartmentId, FileItem, Skill, Thread } from "./types";
import { threads as seedThreads } from "@/data/threads";
import { siteConfig } from "@/config/site";

export interface AppState {
  threads: Thread[];
  files: FileItem[];
  skillEnabled: Record<string, boolean>;
  customSkills: Skill[];
  trialStarted: boolean;
  integrations: Record<string, boolean>;
  schedules: Record<string, boolean>;
  workspace: { company: string; about: string; website?: string };
  notifications: Notice[];
  /** Answers from onboarding. */
  profile: Profile;
  onboarding: { done: boolean };
  /** Company Brain brief and audit written during onboarding. */
  brain: { brief: string; audit: string; facts: string[] };
  /** Department names and skills generated for this company (null = the default tree). */
  tree: TreeOverride | null;
}

export type Profile = { name: string; role: string; goals: string[]; apps: string[] };

export type TreeOverride = Partial<
  Record<
    Exclude<DepartmentId, "brain">,
    { name: string; tagline: string[]; groups: { name: string; skills: { name: string; description: string; icon?: string }[] }[] }
  >
>;

export type Notice = { id: string; title: string; body: string; time: string; color: string };

const KEY = "nexora.state.v1";

/** Integrations that connect for real. Everything else is "Coming soon" and can never be connected. */
export const LIVE_INTEGRATIONS = ["gmail", "drive", "shopify", "hubspot", "meta-ads", "slack", "linkedin", "outlook", "accounting", "newsletter"] as const;

/** Drops old simulated connections (e.g. hubspot: true) saved by earlier versions. */
function onlyLive(integrations: Record<string, boolean> = {}) {
  return Object.fromEntries(Object.entries(integrations).filter(([k]) => (LIVE_INTEGRATIONS as readonly string[]).includes(k)));
}

const initial: AppState = {
  threads: seedThreads,
  files: [],
  skillEnabled: {},
  customSkills: [],
  trialStarted: false,
  integrations: {},
  schedules: {},
  notifications: [
    { id: "n1", title: "Paid Ads needs you", body: "Cost per lead rose 7.7% this week.", time: "5 min ago", color: "#b98bff" },
    { id: "n2", title: "Q3 preview drafted", body: "Research finished the Volvo Cars preview.", time: "1 h ago", color: "#7cc4ff" },
    { id: "n3", title: "Invoice overdue", body: "Finance flagged 2 unpaid commissioned-research invoices.", time: "Yesterday", color: "#5fe08a" },
  ],
  profile: { name: "", role: "", goals: [], apps: [] },
  onboarding: { done: false },
  brain: { brief: "", audit: "", facts: [] },
  tree: null,
  workspace: {
    company: siteConfig.user.company,
    about: "Independent equity research on Nordic listed companies: commissioned research, investor events and distribution to institutional investors.",
  },
};

let state: AppState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...initial, ...saved, integrations: onlyLive(saved.integrations) };
    }
  } catch {}
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function setState(fn: (s: AppState) => Partial<AppState>) {
  load();
  state = { ...state, ...fn(state) };
  persist();
  listeners.forEach((l) => l());
}

export function getState() {
  load();
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(initial),
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Context every agent request carries: workspace settings and Company Brain documents. */
export function agentContext() {
  const s = getState();
  return {
    company: s.workspace.company,
    about: s.workspace.about,
    brief: s.brain.brief,
    profile: s.profile,
    departments: s.tree ? Object.fromEntries(Object.entries(s.tree).map(([id, d]) => [id, { name: d.name, tagline: d.tagline }])) : undefined,
    docCount: s.files.length,
    docs: s.files.map((f) => ({ name: f.name, text: f.text })),
  };
}
