import { NextResponse } from "next/server";
import { composioConfigured, describe, toolkitLogos } from "@/lib/integrations/composio";

/** Logo URLs Composio returns for each toolkit, keyed by app id. Empty when Composio is not configured. */
export async function GET() {
  if (!composioConfigured()) return NextResponse.json({});
  try {
    return NextResponse.json(await toolkitLogos(), { headers: { "cache-control": "public, max-age=3600" } });
  } catch (e) {
    console.error("[composio] logos failed:", describe(e));
    return NextResponse.json({});
  }
}
