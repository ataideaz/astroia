// Catálogo único de produtos do AstroIA. Preços só no servidor.
// Se um preço mudar aqui (ou na variável de ambiente), muda no site inteiro.
import { asaasAmountCents } from "./asaas";

export type ProductId = "map" | "compat" | "name";

export const PRODUCTS: Record<ProductId, { title: string; description: string }> = {
  map: {
    title: "AstroIA · Mapa completo",
    description: "Mapa astral completo com PDF. Pagamento único, sem assinatura.",
  },
  compat: {
    title: "AstroIA · Compatibilidade do casal",
    description: "Compatibilidade entre dois mapas. Pagamento único, sem assinatura.",
  },
  name: {
    title: "AstroIA · Numerologia do Nome",
    description: "Numerologia completa do nome. Pagamento único, sem assinatura.",
  },
};

export function productPrice(id: ProductId) {
  if (id === "map") return asaasAmountCents();
  const value = Number(
    id === "name" ? process.env.NAME_AMOUNT_CENTS || 990 : process.env.COMPAT_AMOUNT_CENTS || 1490,
  );
  if (!Number.isSafeInteger(value) || value < 100 || value > 9990) {
    throw new Error("Valor do produto não configurado.");
  }
  return value;
}

/**
 * Oferta v2 (OFFER_V2=1): quem compra o mapa completo leva a Numerologia do Nome
 * de bônus. O bônus fica gravado no pedido (item "name" com preço zero), então
 * quem comprou continua com ele mesmo se a oferta mudar depois.
 */
export function offerV2() {
  return process.env.OFFER_V2 === "1";
}

/**
 * Preço de cada item do pedido. Com o mapa: a Numerologia do Nome sai a zero (bônus da
 * oferta v2) e, na oferta de saída (quem ia fechar o pagamento), a Compatibilidade também.
 */
export function linePrices(items: ProductId[], bonus = offerV2(), exit = false) {
  const withMap = items.includes("map");
  return items.map((id) => ({
    id,
    cents: withMap && ((bonus && id === "name") || (exit && id === "compat")) ? 0 : productPrice(id),
  }));
}

export function orderTotal(items: ProductId[], bonus = offerV2(), exit = false) {
  return linePrices(items, bonus, exit).reduce((sum, line) => sum + line.cents, 0);
}

/** Lista limpa, sem repetição e sempre na mesma ordem. */
export function cleanItems(value: unknown): ProductId[] {
  const list = Array.isArray(value) ? value : [];
  return (["map", "compat", "name"] as ProductId[]).filter((id) => list.includes(id));
}

export function parseItems(json: string | null | undefined): ProductId[] {
  try {
    return cleanItems(JSON.parse(json || "[]"));
  } catch {
    return [];
  }
}
