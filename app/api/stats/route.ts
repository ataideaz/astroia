import { env } from "cloudflare:workers";
import { dayInBrazil } from "../../../lib/attribution";
export const dynamic = "force-dynamic";

// Números reais e anônimos para a prova social do site (sem nomes, sem cidades).
// Mesma base do painel: mapas e vendas de teste marcados no painel ficam de fora.
const SALES_SINCE = Date.parse("2026-10-22T15:00:00Z");

export async function GET() {
  try {
    const todayStart = Date.parse(`${dayInBrazil()}T03:00:00Z`);
    const weekStart = todayStart - 6 * 86400000;
    const maps = await env.DB.prepare(
      `SELECT SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS today, COUNT(*) AS week
       FROM guest_reports WHERE created_at >= ? AND excluded_at IS NULL`,
    ).bind(todayStart, Math.max(weekStart, SALES_SINCE)).first<{ today: number | null; week: number }>();
    // Total desde o lançamento (22/10/2026), sem os testes marcados no painel.
    const total = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM guest_reports WHERE created_at >= ? AND excluded_at IS NULL",
    ).bind(SALES_SINCE).first<{ total: number }>();
    const sales = await env.DB.prepare(
      `SELECT COUNT(*) AS week FROM payment_orders
       WHERE status = 'approved' AND excluded_at IS NULL AND approved_at >= ?`,
    ).bind(Math.max(weekStart, SALES_SINCE)).first<{ week: number }>();
    return Response.json(
      { mapsToday: maps?.today ?? 0, mapsWeek: maps?.week ?? 0, mapsTotal: total?.total ?? 0, salesWeek: sales?.week ?? 0 },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return Response.json({ mapsToday: 0, mapsWeek: 0, mapsTotal: 0, salesWeek: 0 }, { headers: { "Cache-Control": "no-store" } });
  }
}
