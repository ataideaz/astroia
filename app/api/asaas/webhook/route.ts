export const dynamic = "force-dynamic";

async function tokenMatches(received: string, expected: string) {
  const hash = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([hash(received), hash(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

function field(value: unknown) {
  return typeof value === "string" && value.length > 0 && value.length <= 255 ? value : null;
}

export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return Response.json({ error: "Webhook indisponível." }, { status: 503 });
  const received = request.headers.get("asaas-access-token") || "";
  if (received.length > 255 || !await tokenMatches(received, expected)) return Response.json({ error: "Não autorizado." }, { status: 401 });

  // Only read the payload after authenticating. Never persist payment/card tokens.
  let raw: string;
  try { raw = await request.text(); } catch { return Response.json({ error: "Corpo inválido." }, { status: 400 }); }
  if (raw.length > 65536) return Response.json({ error: "Corpo muito grande." }, { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !field(body.id) || !field(body.event)) return Response.json({ error: "Evento inválido." }, { status: 400 });
  if (body.event === "CHECKOUT_PAID") {
    const checkoutId = field(body.checkout?.id);
    if (!checkoutId) return Response.json({ error: "Checkout inválido." }, { status: 400 });
    try {
      const { syncAsaasCheckout } = await import("../../../../lib/asaas");
      const result = await syncAsaasCheckout(checkoutId);
      console.info("asaas_checkout_webhook_processed", { processingStatus: result });
      return Response.json({ received: true });
    } catch {
      console.error("asaas_checkout_webhook_failed");
      return Response.json({ error: "Tente novamente." }, { status: 503 });
    }
  }
  if (!body.event.startsWith("PAYMENT_")) return Response.json({ received: true, ignored: true });
  const payment = body.payment;
  if (!payment || !field(payment.id) || !field(payment.status) || typeof payment.value !== "number" || !Number.isFinite(payment.value) || payment.value < 0 || payment.value > 1000000000) return Response.json({ error: "Cobrança inválida." }, { status: 400 });
  try {
    const { env } = await import("cloudflare:workers");
    await env.DB.prepare(`INSERT INTO asaas_webhook_events
      (id, event, payment_id, customer_id, payment_link, external_reference, amount_cents, payment_status, processing_status, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_order_link', ?) ON CONFLICT(id) DO NOTHING`)
      .bind(body.id, body.event, payment.id, field(payment.customer), field(payment.paymentLink), field(payment.externalReference), Math.round(payment.value * 100), payment.status, Date.now()).run();
    const { syncAsaasPayment } = await import("../../../../lib/asaas");
    const result = await syncAsaasPayment(payment.id, field(payment.paymentLink) || undefined, field(payment.externalReference) || undefined);
    await env.DB.prepare("UPDATE asaas_webhook_events SET processing_status=? WHERE id=?").bind(result, body.id).run();
    console.info("asaas_webhook_processed", { event: body.event, processingStatus: result });
    return Response.json({ received: true });
  } catch {
    console.error("asaas_webhook_storage_failed");
    return Response.json({ error: "Tente novamente." }, { status: 503 });
  }
}
