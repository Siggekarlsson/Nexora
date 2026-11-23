"use client";

import { getState, setState } from "./store";

/** Cookie the middleware checks, so pages redirect to /onboarding before rendering. */
export const ONBOARDED_COOKIE = "nx_onboarded";

export const ROLES = [
  "Founder or owner",
  "Operations",
  "Sales",
  "Marketing",
  "Finance",
  "Customer support",
  "People and HR",
  "Product and engineering",
];

export const GOALS = [
  "Answer customer emails faster",
  "Weekly report on sales",
  "Turn calls into follow-ups",
  "Find answers in our docs",
  "Draft marketing content",
  "Chase invoices",
];

/** Apps offered in onboarding. `integration` is the id used by /api/integrations/<id>/connect. */
export const WORK_APPS = [
  { id: "gmail", name: "Gmail", mono: "Gm", color: "#ea5f4f", integration: "gmail", what: "emails", desc: "Threads, labels and attachments." },
  { id: "outlook", name: "Microsoft Outlook", mono: "Ol", color: "#3d8bfd", integration: "outlook", what: "emails", desc: "Mail, calendar and contacts on Microsoft 365." },
  { id: "drive", name: "Google Drive", mono: "Gd", color: "#36b37e", integration: "drive", what: "files", desc: "Docs, sheets and the reports your team keeps." },
  { id: "onedrive", name: "OneDrive", mono: "Od", color: "#2f8bff", integration: "onedrive", what: "files", desc: "Files and folders in your OneDrive." },
  { id: "sharepoint", name: "SharePoint", mono: "Sp", color: "#1fa3a3", integration: "sharepoint", what: "documents", desc: "Sites and document libraries." },
  { id: "calendar", name: "Google Calendar", mono: "Gc", color: "#4f8cff", integration: "calendar", what: "meetings", desc: "Meetings, invites and free time." },
  { id: "slack", name: "Slack", mono: "Sl", color: "#b98bff", integration: "slack", what: "conversations", desc: "Channels, threads and mentions." },
  { id: "teams", name: "Microsoft Teams", mono: "Mt", color: "#7b83eb", integration: "teams", what: "conversations", desc: "Chats, channels and meetings." },
  { id: "notion", name: "Notion", mono: "No", color: "#d9d9e3", integration: "notion", what: "docs", desc: "Pages, wikis and databases." },
] as const;

export const NONE_APP = "none";

export function setOnboardedCookie(done: boolean) {
  document.cookie = done ? `${ONBOARDED_COOKIE}=1; path=/; max-age=31536000; samesite=lax` : `${ONBOARDED_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function finishOnboarding() {
  setState(() => ({ onboarding: { done: true } }));
  setOnboardedCookie(true);
}

/** Starts onboarding again. Answers are kept so the fields are prefilled. */
export function restartOnboarding() {
  setState(() => ({ onboarding: { done: false } }));
  setOnboardedCookie(false);
  try {
    sessionStorage.removeItem("nexora.onboarding.v1");
  } catch {}
}

export const isOnboarded = () => getState().onboarding.done;
