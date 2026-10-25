import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const marketingLeads = sqliteTable(
  "marketing_leads",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    marketingConsent: integer("marketing_consent", {
      mode: "boolean",
    })
      .notNull(),
    consentVersion: text("consent_version").notNull(),
    source: text("source").notNull(),
    selectedTheme: text("selected_theme"),
    consentedAt: integer("consented_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    /** Marcado no painel como e-mail de teste. */
    excludedAt: integer("excluded_at"),
  },
);

export const marketingSuppressions = sqliteTable(
  "marketing_suppressions",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    reason: text("reason").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
);

export const privacyRequests = sqliteTable("privacy_requests", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  requestType: text("request_type").notNull(),
  details: text("details"),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const paymentOrders = sqliteTable(
  "payment_orders",
  {
    id: text("id").primaryKey(),
    offerMode: text("offer_mode").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    customerEmail: text("customer_email"),
    personName: text("person_name"),
    themeLabel: text("theme_label"),
    status: text("status").notNull(),
    providerPreferenceId: text("provider_preference_id").unique(),
    providerPaymentId: text("provider_payment_id").unique(),
    providerStatus: text("provider_status"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
    /** Marcado no painel como compra de teste: some das contas do painel. */
    excludedAt: integer("excluded_at"),
  },
);

export const astroAccounts = sqliteTable("astro_accounts", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const astroLoginTokens = sqliteTable("astro_login_tokens", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const astroSessions = sqliteTable("astro_sessions", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  secretHash: text("secret_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const astroMaps = sqliteTable("astro_maps", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  fingerprint: text("fingerprint").notNull(),
  reportTier: text("report_tier").notNull(),
  analysisJson: text("analysis_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const guestReports = sqliteTable("guest_reports", {
 tokenHash: text("token_hash").primaryKey(),
 requestJson: text("request_json").notNull(),
 analysisJson: text("analysis_json").notNull(),
 orderId: text("order_id"),
 checkoutUrl: text("checkout_url"),
 compatJson: text("compat_json"),
 attributionJson: text("attribution_json"),
 geo: text("geo"),
 /** Quando a pessoa viu a oferta / abriu a tela de compra deste mapa (painel). */
 offerViewedAt: integer("offer_viewed_at"),
 offerOpenedAt: integer("offer_opened_at"),
 /** Marcado no painel como mapa de teste. */
 excludedAt: integer("excluded_at"),
 createdAt: integer("created_at").notNull(),
});
// Cada pedido ligado a um mapa, com os produtos comprados (ex.: ["map","compat"]).
export const reportOrders = sqliteTable("report_orders", {
 orderId: text("order_id").primaryKey(),
 tokenHash: text("token_hash").notNull(),
 items: text("items").notNull(),
 checkoutUrl: text("checkout_url"),
 attributionJson: text("attribution_json"),
 capiSentAt: integer("capi_sent_at"),
 createdAt: integer("created_at").notNull(),
});
// Contagem anônima do funil (visitas, mapas, checkouts) por dia e origem.
export const siteEvents = sqliteTable("site_events", {
 id: integer("id").primaryKey({ autoIncrement: true }),
 day: text("day").notNull(),
 type: text("type").notNull(),
 source: text("source").notNull(),
 campaign: text("campaign"),
 ad: text("ad"),
 createdAt: integer("created_at").notNull(),
});
export const guestLimits = sqliteTable("guest_limits", {
 id: text("id").primaryKey(), count: integer("count").notNull(), expiresAt: integer("expires_at").notNull(),
});

// Minimal durable inbox. Events are not proof of ownership of a guest report.
export const asaasWebhookEvents = sqliteTable("asaas_webhook_events", {
 id: text("id").primaryKey(),
 event: text("event").notNull(),
 paymentId: text("payment_id").notNull(),
 customerId: text("customer_id"),
 paymentLink: text("payment_link"),
 externalReference: text("external_reference"),
 amountCents: integer("amount_cents").notNull(),
 paymentStatus: text("payment_status").notNull(),
 processingStatus: text("processing_status").notNull(),
 receivedAt: integer("received_at").notNull(),
});
