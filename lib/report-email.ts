import type { AnalysisResult, Placement } from "./astro-analysis";
import type { ExportTier } from "./report-export";

const DEFAULT_SITE_URL = "https://meuastroia.com.br";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function placementText(placement: Placement | null) {
  if (!placement) return "Horário não informado";
  return `${placement.sign} · ${placement.degree}${
    placement.house ? ` · Casa ${placement.house}` : ""
  }`;
}

function emailRow(label: string, placement: Placement | null) {
  return `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#1b1137;border:1px solid #35255d;border-radius:14px;">
          <tr>
            <td style="padding:15px 17px;">
              <div style="color:#e5bd72;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(label)}</div>
              <div style="color:#fffaf2;font-family:Georgia,serif;font-size:20px;line-height:1.35;margin-top:5px;">${escapeHtml(placementText(placement))}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export function mapEmailSubject(
  analysis: AnalysisResult,
  tier: ExportTier,
) {
  return `${
    tier === "premium" ? "Seu mapa Premium" : "Seu mapa essencial"
  } chegou, ${analysis.person.firstName}`;
}

export function createMapEmailHtml(
  analysis: AnalysisResult,
  tier: ExportTier,
  siteUrl = process.env.ASTROIA_SITE_URL || DEFAULT_SITE_URL,
) {
  const safeSiteUrl = siteUrl.replace(/\/+$/, "");
  const mapsUrl = `${safeSiteUrl}/#meus-mapas`;
  const privacyUrl = `${safeSiteUrl}/privacidade`;
  const reportLabel =
    tier === "premium" ? "RELATÓRIO PREMIUM" : "MAPA ESSENCIAL";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(mapEmailSubject(analysis, tier))}</title>
  </head>
  <body style="background:#080612;margin:0;padding:0;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Seu mapa AstroIA está pronto e o PDF vai anexado.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080612;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;max-width:620px;">
            <tr>
              <td style="padding:0 4px 18px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#fffaf2;font-family:Georgia,serif;font-size:24px;font-weight:bold;">✦ AstroIA</td>
                    <td align="right" style="color:#e5bd72;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:1.4px;">${reportLabel}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#130c29;border:1px solid #3d2c61;border-radius:24px;overflow:hidden;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#26134d,#130c29);padding:42px 36px 34px 36px;">
                      <div style="color:#e5bd72;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;">Seu mapa chegou</div>
                      <h1 style="color:#fffaf2;font-family:Georgia,serif;font-size:40px;font-weight:normal;letter-spacing:-1px;line-height:1.05;margin:13px 0 12px 0;">
                        ${escapeHtml(analysis.person.firstName)}, há mais no seu céu.
                      </h1>
                      <p style="color:#cfc5df;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0;">
                        Preparamos sua leitura sobre <strong style="color:#f2d292;">${escapeHtml(analysis.themeDeepDive.label.toLowerCase())}</strong> em palavras simples, bonitas e fáceis de levar para a vida.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px 36px 8px 36px;">
                      <div style="background:#21143f;border:1px solid #4b3573;border-radius:16px;padding:20px;">
                        <div style="color:#e5bd72;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Um primeiro olhar</div>
                        <p style="color:#f7f1ff;font-family:Georgia,serif;font-size:18px;line-height:1.65;margin:10px 0 0 0;">${escapeHtml(analysis.summary)}</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px 4px 36px;">
                      <div style="color:#e5bd72;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Seu trio principal</div>
                      <h2 style="color:#fffaf2;font-family:Georgia,serif;font-size:27px;font-weight:normal;line-height:1.2;margin:8px 0 18px 0;">Três pistas importantes sobre você</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        ${emailRow("Sol · sua essência", analysis.bigThree.sun)}
                        ${emailRow("Lua · seu mundo emocional", analysis.bigThree.moon)}
                        ${emailRow("Ascendente · sua expressão", analysis.bigThree.ascendant)}
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 36px 8px 36px;">
                      <div style="border-left:3px solid #e5bd72;padding:2px 0 2px 17px;">
                        <div style="color:#e5bd72;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Seu foco · ${escapeHtml(analysis.themeDeepDive.label)}</div>
                        <h2 style="color:#fffaf2;font-family:Georgia,serif;font-size:25px;font-weight:normal;line-height:1.25;margin:8px 0;">${escapeHtml(analysis.themeDeepDive.headline)}</h2>
                        <p style="color:#cfc5df;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;margin:0;">${escapeHtml(analysis.themeDeepDive.introduction)}</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 36px 30px 36px;">
                      <div style="background:#f1d08d;border-radius:14px;color:#1b102e;font-family:Georgia,serif;font-size:16px;line-height:1.55;padding:18px 20px;">${escapeHtml(analysis.themeDeepDive.actionPrompt)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 36px 36px 36px;">
                      <a href="${escapeHtml(mapsUrl)}" style="background:#dcb6f2;border-radius:999px;color:#1b102e;display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:800;padding:15px 25px;text-decoration:none;">Abrir meus mapas</a>
                      <p style="color:#9e91b2;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;margin:14px 0 0 0;">
                        O mapa completo também está no PDF anexado a este e-mail.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 18px 0 18px;text-align:center;">
                <p style="color:#8f839f;font-family:Arial,sans-serif;font-size:10px;line-height:1.65;margin:0;">
                  Este é um e-mail de entrega solicitado por você. Recebê-lo não ativa comunicações promocionais.
                  Conteúdo para entretenimento e autoconhecimento; não substitui orientação profissional.
                </p>
                <p style="font-family:Arial,sans-serif;font-size:10px;margin:9px 0 0 0;">
                  <a href="${escapeHtml(privacyUrl)}" style="color:#cbb4ff;">Política de Privacidade</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function createMapEmailText(
  analysis: AnalysisResult,
  tier: ExportTier,
) {
  return [
    mapEmailSubject(analysis, tier),
    "",
    `Sua leitura sobre ${analysis.themeDeepDive.label.toLowerCase()} está pronta.`,
    "",
    analysis.summary,
    "",
    `Sol: ${placementText(analysis.bigThree.sun)}`,
    `Lua: ${placementText(analysis.bigThree.moon)}`,
    `Ascendente: ${placementText(analysis.bigThree.ascendant)}`,
    "",
    analysis.themeDeepDive.headline,
    analysis.themeDeepDive.introduction,
    "",
    analysis.themeDeepDive.actionPrompt,
    "",
    "O mapa completo está no PDF anexado.",
    "Este e-mail de entrega não ativa comunicações promocionais.",
    "AstroIA - Conteúdo para entretenimento e autoconhecimento.",
  ].join("\n");
}
