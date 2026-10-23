import { createReportPdf } from "../../../lib/report-pdf";
import { getGuestReport, limitRequest } from "../../../lib/guest-reports";
import {
  reportFilename,
} from "../../../lib/report-export";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 900_000;

export async function POST(request: Request) {
  try {
    await limitRequest(request, "pdf", 40);
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return Response.json(
        { error: "Envie os dados do mapa no formato correto." },
        { status: 415 },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return Response.json(
        { error: "Este mapa ficou grande demais para exportar." },
        { status: 413 },
      );
    }

    const body = await request.json() as {token?: string};
    const { analysis, reportTier, compat, nameReading, products } = await getGuestReport(body.token);
    // O PDF é parte do que se compra: na prévia grátis ele não é gerado
    // (quem comprou só a Numerologia do Nome continua com o PDF dela).
    const { paymentsEnabled } = await import("../../../lib/asaas");
    if (reportTier === "free" && paymentsEnabled() && !products.name) {
      return Response.json({ error: "O PDF faz parte do mapa completo." }, { status: 403 });
    }
    const pdfBytes = await createReportPdf(analysis, reportTier, compat?.result ?? null, nameReading);
    const filename = reportFilename(analysis, reportTier);

    return new Response(pdfBytes.slice().buffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.byteLength),
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o PDF agora.",
      },
      { status: 400 },
    );
  }
}
