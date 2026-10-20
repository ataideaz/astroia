import type { AnalysisResult } from "./astro-analysis";

export type ExportTier = "free" | "premium";
export type EmailAction = "preview" | "send";

export type ReportExportPayload = {
  analysis: AnalysisResult;
  reportTier: ExportTier;
};

export type EmailMapPayload = ReportExportPayload & {
  action: EmailAction;
  deliveryId?: string;
  email: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredText(
  object: Record<string, unknown>,
  key: string,
  maxLength = 8_000,
) {
  const value = object[key];
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maxLength
  ) {
    throw new Error("Os dados do mapa estão incompletos para esta entrega.");
  }
}

function requiredArray(
  object: Record<string, unknown>,
  key: string,
  maxLength: number,
) {
  const value = object[key];
  if (!Array.isArray(value) || value.length > maxLength) {
    throw new Error("Os dados do mapa estão incompletos para esta entrega.");
  }
}

export function parseReportPayload(value: unknown): ReportExportPayload {
  if (!isRecord(value)) {
    throw new Error("Não foi possível preparar este mapa.");
  }

  const reportTier = value.reportTier;
  if (reportTier !== "free" && reportTier !== "premium") {
    throw new Error("Escolha uma versão válida do mapa.");
  }

  const analysis = value.analysis;
  if (!isRecord(analysis)) {
    throw new Error("Gere o mapa novamente antes de continuar.");
  }

  const person = analysis.person;
  const bigThree = analysis.bigThree;
  const pattern = analysis.pattern;
  const themeDeepDive = analysis.themeDeepDive;
  const numerology = analysis.numerology;
  const premium = analysis.premium;

  if (
    !isRecord(person) ||
    !isRecord(bigThree) ||
    !isRecord(pattern) ||
    !isRecord(themeDeepDive) ||
    !isRecord(numerology) ||
    !isRecord(premium)
  ) {
    throw new Error("Os dados do mapa estão incompletos para esta entrega.");
  }

  requiredText(person, "firstName", 120);
  requiredText(person, "fullName", 240);
  requiredText(person, "birthDate", 20);
  requiredText(person, "location", 300);
  requiredText(analysis, "summary", 12_000);
  requiredText(themeDeepDive, "id", 40);
  requiredText(themeDeepDive, "label", 80);
  requiredText(themeDeepDive, "headline", 500);
  requiredText(themeDeepDive, "introduction", 12_000);
  requiredArray(themeDeepDive, "sections", 12);
  requiredArray(analysis, "readings", 20);
  requiredArray(analysis, "allThemes", 5);
  requiredArray(analysis, "placements", 24);
  requiredArray(analysis, "aspects", 24);
  requiredArray(analysis, "notes", 12);
  requiredArray(premium, "chapters", 16);
  requiredArray(premium, "actionPlan", 8);
  requiredArray(premium, "reflectionQuestions", 12);

  return {
    analysis: analysis as unknown as AnalysisResult,
    reportTier,
  };
}

export function parseEmailPayload(value: unknown): EmailMapPayload {
  if (!isRecord(value)) {
    throw new Error("Não foi possível preparar este e-mail.");
  }

  const { analysis, reportTier } = parseReportPayload(value);
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const action = value.action;
  const deliveryId =
    typeof value.deliveryId === "string" ? value.deliveryId.trim() : "";

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    throw new Error("Informe um e-mail válido para receber o mapa.");
  }

  if (action !== "preview" && action !== "send") {
    throw new Error("Escolha uma ação válida para o e-mail.");
  }

  if (
    action === "send" &&
    deliveryId &&
    !/^[a-zA-Z0-9-]{8,128}$/.test(deliveryId)
  ) {
    throw new Error("Não foi possível identificar este envio.");
  }

  return {
    action,
    analysis,
    deliveryId,
    email: email.toLowerCase(),
    reportTier,
  };
}

export function reportFilename(
  analysis: AnalysisResult,
  reportTier: ExportTier,
) {
  const safeName =
    analysis.person.firstName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "Mapa";

  return `AstroIA-${safeName}-${
    reportTier === "premium" ? "Premium" : "Essencial"
  }.pdf`;
}
