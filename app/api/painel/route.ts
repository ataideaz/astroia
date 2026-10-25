import { env } from "cloudflare:workers";
import { cleanAttribution, dayInBrazil, normalizeName, sourceOf, type Attribution } from "../../../lib/attribution";
import { checkAdmin } from "../../../lib/admin-auth";
import { readEnv } from "../../../lib/runtime-env";
export const dynamic = "force-dynamic";

type Row = { day: string; type: string; source: string; campaign: string | null; ad: string | null; total: number };
type Sale = { id: string; offer_mode: string; amount_cents: number; approved_at: number; ro_attr: string | null; gr_attr: string | null };

// Vendas de teste (sandbox) ficaram antes do pagamento real.
const SALES_SINCE = Date.parse("2026-10-22T15:00:00Z");

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("dias")) || 30));
  const fromDay = dayInBrazil(Date.now() - (days - 1) * 86400000);
  const fromTime = Math.max(SALES_SINCE, Date.parse(`${fromDay}T03:00:00Z`));

  const events = await env.DB.prepare(
    `SELECT day, type, source, campaign, ad, COUNT(*) AS total FROM site_events
     WHERE day >= ? GROUP BY day, type, source, campaign, ad`,
  ).bind(fromDay).all<Row>();
  const sales = await env.DB.prepare(
    `SELECT po.id, po.offer_mode, po.amount_cents, po.approved_at,
            ro.attribution_json AS ro_attr, gr.attribution_json AS gr_attr
     FROM payment_orders po
     LEFT JOIN report_orders ro ON ro.order_id = po.id
     LEFT JOIN guest_reports gr ON gr.token_hash = ro.token_hash
     WHERE po.status = 'approved' AND po.approved_at >= ? AND po.excluded_at IS NULL AND gr.excluded_at IS NULL
     ORDER BY po.approved_at DESC LIMIT 5000`,
  ).bind(fromTime).all<Sale>();
  const refunds = await env.DB.prepare(
    `SELECT COUNT(*) AS total, COALESCE(SUM(amount_cents), 0) AS cents FROM payment_orders
     WHERE status IN ('refunded', 'charged_back') AND updated_at >= ? AND excluded_at IS NULL`,
  ).bind(fromTime).first<{ total: number; cents: number }>();

  type Bucket = { visits: number; offerViews: number; offerOpens: number; maps: number; checkouts: number; pix: number; sales: number; revenue: number };
  const empty = (): Bucket => ({ visits: 0, offerViews: 0, offerOpens: 0, maps: 0, checkouts: 0, pix: 0, sales: 0, revenue: 0 });
  const byDay = new Map<string, Bucket>();
  const bySource = new Map<string, Bucket>();
  const byCampaign = new Map<string, Bucket & { source: string }>();
  // Anúncio = utm_content ({{ad.name}}), dentro da campanha.
  const byAd = new Map<string, Bucket & { campaign: string }>();
  const adBucket = (campaign: string | undefined, ad: string | undefined) => {
    const name = normalizeName(ad);
    if (!name) return null;
    const camp = normalizeName(campaign) ?? "";
    const id = `${camp}|${name}`;
    return byAd.get(id) ?? byAd.set(id, { ...empty(), campaign: camp }).get(id)!;
  };
  const totals = empty();
  const field = { visit: "visits", offer_view: "offerViews", offer_open: "offerOpens", map: "maps", checkout: "checkouts", pix: "pix" } as const;

  for (const row of events.results) {
    const name = field[row.type as keyof typeof field];
    if (!name) continue;
    for (const bucket of [
      byDay.get(row.day) ?? byDay.set(row.day, empty()).get(row.day)!,
      bySource.get(row.source) ?? bySource.set(row.source, empty()).get(row.source)!,
      totals,
    ]) bucket[name] += row.total;
    const campaign = normalizeName(row.campaign);
    if (campaign) {
      const id = `${row.source}|${campaign}`;
      const bucket = byCampaign.get(id) ?? byCampaign.set(id, { ...empty(), source: row.source }).get(id)!;
      bucket[name] += row.total;
    }
    const ad = adBucket(row.campaign ?? undefined, row.ad ?? undefined);
    if (ad) ad[name] += row.total;
  }

  // Mapas marcados como teste saem das contagens (e os pagamentos que eles abriram).
  const tracking = await env.DB.prepare("SELECT MIN(created_at) AS since FROM site_events WHERE type = 'map'").first<{ since: number | null }>();
  const testMaps = await env.DB.prepare(
    `SELECT gr.created_at AS at, gr.attribution_json AS attr,
            (SELECT COUNT(*) FROM report_orders ro WHERE ro.token_hash = gr.token_hash) AS checkouts
     FROM guest_reports gr WHERE gr.excluded_at IS NOT NULL AND gr.created_at >= ?`,
  ).bind(Math.max(fromTime, tracking?.since ?? Date.now())).all<{ at: number; attr: string | null; checkouts: number }>();
  for (const map of testMaps.results) {
    let attribution: Attribution | null = null;
    try { attribution = map.attr ? cleanAttribution(JSON.parse(map.attr)) : null; } catch { attribution = null; }
    const source = sourceOf(attribution);
    const day = dayInBrazil(map.at);
    const buckets: Bucket[] = [byDay.get(day), bySource.get(source), totals].filter(Boolean) as Bucket[];
    if (attribution?.campaign) { const c = byCampaign.get(`${source}|${attribution.campaign}`); if (c) buckets.push(c); }
    if (attribution?.content) { const a = byAd.get(`${attribution.campaign ?? ""}|${attribution.content}`); if (a) buckets.push(a); }
    for (const bucket of buckets) {
      bucket.maps = Math.max(0, bucket.maps - 1);
      bucket.checkouts = Math.max(0, bucket.checkouts - map.checkouts);
    }
  }

  // Quem faz o mapa: faixa de idade (só mapas "para mim") e para quem é o mapa.
  type People = { maps: number; checkouts: number; sales: number };
  const ageOrder = ["Menos de 18", "18 a 24", "25 a 34", "35 a 44", "45 a 54", "55 a 64", "65 ou mais"];
  const recipientNames: Record<string, string> = { self: "Para mim", partner: "Para o par", child: "Para filho(a)", other: "Para outra pessoa" };
  const byAge = new Map<string, People>();
  const byRecipient = new Map<string, People>();
  const reports = await env.DB.prepare(
    `SELECT gr.request_json AS req, gr.created_at AS at,
            (SELECT COUNT(*) FROM report_orders ro WHERE ro.token_hash = gr.token_hash) AS orders,
            (SELECT COUNT(*) FROM report_orders ro JOIN payment_orders po ON po.id = ro.order_id
              WHERE ro.token_hash = gr.token_hash AND po.status = 'approved' AND po.excluded_at IS NULL) AS paid
     FROM guest_reports gr WHERE gr.created_at >= ? AND gr.excluded_at IS NULL LIMIT 5000`,
  ).bind(fromTime).all<{ req: string; at: number; orders: number; paid: number }>();
  const add = (map: Map<string, People>, key: string, r: { orders: number; paid: number }) => {
    const b = map.get(key) ?? map.set(key, { maps: 0, checkouts: 0, sales: 0 }).get(key)!;
    b.maps += 1; if (r.orders > 0) b.checkouts += 1; if (r.paid > 0) b.sales += 1;
  };
  for (const r of reports.results) {
    let req: { birthDate?: string; recipientType?: string } = {};
    try { req = JSON.parse(r.req); } catch { continue; }
    const recipient = recipientNames[req.recipientType ?? "self"] ?? "Para outra pessoa";
    add(byRecipient, recipient, r);
    if ((req.recipientType ?? "self") !== "self" || !req.birthDate) continue;
    const birth = new Date(`${req.birthDate}T12:00:00Z`);
    const made = new Date(r.at);
    if (Number.isNaN(birth.getTime())) continue;
    let age = made.getUTCFullYear() - birth.getUTCFullYear();
    if (made.getUTCMonth() < birth.getUTCMonth() || (made.getUTCMonth() === birth.getUTCMonth() && made.getUTCDate() < birth.getUTCDate())) age -= 1;
    const label = age < 18 ? ageOrder[0] : age < 25 ? ageOrder[1] : age < 35 ? ageOrder[2] : age < 45 ? ageOrder[3] : age < 55 ? ageOrder[4] : age < 65 ? ageOrder[5] : ageOrder[6];
    add(byAge, label, r);
  }

  const products = new Map<string, { orders: number; revenue: number }>();
  const recent: Array<{ at: number; items: string; value: number; source: string; campaign: string | null }> = [];
  for (const sale of sales.results) {
    let attribution: Attribution | null = null;
    try {
      const fromOrder = sale.ro_attr ? (JSON.parse(sale.ro_attr) as { attribution?: unknown }).attribution : null;
      const fromReport = sale.gr_attr ? JSON.parse(sale.gr_attr) : null;
      attribution = fromOrder ? cleanAttribution(fromOrder) : fromReport ? cleanAttribution(fromReport) : null;
    } catch { attribution = null; }
    const source = sourceOf(attribution);
    const day = dayInBrazil(sale.approved_at);
    const value = sale.amount_cents / 100;
    for (const bucket of [
      byDay.get(day) ?? byDay.set(day, empty()).get(day)!,
      bySource.get(source) ?? bySource.set(source, empty()).get(source)!,
      totals,
    ]) { bucket.sales += 1; bucket.revenue += value; }
    if (attribution?.campaign) {
      const id = `${source}|${attribution.campaign}`;
      const bucket = byCampaign.get(id) ?? byCampaign.set(id, { ...empty(), source }).get(id)!;
      bucket.sales += 1; bucket.revenue += value;
    }
    const ad = adBucket(attribution?.campaign, attribution?.content);
    if (ad) { ad.sales += 1; ad.revenue += value; }
    const product = products.get(sale.offer_mode) ?? products.set(sale.offer_mode, { orders: 0, revenue: 0 }).get(sale.offer_mode)!;
    product.orders += 1; product.revenue += value;
    if (recent.length < 25) recent.push({ at: sale.approved_at, items: sale.offer_mode, value, source, campaign: attribution?.campaign ?? null });
  }

  const round = <T extends { revenue: number }>(b: T) => ({ ...b, revenue: Math.round(b.revenue * 100) / 100 });
  return Response.json({
    days,
    fromDay,
    totals: round(totals),
    refunds: { count: refunds?.total ?? 0, value: (refunds?.cents ?? 0) / 100 },
    byDay: [...byDay].map(([day, b]) => ({ day, ...round(b) })).sort((a, b) => b.day.localeCompare(a.day)),
    bySource: [...bySource].map(([source, b]) => ({ source, ...round(b) })).sort((a, b) => b.revenue - a.revenue || b.visits - a.visits),
    byCampaign: [...byCampaign].map(([id, b]) => ({ campaign: id.split("|").slice(1).join("|"), ...round(b) })).sort((a, b) => b.revenue - a.revenue || b.visits - a.visits).slice(0, 50),
    byAd: [...byAd].map(([id, b]) => ({ ad: id.split("|").slice(1).join("|"), ...round(b) })).sort((a, b) => b.revenue - a.revenue || b.maps - a.maps || b.visits - a.visits).slice(0, 50),
    byAge: ageOrder.filter((label) => byAge.has(label)).map((label) => ({ label, ...byAge.get(label)! })),
    byRecipient: [...byRecipient].map(([label, b]) => ({ label, ...b })).sort((a, b) => b.maps - a.maps),
    products: [...products].map(([items, p]) => ({ items, ...p, revenue: Math.round(p.revenue * 100) / 100 })).sort((a, b) => b.revenue - a.revenue),
    recent,
    meta: { pixel: Boolean(readEnv("META_PIXEL_ID")), capi: Boolean(readEnv("META_PIXEL_ID") && readEnv("META_CAPI_TOKEN")) },
  }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
