import { cleanAttribution } from "../../../lib/attribution";
import { limitRequest } from "../../../lib/guest-reports";
import { recordSiteEvent } from "../../../lib/site-events";
export const dynamic = "force-dynamic";

// Recebe visita, "viu a oferta" e "abriu a compra" (uma vez por sessão). Mapas e checkouts são
// contados no servidor, onde não dá para inflar o número.
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 3000) return new Response(null, { status: 413 });
    const body = JSON.parse(raw) as { type?: string; attribution?: unknown };
    // Passos do funil que só o navegador vê (uma vez por sessão cada).
    const type = body.type === "visit" || body.type === "offer_view" || body.type === "offer_open" ? body.type : null;
    if (!type) return new Response(null, { status: 400 });
    await limitRequest(request, "track", 120);
    await recordSiteEvent(type, cleanAttribution(body.attribution));
  } catch { /* estatística: ignora erros */ }
  return new Response(null, { status: 204 });
}
