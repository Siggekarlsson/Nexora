import { NextResponse, type NextRequest } from "next/server";
import { composioConfigured, composioConnect } from "@/lib/integrations/composio";
import { DRIVE_SCOPES, driveConfigured } from "@/lib/integrations/drive";
import { newState, origin } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  if (composioConfigured()) return composioConnect(req, "drive", origin(req));
  if (!driveConfigured()) return NextResponse.redirect(`${origin(req)}/integrations?error=drive_not_configured`);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const res = NextResponse.redirect(url);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin(req)}/api/integrations/drive/callback`,
    response_type: "code",
    scope: DRIVE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: newState(res, "drive"),
  }).toString();
  res.headers.set("location", url.toString());
  return res;
}
