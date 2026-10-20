import { getGuestReport, limitRequest } from "../../../lib/guest-reports";
import { normalizedEmail } from "../../../lib/site-auth";
import { createAsaasCheckout, paymentsEnabled } from "../../../lib/asaas";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    if (!paymentsEnabled()) throw new Error("O pagamento está temporariamente desativado para testes.");
    await limitRequest(request, "checkout", 8);
    const raw = await request.text();
    if (raw.length > 12000) throw new Error("Solicitação muito grande.");
    const body = JSON.parse(raw) as {reportToken: string; customerEmail: string};
    const email = normalizedEmail(body.customerEmail);
    if (!email) throw new Error("Informe um e-mail válido para identificar a compra.");
    const report = await getGuestReport(body.reportToken);
    if (report.reportTier === "premium") throw new Error("Este relatório já está liberado. Use seu link privado.");
    const checkout = await createAsaasCheckout(body.reportToken, email, report.analysis.person.fullName);
    return Response.json(checkout, {headers:{"Cache-Control":"no-store"}});
  } catch(error) { return Response.json({error:error instanceof Error ? error.message : "Não foi possível iniciar a compra."}, {status:400}); }
}
