async function database() { return (await import("cloudflare:workers")).env.DB; }
async function digest(value: string) {
 const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
 return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}
import { createAstroAnalysis, type AnalyzeRequest, type AnalysisResult } from "./astro-analysis";
import { buildCompatibility, type CompatPerson, type CompatResult } from "./compatibility";
import { paymentsEnabled } from "./asaas";
import { parseItems, type ProductId } from "./products";
import { buildNameReading } from "./name-numerology";
import type { AdSignals, Attribution } from "./attribution";

export async function limitRequest(request: Request, scope: string, limit: number) {
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const bucket = Math.floor(Date.now() / 3600000);
  const key = await digest(`${scope}:${ip}:${bucket}`);
  const result = await (await database()).prepare(`INSERT INTO guest_limits (id, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`)
    .bind(key, Date.now() + 7200000, limit).first();
  if (!result) throw new Error("Muitas tentativas seguidas desta conexão. Aguarde alguns minutos e tente de novo.");
  await (await database()).prepare("DELETE FROM guest_limits WHERE expires_at < ?").bind(Date.now()).run();
}
export async function createGuestReport(input: AnalyzeRequest, allowUnpaidPremium = false, attribution: Attribution | null = null, geo: string | null = null) {
  const reportTier = allowUnpaidPremium && input.reportTier === "premium" ? "premium" : "free";
  const request = { ...input, theme: "personalidade", reportTier };
  const full = await createAstroAnalysis(request);
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
  await (await database()).prepare("INSERT INTO guest_reports (token_hash, request_json, analysis_json, attribution_json, geo, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(await digest(token), JSON.stringify(request), JSON.stringify(full), attribution ? JSON.stringify(attribution) : null, geo, Date.now()).run();
  return { ...(reportTier === "premium" ? full : preview(full)), reportToken: token };
}
function premiumPreviewOf(full: AnalysisResult): AnalysisResult["premiumPreview"] {
  // Uma frase real e com conteúdo (não uma frase de transição), do primeiro capítulo que tiver.
  const firstSentence = (text: string) => (text.split(/(?<=[.!?])\s+/)[0] ?? "").trim();
  let best: { label: string; title: string; blockTitle: string; text: string } | null = null;
  for (const chapter of full.premiumReading?.chapters ?? []) {
    for (const block of chapter.blocks ?? []) {
      const sentence = firstSentence(block.text ?? "");
      const found = { label: chapter.label, title: chapter.title, blockTitle: block.title, text: sentence.slice(0, 260) };
      if (sentence.length >= 70) return found;
      if (sentence.length >= 35 && (!best || sentence.length > best.text.length)) best = found;
    }
  }
  return best;
}
function monthsPreviewOf(full: AnalysisResult): AnalysisResult["monthsPreview"] {
  const months = full.premiumReading?.months ?? [];
  if (months.length < 2) return null;
  return {
    first: { label: months[0].label, theme: months[0].theme, tip: months[0].tip },
    labels: months.slice(1).map((month) => month.label),
    love: months.filter((month) => month.tags.some((tag) => tag.id === "amor")).length,
    luck: months.filter((month) => month.tags.some((tag) => tag.id === "sorte")).length,
  };
}

export function preview(full: AnalysisResult): AnalysisResult {
  return { ...full, midheaven: null, aspects: [], readings: [], allThemes: [], premiumReading: null, premiumPreview: premiumPreviewOf(full), monthsPreview: monthsPreviewOf(full),
    premium: { headline: "", introduction: "", chapters: [], actionPlan: [], reflectionQuestions: [] },
    themeDeepDive: { ...full.themeDeepDive, sections: full.themeDeepDive.sections.slice(0, 1) },
    zodiacPortrait: full.zodiacPortrait ? { ...full.zodiacPortrait, premiumLayers: [] } : undefined,
    currentSky: { ...full.currentSky, highlights: [], moves: [], summary: "", moonPhase: { label: "", angle: 0, text: "" } },
    pattern: { ...full.pattern, strengths: full.pattern.strengths.slice(0, 1), watchouts: full.pattern.watchouts.slice(0, 1) },
  };
}

export type StoredCompat = {
  partner: { name: string; birthDate: string; birthTime: string; city: string; country: string };
  /** Signos das duas pessoas: permite refazer o texto quando a leitura melhora. */
  people?: { a: CompatPerson; b: CompatPerson };
  result: CompatResult;
  saves: number;
  updatedAt: number;
};

type OrderRow = { order_id: string; items: string; checkout_url: string | null; created_at: number; status: string | null };

const OPEN_STATUSES = new Set(["creating", "pending", "in_process", "in_mediation", "authorized"]);

async function reportRow(token: unknown) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw new Error("Link privado inválido.");
  const tokenHash = await digest(token);
  const db = await database();
  const row = await db.prepare("SELECT request_json, analysis_json, order_id, checkout_url, compat_json FROM guest_reports WHERE token_hash = ?")
    .bind(tokenHash).first<{ request_json: string; analysis_json: string; order_id: string | null; checkout_url: string | null; compat_json: string | null }>();
  if (!row) throw new Error("Relatório não encontrado. Confira o link privado.");
  const linked = await db.prepare(`SELECT ro.order_id, ro.items, ro.checkout_url, ro.created_at, po.status
    FROM report_orders ro LEFT JOIN payment_orders po ON po.id = ro.order_id
    WHERE ro.token_hash = ? ORDER BY ro.created_at DESC LIMIT 20`).bind(tokenHash).all<OrderRow>();
  const orders = [...linked.results];
  // Pedidos antigos (antes dos produtos) ficavam só em guest_reports.order_id e eram sempre o mapa.
  if (row.order_id && !orders.some((order) => order.order_id === row.order_id)) {
    const legacy = await db.prepare("SELECT status FROM payment_orders WHERE id = ?").bind(row.order_id).first<{ status: string }>();
    orders.push({ order_id: row.order_id, items: '["map"]', checkout_url: row.checkout_url, created_at: 0, status: legacy?.status ?? null });
  }
  return { row, orders, tokenHash };
}

