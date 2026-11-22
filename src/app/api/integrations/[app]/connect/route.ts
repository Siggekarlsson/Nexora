import { NextResponse, type NextRequest } from "next/server";
import { composioConnect, isAppId, viaComposio } from "@/lib/integrations/composio";
import { origin } from "@/lib/integrations/vault";

/** Connect for every app that goes through Composio (Gmail, Drive and Shopify have their own routes). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  if (isAppId(app) && viaComposio(app)) return composioConnect(req, app, origin(req));
  return NextResponse.redirect(`${origin(req)}/integrations?error=not_configured`);
}
