import { NextResponse, type NextRequest } from "next/server";
import { clearConn, type IntegrationId } from "@/lib/integrations/vault";

export async function POST(req: NextRequest) {
  const { id } = (await req.json()) as { id: IntegrationId };
  const res = NextResponse.json({ ok: true });
  if (id === "gmail" || id === "drive" || id === "shopify") clearConn(res, id);
  return res;
}
