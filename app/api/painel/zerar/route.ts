import { env } from "cloudflare:workers";
import { checkAdmin } from "../../../../lib/admin-auth";
export const dynamic = "force-dynamic";

// Zera as contagens anônimas do funil (viu a oferta, abriu a compra, clicou em
// pagar, Pix gerado) registradas até agora. Usado depois de testes. Visitas,
// mapas e vendas não são tocados.
const TYPES = ["offer_view", "offer_open", "checkout", "pix"];

export async function POST(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const result = await env.DB.prepare(
    `DELETE FROM site_events WHERE type IN (${TYPES.map(() => "?").join(",")}) AND created_at <= ?`,
  ).bind(...TYPES, Date.now()).run();
  return Response.json({ ok: true, removed: result.meta?.changes ?? 0 });
}
