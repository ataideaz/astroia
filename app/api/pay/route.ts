import { limitRequest, orderBelongsToReport } from "../../../lib/guest-reports";
export const dynamic = "force-dynamic";

// Recebe o formulário de pagamento do site (Pix ou cartão já protegido pelo
// Mercado Pago: o número do cartão nunca passa por aqui, só um token).
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 8000) throw new Error("Solicitação muito grande.");
    const body = JSON.parse(raw) as { reportToken?: string; orderId?: string; formData?: unknown };
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!orderId || !(await orderBelongsToReport(body.reportToken, orderId))) throw new Error("Pedido não encontrado neste mapa.");
    await limitRequest(request, "pay", 20);
    const { payDirectOrder } = await import("../../../lib/mercado-pago");
    const result = await payDirectOrder(orderId, (body.formData ?? {}) as Parameters<typeof payDirectOrder>[1]);
    if (result.pix) {
      const { recordSiteEvent } = await import("../../../lib/site-events");
      const { cleanAttribution } = await import("../../../lib/attribution");
      const { env } = await import("cloudflare:workers");
      const row = await env.DB.prepare("SELECT attribution_json FROM report_orders WHERE order_id = ?").bind(orderId).first<{ attribution_json: string | null }>();
      let attribution = null;
      try { attribution = row?.attribution_json ? cleanAttribution(JSON.parse(row.attribution_json).attribution) : null; } catch { attribution = null; }
      await recordSiteEvent("pix", attribution);
    }
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível processar o pagamento." }, { status: 400 });
  }
}
