import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, normaliseShop, validHmac } from "@/lib/integrations/shopify";
import { checkState, origin, writeConn } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const back = (q: string) => NextResponse.redirect(`${origin(req)}/integrations?${q}`);
  const shop = normaliseShop(p.get("shop") ?? "");
  const savedShop = checkState(req, "shopify", p.get("state"));
  if (!shop || savedShop !== shop || !validHmac(p)) return back("error=shopify_state");
  try {
    const conn = await exchangeCode(shop, p.get("code") ?? "");
    const res = back("connected=shopify");
    writeConn(res, "shopify", conn);
    return res;
  } catch {
    return back("error=shopify_failed");
  }
}
