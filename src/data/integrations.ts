/**
 * Every app on the Integrations page. `slug` is the Composio toolkit slug (null = Composio has no toolkit yet).
 * `icon` is the fallback logo from the Iconify "logos" set, used when Composio returns no logo.
 * Kept as plain data so it can move to a database table later.
 */

export type CategoryId =
  | "popular" | "mail" | "scheduling" | "communication" | "storage" | "docs" | "crm" | "finance"
  | "projects" | "marketing" | "code" | "research" | "soon";

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "popular", name: "Most Popular" },
  { id: "mail", name: "Mail" },
  { id: "scheduling", name: "Scheduling, forms and signatures" },
  { id: "communication", name: "Communication" },
  { id: "storage", name: "Storage" },
  { id: "docs", name: "Docs and knowledge" },
  { id: "crm", name: "CRM and support" },
  { id: "finance", name: "Finance" },
  { id: "projects", name: "Project tools" },
  { id: "marketing", name: "Marketing and web" },
  { id: "code", name: "Code, data and automation" },
  { id: "research", name: "Research and web" },
  { id: "soon", name: "Coming Soon" },
];

export type Integration = {
  id: string;
  name: string;
  desc: string;
  category: Exclude<CategoryId, "popular">;
  slug: string | null;
  icon?: string;
  /** Brand colour for one-colour icons (simple-icons set). */
  color?: string;
};

const app = (id: string, name: string, category: Integration["category"], slug: string | null, desc: string, icon?: string, color?: string): Integration => ({ id, name, desc, category, slug, icon, color });

