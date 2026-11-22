/**
 * Global branding & app configuration.
 * Change `name` here to rebrand the whole app.
 */
export const siteConfig = {
  name: "Nexora",
  tagline: "Your company's AI workforce",
  description:
    "Nexora is an AI agent platform where every department has its own agents, skills and shared company brain.",
  /** Mock signed-in user until auth is wired up (Supabase). */
  user: {
    firstName: "Sigge",
    lastName: "Karlsson",
    email: "sigge@example.com",
    company: "Nordic Equity Research",
  },
  trial: {
    started: false,
    label: "Free trial not started",
    cta: "Start Free Trial",
  },
} as const;

export type SiteConfig = typeof siteConfig;
