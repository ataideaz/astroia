import { dayInBrazil, sourceOf, type Attribution } from "./attribution";

export type SiteEventType = "visit" | "map" | "checkout";

/** Conta um passo do funil. Anônimo: só dia, tipo e origem. Nunca derruba a requisição. */
export async function recordSiteEvent(type: SiteEventType, attribution: Attribution | null | undefined) {
  try {
    const { env } = await import("cloudflare:workers");
    await env.DB.prepare("INSERT INTO site_events (day, type, source, campaign, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(dayInBrazil(), type, sourceOf(attribution), attribution?.campaign ?? null, Date.now()).run();
  } catch {
    // A contagem é só estatística: se falhar, o site segue normal.
  }
}
