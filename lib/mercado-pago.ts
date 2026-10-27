import { env } from "cloudflare:workers";
import { PRODUCTS, linePrices, orderTotal, type ProductId } from "./products";
import { readEnv } from "./runtime-env";

type PaymentOrder = {
  id: string;
  offer_mode: string;
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

function getAccessToken() {
  const token = readEnv("MERCADO_PAGO_ACCESS_TOKEN");
  if (!token) {
    throw new Error("O ambiente de pagamento ainda não está configurado.");
  }
  return token;
}

function getSiteUrl() {
  return (
    readEnv("ASTROIA_SITE_URL")?.replace(/\/$/, "") ||
    "https://meuastroia.com.br"
  );
}

function isTestMode() {
  const mode = readEnv("MERCADO_PAGO_MODE")?.trim().toLowerCase() || "";
  return !["production", "prod", "prd", "real", "live"].includes(mode);
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
  items: ProductId[];
  customerEmail?: unknown;
  personName?: unknown;
  reportToken?: string;
  exit?: boolean;
}) {
  if (!input.items.length) throw new Error("Escolha o que deseja comprar.");
  const lines = linePrices(input.items, undefined, Boolean(input.exit)).map(({ id, cents }) => ({ id, ...PRODUCTS[id], amountCents: cents }));
  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const orderId = `ast_${crypto.randomUUID()}`;
  const customerEmail = cleanEmail(input.customerEmail);
  const personName = cleanText(input.personName, 100);
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO payment_orders (
      id, offer_mode, amount_cents, currency, customer_email, person_name,
      theme_label, status, created_at, updated_at
    ) VALUES (?, ?, ?, 'BRL', ?, ?, ?, 'creating', ?, ?)`,
  )
    .bind(
      orderId,
      input.items.join("+"),
      totalCents,
      customerEmail || null,
      personName || null,
      lines.map((line) => line.title).join(" + ").slice(0, 80),
      now,
      now,
    )
    .run();

  const siteUrl = getSiteUrl();
  const returnUrl = `${siteUrl}/#report=${encodeURIComponent(input.reportToken || "")}&payment=success`;
  const response = await mercadoPagoFetch("/checkout/preferences", {
    method: "POST",
    headers: { "X-Idempotency-Key": orderId },
    body: JSON.stringify({
      items: lines.filter((line) => line.amountCents > 0).map((line) => ({
        id: line.id,
        title: line.title,
        description: line.description,
        category_id: "services",
        currency_id: "BRL",
        quantity: 1,
        unit_price: line.amountCents / 100,
      })),
      // No ambiente de teste, o comprador precisa ser identificado apenas pela
      // sessão do Buyer Test no Mercado Pago. Enviar aqui o e-mail real informado
      // no formulário mistura identidades reais e fictícias e bloqueia o checkout.
      ...(!isTestMode() && customerEmail ? { payer: { email: customerEmail } } : {}),
      external_reference: orderId,
      metadata: {
        astroia_order_id: orderId,
        items: input.items.join("+"),
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
  // Credenciais antigas de teste (TEST-...) usam o checkout de sandbox.
  // Credenciais das contas de teste atuais (APP_USR-...) usam o init_point normal;
  // usar o sandbox com elas causa o erro de "conta de teste com conta real".
  const legacyTestToken = getAccessToken().startsWith("TEST-");
  const checkoutUrl = legacyTestToken
    ? preference.sandbox_init_point || preference.init_point
    : preference.init_point;

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

  // Pedido já pago: uma tentativa antiga recusada (ex.: cartão antes do Pix)
  // não pode desfazer a aprovação. Reembolso do pagamento aprovado continua valendo.
  if (order.status === "approved" && status !== "approved" && order.provider_payment_id && order.provider_payment_id !== paymentId) {
    return { orderId: order.id, status: order.status, providerStatus: order.provider_status, approved: true };
  }
  await env.DB.prepare(
    `UPDATE payment_orders
     SET status = ?, provider_payment_id = ?, provider_status = ?,
         updated_at = ?, approved_at = CASE WHEN ? = 'approved' THEN ? ELSE approved_at END
     WHERE id = ?`,
  )
    .bind(status, paymentId, providerStatus, now, status, now, order.id)
    .run();

  if (status === "approved") {
    const { sendPurchaseToMeta } = await import("./meta-capi");
    await sendPurchaseToMeta(order.id);
  }

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

// ---------------------------------------------------------------------------
// Pagamento direto no site (Checkout Bricks): Pix e cartão sem sair do AstroIA
// e sem login no Mercado Pago.

export function directCheckoutEnabled() {
  return Boolean(readEnv("MERCADO_PAGO_PUBLIC_KEY") && readEnv("MERCADO_PAGO_ACCESS_TOKEN"));
}

export function mercadoPagoPublicKey() {
  return readEnv("MERCADO_PAGO_PUBLIC_KEY") || "";
}

/** Cria só o pedido no AstroIA (o pagamento é criado depois, pelo formulário no site). */
export async function createDirectOrder(input: { items: ProductId[]; customerEmail?: unknown; personName?: unknown; exit?: boolean }) {
  if (!input.items.length) throw new Error("Escolha o que deseja comprar.");
  const lines = linePrices(input.items, undefined, Boolean(input.exit)).map(({ id, cents }) => ({ id, ...PRODUCTS[id], amountCents: cents }));
  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const orderId = `ast_${crypto.randomUUID()}`;
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO payment_orders (
      id, offer_mode, amount_cents, currency, customer_email, person_name,
      theme_label, status, created_at, updated_at
    ) VALUES (?, ?, ?, 'BRL', ?, ?, ?, 'pending', ?, ?)`,
  ).bind(
    orderId, input.items.join("+"), totalCents,
    cleanEmail(input.customerEmail) || null, cleanText(input.personName, 100) || null,
    lines.map((line) => line.title).join(" + ").slice(0, 80), now, now,
  ).run();
  return { orderId, amountCents: totalCents };
}

type BrickFormData = {
  token?: unknown;
  issuer_id?: unknown;
  payment_method_id?: unknown;
  installments?: unknown;
  payer?: {
    email?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    identification?: { type?: unknown; number?: unknown };
  };
};

const REJECTION_TEXT: Record<string, string> = {
  cc_rejected_insufficient_amount: "O cartão não tem limite suficiente. Tente outro cartão ou pague com Pix.",
  cc_rejected_bad_filled_security_code: "O código de segurança (CVV) está incorreto. Confira e tente de novo.",
  cc_rejected_bad_filled_date: "A data de validade está incorreta. Confira e tente de novo.",
  cc_rejected_bad_filled_card_number: "O número do cartão está incorreto. Confira e tente de novo.",
  cc_rejected_bad_filled_other: "Algum dado do cartão está incorreto. Confira e tente de novo.",
  cc_rejected_call_for_authorize: "O banco pediu para você autorizar esta compra. Ligue para o banco ou use o Pix.",
  cc_rejected_card_disabled: "Este cartão está bloqueado para compras online. Ative no app do banco ou use o Pix.",
  cc_rejected_duplicated_payment: "Este pagamento já foi feito. Confira o seu mapa em instantes.",
  cc_rejected_high_risk: "O pagamento foi recusado por segurança. Tente com o Pix, que é aprovado na hora.",
  cc_rejected_max_attempts: "Muitas tentativas com este cartão. Use outro cartão ou o Pix.",
};

export function rejectionMessage(detail?: string) {
  return (detail && REJECTION_TEXT[detail]) || "O pagamento não foi aprovado. Tente outro cartão ou pague com Pix.";
}

/** Envia ao Mercado Pago o pagamento preenchido no site, sempre com o valor do servidor. */
export async function payDirectOrder(orderIdInput: unknown, formData: BrickFormData) {
  const orderId = cleanText(orderIdInput, 80);
  if (!/^ast_[0-9a-f-]{36}$/i.test(orderId)) throw new Error("Pedido inválido.");
  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.status === "approved") return { orderId, status: "approved", approved: true };

  const method = cleanText(formData.payment_method_id, 40);
  if (!/^[a-z_]{2,40}$/.test(method)) throw new Error("Escolha a forma de pagamento.");
  const isPix = method === "pix";
  const cardToken = cleanText(formData.token, 200);
  if (!isPix && !cardToken) throw new Error("Confira os dados do cartão.");

  const stored = await env.DB.prepare("SELECT customer_email, person_name FROM payment_orders WHERE id = ?")
    .bind(orderId).first<{ customer_email: string | null; person_name: string | null }>();
  const email = cleanEmail(formData.payer?.email) || stored?.customer_email || "";
  if (!email) throw new Error("Informe o seu e-mail.");
  const docType = cleanText(formData.payer?.identification?.type, 10).toUpperCase();
  const docNumber = cleanText(formData.payer?.identification?.number, 20).replace(/\D/g, "");
  const items = order.offer_mode.split("+") as ProductId[];
  const siteUrl = getSiteUrl();

  const body = {
    transaction_amount: order.amount_cents / 100,
    description: items.map((id) => PRODUCTS[id]?.title || id).join(" + ").slice(0, 120),
    payment_method_id: method,
    ...(isPix ? {} : {
      token: cardToken,
      installments: 1,
      ...(cleanText(String(formData.issuer_id ?? ""), 20) ? { issuer_id: cleanText(String(formData.issuer_id), 20) } : {}),
    }),
    payer: {
      email,
      ...(cleanText(formData.payer?.first_name, 60) ? { first_name: cleanText(formData.payer?.first_name, 60) } : {}),
      ...(cleanText(formData.payer?.last_name, 60) ? { last_name: cleanText(formData.payer?.last_name, 60) } : {}),
      ...(docType && docNumber ? { identification: { type: docType, number: docNumber } } : {}),
    },
    external_reference: orderId,
    notification_url: `${siteUrl}/api/mercado-pago/webhook`,
    statement_descriptor: "ASTROIA",
    metadata: { astroia_order_id: orderId, items: order.offer_mode },
    additional_info: {
      items: linePrices(items, undefined, order.amount_cents < orderTotal(items)).filter((line) => line.cents > 0).map(({ id, cents }) => ({
        id, title: PRODUCTS[id]?.title || id, category_id: "services", quantity: 1, unit_price: cents / 100,
      })),
    },
    ...(isPix ? { date_of_expiration: new Date(Date.now() + 30 * 60000).toISOString().replace("Z", "-00:00") } : {}),
  };

  const response = await fetch(`${MERCADO_PAGO_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      // Mesmo cartão (token) ou mesmo Pix do mesmo pedido: nunca cobra duas vezes.
      "X-Idempotency-Key": `${orderId}:${isPix ? `pix${Math.floor(Date.now() / 1800000)}` : cardToken.slice(-40)}`,
    },
    body: JSON.stringify(body),
  });
  const payment = (await response.json().catch(() => ({}))) as MercadoPagoPayment & {
    message?: string;
    point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
  };
  if (!response.ok || !payment.id) {
    console.warn("MP /v1/payments", response.status, JSON.stringify(payment).slice(0, 400));
    throw new Error(isPix
      ? "Não foi possível gerar o Pix agora. Confira o e-mail e tente de novo."
      : "O Mercado Pago não aceitou os dados do cartão. Confira e tente de novo, ou pague com Pix.");
  }

  await env.DB.prepare("UPDATE payment_orders SET customer_email = COALESCE(customer_email, ?) WHERE id = ?").bind(email, orderId).run();
  const result = await applyPaymentToOrder(order, payment);
  const pix = payment.point_of_interaction?.transaction_data;
  return {
    orderId,
    status: result.status,
    approved: result.approved,
    message: result.approved ? "" : payment.status === "rejected" ? rejectionMessage(payment.status_detail) : "",
    pix: isPix && pix?.qr_code ? { code: pix.qr_code, image: pix.qr_code_base64 || "", url: pix.ticket_url || "" } : null,
  };
}
