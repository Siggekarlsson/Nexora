"use client";

import { resetState } from "./store";

/**
 * Removes everything Nexora knows about this browser's user and starts over at onboarding step 1:
 * server cookies (via /api/auth/logout), client cookies, Nexora's localStorage and sessionStorage, and the in-memory store.
 */
export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
  } catch {}
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("nexora")) localStorage.removeItem(k);
    for (const k of Object.keys(sessionStorage)) if (k.startsWith("nexora")) sessionStorage.removeItem(k);
  } catch {}
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (name.startsWith("nx_")) document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
  }
  resetState();
  // A full page load clears anything else held in memory (applied company tree, cached views).
  window.location.replace("/onboarding");
}
