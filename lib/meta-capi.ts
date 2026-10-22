// API de Conversões da Meta: avisa a compra pelo servidor (não depende do
// navegador, nem de bloqueador, nem do iPhone). Só envia quem aceitou cookies.
import { env } from "cloudflare:workers";
import { readEnv } from "./runtime-env";
import type { OrderAdData } from "./guest-reports";

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function metaConfigured() {
  return Boolean(readEnv("META_PIXEL_ID") && readEnv("META_CAPI_TOKEN"));
}

/** Envia o evento Purchase uma única vez por pedido. Nunca lança erro. */
export async function sendPurchaseToMeta(orderId: string) {
  try {
    const pixelId = readEnv("META_PIXEL_ID");
    const token = readEnv("META_CAPI_TOKEN");
    if (!pixelId || !token || !/^\d{5,20}$/.test(pixelId)) return;

    const row = await env.DB.prepare(
      `SELECT ro.attribution_json, po.customer_email, po.amount_cents, po.offer_mode
       FROM report_orders ro JOIN payment_orders po ON po.id = ro.order_id
       WHERE ro.order_id = ? AND po.status = 'approved' AND ro.capi_sent_at IS NULL`,
    ).bind(orderId).first<{ attribution_json: string | null; customer_email: string | null; amount_cents: number; offer_mode: string }>();
    if (!row?.attribution_json) return;
    const ad = JSON.parse(row.attribution_json) as OrderAdData;
    if (!ad.signals?.consent) return;

    // Marca antes de enviar: duas notificações ao mesmo tempo não duplicam o evento.
    const claim = await env.DB.prepare("UPDATE report_orders SET capi_sent_at = ? WHERE order_id = ? AND capi_sent_at IS NULL")
      .bind(Date.now(), orderId).run();
    if (!(claim.meta?.changes ?? 0)) return;

    const site = (readEnv("ASTROIA_SITE_URL") || "https://meuastroia.com.br").replace(/\/+$/, "");
    const email = row.customer_email?.trim().toLowerCase();
    const items = row.offer_mode.split("+").filter(Boolean);
    const event = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: orderId, // o mesmo ID do Pixel no navegador: a Meta conta uma vez só
      action_source: "website",
      event_source_url: `${site}/`,
      user_data: {
        ...(email ? { em: [await sha256(email)] } : {}),
        ...(ad.ip ? { client_ip_address: ad.ip } : {}),
        ...(ad.userAgent ? { client_user_agent: ad.userAgent } : {}),
        ...(ad.signals.fbp ? { fbp: ad.signals.fbp } : {}),
        ...(ad.signals.fbc ? { fbc: ad.signals.fbc } : {}),
        country: [await sha256("br")],
      },
      custom_data: {
        currency: "BRL",
        value: row.amount_cents / 100,
        content_ids: items,
        content_type: "product",
        num_items: items.length,
      },
    };
    const version = readEnv("META_GRAPH_VERSION") || "v26.0";
    const testCode = readEnv("META_TEST_EVENT_CODE");
    const response = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event], ...(testCode ? { test_event_code: testCode } : {}) }),
    });
    if (!response.ok) {
      // Libera para tentar de novo na próxima confirmação do pagamento.
      await env.DB.prepare("UPDATE report_orders SET capi_sent_at = NULL WHERE order_id = ?").bind(orderId).run();
      console.warn("Meta CAPI", response.status, (await response.text()).slice(0, 300));
      return;
    }
    // Depois de enviado, IP e navegador não são mais necessários.
    await env.DB.prepare("UPDATE report_orders SET attribution_json = ? WHERE order_id = ?")
      .bind(JSON.stringify({ attribution: ad.attribution, signals: { consent: true } }), orderId).run();
  } catch (error) {
    console.warn("Meta CAPI falhou", error instanceof Error ? error.message : error);
  }
}
