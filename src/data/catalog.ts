import type { DepartmentId } from "@/lib/types";

/**
 * Raw skill catalog for an equity research house.
 * Each sub-group lists [name, description?, icon?]. Missing descriptions are generated.
 */
export type SkillSeed = [name: string, description?: string, icon?: string];

export interface SubGroupSeed {
  id: string;
  name: string;
  icon: string;
  skills: SkillSeed[];
}

export const catalog: Record<Exclude<DepartmentId, "brain">, SubGroupSeed[]> = {
  research: [
    {
      id: "company-coverage", name: "Company Coverage", icon: "Building2",
      skills: [
        ["Lead Research Brief", "Builds a one-page brief on a covered or prospective company: business model, recent numbers, consensus, key debates and what management has said lately. Use it before an initiation, a client call or an internal pitch. Produces a structured brief with sources from your brain and public filings.", "FileSearch"],
        ["Quarterly Preview", "Drafts a preview ahead of a company's report: what the market expects, where our estimates differ and the three questions that matter on the call.", "CalendarSearch"],
        ["Estimate Revision Note", "Turns updated model numbers into a short note explaining what changed in our estimates and why.", "TrendingUp"],
      ],
    },
    {
      id: "peer-context", name: "Peer Context", icon: "Users",
      skills: [
        ["Peer Valuation Table", "Collects multiples for a peer group and highlights where the covered company trades at a premium or discount.", "Table"],
        ["Read-Across Memo", "Explains what a peer's report means for the companies we cover.", "GitBranch"],
      ],
    },
    {
      id: "event-watch", name: "Event Watch", icon: "Radar",
      skills: [["Event Monitor", "Watches press releases, insider trades and AGM notices for covered companies and flags what needs a comment.", "Bell"]],
    },
    {
      id: "research-synthesis", name: "Research Synthesis", icon: "Layers",
      skills: [["Sector Synthesis", "Combines our notes across a sector into a themed overview for clients.", "Layers"]],
    },
  ],
  sales: [
    {
      id: "investor-outreach", name: "Investor Outreach", icon: "Send",
      skills: [
        ["Cold Email Writer", "Writes a short, specific first email to an institutional investor based on their holdings and our coverage.", "Mail"],
        ["Investor Match", "Finds funds whose holdings overlap with a company we just initiated on.", "Crosshair"],
        ["Follow-up Sequencer", undefined, "Repeat"],
        ["Fund Profile", undefined, "Landmark"],
        ["Intro Request Drafter", undefined, "Handshake"],
        ["Conference Invite", undefined, "Ticket"],
        ["Warm Lead Scorer", undefined, "Flame"],
      ],
    },
    {
      id: "calls", name: "Calls", icon: "Phone",
      skills: [
        ["Call Prep", "Prepares a briefing before an investor call: who they are, what they own, what we last discussed and what to pitch.", "ClipboardList"],
        ["Call Debrief", "Turns your call notes into a CRM summary with next steps and follow-up tasks.", "NotebookPen"],
        ["Objection Handler", undefined, "Shield"],
        ["Management Meeting Brief", undefined, "Briefcase"],
        ["Call Transcript Summary", undefined, "FileAudio"],
        ["Q&A Prep", undefined, "MessagesSquare"],
      ],
    },
    {
      id: "pipeline", name: "Pipeline", icon: "Filter",
      skills: [
        ["Deal Closer", "Suggests the next best action for each commissioned-research deal that is stuck in the pipeline.", "Target"],
        ["Pipeline Review", undefined, "ListChecks"],
        ["Mandate Proposal", undefined, "FileSignature"],
        ["Win/Loss Analysis", undefined, "Scale"],
        ["Renewal Forecast", undefined, "CalendarClock"],
        ["CRM Hygiene", undefined, "Sparkles"],
      ],
    },
    {
      id: "roadshows", name: "Roadshows", icon: "Plane",
      skills: [
        ["Roadshow Planner", undefined, "Map"],
        ["Meeting Scheduler", undefined, "CalendarDays"],
        ["Roadshow Feedback", undefined, "MessageSquareQuote"],
      ],
    },
  ],
  marketing: [
    {
      id: "reports", name: "Reports", icon: "FileText",
      skills: [
        ["Report Summary", undefined, "FileText"], ["Executive Abstract", undefined, "AlignLeft"], ["Chart Pack", undefined, "BarChart3"],
        ["Key Takeaways", undefined, "ListOrdered"], ["Headline Writer", undefined, "Heading"], ["Disclaimer Check", undefined, "ShieldCheck"],
        ["Report Translator", undefined, "Languages"], ["Initiation Teaser", undefined, "Rocket"], ["Model Snapshot", undefined, "Calculator"],
        ["Rating Change Flash", undefined, "Zap"], ["Report Index", undefined, "BookOpen"], ["Quote Extractor", undefined, "Quote"],
      ],
    },
    {
      id: "content", name: "Content", icon: "PenLine",
      skills: [
        ["LinkedIn Post", undefined, "Share"], ["Weekly Newsletter", undefined, "Newspaper"], ["Podcast Script", undefined, "Mic"],
        ["Video Outline", undefined, "Video"], ["Blog Article", undefined, "PenLine"], ["Thread Writer", undefined, "AtSign"],
        ["Analyst Bio", undefined, "UserRound"], ["Case Study", undefined, "BookMarked"], ["Webinar Abstract", undefined, "Presentation"],
        ["Press Release", undefined, "Megaphone"], ["Infographic Brief", undefined, "PieChart"], ["Market Comment", undefined, "MessageCircle"],
        ["Morning Note", undefined, "Sunrise"], ["Sector Spotlight", undefined, "Lightbulb"],
      ],
    },
    {
      id: "distribution", name: "Distribution", icon: "Share2",
      skills: [
        ["Distribution List Builder", undefined, "ListPlus"], ["Send-time Optimizer", undefined, "Timer"], ["Open Rate Report", undefined, "MailOpen"],
        ["Readership Insights", undefined, "Eye"], ["Platform Upload", undefined, "UploadCloud"], ["Embargo Checker", undefined, "Lock"],
        ["Syndication Feed", undefined, "Rss"], ["Subscriber Segmenter", undefined, "SplitSquareHorizontal"], ["Unsubscribe Analysis", undefined, "UserMinus"],
        ["Channel Mix Review", undefined, "Shuffle"], ["Link Tracker", undefined, "Link"], ["Bounce Cleaner", undefined, "Eraser"],
      ],
    },
    {
      id: "brand-events", name: "Brand & Events", icon: "Sparkles",
      skills: [
        ["Event Landing Page", undefined, "LayoutTemplate"], ["Seminar Invite", undefined, "Ticket"], ["Brand Voice Check", undefined, "Volume2"],
        ["Ad Copy", undefined, "Type"], ["Paid Ads Review", undefined, "BadgeDollarSign"], ["Sponsorship Brief", undefined, "Award"],
        ["Event Recap", undefined, "CameraIcon"], ["Media List", undefined, "Contact"],
      ],
    },
  ],
  operations: [
    {
      id: "onboarding", name: "Onboarding", icon: "UserPlus",
      skills: [["Client Onboarding", undefined, "UserPlus"], ["KYC Checklist", undefined, "ClipboardCheck"], ["Analyst Onboarding", undefined, "GraduationCap"]],
    },
    {
      id: "production", name: "Production", icon: "Factory",
      skills: [["Publishing Checklist", undefined, "ListChecks"], ["Compliance Review", undefined, "Scale"], ["Report Formatter", undefined, "Wand2"], ["Data Refresh", undefined, "RefreshCw"]],
    },
    {
      id: "correspondence", name: "Correspondence", icon: "Mail",
      skills: [["Inbox Triage", undefined, "Inbox"], ["Reply Drafter", undefined, "Reply"], ["Meeting Notes", undefined, "NotebookPen"]],
    },
  ],
  customer: [
    {
      id: "subscriber-support", name: "Subscriber Support", icon: "LifeBuoy",
      skills: [["Support Reply", undefined, "LifeBuoy"], ["Access Troubleshooter", undefined, "KeyRound"], ["FAQ Builder", undefined, "HelpCircle"]],
    },
    {
      id: "retention", name: "Retention", icon: "HeartHandshake",
      skills: [["Churn Risk Alert", undefined, "AlertTriangle"], ["Renewal Reminder", undefined, "CalendarCheck"]],
    },
    { id: "community", name: "Community", icon: "Users", skills: [["Community Digest", undefined, "Users"]] },
  ],
  finance: [
    {
      id: "invoices", name: "Invoices", icon: "Receipt",
      skills: [["Invoice Drafter", undefined, "Receipt"], ["Overdue Chaser", undefined, "Clock"], ["Expense Coder", undefined, "Tags"]],
    },
    { id: "pricing", name: "Pricing", icon: "Tag", skills: [["Mandate Pricing", undefined, "Tag"], ["Subscription Pricing Review", undefined, "Percent"]] },
    {
      id: "revenue", name: "Revenue", icon: "LineChart",
      skills: [["Revenue Report", undefined, "LineChart"], ["Cash Flow Forecast", undefined, "Wallet"], ["Budget Variance", undefined, "Activity"]],
    },
  ],
  leadership: [
    {
      id: "advice", name: "Advice", icon: "Lightbulb",
      skills: [["Board Memo", undefined, "FileText"], ["Strategy Sparring", undefined, "Swords"], ["Decision Log", undefined, "BookCheck"], ["Risk Review", undefined, "ShieldAlert"], ["Competitor Watch", undefined, "Binoculars"]],
    },
    {
      id: "planning", name: "Planning", icon: "Compass",
      skills: [["Quarterly Plan", undefined, "Compass"], ["OKR Drafter", undefined, "Target"], ["Coverage Planning", undefined, "Map"], ["Hiring Plan", undefined, "UserPlus"], ["Weekly Priorities", undefined, "ListTodo"], ["Offsite Agenda", undefined, "CalendarRange"]],
    },
    {
      id: "delegation", name: "Delegation", icon: "Share",
      skills: [["Task Router", undefined, "Route"], ["Status Roll-up", undefined, "ClipboardList"], ["1:1 Prep", undefined, "Coffee"], ["Team Update", undefined, "Megaphone"], ["Handover Note", undefined, "ArrowRightLeft"]],
    },
  ],
};
