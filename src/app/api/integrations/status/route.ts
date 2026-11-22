import { NextResponse, type NextRequest } from "next/server";
import { gmailConfigured } from "@/lib/integrations/gmail";
import { driveConfigured } from "@/lib/integrations/drive";
import { shopifyConfigured } from "@/lib/integrations/shopify";
import { readConn } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  const g = gmailConfigured() ? readConn(req, "gmail") : null;
  const d = driveConfigured() ? readConn(req, "drive") : null;
  const s = shopifyConfigured() ? readConn(req, "shopify") : null;
  return NextResponse.json({
    gmail: { configured: gmailConfigured(), connected: !!g, account: g?.email ?? null },
    drive: { configured: driveConfigured(), connected: !!d, account: d?.email ?? null },
    shopify: { configured: shopifyConfigured(), connected: !!s, account: s ? s.name ?? s.shop : null },
  });
}
