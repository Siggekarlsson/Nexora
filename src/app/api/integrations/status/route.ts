import { NextResponse, type NextRequest } from "next/server";
import { INTEGRATIONS } from "@/data/integrations";
import { gmailConfigured } from "@/lib/integrations/gmail";
import { driveConfigured } from "@/lib/integrations/drive";
import { readConn } from "@/lib/integrations/vault";
import { appStatus, composioConfigured, describe, readUid, toolkitLogos, viaComposio } from "@/lib/integrations/composio";

export type AppState = { connected: boolean; setup: boolean; account?: string | null };

/**
 * Connection state for every app on the Integrations page.
 * `connected` is only true for a live connection (Composio, or Nexora's own Google OAuth when Composio is off).
 * `setup` is true when the app can't be connected yet (no Composio toolkit, or it needs its own auth config).
 */
export async function GET(req: NextRequest) {
  const uid = readUid(req);
  const st =
    composioConfigured() && uid
      ? await appStatus(uid, { labels: true }).catch((e) => {
          console.error("[composio] status failed:", describe(e));
          return null;
        })
      : null;
  const logos = composioConfigured()
    ? await toolkitLogos().catch((e) => {
        console.error("[composio] logos failed:", describe(e));
        return {} as Record<string, string>;
      })
    : {};

  const g = !viaComposio("gmail") && gmailConfigured() ? readConn(req, "gmail") : null;
  const d = !viaComposio("drive") && driveConfigured() ? readConn(req, "drive") : null;
  const apps: Record<string, AppState> = {};
  for (const a of INTEGRATIONS) {
    if (a.category === "soon") continue;
    if (viaComposio(a.id)) apps[a.id] = { connected: !!st?.[a.id]?.connected, setup: false, account: st?.[a.id]?.account ?? null };
    else if (a.id === "gmail" && gmailConfigured()) apps[a.id] = { connected: !!g, setup: false, account: g?.email ?? null };
    else if (a.id === "drive" && driveConfigured()) apps[a.id] = { connected: !!d, setup: false, account: d?.email ?? null };
    else apps[a.id] = { connected: false, setup: true };
  }
  return NextResponse.json({ composio: composioConfigured(), apps, logos });
}
