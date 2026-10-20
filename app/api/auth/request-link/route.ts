import { NextResponse } from "next/server";
import { createLoginToken, normalizedEmail } from "../../../../lib/site-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const address = normalizedEmail(email);
    if (!address) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.ASTROIA_EMAIL_FROM?.trim();
    if (!apiKey || !from) return NextResponse.json({ error: "O acesso por e-mail ainda não está configurado. Tente novamente em instantes." }, { status: 503 });
    const token = await createLoginToken(address);
    const site = (process.env.ASTROIA_SITE_URL || "https://meuastroia.com.br").replace(/\/+$/, "");
    const link = `${site}/api/auth/verify?token=${encodeURIComponent(token)}`;
    const sent = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [address], subject: "Entre no seu AstroIA", html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Seu acesso ao AstroIA</h1><p>Use o botão abaixo para entrar e consultar seus mapas.</p><p><a href="${link}" style="display:inline-block;background:#5b347c;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Entrar no AstroIA</a></p><p>Este link é pessoal e vale por 15 minutos.</p></div>`, text: `Entre no AstroIA: ${link}\n\nEste link é pessoal e vale por 15 minutos.` }) });
    if (!sent.ok) return NextResponse.json({ error: "Não foi possível enviar o link agora. Tente novamente." }, { status: 502 });
    return NextResponse.json({ message: "Enviamos um link de acesso para seu e-mail." });
  } catch { return NextResponse.json({ error: "Não foi possível solicitar o acesso agora." }, { status: 400 }); }
}
