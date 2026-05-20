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
        testimonial_1_name:  c.testimonial_1_name  ?? "Maria Santos",
        testimonial_1_text:  c.testimonial_1_text  ?? "Fiz o simulador por curiosidade e fiquei chocada com o resultado.",
        testimonial_1_stars: c.testimonial_1_stars ?? "5",
        testimonial_2_name:  c.testimonial_2_name  ?? "Carlos Mendes",
        testimonial_2_text:  c.testimonial_2_text  ?? "Sempre achei que o problema era o salário. O guia mostrou-me que o problema era a minha forma de pensar.",
        testimonial_2_stars: c.testimonial_2_stars ?? "5",
        testimonial_3_name:  c.testimonial_3_name  ?? "João Ferreira",
        testimonial_3_text:  c.testimonial_3_text  ?? "Comprei sem muita expectativa, mas o conteúdo é directo ao ponto.",
        testimonial_3_stars: c.testimonial_3_stars ?? "5",
        testimonial_4_name:  c.testimonial_4_name  ?? "Ana Pereira",
        testimonial_4_text:  c.testimonial_4_text  ?? "O perfil que recebi descreveu-me exactamente. Senti que foi feito para mim.",
        testimonial_4_stars: c.testimonial_4_stars ?? "5",
        testimonial_5_name:  c.testimonial_5_name  ?? "José Nunes",
        testimonial_5_text:  c.testimonial_5_text  ?? "Vale muito mais do que o preço.",
        testimonial_5_stars: c.testimonial_5_stars ?? "4",
        testimonial_6_name:  c.testimonial_6_name  ?? "Etiene Kimbangu",
        testimonial_6_text:  c.testimonial_6_text  ?? "Nunca pensei que um quiz pudesse revelar tanto sobre mim.",
        testimonial_6_stars: c.testimonial_6_stars ?? "5",
      }}
    />
  );
}
