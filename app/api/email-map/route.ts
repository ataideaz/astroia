import { Buffer } from "node:buffer";
import {
  createMapEmailHtml,
  createMapEmailText,
  mapEmailSubject,
} from "../../../lib/report-email";
import {
  parseEmailPayload,
  reportFilename,
} from "../../../lib/report-export";
import { createReportPdf } from "../../../lib/report-pdf";
import { getSiteAccount } from "../../../lib/site-auth";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 900_000;

export async function POST(request: Request) {
  try {
    const user = await getSiteAccount();
    if (!user) return Response.json({ error: "Entre com seu e-mail para enviar seu mapa." }, { status: 401 });
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return Response.json(
        { error: "Envie os dados do e-mail no formato correto." },
        { status: 415 },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return Response.json(
        { error: "Este mapa ficou grande demais para enviar." },
        { status: 413 },
      );
    }

    const { action, analysis, deliveryId, email, reportTier } =
      parseEmailPayload(await request.json());
    const html = createMapEmailHtml(analysis, reportTier);

    if (action === "preview") {
      return Response.json(
        {
          mode: "preview",
          previewHtml: html,
          message: "Esta é a aparência real do e-mail AstroIA.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.ASTROIA_EMAIL_FROM?.trim();

    if (!apiKey || !from) {
      return Response.json(
        {
          mode: "preview-only",
          previewHtml: html,
          message:
            "O e-mail está pronto para teste. Falta somente conectar o remetente AstroIA para ele chegar à caixa de entrada.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const pdfBytes = await createReportPdf(analysis, reportTier);
    const providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `astroia-${deliveryId || crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        attachments: [
          {
            content: Buffer.from(pdfBytes).toString("base64"),
            filename: reportFilename(analysis, reportTier),
          },
        ],
        from,
        html,
        subject: mapEmailSubject(analysis, reportTier),
        tags: [
          { name: "product", value: "astroia-map" },
          { name: "tier", value: reportTier },
          { name: "theme", value: analysis.themeDeepDive.id },
        ],
        text: createMapEmailText(analysis, reportTier),
        to: [email],
      }),
    });

    if (!providerResponse.ok) {
      console.error(
        "Falha no serviço de e-mail AstroIA:",
        providerResponse.status,
      );
      return Response.json(
        {
          error:
            "O e-mail não foi enviado agora. Seu mapa continua disponível e você pode tentar novamente.",
        },
        { status: 502 },
      );
    }

    const providerPayload = (await providerResponse.json()) as { id?: string };
    return Response.json(
      {
        deliveryId: providerPayload.id ?? null,
        message: `Mapa enviado para ${email}. Verifique também a caixa de spam.`,
        mode: "sent",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível preparar o e-mail agora.",
      },
      { status: 400 },
    );
  }
}
