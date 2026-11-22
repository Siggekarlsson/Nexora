import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/integrations/gmail";
import { checkState, origin, writeConn } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const back = (q: string) => NextResponse.redirect(`${origin(req)}/integrations?${q}`);
  if (p.get("error")) return back("error=gmail_denied");
  if (checkState(req, "gmail", p.get("state")) === null) return back("error=gmail_state");
  try {
    const conn = await exchangeCode(p.get("code") ?? "", `${origin(req)}/api/integrations/gmail/callback`);
    const res = back("connected=gmail");
    writeConn(res, "gmail", conn);
    return res;
  } catch {
    return back("error=gmail_failed");
  }
}
