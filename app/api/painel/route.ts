import { env } from "cloudflare:workers";
import { cleanAttribution, dayInBrazil, sourceOf, type Attribution } from "../../../lib/attribution";
import { checkAdmin } from "../../../lib/admin-auth";
import { readEnv } from "../../../lib/runtime-env";
export const dynamic = "force-dynamic";

type Row = { day: string; type: string; source: string; campaign: string | null; total: number };
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
    `SELECT day, type, source, campaign, COUNT(*) AS total FROM site_events
     WHERE day >= ? GROUP BY day, type, source, campaign`,
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
    if (row.campaign) {
      const id = `${row.source}|${row.campaign}`;
      const bucket = byCampaign.get(id) ?? byCampaign.set(id, { ...empty(), source: row.source }).get(id)!;
      bucket[name] += row.total;
    }
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
    for (const bucket of buckets) {
      bucket.maps = Math.max(0, bucket.maps - 1);
      bucket.checkouts = Math.max(0, bucket.checkouts - map.checkouts);
    }
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
    products: [...products].map(([items, p]) => ({ items, ...p, revenue: Math.round(p.revenue * 100) / 100 })).sort((a, b) => b.revenue - a.revenue),
    recent,
    meta: { pixel: Boolean(readEnv("META_PIXEL_ID")), capi: Boolean(readEnv("META_PIXEL_ID") && readEnv("META_CAPI_TOKEN")) },
  }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
