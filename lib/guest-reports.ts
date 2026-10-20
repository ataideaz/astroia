async function database() { return (await import("cloudflare:workers")).env.DB; }
async function digest(value: string) {
 const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
 return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}
import { createAstroAnalysis, type AnalyzeRequest, type AnalysisResult } from "./astro-analysis";
import { paymentsEnabled } from "./asaas";

export async function limitRequest(request: Request, scope: string, limit: number) {
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const bucket = Math.floor(Date.now() / 3600000);
  const key = await digest(`${scope}:${ip}:${bucket}`);
  const result = await (await database()).prepare(`INSERT INTO guest_limits (id, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`)
    .bind(key, Date.now() + 7200000, limit).first();
  if (!result) throw new Error("Limite temporário atingido. Tente novamente em uma hora.");
  await (await database()).prepare("DELETE FROM guest_limits WHERE expires_at < ?").bind(Date.now()).run();
}
export async function createGuestReport(input: AnalyzeRequest, allowUnpaidPremium = false) {
  const reportTier = allowUnpaidPremium && input.reportTier === "premium" ? "premium" : "free";
  const request = { ...input, theme: "personalidade", reportTier };
  const full = await createAstroAnalysis(request);
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
  await (await database()).prepare("INSERT INTO guest_reports (token_hash, request_json, analysis_json, created_at) VALUES (?, ?, ?, ?)")
    .bind(await digest(token), JSON.stringify(request), JSON.stringify(full), Date.now()).run();
  return { ...(reportTier === "premium" ? full : preview(full)), reportToken: token };
}
export function preview(full: AnalysisResult): AnalysisResult {
  return { ...full, placements: [], midheaven: null, aspects: [], readings: [], allThemes: [],
    premium: { headline: "", introduction: "", chapters: [], actionPlan: [], reflectionQuestions: [] },
    themeDeepDive: { ...full.themeDeepDive, sections: full.themeDeepDive.sections.slice(0, 1) },
    zodiacPortrait: full.zodiacPortrait ? { ...full.zodiacPortrait, premiumLayers: [] } : undefined,
    currentSky: { ...full.currentSky, highlights: [], summary: "", moonPhase: { label: "", angle: 0, text: "" } },
    pattern: { ...full.pattern, strengths: full.pattern.strengths.slice(0, 1), watchouts: full.pattern.watchouts.slice(0, 1) },
  };
}
export async function getGuestReport(token: unknown) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw new Error("Link privado inválido.");
  const row = await (await database()).prepare("SELECT request_json, analysis_json, order_id, checkout_url FROM guest_reports WHERE token_hash = ?")
    .bind(await digest(token)).first<{ request_json: string; analysis_json: string; order_id: string | null; checkout_url: string | null }>();
  if (!row) throw new Error("Relatório não encontrado. Confira o link privado.");
  const full = JSON.parse(row.analysis_json) as AnalysisResult;
  const requestedPremium = JSON.parse(row.request_json).reportTier === "premium";
  const order = row.order_id ? await (await database()).prepare("SELECT status FROM payment_orders WHERE id = ?").bind(row.order_id).first<{status: string}>() : null;
  const paid = order?.status === "approved" || (!paymentsEnabled() && requestedPremium);
  return { analysis: paid ? full : preview(full), reportTier: paid ? "premium" as const : "free" as const, orderId: row.order_id, checkoutUrl: row.checkout_url };
}
export async function attachOrder(token: string, orderId: string, checkoutUrl = "") {
  await (await database()).prepare("UPDATE guest_reports SET order_id = ?, checkout_url = ? WHERE token_hash = ?").bind(orderId, checkoutUrl, await digest(token)).run();
}
