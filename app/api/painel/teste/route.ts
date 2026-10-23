import { env } from "cloudflare:workers";
import { checkAdmin } from "../../../../lib/admin-auth";
export const dynamic = "force-dynamic";

// Marca (ou desmarca) um registro como teste. Não apaga nada: o mapa, o pedido
// e o e-mail continuam guardados; só deixam de entrar nas contas do painel.
const TARGETS = {
  order: { sql: "UPDATE payment_orders SET excluded_at = ? WHERE id = ?", valid: /^ast_[0-9a-f-]{36}$/i },
  map: { sql: "UPDATE guest_reports SET excluded_at = ? WHERE token_hash = ?", valid: /^[a-f0-9]{64}$/ },
  email: { sql: "UPDATE marketing_leads SET excluded_at = ? WHERE email = ?", valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
} as const;

export async function POST(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({})) as { kind?: string; id?: string; order?: string; test?: boolean };
  const kind = (body.kind ?? (body.order ? "order" : "")) as keyof typeof TARGETS;
  const id = String(body.id ?? body.order ?? "").trim();
  const target = TARGETS[kind];
  if (!target || !target.valid.test(id)) return Response.json({ error: "Registro inválido." }, { status: 400 });
  const result = await env.DB.prepare(target.sql).bind(body.test === false ? null : Date.now(), kind === "email" ? id.toLowerCase() : id).run();
  if (!(result.meta?.changes ?? 0)) return Response.json({ error: "Registro não encontrado." }, { status: 404 });
  return Response.json({ ok: true });
}
