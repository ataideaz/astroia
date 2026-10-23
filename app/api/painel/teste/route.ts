import { env } from "cloudflare:workers";
import { checkAdmin } from "../../../../lib/admin-auth";
export const dynamic = "force-dynamic";

// Marca (ou desmarca) uma compra como teste. Não apaga nada: o pedido continua
// guardado e o acesso do mapa não muda; só deixa de entrar nas contas do painel.
export async function POST(request: Request) {
  const denied = await checkAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({})) as { order?: string; test?: boolean };
  const order = typeof body.order === "string" ? body.order : "";
  if (!/^ast_[0-9a-f-]{36}$/i.test(order)) return Response.json({ error: "Pedido inválido." }, { status: 400 });
  const result = await env.DB.prepare("UPDATE payment_orders SET excluded_at = ? WHERE id = ?")
    .bind(body.test === false ? null : Date.now(), order).run();
  if (!(result.meta?.changes ?? 0)) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  return Response.json({ ok: true });
}
