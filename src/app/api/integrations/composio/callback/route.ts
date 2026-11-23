import { NextResponse, type NextRequest } from "next/server";
import { accountIsActive, describe, isAppId, readUid, returnPath } from "@/lib/integrations/composio";
import { origin } from "@/lib/integrations/vault";

/**
 * Composio sends the browser back here after sign-in, with status=success or failed and the connected account id.
 * Only says "connected" once Composio reports the account as ACTIVE.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const app = p.get("app");
  const back = returnPath(p.get("next"));
  if (!isAppId(app)) return NextResponse.redirect(`${origin(req)}${back}`);
  const uid = readUid(req);
  let ok = (p.get("status") ?? "success") === "success" && !!uid;
  if (ok && uid) {
    try {
      ok = await accountIsActive(uid, app, p.get("connected_account_id") ?? p.get("connectedAccountId"));
    } catch (e) {
      console.error(`[composio] callback check ${app} failed:`, describe(e));
      ok = false;
    }
  }
  return NextResponse.redirect(`${origin(req)}${back}?${ok ? `connected=${app}` : `error=${app}_failed`}`);
}
