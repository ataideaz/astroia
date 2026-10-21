import { attachOrder, getGuestReport, limitRequest } from "../../../lib/guest-reports";
import { normalizedEmail } from "../../../lib/site-auth";
import { createAsaasCheckout, paymentsEnabled } from "../../../lib/asaas";
import { readEnv } from "../../../lib/runtime-env";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    if (!paymentsEnabled()) throw new Error("O pagamento está temporariamente desativado para testes.");
    const raw = await request.text();
    if (raw.length > 12000) throw new Error("Solicitação muito grande.");
    const body = JSON.parse(raw) as {reportToken: string; customerEmail: string};
    const email = normalizedEmail(body.customerEmail);
    if (!email) throw new Error("Informe um e-mail válido para identificar a compra.");
    const report = await getGuestReport(body.reportToken);
    if (report.reportTier === "premium") throw new Error("Este relatório já está liberado. Use seu link privado.");
    // Mesmo mapa, pagamento já criado no Mercado Pago: devolve o mesmo link
    // (não cria outro pedido e não conta no limite).
    if (report.orderId?.startsWith("ast_") && report.checkoutUrl?.startsWith("https://")) {
      return Response.json({orderId: report.orderId, checkoutUrl: report.checkoutUrl}, {headers:{"Cache-Control":"no-store"}});
    }
    await limitRequest(request, "checkout", 30);
    if (readEnv("MERCADO_PAGO_ACCESS_TOKEN")) {
      const { createPaymentPreference } = await import("../../../lib/mercado-pago");
      const checkout = await createPaymentPreference({
        offerMode: "individual",
        customerEmail: email,
        personName: report.analysis.person.fullName,
        themeLabel: "Mapa completo",
        reportToken: body.reportToken,
      });
      await attachOrder(body.reportToken, checkout.orderId, checkout.checkoutUrl);
      return Response.json(checkout, {headers:{"Cache-Control":"no-store"}});
    }
    const checkout = await createAsaasCheckout(body.reportToken, email, report.analysis.person.fullName);
    return Response.json(checkout, {headers:{"Cache-Control":"no-store"}});
  } catch(error) { return Response.json({error:error instanceof Error ? error.message : "Não foi possível iniciar a compra."}, {status:400}); }
}