export async function getGuestReport(token: unknown) {
  const { row, orders } = await reportRow(token);
  const full = JSON.parse(row.analysis_json) as AnalysisResult;
  const requestedPremium = JSON.parse(row.request_json).reportTier === "premium";
  const owned = new Set<ProductId>();
  for (const order of orders) if (order.status === "approved") parseItems(order.items).forEach((item) => owned.add(item));
  if (!paymentsEnabled() && requestedPremium) owned.add("map");
  const paid = owned.has("map");
  const pending = orders.find((order) => order.status === null || OPEN_STATUSES.has(order.status));
  const stored = row.compat_json ? JSON.parse(row.compat_json) as StoredCompat : null;
  const compatOwned = paid && owned.has("compat") && !full.person.isMinor;
  const nameOwned = owned.has("name") && !full.person.isMinor;
  return {
    analysis: paid ? full : preview(full),
    reportTier: paid ? "premium" as const : "free" as const,
    products: { map: paid, compat: compatOwned, name: nameOwned },
    nameReading: nameOwned ? buildNameReading(full.person.fullName, full.person.birthDate) : null,
    orderId: pending?.order_id ?? null,
    checkoutUrl: pending?.checkout_url ?? null,
    pendingItems: pending ? parseItems(pending.items) : [],
    pendingOrderIds: orders.filter((order) => order.status === null || OPEN_STATUSES.has(order.status)).map((order) => order.order_id).slice(0, 3),
    compat: compatOwned && stored ? { result: stored.people ? buildCompatibility(stored.people.a, stored.people.b) : stored.result, partnerName: stored.partner.name, canEdit: stored.saves < 2 } : null,
  };
}

/** Pedido ainda aberto com exatamente os mesmos produtos: reaproveita o link. */
export async function findOpenOrder(token: string, items: ProductId[]) {
  const { orders } = await reportRow(token);
  const key = items.join(",");
  return orders.find((order) =>
    (order.status === null || OPEN_STATUSES.has(order.status)) &&
    order.order_id.startsWith("ast_") &&
    (order.checkout_url?.startsWith("https://") || order.checkout_url === "direct") &&
    parseItems(order.items).join(",") === key) ?? null;
}

/** Dados de anúncio guardados com o pedido, para a API de Conversões. IP e navegador só com consentimento. */
export type OrderAdData = { attribution: Attribution | null; signals: AdSignals; ip?: string; userAgent?: string };

export async function attachOrder(token: string, orderId: string, checkoutUrl = "", items: ProductId[] = ["map"], adData: OrderAdData | null = null) {
  const db = await database();
  const tokenHash = await digest(token);
  const stored = adData ? JSON.stringify(adData.signals.consent ? adData : { attribution: adData.attribution, signals: { consent: false } }) : null;
  await db.prepare("INSERT OR REPLACE INTO report_orders (order_id, token_hash, items, checkout_url, attribution_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(orderId, tokenHash, JSON.stringify(items), checkoutUrl, stored, Date.now()).run();
  if (items.includes("map")) {
    await db.prepare("UPDATE guest_reports SET order_id = ?, checkout_url = ? WHERE token_hash = ?").bind(orderId, checkoutUrl, tokenHash).run();
  }
}

/** Confere se o pedido pertence a este mapa (o link privado é a prova de posse). */
export async function orderBelongsToReport(token: unknown, orderId: string) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return false;
  const row = await (await database()).prepare("SELECT 1 AS ok FROM report_orders WHERE order_id = ? AND token_hash = ?")
    .bind(orderId, await digest(token)).first<{ ok: number }>();
  return Boolean(row);
}

export async function readStoredCompat(token: string) {
  const { row } = await reportRow(token);
  return row.compat_json ? JSON.parse(row.compat_json) as StoredCompat : null;
}

export async function saveCompat(token: string, expectedSaves: number, compat: StoredCompat) {
  // Só grava se ninguém salvou no meio do caminho (evita duas correções ao mesmo tempo).
  const result = await (await database()).prepare(
    "UPDATE guest_reports SET compat_json = ? WHERE token_hash = ? AND COALESCE(json_extract(compat_json, '$.saves'), 0) = ?",
  ).bind(JSON.stringify(compat), await digest(token), expectedSaves).run();
  return (result.meta?.changes ?? 0) > 0;
}
