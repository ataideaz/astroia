import { cleanAttribution } from "../../../lib/attribution";
import { limitRequest } from "../../../lib/guest-reports";
import { recordSiteEvent } from "../../../lib/site-events";
export const dynamic = "force-dynamic";

// Recebe só a visita (uma por sessão do navegador). Mapas e checkouts são
// contados no servidor, onde não dá para inflar o número.
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 3000) return new Response(null, { status: 413 });
    const body = JSON.parse(raw) as { type?: string; attribution?: unknown };
    if (body.type !== "visit") return new Response(null, { status: 400 });
    await limitRequest(request, "track", 120);
    await recordSiteEvent("visit", cleanAttribution(body.attribution));
  } catch { /* estatística: ignora erros */ }
  return new Response(null, { status: 204 });
}
