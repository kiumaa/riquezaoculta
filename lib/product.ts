import { getSettings } from "@/lib/storage";

export type ProductType = "quiz" | "ebook";

/**
 * Decide se um checkout corresponde ao relatório do Quiz ou ao Ebook.
 *
 * Fonte primária: o flag `product` guardado no `providerPayload` no momento do
 * charge ("quiz" | "ebook" | "ebook_upsell"). Para linhas legadas sem o flag,
 * recorre ao limiar de preço: o Quiz é o produto mais barato (<= priceQuiz).
 *
 * `priceQuiz` deve vir de `getSettings()` (a fonte de verdade) — nunca de um
 * número mágico hardcoded.
 */
export function productTypeFrom(
  providerPayload: unknown,
  amount: number,
  priceQuiz: number
): ProductType {
  const payload =
    providerPayload && typeof providerPayload === "object"
      ? (providerPayload as Record<string, unknown>)
      : null;
  const product = payload && typeof payload.product === "string" ? payload.product : undefined;

  if (product === "quiz") return "quiz";
  if (product === "ebook" || product === "ebook_upsell") return "ebook";

  return amount <= priceQuiz ? "quiz" : "ebook";
}

/** Variante assíncrona que lê `priceQuiz` das settings. */
export async function resolveProductType(
  providerPayload: unknown,
  amount: number
): Promise<ProductType> {
  const { priceQuiz } = await getSettings();
  return productTypeFrom(providerPayload, amount, priceQuiz);
}
