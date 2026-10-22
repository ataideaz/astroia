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
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível processar o pagamento." }, { status: 400 });
  }
}
