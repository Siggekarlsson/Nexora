import { NextResponse, type NextRequest } from "next/server";
import { clearConn, type IntegrationId } from "@/lib/integrations/vault";
import { composioConfigured, disconnect, readUid } from "@/lib/integrations/composio";

export async function POST(req: NextRequest) {
  const { id } = (await req.json()) as { id: IntegrationId };
  if (id !== "gmail" && id !== "drive" && id !== "shopify") return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  clearConn(res, id);
  const uid = readUid(req);
  if (composioConfigured() && uid) {
    try {
      await disconnect(uid, id);
    } catch {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  }
  return res;
}
