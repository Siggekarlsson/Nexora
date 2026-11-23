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

/** "What does {company} do?" choices for companies without a website. `icon` is a lucide icon name. */
export const COMPANY_TYPES = [
  { id: "dropshipping", label: "Dropshipping", icon: "Package" },
  { id: "clothing", label: "Clothing brand", icon: "Shirt" },
  { id: "creator", label: "Content creator", icon: "Video" },
  { id: "ecommerce", label: "E-commerce store", icon: "ShoppingCart" },
  { id: "agency", label: "Agency (marketing/design)", icon: "Palette" },
  { id: "consulting", label: "Consulting", icon: "Briefcase" },
  { id: "saas", label: "SaaS / software", icon: "Code" },
  { id: "restaurant", label: "Restaurant or café", icon: "Coffee" },
  { id: "local", label: "Local service business", icon: "Wrench" },
  { id: "coaching", label: "Coaching or courses", icon: "GraduationCap" },
  { id: "realestate", label: "Real estate", icon: "Home" },
  { id: "finance", label: "Finance / investing", icon: "LineChart" },
] as const;

export const companyTypeLabel = (id: string) => COMPANY_TYPES.find((t) => t.id === id)?.label ?? id;

/** Helper questions shown as chips above the "Let Company Brain get to know you" text box. */
export function describeHints(type: string): { questions: string[]; placeholder: string } {
  switch (type) {
    case "clothing":
      return {
        questions: ["What kind of clothes do you sell?", "Who is your customer?", "Where do you sell (own store, Instagram, Zalando…)?", "How do you market today?"],
        placeholder: "We sell minimalist streetwear for 18–30 year olds, mostly through our own Shopify store and Instagram…",
      };
    case "dropshipping":
      return {
        questions: ["What products/niche?", "Which store platform?", "Where do your ads run?", "Average order value and margin?"],
        placeholder: "We sell pet accessories through a Shopify store, with ads on TikTok and Meta…",
      };
    case "creator":
      return {
        questions: ["Which platforms and niche?", "How do you make money (sponsors, ads, products)?", "How often do you post?"],
        placeholder: "I make fitness videos on YouTube and TikTok, and earn from sponsors and my own training program…",
      };
    default:
      return {
        questions: ["What do you sell?", "Who are your customers?", "How do you make money?", "How do you find new customers?"],
        placeholder: "We help small companies with… Our customers are… We make money by…",
      };
  }
}

const COMMERCE_HELP = [
  "Keep an eye on my email and answer customers",
  "Track how sales are going",
  "Suggest ads and marketing ideas",
  "Write product descriptions and posts",
  "Chase invoices and keep track of money",
  "Find answers in my docs",
];
const CREATOR_HELP = [
  "Answer brand and sponsor emails",
  "Track views, followers and income",
  "Suggest content ideas",
  "Write posts, captions and scripts",
  "Keep track of deals, invoices and money",
  "Find answers in my docs",
];
const SERVICE_HELP = [
  "Keep an eye on my email and answer clients",
  "Follow up on leads and calls",
  "Write proposals, posts and marketing",
  "Track sales and bookings",
  "Chase invoices and keep track of money",
  "Find answers in my docs",
];
const RESTAURANT_HELP = [
  "Answer guest emails and bookings",
  "Track sales and costs",
  "Suggest marketing ideas and offers",
  "Write menus, posts and descriptions",
  "Keep track of suppliers and invoices",
  "Find answers in my docs",
];

/** "How should Nexora help you?" choices, shaped by the company type. */
export function helpOptions(type: string): string[] {
  if (["clothing", "dropshipping", "ecommerce"].includes(type)) return COMMERCE_HELP;
  if (type === "creator") return CREATOR_HELP;
  if (type === "restaurant") return RESTAURANT_HELP;
  if (["agency", "consulting", "local", "coaching", "realestate"].includes(type)) return SERVICE_HELP;
  return GOALS;
}
