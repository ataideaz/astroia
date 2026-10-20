import { NextResponse } from "next/server";
import { createGuestReport, limitRequest } from "../../../lib/guest-reports";
import { paymentsEnabled } from "../../../lib/asaas";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await limitRequest(request, "preview", 12);
    const raw = await request.text();
    if (raw.length > 12000) return NextResponse.json({error: "Dados muito extensos."}, {status:413});
    const body = JSON.parse(raw);
    if (body.reportTier === "premium" && paymentsEnabled()) return NextResponse.json({error: "Abra seu relatório pelo link privado após confirmar o pagamento."}, {status:403});
    const result = await createGuestReport(body, body.reportTier === "premium" && !paymentsEnabled());
    if (body.marketingConsent && body.email) {
      const { saveMarketingLead } = await import("../../../lib/marketing-leads");
      await saveMarketingLead({email:body.email, selectedTheme:"personalidade"});
    }
    return NextResponse.json(result, {headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar a prévia.";
    return NextResponse.json({error:message}, {status: message.includes("Limite") ? 429 : 400});
  }
}
