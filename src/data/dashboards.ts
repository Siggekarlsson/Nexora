import type { Dashboard } from "@/lib/types";

function series(seed: number, n: number, base: number, vol: number, trend: number) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, (_, i) => Math.round((base + i * trend + (r() - 0.5) * vol) * 100) / 100);
}

export const dashboards: (Dashboard & { tab: string; chartLabel: string; alert?: string; unit?: string })[] = [
  {
    id: "paid-ads", tab: "Paid Ads", name: "Paid Ads", source: "Meta Ads", ownerDepartmentId: "marketing", sample: true, needsYou: 1, syncedAt: "5 min ago",
    kpis: [{ label: "Spend", value: "$31,587", delta: 19.0 }, { label: "Cost per Lead", value: "$30.12", delta: 7.7 }],
    series: series(7, 30, 880, 260, 12), chartLabel: "Daily spend, last 30 days", unit: "$",
    alert: "Cost per lead is up 7.7% while spend rose 19%. The webinar campaign is the main driver.",
  },
  {
    id: "pipeline", tab: "Pipeline", name: "Pipeline", source: "HubSpot", ownerDepartmentId: "sales", sample: true, needsYou: 1, syncedAt: "12 min ago",
    kpis: [{ label: "Open pipeline", value: "SEK 4.2M", delta: 6.4 }, { label: "Win rate", value: "31%", delta: -2.1 }],
    series: series(19, 30, 3.6, 0.4, 0.02).map((v) => v), chartLabel: "Open pipeline (SEK M), last 30 days",
    alert: "3 commissioned-research deals have had no activity for 14 days.",
  },
  {
    id: "finance", tab: "Finance", name: "Finance", source: "Accounting export", ownerDepartmentId: "finance", sample: true, needsYou: 1, syncedAt: "1 h ago",
    kpis: [{ label: "Revenue MTD", value: "SEK 1.86M", delta: 4.2 }, { label: "Overdue", value: "SEK 212k", delta: 31.0 }],
    series: series(3, 30, 52, 18, 1.1), chartLabel: "Daily revenue (SEK k), last 30 days",
    alert: "2 invoices for commissioned research are more than 30 days overdue.",
  },
  {
    id: "content", tab: "Content", name: "Content", source: "Newsletter + LinkedIn", ownerDepartmentId: "marketing", sample: true, needsYou: 1, syncedAt: "32 min ago",
    kpis: [{ label: "Readers", value: "18,420", delta: 11.3 }, { label: "Open rate", value: "46.8%", delta: 1.9 }],
    series: series(11, 30, 560, 180, 6), chartLabel: "Daily report reads, last 30 days",
    alert: "Monday's newsletter hasn't been scheduled yet.",
  },
];

export const timeSaved = [
  { dept: "marketing", hours: 64, value: 51200 },
  { dept: "sales", hours: 41, value: 36900 },
  { dept: "research", hours: 33, value: 39600 },
  { dept: "operations", hours: 22, value: 15400 },
  { dept: "leadership", hours: 12, value: 18000 },
  { dept: "finance", hours: 9, value: 7200 },
  { dept: "customer", hours: 7, value: 4900 },
] as const;
