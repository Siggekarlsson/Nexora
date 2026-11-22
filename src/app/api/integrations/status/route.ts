import { NextResponse, type NextRequest } from "next/server";
import { gmailConfigured } from "@/lib/integrations/gmail";
import { shopifyConfigured } from "@/lib/integrations/shopify";
import { readConn } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  const g = gmailConfigured() ? readConn(req, "gmail") : null;
  const s = shopifyConfigured() ? readConn(req, "shopify") : null;
  return NextResponse.json({
    gmail: { configured: gmailConfigured(), connected: !!g, account: g?.email ?? null },
    shopify: { configured: shopifyConfigured(), connected: !!s, account: s ? s.name ?? s.shop : null },
  });
}
