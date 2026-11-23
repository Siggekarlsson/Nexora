import { NextResponse, type NextRequest } from "next/server";
import { clearConn, type IntegrationId } from "@/lib/integrations/vault";
import { disconnect, isAppId, readUid, viaComposio } from "@/lib/integrations/composio";

export async function POST(req: NextRequest) {
  const { id } = (await req.json()) as { id: unknown };
  if (!isAppId(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  if (id === "gmail" || id === "drive") clearConn(res, id as IntegrationId);
  const uid = readUid(req);
  if (viaComposio(id) && uid) {
    try {
      await disconnect(uid, id);
    } catch {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  }
  return res;
}
