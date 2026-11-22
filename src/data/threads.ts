import type { Thread } from "@/lib/types";

export const threads: Thread[] = [
  { id: "t-marketing-main", title: "Main Thread", departmentId: "marketing", updatedAt: "2026-11-22T16:10:00Z", messages: [] },
  { id: "t-research-volvo", title: "Volvo Cars Q3 preview", departmentId: "research", skillId: "research.quarterly-preview", updatedAt: "2026-11-22T14:02:00Z", messages: [] },
  { id: "t-sales-main", title: "Main Thread", departmentId: "sales", updatedAt: "2026-11-21T17:45:00Z", messages: [] },
  { id: "t-finance-invoices", title: "Overdue invoices", departmentId: "finance", skillId: "finance.overdue-chaser", updatedAt: "2026-11-21T09:30:00Z", messages: [] },
];

export const onboardingSteps = [
  { id: "account", label: "Create your workspace", done: true },
  { id: "company", label: "Tell us about your company", done: true },
  { id: "departments", label: "Pick your departments", done: true },
  { id: "first-chat", label: "Have your first chat", done: true },
  { id: "first-skill", label: "Run your first skill", done: true },
  { id: "brain", label: "Feed the brain with a document", done: false, href: "/files" },
  { id: "integration", label: "Connect an integration", done: false, href: "/integrations" },
];
