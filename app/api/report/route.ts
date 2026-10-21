import { getGuestReport, limitRequest } from "../../../lib/guest-reports";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await request.json() as {token?: string; refresh?: boolean};
    let report = await getGuestReport(body.token);
    if (body.refresh && report.pendingOrderIds.length) {
      await limitRequest(request, "payment-check", 120);
      for (const orderId of report.pendingOrderIds) {
        try {
          if (orderId.startsWith("asaas_")) {
            const { refreshAsaasOrder } = await import("../../../lib/asaas");
            await refreshAsaasOrder(orderId);
          } else {
            const { refreshPaymentOrder } = await import("../../../lib/mercado-pago");
            await refreshPaymentOrder(orderId);
          }
        } catch { /* Um pedido com problema não impede de consultar os outros. */ }
      }
      report = await getGuestReport(body.token);
    }
    const { pendingOrderIds: _ignored, ...publicReport } = report;
    return Response.json(publicReport, {headers:{"Cache-Control":"no-store", "Referrer-Policy":"no-referrer"}});
  } catch(error) { return Response.json({error:error instanceof Error ? error.message : "Link inválido."}, {status:400}); }
}
