import { env } from "cloudflare:workers";
import { checkAdmin } from "../../../../lib/admin-auth";
import { cleanAttribution, dayInBrazil, sourceOf } from "../../../../lib/attribution";
export const dynamic = "force-dynamic";

// Dados pessoais dos clientes, só para o dono do AstroIA (protegido pela ADMIN_KEY).
// Mostra o mínimo necessário: nada de data, hora ou cidade de nascimento.
const LAUNCH = Date.parse("2026-10-22T15:00:00Z");

/** Campanha e anúncio (utm_campaign / utm_content) de onde a pessoa veio. */
function campaignOf(json: string | null, nested = false) {
  if (!json) return { campaign: null as string | null, ad: null as string | null };
  try {
    const raw = JSON.parse(json);
    const a = cleanAttribution(nested ? raw?.attribution : raw);
    return { campaign: a.campaign ?? null, ad: a.content ?? null };
  } catch { return { campaign: null, ad: null }; }
}

function source(json: string | null, nested = false) {
  if (!json) return "direto";
  try {
    const raw = JSON.parse(json);
    return sourceOf(cleanAttribution(nested ? raw?.attribution : raw));
  } catch { return "direto"; }
}

export async function GET(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("dias")) || 30));
  const fromDay = dayInBrazil(Date.now() - (days - 1) * 86400000);
  const from = Math.max(LAUNCH, Date.parse(`${fromDay}T03:00:00Z`));

  const sales = await env.DB.prepare(
    `SELECT po.id, po.customer_email, po.person_name, po.offer_mode, po.amount_cents, po.status,
            COALESCE(po.approved_at, po.updated_at) AS at, ro.attribution_json AS ro_attr, gr.attribution_json AS gr_attr
     FROM payment_orders po
     LEFT JOIN report_orders ro ON ro.order_id = po.id
     LEFT JOIN guest_reports gr ON gr.token_hash = ro.token_hash
     WHERE po.status IN ('approved', 'refunded', 'charged_back') AND COALESCE(po.approved_at, po.updated_at) >= ? AND po.excluded_at IS NULL AND gr.excluded_at IS NULL
     ORDER BY at DESC LIMIT 1000`,
  ).bind(from).all<{ id: string; customer_email: string | null; person_name: string | null; offer_mode: string; amount_cents: number; status: string; at: number; ro_attr: string | null; gr_attr: string | null }>();

  const maps = await env.DB.prepare(
    `SELECT gr.token_hash AS id, gr.created_at AS at,
            json_extract(gr.request_json, '$.name') AS name,
            json_extract(gr.request_json, '$.email') AS email,
            json_extract(gr.request_json, '$.marketingConsent') AS consent,
            json_extract(gr.request_json, '$.recipientType') AS recipient,
            gr.attribution_json AS attr,
            (SELECT GROUP_CONCAT(ro.items, '|') FROM report_orders ro JOIN payment_orders po ON po.id = ro.order_id
              WHERE ro.token_hash = gr.token_hash AND po.status = 'approved' AND po.excluded_at IS NULL) AS bought,
            (SELECT COUNT(*) FROM report_orders ro WHERE ro.token_hash = gr.token_hash) AS checkouts
     FROM guest_reports gr WHERE gr.created_at >= ? AND gr.excluded_at IS NULL ORDER BY gr.created_at DESC LIMIT 1000`,
  ).bind(from).all<{ id: string; at: number; name: string | null; email: string | null; consent: number | null; recipient: string | null; attr: string | null; bought: string | null; checkouts: number }>();

  // Lista para promoções: só quem marcou que aceita receber e-mails e não cancelou.
  // E-mails seguem o período escolhido; "?emails=todos" devolve a lista inteira (para baixar).
  const allEmails = url.searchParams.get("emails") === "todos";
  const leads = await env.DB.prepare(
    `SELECT ml.email, ml.consented_at AS at FROM marketing_leads ml
     WHERE ml.marketing_consent = 1 AND ml.revoked_at IS NULL AND ml.excluded_at IS NULL
       AND ml.consented_at >= ?
       AND NOT EXISTS (SELECT 1 FROM marketing_suppressions ms WHERE ms.email = ml.email)
     ORDER BY ml.consented_at DESC LIMIT 5000`,
  ).bind(allEmails ? 0 : Date.parse(`${fromDay}T03:00:00Z`)).all<{ email: string; at: number }>();
  const leadsTotal = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM marketing_leads ml
     WHERE ml.marketing_consent = 1 AND ml.revoked_at IS NULL AND ml.excluded_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM marketing_suppressions ms WHERE ms.email = ml.email)`,
  ).first<{ total: number }>();

  return Response.json({
    sales: sales.results.map((s) => ({
      at: s.at, email: s.customer_email, name: s.person_name, items: s.offer_mode, value: s.amount_cents / 100,
      status: s.status, order: s.id, source: s.ro_attr ? source(s.ro_attr, true) : source(s.gr_attr),
      ...(s.ro_attr && campaignOf(s.ro_attr, true).campaign ? campaignOf(s.ro_attr, true) : campaignOf(s.gr_attr)),
    })),
    maps: maps.results.map((m) => {
      const items = new Set((m.bought || "").split("|").flatMap((part) => { try { return JSON.parse(part) as string[]; } catch { return []; } }));
      return {
        id: m.id, at: m.at, name: m.name, email: m.email || null, consent: m.consent === 1, recipient: m.recipient || "self",
        source: source(m.attr), ...campaignOf(m.attr), bought: [...items].join("+"), checkout: m.checkouts > 0,
      };
    }),
    leads: leads.results,
    leadsTotal: leadsTotal?.total ?? 0,
  }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
