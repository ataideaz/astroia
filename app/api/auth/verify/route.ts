import { NextResponse } from "next/server";
import { redeemLoginToken, setSiteSession } from "../../../../lib/site-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const session = await redeemLoginToken(token);
  if (!session) return NextResponse.redirect(new URL("/?login=invalid", request.url));
  await setSiteSession(session.value, session.expiresAt);
  return NextResponse.redirect(new URL("/?login=ok#criar", request.url));
}
