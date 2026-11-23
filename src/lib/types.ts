// Core domain model. Shapes mirror the future Supabase/Postgres tables.

export type DepartmentId =
  | "brain"
  | "research"
  | "sales"
  | "marketing"
  | "operations"
  | "customer"
  | "finance"
  | "leadership";

export interface Skill {
  id: string;
  departmentId: DepartmentId;
  subGroupId: string;
  name: string;
  description: string;
  /** lucide-react icon name */
  icon: string;
  color?: string;
  enabled: boolean;
  recommended: boolean;
  readyToRun: boolean;
  owner: string;
}

/** A job is a skill placed in the tree. Kept as alias for clarity in UI code. */
export type Job = Skill;

export interface SubGroup {
  id: string;
  departmentId: DepartmentId;
  name: string;
  description?: string;
  skills: Skill[];
}

export interface Department {
  id: DepartmentId;
  name: string;
  /** Short lowercase focus areas shown under the name */
  tagline: string[];
  color: string;
  /** key into the pixel avatar sprite map */
  avatar: DepartmentId;
  jobs: number;
  readyToRun: number;
  subGroups: SubGroup[];
}

/** An email the agent drafted. It is only sent when the user clicks "Skicka" in the email card. */
export interface EmailDraft {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  threadId?: string;
  status?: "open" | "sent" | "saved" | "cancelled";
  sentTo?: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  departmentId?: DepartmentId;
  draft?: EmailDraft;
}

export interface Thread {
  id: string;
  title: string;
  departmentId: DepartmentId;
  skillId?: string;
  updatedAt: string;
  messages: ChatMessage[];
  /** true when the router picked the agent */
  autoRouted?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "docx" | "xlsx" | "txt" | "eml" | "md";
  sizeBytes: number;
  uploadedAt: string;
  departmentId?: DepartmentId;
  /** Extracted text for plain-text formats, sent to agents as Company Brain context. */
  text?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  source: string;
  ownerDepartmentId: DepartmentId;
  sample: boolean;
  needsYou: number;
  syncedAt: string;
  kpis: { label: string; value: string; delta: number }[];
  series: number[];
}
