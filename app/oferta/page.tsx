import { getFunnelContentMap, getSettings, getWhatsAppGroupLink } from "@/lib/storage";
import OfertaClient from "./client";

export const dynamic = "force-dynamic";

export default async function OfertaPage() {
  const [prices, c, whatsappLink] = await Promise.all([getSettings(), getFunnelContentMap("oferta"), getWhatsAppGroupLink()]);
  return (
    <OfertaClient
      initialPrices={prices}
      whatsappLink={whatsappLink}
      content={{
        headline:      c.headline      ?? "Riqueza Oculta: Guia Definitivo",
        subheading:    c.subheading    ?? "descobre os pilares estratégicos que separam quem gera resultados reais de quem apenas observa. Não é sobre sofrer mais, é sobre dominar o sistema.",
        cta_text:      c.cta_text      ?? "DESBLOQUEAR AGORA",
        guarantee_text: c.guarantee_text ?? "Se não ficares satisfeito, devolvemos 100% do valor. Sem perguntas.",
        scarcity_text: c.scarcity_text ?? "Restam 14 vagas ao preço promocional",
        social_proof:  c.social_proof  ?? "327+ pessoas já garantiram o seu acesso",
        bullets: [
          c.bullet_1 ?? "Os 5 Pilares da Riqueza Mental",
          c.bullet_2 ?? "Como Reprogramar Crenças Limitantes",
          c.bullet_3 ?? "Hábitos Estratégicos de Foco",
          c.bullet_4 ?? "A Fórmula do Crescimento Financeiro",
          c.bullet_5 ?? "Checklist de Hábitos Diários",
          c.bullet_6 ?? "Garantia de 7 dias ou dinheiro de volta",
        ],
      }}
    />
  );
}
