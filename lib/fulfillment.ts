import { getSettings } from "@/lib/storage";
import { resolveProductType } from "@/lib/product";

export type DeliverableId = "guia1m" | "bonus";

export type Deliverable = {
  id: DeliverableId;
  title: string;
  /** Nome do ficheiro em data/ (servido só pela rota de download autenticada). */
  file: string;
  /** Nome sugerido para o ficheiro descarregado. */
  downloadName: string;
};

const CATALOG: Record<DeliverableId, Deliverable> = {
  guia1m: {
    id: "guia1m",
    title: "Guia 1M em Uma Semana",
    file: "guia-1m-em-uma-semana.pdf",
    downloadName: "1M-em-Uma-Semana.pdf"
  },
  bonus: {
    id: "bonus",
    title: "Bónus: Riqueza Oculta",
    file: "Riqueza_Oculta.pdf",
    downloadName: "Riqueza-Oculta.pdf"
  }
};

export function getDeliverableById(id: string): Deliverable | undefined {
  return id === "guia1m" || id === "bonus" ? CATALOG[id] : undefined;
}

/**
 * Detecta se o order bump (bónus Riqueza Oculta) foi comprado.
 * Fonte primária: flag `orderBump` gravada no providerPayload no momento do charge.
 * Fallback legado (checkouts antigos sem flag): pagou acima do preço do ebook.
 */
function hasBonus(
  payload: Record<string, unknown> | null,
  amount: number,
  pricePromo: number
): boolean {
  const ob = payload?.orderBump;
  if (typeof ob === "number") return ob > 0;
  if (typeof ob === "boolean") return ob;
  return amount > pricePromo;
}

/**
 * Lista de entregáveis (ficheiros) a que um checkout pago dá direito.
 * - quiz → [] (análise é on-page, sem PDF)
 * - ebook/ebook_upsell → guia 1M (+ bónus se order bump)
 */
export async function getDeliverables(
  providerPayload: unknown,
  amount: number
): Promise<Deliverable[]> {
  const productType = await resolveProductType(providerPayload, amount);
  if (productType !== "ebook") return [];

  const { pricePromo } = await getSettings();
  const payload =
    providerPayload && typeof providerPayload === "object"
      ? (providerPayload as Record<string, unknown>)
      : null;

  const items: Deliverable[] = [CATALOG.guia1m];
  if (hasBonus(payload, amount, pricePromo)) items.push(CATALOG.bonus);
  return items;
}
