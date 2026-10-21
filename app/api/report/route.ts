import { getGuestReport, limitRequest } from "../../../lib/guest-reports";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await request.json() as {token?: string; refresh?: boolean};
    let report = await getGuestReport(body.token);
    if (body.refresh && report.orderId) {
      await limitRequest(request, "payment-check", 120);
      if (report.orderId.startsWith("asaas_")) {
        const { refreshAsaasOrder } = await import("../../../lib/asaas");
        await refreshAsaasOrder(report.orderId);
      } else {
        const { refreshPaymentOrder } = await import("../../../lib/mercado-pago");
        await refreshPaymentOrder(report.orderId);
      }
      report = await getGuestReport(body.token);
    }
    return Response.json(report, {headers:{"Cache-Control":"no-store", "Referrer-Policy":"no-referrer"}});
  } catch(error) { return Response.json({error:error instanceof Error ? error.message : "Link inválido."}, {status:400}); }
}
