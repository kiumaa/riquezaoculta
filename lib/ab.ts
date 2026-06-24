// Framework de A/B testing leve.
//
// Cada teste tem variantes de peso igual. A atribuição é DETERMINÍSTICA a partir
// de um id de visitante (estável em localStorage), por isso o mesmo visitante vê
// sempre a mesma variante em todo o funil. A conversão é atribuída anexando as
// variantes ativas ao checkout (providerPayload.ab); o admin agrega daí.

export const AB_TESTS = {
  // Teste do título da página de oferta.
  oferta_headline: { variants: ["A", "B"] }
} as const;

export type ABTestKey = keyof typeof AB_TESTS;

/** Hash determinístico (djb2) → inteiro não-negativo. */
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Atribui uma variante de forma estável a partir do id de visitante. */
export function assignVariant(test: ABTestKey, visitorId: string): string {
  const variants = AB_TESTS[test].variants as readonly string[];
  return variants[hash(`${test}:${visitorId}`) % variants.length];
}
