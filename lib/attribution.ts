// Origem de cada visita/mapa/venda (UTM e afins). Usado no navegador e no servidor.

export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  referrer?: string;
  landing?: string;
  at?: number;
};

/** Dados extras só para a API de Conversões da Meta (somente com consentimento). */
export type AdSignals = {
  consent?: boolean;
  fbp?: string;
  fbc?: string;
};

function clean(value: unknown, max = 80) {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/[\u0000-\u001f<>"]/g, "").trim().slice(0, max);
  return text || undefined;
}

/**
 * Nome de campanha/anúncio legível: "AstroIA+-+Vendas" vira "AstroIA - Vendas"
 * (alguns apps mandam o espaço como "+" ou "%20"). Se a Meta não trocou a
 * variável ({{campaign.name}}), fica sem nome: não dá para saber a campanha.
 */
export function normalizeName(value: string | null | undefined) {
  if (!value) return undefined;
  let text = value.replace(/\+/g, " ");
  try { text = decodeURIComponent(text); } catch { /* já estava decodificado */ }
  text = text.replace(/\s+/g, " ").trim();
  if (!text || /\{\{.*\}\}/.test(text)) return undefined;
  return text;
}

export function cleanAttribution(input: unknown): Attribution {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const at = Number(raw.at);
  return {
    source: clean(raw.source)?.toLowerCase(),
    medium: clean(raw.medium)?.toLowerCase(),
    campaign: normalizeName(clean(raw.campaign, 160))?.slice(0, 120),
    content: normalizeName(clean(raw.content, 160))?.slice(0, 120),
    term: clean(raw.term),
    fbclid: clean(raw.fbclid, 500),
    referrer: clean(raw.referrer)?.toLowerCase(),
    landing: clean(raw.landing, 120),
    at: Number.isFinite(at) && at > 0 ? at : undefined,
  };
}

export function cleanAdSignals(input: unknown): AdSignals {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const fbp = clean(raw.fbp, 200);
  const fbc = clean(raw.fbc, 600);
  return {
    consent: raw.consent === true,
    fbp: fbp && /^fb\.\d\.\d+\.\d+$/.test(fbp) ? fbp : undefined,
    fbc: fbc && /^fb\.\d\.\d+\./.test(fbc) ? fbc : undefined,
  };
}

const SOCIAL: Record<string, string> = {
  "facebook.com": "facebook", "m.facebook.com": "facebook", "l.facebook.com": "facebook", "lm.facebook.com": "facebook",
  "instagram.com": "instagram", "l.instagram.com": "instagram",
  "tiktok.com": "tiktok", "t.co": "twitter", "x.com": "twitter",
  "youtube.com": "youtube", "wa.me": "whatsapp", "web.whatsapp.com": "whatsapp",
  "google.com": "google", "google.com.br": "google", "bing.com": "bing",
};

/** Nome curto da origem, para agrupar no painel. */
export function sourceOf(attribution: Attribution | null | undefined) {
  if (!attribution) return "direto";
  if (attribution.source) return attribution.source.slice(0, 40);
  if (attribution.fbclid) return "facebook";
  const host = attribution.referrer?.replace(/^www\./, "");
  if (host) return SOCIAL[host] || host.slice(0, 40);
  return "direto";
}

/** Dia no horário de Brasília (AAAA-MM-DD). */
export function dayInBrazil(time = Date.now()) {
  return new Date(time - 3 * 3600000).toISOString().slice(0, 10);
}

/** Lê UTM/fbclid/referência da página atual (somente no navegador). */
export function readAttributionFromPage(): Attribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const pick = (name: string) => params.get(name) || undefined;
  let referrer: string | undefined;
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host !== window.location.host) referrer = ref.host;
  } catch { /* referência inválida */ }
  const found: Attribution = {
    source: pick("utm_source"), medium: pick("utm_medium"), campaign: pick("utm_campaign"),
    content: pick("utm_content"), term: pick("utm_term"), fbclid: pick("fbclid"),
    referrer, landing: window.location.pathname.slice(0, 120), at: Date.now(),
  };
  const meaningful = found.source || found.campaign || found.fbclid || found.referrer;
  return meaningful ? cleanAttribution(found) : null;
}