export const INTEGRATIONS: Integration[] = [
  // Mail
  app("gmail", "Gmail", "mail", "gmail", "Read threads, labels and attachments.", "logos:google-gmail"),
  app("outlook", "Microsoft Outlook", "mail", "outlook", "Mail, contacts and calendar on Microsoft 365.", "simple-icons:microsoftoutlook", "#0078D4"),
  app("zohomail", "Zoho Mail", "mail", "zoho_mail", "Business mail on Zoho.", "logos:zoho"),
  // Scheduling, forms and signatures
  app("calendar", "Google Calendar", "scheduling", "googlecalendar", "Meetings, invites and free time.", "logos:google-calendar"),
  app("calendly", "Calendly", "scheduling", "calendly", "Booked meetings and event types.", "simple-icons:calendly", "#006BFF"),
  app("calcom", "Cal.com", "scheduling", "cal", "Bookings and availability.", "simple-icons:caldotcom", "#ffffff"),
  app("typeform", "Typeform", "scheduling", "typeform", "Forms and their responses.", "logos:typeform-icon"),
  app("pandadoc", "PandaDoc", "scheduling", "pandadoc", "Proposals, quotes and e-signatures.", undefined),
  // Communication
  app("slack", "Slack", "communication", "slack", "Channels, threads and mentions.", "logos:slack-icon"),
  app("teams", "Microsoft Teams", "communication", "microsoft_teams", "Chats, channels and meetings.", "logos:microsoft-teams"),
  app("zoom", "Zoom", "communication", "zoom", "Meetings and recordings.", "logos:zoom-icon"),
  app("meet", "Google Meet", "communication", "googlemeet", "Meetings and conference records.", "logos:google-meet"),
  app("whatsapp", "WhatsApp", "communication", "whatsapp", "Business messages with customers.", "logos:whatsapp-icon"),
  app("discord", "Discord", "communication", "discord", "Servers, channels and community.", "logos:discord-icon"),
  app("fireflies", "Fireflies", "communication", "fireflies", "Meeting notes and transcripts.", undefined),
  app("gong", "Gong", "communication", "gong", "Sales calls and transcripts.", undefined),
  app("telegram", "Telegram", "communication", "telegram", "Chats and channels.", "logos:telegram"),
  app("twilio", "Twilio", "communication", "twilio", "SMS and calls.", "logos:twilio-icon"),
  // Storage
  app("drive", "Google Drive", "storage", "googledrive", "Docs, sheets and files your team keeps.", "logos:google-drive"),
  app("onedrive", "OneDrive", "storage", "one_drive", "Files and folders in OneDrive.", "logos:microsoft-onedrive"),
  app("dropbox", "Dropbox", "storage", "dropbox", "Files and shared folders.", "logos:dropbox"),
  app("sharepoint", "SharePoint", "storage", "share_point", "Sites and document libraries.", "simple-icons:microsoftsharepoint", "#0B828E"),
  app("box", "Box", "storage", "box", "Secure file storage and sharing.", "logos:box"),
  // Docs and knowledge
  app("sheets", "Google Sheets", "docs", "googlesheets", "Spreadsheets and the numbers in them.", "simple-icons:googlesheets", "#34A853"),
  app("docs", "Google Docs", "docs", "googledocs", "Documents your team writes.", "simple-icons:googledocs", "#4285F4"),
  app("confluence", "Confluence", "docs", "confluence", "Wiki pages and spaces.", "logos:confluence"),
  app("coda", "Coda", "docs", "coda", "Docs, tables and pages.", "logos:coda-icon"),
  // CRM and support
  app("hubspot", "HubSpot", "crm", "hubspot", "Contacts, deals and pipeline.", "logos:hubspot"),
  app("salesforce", "Salesforce", "crm", "salesforce", "Accounts, leads and opportunities.", "logos:salesforce"),
  app("pipedrive", "Pipedrive", "crm", "pipedrive", "Deals, leads and activities.", "logos:pipedrive"),
  app("attio", "Attio", "crm", "attio", "Records, lists and relationships.", undefined),
  app("close", "Close", "crm", "close", "Leads, calls and email sequences.", undefined),
  app("gohighlevel", "GoHighLevel", "crm", "highlevel_mcp", "Contacts, funnels and pipelines.", undefined),
  app("zohocrm", "Zoho CRM", "crm", "zoho", "Leads, contacts and deals.", "logos:zoho"),
  app("zendesk", "Zendesk", "crm", "zendesk", "Support tickets and customers.", "logos:zendesk-icon"),
  app("intercom", "Intercom", "crm", "intercom", "Customer conversations and help center.", "logos:intercom-icon"),
  app("freshdesk", "Freshdesk", "crm", "freshdesk", "Tickets and support agents.", undefined),
  // Finance
  app("quickbooks", "QuickBooks", "finance", "quickbooks", "Invoices, customers and revenue.", "simple-icons:quickbooks", "#2CA01C"),
  app("stripe", "Stripe", "finance", "stripe", "Payments, customers and subscriptions.", "logos:stripe"),
  app("zohobooks", "Zoho Books", "finance", "zoho_books", "Invoices, bills and accounts.", "logos:zoho"),
  app("brex", "Brex", "finance", "brex", "Cards, spend and transactions.", "simple-icons:brex", "#F46A35"),
  // Project tools
  app("notion", "Notion", "projects", "notion", "Pages, wikis and databases.", "logos:notion-icon"),
  app("asana", "Asana", "projects", "asana", "Projects and tasks.", "logos:asana-icon"),
  app("clickup", "ClickUp", "projects", "clickup", "Tasks, docs and goals.", "logos:clickup"),
  app("trello", "Trello", "projects", "trello", "Boards, lists and cards.", "logos:trello"),
  app("jira", "Jira", "projects", "jira", "Issues, sprints and projects.", "logos:jira"),
  app("linear", "Linear", "projects", "linear", "Issues, cycles and projects.", "logos:linear-icon"),
  app("monday", "monday.com", "projects", "monday", "Boards and work items.", "logos:monday-icon"),
  app("basecamp", "Basecamp", "projects", "basecamp", "Projects, to-dos and messages.", "logos:basecamp"),
  app("airtable", "Airtable", "projects", "airtable", "Bases, tables and records.", "logos:airtable"),
  // Marketing and web
  app("mailchimp", "Mailchimp", "marketing", "mailchimp", "Newsletters, audiences and campaigns.", "logos:mailchimp-freddie"),
  app("linkedin", "LinkedIn", "marketing", "linkedin", "Posts and company pages.", "logos:linkedin-icon"),
  app("meta", "Meta Business", "marketing", "facebook", "Facebook Pages, lead forms and ads.", "logos:meta-icon"),
  app("instantly", "Instantly", "marketing", "instantly", "Cold email campaigns and leads.", undefined),
  app("heyreach", "HeyReach", "marketing", "heyreach", "LinkedIn outreach campaigns.", undefined),
  app("lemlist", "lemlist", "marketing", "lemlist", "Outreach sequences and replies.", undefined),
  app("googleads", "Google Ads", "marketing", "googleads", "Campaigns, spend and conversions.", "logos:google-ads"),
  app("tiktokads", "TikTok Ads", "marketing", "tiktok_ads", "Ad campaigns and results on TikTok.", "logos:tiktok-icon"),
  app("instagram", "Instagram", "marketing", "instagram", "Posts, reels and insights.", "logos:instagram-icon"),
  app("canva", "Canva", "marketing", "canva", "Designs and brand assets.", "simple-icons:canva", "#00C4CC"),
  app("analytics", "Google Analytics", "marketing", "google_analytics", "Traffic, sources and conversions.", "logos:google-analytics"),
  app("webflow", "Webflow", "marketing", "webflow", "Sites, pages and CMS items.", "logos:webflow"),
  app("square", "Square", "marketing", "square", "Payments, orders and point of sale.", "logos:square"),
  // Code, data and automation
  app("github", "GitHub", "code", "github", "Repositories, issues and pull requests.", "logos:github-icon"),
  app("gitlab", "GitLab", "code", "gitlab", "Projects, issues and merge requests.", "logos:gitlab"),
  app("bigquery", "BigQuery", "code", "googlebigquery", "Query your data warehouse.", "logos:google-cloud"),
  app("make", "Make", "code", "make", "Scenarios and automations.", "simple-icons:make", "#A259FF"),
  app("base44", "Base44", "code", null, "Apps you built with Base44.", undefined),
  // Research and web
  app("apollo", "Apollo", "research", "apollo", "People and company data for prospecting.", undefined),
  app("apify", "Apify", "research", "apify", "Web scraping actors and datasets.", "logos:apify-icon"),
  app("dataforseo", "DataForSEO", "research", "dataforseo", "Keyword and search data.", undefined),
  app("clay", "Clay", "research", "clay_mcp", "Enrich companies and contacts.", undefined),
  app("hunter", "Hunter", "research", "hunter", "Find and verify email addresses.", undefined),
  // Coming soon
  app("protonmail", "Proton Mail", "soon", null, "Encrypted mail.", "simple-icons:protonmail", "#6D4AFF"),
  app("forms", "Google Forms", "soon", null, "Forms and responses.", "simple-icons:googleforms", "#7248B9"),
  app("docusign", "DocuSign", "soon", null, "Contracts and e-signatures.", "simple-icons:docusign", "#FFCC22"),
  app("s3", "Amazon S3", "soon", null, "Files in S3 buckets.", "logos:aws-s3"),
  app("icloud", "iCloud Drive", "soon", null, "Files in iCloud.", "simple-icons:icloud", "#3693F3"),
  app("nextcloud", "Nextcloud", "soon", null, "Self-hosted files.", "simple-icons:nextcloud", "#0082C9"),
  app("obsidian", "Obsidian", "soon", null, "Notes and vaults.", "logos:obsidian-icon"),
  app("evernote", "Evernote", "soon", null, "Notes and notebooks.", "simple-icons:evernote", "#00A82D"),
  app("xero", "Xero", "soon", null, "Accounting and invoices.", "logos:xero"),
  app("sage", "Sage", "soon", null, "Accounting and payroll.", "simple-icons:sage", "#00D639"),
  app("paypal", "PayPal", "soon", null, "Payments and payouts.", "logos:paypal"),
  app("expensify", "Expensify", "soon", null, "Receipts and expenses.", "simple-icons:expensify", "#0185FF"),
  app("shopify", "Shopify", "soon", null, "Orders, products and stock.", "logos:shopify"),
  app("tiktok", "TikTok", "soon", null, "Videos and account insights.", "logos:tiktok-icon"),
  app("woocommerce", "WooCommerce", "soon", null, "Orders and products.", "logos:woocommerce-icon"),
  app("zapier", "Zapier", "soon", null, "Zaps and automations.", "logos:zapier-icon"),
  app("postgres", "PostgreSQL", "soon", null, "Query your database.", "logos:postgresql"),
  app("snowflake", "Snowflake", "soon", null, "Query your data cloud.", "logos:snowflake-icon"),
  app("n8n", "n8n", "soon", null, "Workflows and automations.", "logos:n8n-icon"),
  app("exa", "Exa", "soon", null, "Web search for AI.", "logos:exa-icon"),
];

export const MOST_POPULAR = ["gmail", "calendar", "drive", "slack", "outlook", "teams", "zoom", "sheets", "notion", "hubspot", "quickbooks", "stripe"];

export const integrationById = Object.fromEntries(INTEGRATIONS.map((a) => [a.id, a])) as Record<string, Integration>;

/** Apps that can be connected (have a Composio toolkit and are not "Coming Soon"). */
export const CONNECTABLE = INTEGRATIONS.filter((a) => a.slug && a.category !== "soon");

/** Apps in a category, in the order of the page. */
export function appsIn(cat: CategoryId) {
  if (cat === "popular") return MOST_POPULAR.map((id) => integrationById[id]);
  return INTEGRATIONS.filter((a) => a.category === cat);
}
