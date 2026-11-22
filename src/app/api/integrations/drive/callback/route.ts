import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/integrations/drive";
import { checkState, origin, writeConn } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const back = (q: string) => NextResponse.redirect(`${origin(req)}/integrations?${q}`);
  if (p.get("error")) return back("error=drive_denied");
  if (checkState(req, "drive", p.get("state")) === null) return back("error=drive_state");
  try {
    const conn = await exchangeCode(p.get("code") ?? "", `${origin(req)}/api/integrations/drive/callback`);
    const res = back("connected=drive");
    writeConn(res, "drive", conn);
    return res;
  } catch {
    return back("error=drive_failed");
  }
}
