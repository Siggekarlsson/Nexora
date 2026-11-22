import { NextResponse, type NextRequest } from "next/server";
import { gmailConfigured } from "@/lib/integrations/gmail";
import { driveConfigured } from "@/lib/integrations/drive";
import { shopifyConfigured } from "@/lib/integrations/shopify";
import { readConn } from "@/lib/integrations/vault";
import { ALL_APPS, appStatus, composioConfigured, describe, readUid, viaComposio, type AppId } from "@/lib/integrations/composio";

export async function GET(req: NextRequest) {
  const uid = readUid(req);
  const st =
    composioConfigured() && uid
      ? await appStatus(uid).catch((e) => {
          console.error("[composio] status failed:", describe(e));
          return null;
        })
      : null;
  const composio = (id: AppId) => ({ via: "composio", configured: true, connected: !!st?.[id]?.connected, account: null });

  const g = gmailConfigured() ? readConn(req, "gmail") : null;
  const d = driveConfigured() ? readConn(req, "drive") : null;
  const s = shopifyConfigured() ? readConn(req, "shopify") : null;
  const others = Object.fromEntries(
    ALL_APPS.filter((a) => a !== "gmail" && a !== "drive" && a !== "shopify").map((a) => [
      a,
      viaComposio(a) ? composio(a) : { via: "composio", configured: false, connected: false, account: null },
    ]),
  );
  return NextResponse.json({
    ...others,
    gmail: viaComposio("gmail") ? composio("gmail") : { via: "oauth", configured: gmailConfigured(), connected: !!g, account: g?.email ?? null },
    drive: viaComposio("drive") ? composio("drive") : { via: "oauth", configured: driveConfigured(), connected: !!d, account: d?.email ?? null },
    shopify: viaComposio("shopify")
      ? composio("shopify")
      : { via: "oauth", configured: shopifyConfigured(), connected: !!s, account: s ? s.name ?? s.shop : null },
  });
}
