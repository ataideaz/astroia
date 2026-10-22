import { attachOrder, findOpenOrder, getGuestReport, limitRequest } from "../../../lib/guest-reports";
import { normalizedEmail } from "../../../lib/site-auth";
import { createAsaasCheckout, paymentsEnabled } from "../../../lib/asaas";
import { cleanItems } from "../../../lib/products";
import { readEnv } from "../../../lib/runtime-env";
import { cleanAdSignals, cleanAttribution } from "../../../lib/attribution";
import { recordSiteEvent } from "../../../lib/site-events";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    if (!paymentsEnabled()) throw new Error("O pagamento está temporariamente desativado para testes.");
    const raw = await request.text();
    if (raw.length > 12000) throw new Error("Solicitação muito grande.");
    const body = JSON.parse(raw) as {reportToken: string; customerEmail: string; items?: unknown; attribution?: unknown; ad?: unknown};
    const email = normalizedEmail(body.customerEmail);
    if (!email) throw new Error("Informe um e-mail válido para identificar a compra.");
    const report = await getGuestReport(body.reportToken);

    // O que ainda falta comprar neste mapa (nunca cobra duas vezes a mesma coisa).
    const wanted = cleanItems(body.items ?? ["map"]);
    const items = wanted.filter((item) => !report.products[item]);
    if (!items.length) throw new Error("Isso já está liberado neste mapa. Use o seu link privado.");
    if (items.includes("compat") && !items.includes("map") && !report.products.map) {
      throw new Error("A compatibilidade é liberada junto com o mapa completo.");
    }
    if (items.includes("compat") && report.analysis.person.isMinor) {
      throw new Error("A compatibilidade de casal é só para maiores de 18 anos.");
    }
    if (items.includes("name") && report.analysis.person.isMinor) {
      throw new Error("A numerologia do nome é só para maiores de 18 anos.");
    }

    // Mesmo mapa e mesmos produtos, com pagamento já criado: devolve o mesmo link
    // (não cria outro pedido e não conta no limite).
    const open = await findOpenOrder(body.reportToken, items);
    if (open?.checkout_url) {
      return Response.json({orderId: open.order_id, checkoutUrl: open.checkout_url, items}, {headers:{"Cache-Control":"no-store"}});
    }
    await limitRequest(request, "checkout", 30);
    if (readEnv("MERCADO_PAGO_ACCESS_TOKEN")) {
      const { createPaymentPreference } = await import("../../../lib/mercado-pago");
      const checkout = await createPaymentPreference({
        items,
        customerEmail: email,
        personName: report.analysis.person.fullName,
        reportToken: body.reportToken,
      });
      const signals = cleanAdSignals(body.ad);
      const attribution = cleanAttribution(body.attribution);
      await attachOrder(body.reportToken, checkout.orderId, checkout.checkoutUrl, items, {
        attribution: Object.keys(attribution).some((key) => attribution[key as keyof typeof attribution] !== undefined) ? attribution : null,
        signals,
        ip: request.headers.get("cf-connecting-ip") || undefined,
        userAgent: request.headers.get("user-agent")?.slice(0, 400) || undefined,
      });
      await recordSiteEvent("checkout", attribution);
      return Response.json({...checkout, items}, {headers:{"Cache-Control":"no-store"}});
    }
    if (items.some((item) => item !== "map")) throw new Error("Este produto ainda não está disponível neste meio de pagamento.");
    const checkout = await createAsaasCheckout(body.reportToken, email, report.analysis.person.fullName);
    return Response.json({...checkout, items}, {headers:{"Cache-Control":"no-store"}});
  } catch(error) { return Response.json({error:error instanceof Error ? error.message : "Não foi possível iniciar a compra."}, {status:400}); }
}
