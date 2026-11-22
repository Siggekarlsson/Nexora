"use client";

/**
 * Tiny client-side store persisted to localStorage.
 * Swap the implementation of `load`/`persist` for Supabase calls later — the hooks stay the same.
 */
import { useSyncExternalStore } from "react";
import type { FileItem, Skill, Thread } from "./types";
import { threads as seedThreads } from "@/data/threads";

export interface AppState {
  threads: Thread[];
  files: FileItem[];
  skillEnabled: Record<string, boolean>;
  customSkills: Skill[];
  trialStarted: boolean;
  integrations: Record<string, boolean>;
  schedules: Record<string, boolean>;
}

const KEY = "nexora.state.v1";

const initial: AppState = {
  threads: seedThreads,
  files: [],
  skillEnabled: {},
  customSkills: [],
  trialStarted: false,
  integrations: { gmail: true },
  schedules: {},
};

let state: AppState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
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
