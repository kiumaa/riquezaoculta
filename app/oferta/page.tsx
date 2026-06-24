import { getFunnelContentMap, getSettings, getSocialProofEnabled } from "@/lib/storage";
import OfertaClient from "./client";

// ISR: preços/conteúdo da oferta mudam raramente (via admin). Revalida a cada 5 min.
export const revalidate = 300;

export default async function OfertaPage() {
  const [prices, c, socialProofEnabled] = await Promise.all([
    getSettings(), getFunnelContentMap("oferta"), getSocialProofEnabled()
  ]);
  return (
    <OfertaClient
      initialPrices={prices}
      socialProofEnabled={socialProofEnabled}
      content={{
        headline:      c.headline      ?? "1M em Uma Semana: o guia definitivo",
        subheading:    c.subheading    ?? "descobre o plano exato de 7 dias para estruturar uma oferta irresistível, fechar vendas agressivas e bater a meta de 1.000.000 Kz rápido.",
        cta_text:      c.cta_text      ?? "DESBLOQUEAR AGORA",
        guarantee_text: c.guarantee_text ?? "Se não ficares satisfeito, devolvemos 100% do valor. Sem perguntas.",
        scarcity_text: c.scarcity_text ?? "Restam 14 vagas ao preço promocional",
        social_proof:  c.social_proof  ?? "327+ pessoas já garantiram o seu acesso",
        bullets: [
          c.bullet_1 ?? "O Plano Diário (Dia 1 ao Dia 7)",
          c.bullet_2 ?? "Como Estruturar uma Oferta Irresistível",
          c.bullet_3 ?? "Script de Vendas Agressivo por WhatsApp",
          c.bullet_4 ?? "Técnicas de Fecho de Vendas e Objeções",
          c.bullet_5 ?? "Checklist de Execução Rápida",
          c.bullet_6 ?? "Garantia de 7 dias ou dinheiro de volta",
        ],
        testimonial_1_name:  c.testimonial_1_name  ?? "Maria Santos",
        testimonial_1_text:  c.testimonial_1_text  ?? "Achei que era impossível, mas fechei 300 mil Kz logo no terceiro dia só a mudar a minha oferta.",
        testimonial_1_stars: c.testimonial_1_stars ?? "5",
        testimonial_2_name:  c.testimonial_2_name  ?? "Carlos Mendes",
        testimonial_2_text:  c.testimonial_2_text  ?? "O script de WhatsApp pagou o guia 10x logo na primeira hora de aplicação. Brutal!",
        testimonial_2_stars: c.testimonial_2_stars ?? "5",
        testimonial_3_name:  c.testimonial_3_name  ?? "João Ferreira",
        testimonial_3_text:  c.testimonial_3_text  ?? "Sem teorias. É ler, copiar, colar e ver o dinheiro a entrar no Multicaixa Express.",
        testimonial_3_stars: c.testimonial_3_stars ?? "5",
        testimonial_4_name:  c.testimonial_4_name  ?? "Ana Pereira",
        testimonial_4_text:  c.testimonial_4_text  ?? "A minha oferta era fraca. Depois de aplicar a estratégia do dia 2, os clientes pararam de pedir descontos.",
        testimonial_4_stars: c.testimonial_4_stars ?? "5",
        testimonial_5_name:  c.testimonial_5_name  ?? "José Nunes",
        testimonial_5_text:  c.testimonial_5_text  ?? "O método mais direto e focado em vendas que já vi no mercado angolano.",
        testimonial_5_stars: c.testimonial_5_stars ?? "4",
        testimonial_6_name:  c.testimonial_6_name  ?? "Etiene Kimbangu",
        testimonial_6_text:  c.testimonial_6_text  ?? "Fiz o meu primeiro milhão em 9 dias. Passou um pouco da semana, mas valeu cada kwanza!",
        testimonial_6_stars: c.testimonial_6_stars ?? "5",
      }}
    />
  );
}
