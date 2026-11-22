import { NextResponse, type NextRequest } from "next/server";
import { composioConnect, viaComposio } from "@/lib/integrations/composio";
import { normaliseShop, SHOPIFY_SCOPES, shopifyConfigured } from "@/lib/integrations/shopify";
import { newState, origin } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  if (viaComposio("shopify")) return composioConnect(req, "shopify", origin(req));
  if (!shopifyConfigured()) return NextResponse.redirect(`${origin(req)}/integrations?error=shopify_not_configured`);
  const shop = normaliseShop(req.nextUrl.searchParams.get("shop") ?? "");
  if (!shop) return NextResponse.redirect(`${origin(req)}/integrations?error=shopify_shop`);
  const res = NextResponse.redirect(`https://${shop}`);
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.search = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY!,
    scope: SHOPIFY_SCOPES,
    redirect_uri: `${origin(req)}/api/integrations/shopify/callback`,
    state: newState(res, "shopify", shop),
  }).toString();
  res.headers.set("location", url.toString());
  return res;
}
