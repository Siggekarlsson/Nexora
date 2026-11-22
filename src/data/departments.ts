import type { Department, DepartmentId } from "@/lib/types";

/** Department colours, used across tree, chat, skills and dashboards. */
export const departmentColors: Record<DepartmentId, string> = {
  brain: "#a78bfa",
  research: "#7cc4ff",
  sales: "#ff9f4a",
  marketing: "#b98bff",
  operations: "#3fd9c9",
  customer: "#ff6b8b",
  finance: "#5fe08a",
  leadership: "#8b7bff",
};

type DeptSeed = Omit<Department, "subGroups">;

// Mock data for an equity research house. Sub-groups & skills get filled in step 2–3.
export const departmentSeeds: DeptSeed[] = [
  { id: "research", name: "Research", tagline: ["company coverage", "peers", "events"], color: departmentColors.research, avatar: "research", jobs: 7, readyToRun: 1 },
  { id: "sales", name: "Sales", tagline: ["investor outreach", "calls", "pipeline"], color: departmentColors.sales, avatar: "sales", jobs: 22, readyToRun: 10 },
  { id: "marketing", name: "Marketing", tagline: ["reports", "content", "distribution"], color: departmentColors.marketing, avatar: "marketing", jobs: 46, readyToRun: 14 },
  { id: "operations", name: "Operations", tagline: ["onboarding", "production", "correspondence"], color: departmentColors.operations, avatar: "operations", jobs: 10, readyToRun: 6 },
  { id: "customer", name: "Customer", tagline: ["subscriber support", "retention", "community"], color: departmentColors.customer, avatar: "customer", jobs: 6, readyToRun: 1 },
  { id: "finance", name: "Finance", tagline: ["invoices", "pricing", "revenue"], color: departmentColors.finance, avatar: "finance", jobs: 8, readyToRun: 3 },
  { id: "leadership", name: "Leadership", tagline: ["advice", "planning", "delegation"], color: departmentColors.leadership, avatar: "leadership", jobs: 16, readyToRun: 5 },
];

export const brain = {
  id: "brain" as const,
  name: "Company Brain",
  color: departmentColors.brain,
};

/** Agents listed in chat sidebar, in order. */
export const agentOrder: DepartmentId[] = [
  "brain", "research", "sales", "marketing", "operations", "customer", "finance", "leadership",
];

export function departmentName(id: DepartmentId) {
  if (id === "brain") return brain.name;
  return departmentSeeds.find((d) => d.id === id)?.name ?? id;
}
