import { NextResponse, type NextRequest } from "next/server";
import { origin } from "@/lib/integrations/vault";

/** Composio sends the browser back here after sign-in, with status=success or failed. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const app = ["gmail", "drive", "shopify"].includes(p.get("app") ?? "") ? p.get("app") : null;
  if (!app) return NextResponse.redirect(`${origin(req)}/integrations`);
  const ok = (p.get("status") ?? "success") === "success";
  return NextResponse.redirect(`${origin(req)}/integrations?${ok ? `connected=${app}` : `error=${app}_failed`}`);
}
