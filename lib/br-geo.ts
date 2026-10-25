// Estados e regiões do Brasil, para o painel (contagem por região, sem dado pessoal).
export const UF_REGION: Record<string, string> = {
  AC: "Norte", AP: "Norte", AM: "Norte", PA: "Norte", RO: "Norte", RR: "Norte", TO: "Norte",
  AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste", PB: "Nordeste", PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",
  DF: "Centro-Oeste", GO: "Centro-Oeste", MT: "Centro-Oeste", MS: "Centro-Oeste",
  ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste",
  PR: "Sul", RS: "Sul", SC: "Sul",
};

const NAME_UF: Record<string, string> = {
  acre: "AC", amapa: "AP", amazonas: "AM", para: "PA", rondonia: "RO", roraima: "RR", tocantins: "TO",
  alagoas: "AL", bahia: "BA", ceara: "CE", maranhao: "MA", paraiba: "PB", pernambuco: "PE", piaui: "PI",
  "rio grande do norte": "RN", sergipe: "SE", "distrito federal": "DF", "federal district": "DF", goias: "GO",
  "mato grosso": "MT", "mato grosso do sul": "MS", "espirito santo": "ES", "minas gerais": "MG",
  "rio de janeiro": "RJ", "sao paulo": "SP", parana: "PR", "rio grande do sul": "RS", "santa catarina": "SC",
};

const plain = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** "Recife, Pernambuco, Brasil" → "PE" (só Brasil). */
export function ufFromLocation(location: string | undefined | null) {
  if (!location) return null;
  const parts = location.split(",").map(plain);
  const country = parts[parts.length - 1] ?? "";
  if (parts.length > 1 && !/^(brasil|brazil)$/.test(country)) return "EXT";
  for (const part of parts) if (NAME_UF[part]) return NAME_UF[part];
  return null;
}

/** Sigla do estado (ou EXT para outro país) a partir do Cloudflare. */
export function geoFromCf(cf: { country?: string; regionCode?: string } | undefined) {
  if (!cf?.country) return null;
  if (cf.country !== "BR") return "EXT";
  const uf = (cf.regionCode || "").toUpperCase();
  return UF_REGION[uf] ? uf : null;
}

export function regionOf(uf: string | null) {
  if (!uf) return "Não identificado";
  if (uf === "EXT") return "Fora do Brasil";
  return UF_REGION[uf] ?? "Não identificado";
}
