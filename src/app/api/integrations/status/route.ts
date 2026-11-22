import { NextResponse, type NextRequest } from "next/server";
import { gmailConfigured } from "@/lib/integrations/gmail";
import { driveConfigured } from "@/lib/integrations/drive";
import { shopifyConfigured } from "@/lib/integrations/shopify";
import { readConn } from "@/lib/integrations/vault";
import { appStatus, composioConfigured, readUid } from "@/lib/integrations/composio";

export async function GET(req: NextRequest) {
  if (composioConfigured()) {
    const uid = readUid(req);
    const st = uid ? await appStatus(uid).catch(() => null) : null;
    const one = (id: "gmail" | "drive" | "shopify") => ({ configured: true, connected: !!st?.[id].connected, account: null });
    return NextResponse.json({ via: "composio", gmail: one("gmail"), drive: one("drive"), shopify: one("shopify") });
  }
  const g = gmailConfigured() ? readConn(req, "gmail") : null;
  const d = driveConfigured() ? readConn(req, "drive") : null;
  const s = shopifyConfigured() ? readConn(req, "shopify") : null;
  return NextResponse.json({
    via: "oauth",
    gmail: { configured: gmailConfigured(), connected: !!g, account: g?.email ?? null },
    drive: { configured: driveConfigured(), connected: !!d, account: d?.email ?? null },
    shopify: { configured: shopifyConfigured(), connected: !!s, account: s ? s.name ?? s.shop : null },
  });
}
