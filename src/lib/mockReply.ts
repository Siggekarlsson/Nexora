import type { DepartmentId } from "./types";
import { departmentName } from "@/data/departments";

/** Offline fallback used when no ANTHROPIC_API_KEY is configured. */
export function mockReply(agent: DepartmentId, text: string, skillName?: string, docCount = 0): string {
  const name = departmentName(agent);
  if (skillName) {
    return `**${skillName}** is set up and ready to run.\n\nTo get started I need a couple of details:\n- Which company or client is this for?\n- Any deadline or format you want (one-pager, email, slide)?\n\nOnce I have that, I will pull what we have in the brain, draft it and list the sources I used.`;
  }
  if (agent === "brain") {
    return docCount === 0
      ? `I searched the brain, but there are **no documents yet**.\n\nUpload reports, models, client emails or policies under **Files** and I can answer questions like this with citations. Good first uploads:\n- Your latest published reports\n- Price lists and subscription terms\n- The client list or CRM export`
      : `I searched ${docCount} document${docCount === 1 ? "" : "s"} in the brain.\n\n### What I found\n- The most relevant passages relate to: "${text.slice(0, 60)}"\n- I can quote them directly or summarise per document.\n\nWant a short summary or the exact quotes?`;
  }
  const ideas: Record<string, string[]> = {
    research: ["Pull consensus and our latest estimates", "Compare against the peer group", "Flag upcoming events (reports, AGMs, insider trades)"],
    sales: ["List the funds most likely to care", "Draft a short personalised email per fund", "Add follow-ups to the pipeline"],
    marketing: ["Turn the key takeaway into a LinkedIn post", "Add it to Monday's newsletter", "Check readership on the last similar piece"],
    operations: ["Run the publishing checklist", "Do the compliance review", "Schedule distribution"],
    customer: ["Check the subscriber's history", "Draft a friendly reply", "Flag churn risk if renewal is near"],
    finance: ["Pull the open invoices", "Check pricing against last mandate", "Update the revenue report"],
    leadership: ["Rank this against this week's priorities", "Suggest who should own it", "Draft a short decision memo"],
  };
  return `Got it, I'm on it as the **${name}** agent.\n\n### Plan\n${(ideas[agent] ?? []).map((i) => `- ${i}`).join("\n")}\n\nI'll use what's in the brain where possible. Should I go ahead, or would you like to adjust the plan first?`;
}
