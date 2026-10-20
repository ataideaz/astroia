import { env } from "cloudflare:workers";

export type PaymentOfferMode = "individual" | "additional";

type PaymentOrder = {
  id: string;
  offer_mode: PaymentOfferMode;
  amount_cents: number;
  currency: string;
  status: string;
  provider_preference_id: string | null;
  provider_payment_id: string | null;
  provider_status: string | null;
};

type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string;
};

const MERCADO_PAGO_API = "https://api.mercadopago.com";

export const paymentOffers: Record<
  PaymentOfferMode,
  { title: string; description: string; amountCents: number }
> = {
  individual: {
    title: "AstroIA Premium",
    description: "Um mapa completo com os cinco temas",
    amountCents: 3790,
  },
  additional: {
    title: "Novo Mapa Premium",
    description: "Um perfil adicional com resultado separado",
    amountCents: 3790,
  },
};

function getAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("O ambiente de pagamento ainda não está configurado.");
  }
  return token;
}

function getSiteUrl() {
  return (
    process.env.ASTROIA_SITE_URL?.trim().replace(/\/$/, "") ||
    "https://meuastroia.com.br"
  );
}

function isTestMode() {
  return process.env.MERCADO_PAGO_MODE?.trim().toLowerCase() !== "production";
}

function isOfferMode(value: unknown): value is PaymentOfferMode {
  return value === "individual" || value === "additional";
}

function cleanText(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function cleanEmail(value: unknown) {
  const email = cleanText(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function mercadoPagoFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? "A credencial do Mercado Pago não foi aceita."
        : "O Mercado Pago não conseguiu preparar o pagamento.",
    );
  }

  return response;
}

export async function createPaymentPreference(input: {
  offerMode?: unknown;
  customerEmail?: unknown;
  personName?: unknown;
  themeLabel?: unknown;
  reportToken?: string;
}) {
  if (!isOfferMode(input.offerMode)) {
    throw new Error("O plano selecionado não é válido.");
  }


  const offer = paymentOffers[input.offerMode];
  const orderId = `ast_${crypto.randomUUID()}`;
  const customerEmail = cleanEmail(input.customerEmail);
  const personName = cleanText(input.personName, 100);
  const themeLabel = cleanText(input.themeLabel, 80);
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO payment_orders (
      id, offer_mode, amount_cents, currency, customer_email, person_name,
      theme_label, status, created_at, updated_at
    ) VALUES (?, ?, ?, 'BRL', ?, ?, ?, 'creating', ?, ?)`,
  )
    .bind(
      orderId,
      input.offerMode,
      offer.amountCents,
      customerEmail || null,
      personName || null,
      themeLabel || null,
      now,
      now,
    )
    .run();

  const siteUrl = getSiteUrl();
  const returnUrl = `${siteUrl}/#report=${encodeURIComponent(input.reportToken || "")}`;
  const response = await mercadoPagoFetch("/checkout/preferences", {
    method: "POST",
    headers: { "X-Idempotency-Key": orderId },
    body: JSON.stringify({
      items: [
        {
          id: input.offerMode,
          title: offer.title,
          description: offer.description,
          category_id: "services",
          currency_id: "BRL",
          quantity: 1,
          unit_price: offer.amountCents / 100,
        },
      ],
      // No ambiente de teste, o comprador precisa ser identificado apenas pela
      // sessão do Buyer Test no Mercado Pago. Enviar aqui o e-mail real informado
      // no formulário mistura identidades reais e fictícias e bloqueia o checkout.
      ...(!isTestMode() && customerEmail ? { payer: { email: customerEmail } } : {}),
      external_reference: orderId,
      metadata: {
        astroia_order_id: orderId,
        offer_mode: input.offerMode,
      },
      back_urls: {
        success: returnUrl,
        pending: returnUrl,
        failure: returnUrl,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/mercado-pago/webhook`,
      statement_descriptor: "ASTROIA",
    }),
  });

  const preference = (await response.json()) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
  };
  const checkoutUrl = isTestMode() ? preference.sandbox_init_point || preference.init_point : preference.init_point;

  if (!preference.id || !checkoutUrl) {
    throw new Error("O Mercado Pago não retornou o checkout.");
  }

  await env.DB.prepare(
    `UPDATE payment_orders
     SET status = 'pending', provider_preference_id = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(preference.id, Date.now(), orderId)
    .run();

  return { orderId, checkoutUrl };
}

async function getOrder(orderId: string) {
  return env.DB.prepare(
    `SELECT id, offer_mode, amount_cents, currency, status,
            provider_preference_id, provider_payment_id, provider_status
     FROM payment_orders WHERE id = ?`,
  )
    .bind(orderId)
    .first<PaymentOrder>();
}

async function getPayment(paymentId: string) {
  const response = await mercadoPagoFetch(
    `/v1/payments/${encodeURIComponent(paymentId)}`,
  );
  return (await response.json()) as MercadoPagoPayment;
}

async function applyPaymentToOrder(order: PaymentOrder, payment: MercadoPagoPayment) {
  const paymentId = String(payment.id ?? "");
  const amountCents = Math.round(Number(payment.transaction_amount ?? -1) * 100);
  const providerStatus = cleanText(payment.status, 40) || "unknown";

  if (
    !paymentId ||
    payment.external_reference !== order.id ||
    amountCents !== order.amount_cents ||
    payment.currency_id !== order.currency
  ) {
    throw new Error("O pagamento recebido não corresponde ao pedido do AstroIA.");
  }

  const status = providerStatus === "approved" ? "approved" : providerStatus;
  const now = Date.now();
  await env.DB.prepare(
    `UPDATE payment_orders
     SET status = ?, provider_payment_id = ?, provider_status = ?,
         updated_at = ?, approved_at = CASE WHEN ? = 'approved' THEN ? ELSE approved_at END
     WHERE id = ?`,
  )
    .bind(status, paymentId, providerStatus, now, status, now, order.id)
    .run();

  return {
    orderId: order.id,
    status,
    providerStatus,
    approved: status === "approved",
  };
}

export async function syncPaymentById(paymentId: string) {
  const payment = await getPayment(paymentId);
  const orderId = cleanText(payment.external_reference, 80);
  if (!orderId) throw new Error("Pagamento sem referência do pedido.");
  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido não encontrado.");
  return applyPaymentToOrder(order, payment);
}

export async function refreshPaymentOrder(orderIdInput: unknown) {
  const orderId = cleanText(orderIdInput, 80);
  if (!/^ast_[0-9a-f-]{36}$/i.test(orderId)) {
    throw new Error("Pedido inválido.");
  }

  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido não encontrado.");

  if (order.status === "approved") {
    return {
      orderId: order.id,
      status: order.status,
      providerStatus: order.provider_status,
      approved: true,
    };
  }

  if (order.provider_payment_id) {
    return applyPaymentToOrder(order, await getPayment(order.provider_payment_id));
  }

  const response = await mercadoPagoFetch(
    `/v1/payments/search?external_reference=${encodeURIComponent(order.id)}&sort=date_created&criteria=desc`,
  );
  const search = (await response.json()) as { results?: MercadoPagoPayment[] };
  const payment = search.results?.[0];
  if (payment?.id) return applyPaymentToOrder(order, payment);

  return {
    orderId: order.id,
    status: order.status,
    providerStatus: order.provider_status,
    approved: false,
  };
}
