import { NextResponse } from "next/server";
import { getSiteAccount } from "../../../lib/site-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSiteAccount();
  if (!user) {
    return NextResponse.json({ error: "Entre com seu e-mail para continuar." }, { status: 401 });
  }

  return NextResponse.json({ email: user.email, name: user.email.split("@")[0] });
}
