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
    id === "name" ? process.env.NAME_AMOUNT_CENTS || 1990 : process.env.COMPAT_AMOUNT_CENTS || 3200,
  );
  if (!Number.isSafeInteger(value) || value < 100 || value > 9990) {
    throw new Error("Valor do produto não configurado.");
  }
  return value;
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
