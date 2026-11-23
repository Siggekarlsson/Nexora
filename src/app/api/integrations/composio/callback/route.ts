import { NextResponse, type NextRequest } from "next/server";
import { isAppId, returnPath } from "@/lib/integrations/composio";
import { origin } from "@/lib/integrations/vault";

/** Composio sends the browser back here after sign-in, with status=success or failed. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const app = p.get("app");
  const back = returnPath(p.get("next"));
  if (!isAppId(app)) return NextResponse.redirect(`${origin(req)}${back}`);
  const ok = (p.get("status") ?? "success") === "success";
  return NextResponse.redirect(`${origin(req)}${back}?${ok ? `connected=${app}` : `error=${app}_failed`}`);
}
