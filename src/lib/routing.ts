import type { DepartmentId } from "./types";

/**
 * Picks the department agent best suited for a message when the user hasn't chosen one.
 * Keyword scoring for now; swap for an LLM classifier (Anthropic API) later — same signature.
 */
const keywords: Record<DepartmentId, string[]> = {
  brain: ["document", "documents", "file", "files", "uploaded", "upload", "pdf", "say about", "mention", "brain", "summarise", "summarize"],
  research: ["company", "coverage", "estimate", "valuation", "peer", "multiple", "earnings", "quarter", "report q", "preview", "initiation", "sector", "analysis", "ebit", "guidance", "insider"],
  sales: ["investor", "fund", "call", "pipeline", "deal", "outreach", "email", "meeting", "roadshow", "crm", "prospect", "mandate", "client"],
  marketing: ["newsletter", "linkedin", "post", "content", "distribution", "readership", "open rate", "campaign", "ads", "brand", "seminar", "webinar", "press release"],
  operations: ["onboarding", "compliance", "publish", "publishing", "process", "inbox", "kyc", "format", "checklist", "production"],
  customer: ["subscriber", "support", "churn", "renewal", "renewals", "retention", "complaint", "access", "login", "community"],
  finance: ["invoice", "invoices", "pricing", "price", "revenue", "budget", "cash", "cost", "expense", "billing", "payment", "overdue"],
  leadership: ["strategy", "plan", "planning", "priorit", "board", "okr", "hire", "hiring", "team", "delegate", "decision", "advice", "first today", "needs me"],
};

export function routeMessage(text: string): DepartmentId {
  const t = text.toLowerCase();
  let best: DepartmentId = "brain";
  let bestScore = 0;
  (Object.keys(keywords) as DepartmentId[]).forEach((id) => {
    const score = keywords[id].reduce((n, k) => n + (t.includes(k) ? k.length : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  });
  return best;
}
