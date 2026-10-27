import { cleanAttribution } from "../../../lib/attribution";
import { limitRequest, markOfferStep } from "../../../lib/guest-reports";
import { recordSiteEvent } from "../../../lib/site-events";
export const dynamic = "force-dynamic";

// Recebe visita, "viu a oferta" e "abriu a compra" (uma vez por sessão). Mapas e checkouts são
// contados no servidor, onde não dá para inflar o número.
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 3000) return new Response(null, { status: 413 });
    const body = JSON.parse(raw) as { type?: string; attribution?: unknown; reportToken?: unknown; count?: boolean };
    // Passos do funil que só o navegador vê (uma vez por sessão cada).
    const type = body.type === "visit" || body.type === "offer_view" || body.type === "offer_open" || body.type === "exit_view" ? body.type : null;
    if (!type) return new Response(null, { status: 400 });
    await limitRequest(request, "track", 120);
    // Marca no mapa da pessoa (painel → Mapas grátis) que ela viu a oferta / abriu a compra.
    if (type !== "visit" && body.reportToken) await markOfferStep(body.reportToken, type);
    if (body.count !== false) await recordSiteEvent(type, cleanAttribution(body.attribution));
  } catch { /* estatística: ignora erros */ }
  return new Response(null, { status: 204 });
}
