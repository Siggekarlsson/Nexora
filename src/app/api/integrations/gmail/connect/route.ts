import { NextResponse, type NextRequest } from "next/server";
import { composioConnect, viaComposio } from "@/lib/integrations/composio";
import { GMAIL_SCOPES, gmailConfigured } from "@/lib/integrations/gmail";
import { newState, origin } from "@/lib/integrations/vault";

export async function GET(req: NextRequest) {
  if (viaComposio("gmail")) return composioConnect(req, "gmail", origin(req));
  if (!gmailConfigured()) return NextResponse.redirect(`${origin(req)}/integrations?error=gmail_not_configured`);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const res = NextResponse.redirect(url);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin(req)}/api/integrations/gmail/callback`,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: newState(res, "gmail"),
  }).toString();
  res.headers.set("location", url.toString());
  return res;
}
