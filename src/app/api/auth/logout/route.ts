import { NextResponse, type NextRequest } from "next/server";

/**
 * Logs the browser out: clears every Nexora cookie, including the httpOnly ones the browser can't touch
 * (nx_uid for Composio, sealed OAuth tokens, sign-in state). The next visit gets a new nx_uid, so earlier
 * Composio connections no longer belong to this browser.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const names = new Set(["nx_uid", "nx_onboarded", "nx_gmail", "nx_drive", "nx_shopify"]);
  for (const c of req.cookies.getAll()) if (c.name.startsWith("nx_")) names.add(c.name);
  for (const name of names) res.cookies.set(name, "", { path: "/", maxAge: 0 });
  res.headers.set("cache-control", "no-store");
  return res;
}
