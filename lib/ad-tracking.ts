// Rastreio no navegador: origem da visita (sempre, anônimo) e Pixel da Meta
// (somente depois que a pessoa aceita os cookies).
import { cleanAttribution, readAttributionFromPage, type AdSignals, type Attribution } from "./attribution";

const CONSENT_KEY = "astroia-cookies";
const ORIGIN_KEY = "astroia-origin";
const VISIT_KEY = "astroia-visit";
const PURCHASE_KEY = "astroia-pending-purchase";
const ORIGIN_DAYS = 30;

export type Consent = "granted" | "denied" | null;

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
declare global {
  interface Window { fbq?: Fbq; _fbq?: Fbq }
}

function read(storage: "local" | "session", key: string) {
  try { return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key); } catch { return null; }
}
function write(storage: "local" | "session", key: string, value: string | null) {
  try {
    const target = storage === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) target.removeItem(key); else target.setItem(key, value);
  } catch { /* navegação privada ou armazenamento bloqueado */ }
}

export function getConsent(): Consent {
  const value = read("local", CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setConsent(value: "granted" | "denied") {
  write("local", CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("astroia-consent", { detail: value }));
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event("astroia-open-cookies"));
}

/** Guarda a última origem com UTM/fbclid/site de referência (vale 30 dias). */
export function rememberAttribution() {
  const current = readAttributionFromPage();
  if (current) write("local", ORIGIN_KEY, JSON.stringify(current));
}

export function currentAttribution(): Attribution | null {
  try {
    const saved = read("local", ORIGIN_KEY);
    if (!saved) return null;
    const value = cleanAttribution(JSON.parse(saved));
    if (value.at && Date.now() - value.at > ORIGIN_DAYS * 86400000) { write("local", ORIGIN_KEY, null); return null; }
    return value;
  } catch { return null; }
}

/** Conta uma visita por sessão do navegador (anônimo). */
export function trackVisit() {
  trackFunnel("visit");
}

/** Conta um passo do funil uma única vez por sessão do navegador (anônimo). */
export function trackFunnel(type: "visit" | "offer_view" | "offer_open") {
  const key = type === "visit" ? VISIT_KEY : `astroia-ev-${type}`;
  if (read("session", key)) return;
  write("session", key, "1");
  const body = JSON.stringify({ type, attribution: currentAttribution() });
  try {
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* estatística: ignora */ }
}

function cookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Sinais para a API de Conversões (vazios sem consentimento). */
export function adSignals(): AdSignals {
  if (getConsent() !== "granted") return { consent: false };
  const origin = currentAttribution();
  const fbc = cookie("_fbc") || (origin?.fbclid ? `fb.1.${origin.at ?? Date.now()}.${origin.fbclid}` : undefined);
  return { consent: true, fbp: cookie("_fbp"), fbc };
}

/** Carrega o Pixel da Meta (só chamar com consentimento). */
export function loadMetaPixel(pixelId: string) {
  if (typeof window === "undefined" || window.fbq || !/^\d{5,20}$/.test(pixelId)) return;
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) (fbq.callMethod as (...a: unknown[]) => void)(...args); else fbq.queue!.push(args);
  } as Fbq;
  fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0"; fbq.queue = [];
  window.fbq = fbq; window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  // Sem eventos "adivinhados" pela Meta (ex.: Subscribe em cliques): só os nossos.
  fbq("set", "autoConfig", false, pixelId);
  fbq("init", pixelId);
  fbq("track", "PageView");
}

/** Evento no Pixel (ignora se não houver consentimento ou pixel). */
// Eventos que aconteceram antes da escolha no aviso de cookies. Ficam só na
// memória desta página: saem para a Meta apenas se a pessoa aceitar; se recusar
// (ou fechar a página), são descartados.
const pendingEvents: Array<[string, Record<string, unknown>, string | undefined]> = [];

export function metaEvent(name: string, params: Record<string, unknown> = {}, eventId?: string) {
  const consent = getConsent();
  if (consent === null) { if (pendingEvents.length < 10) pendingEvents.push([name, params, eventId]); return; }
  if (consent !== "granted" || !window.fbq) return;
  try { window.fbq("track", name, params, eventId ? { eventID: eventId } : undefined); } catch { /* ignora */ }
}

/** Chamado logo depois do "Aceitar": envia o que ficou guardado. "Recusar" descarta. */
export function flushPendingEvents(granted: boolean) {
  const queued = pendingEvents.splice(0);
  if (granted) queued.forEach(([name, params, eventId]) => metaEvent(name, params, eventId));
}

/** Lembra a compra iniciada para disparar o Purchase quando ela for liberada. */
export function rememberPendingPurchase(orderId: string, value: number, items: string[]) {
  write("local", PURCHASE_KEY, JSON.stringify({ orderId, value, items, at: Date.now() }));
}

/** Se os produtos da compra pendente já estão liberados, dispara o Purchase uma vez. */
export function confirmPendingPurchase(owned: Record<string, boolean | undefined>) {
  try {
    const saved = read("local", PURCHASE_KEY);
    if (!saved) return;
    const pending = JSON.parse(saved) as { orderId: string; value: number; items: string[]; at: number };
    if (Date.now() - pending.at > 3 * 86400000) { write("local", PURCHASE_KEY, null); return; }
    if (!pending.items.length || !pending.items.every((item) => owned[item])) return;
    write("local", PURCHASE_KEY, null);
    metaEvent("Purchase", { currency: "BRL", value: pending.value, content_ids: pending.items, content_type: "product" }, pending.orderId);
  } catch { write("local", PURCHASE_KEY, null); }
}
