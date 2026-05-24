import { getFunnelContentMap, getSettings, getWhatsAppGroupLink } from "@/lib/storage";
import CheckoutPagamentoClient from "./client";

export const dynamic = "force-dynamic";

export default async function CheckoutPagamentoPage() {
  const [prices, c, whatsappLink] = await Promise.all([
    getSettings(),
    getFunnelContentMap("payment"),
    getWhatsAppGroupLink(),
  ]);

  return (
    <CheckoutPagamentoClient
      initialPrices={prices}
      whatsappLink={whatsappLink}
      content={{
        support_label:         c.support_label         ?? "Precisas de ajuda para pagar? Tem alguma dúvida?",
        support_cta:           c.support_cta           ?? "Falar com a equipa no WhatsApp",
        support_context:       c.support_context       ?? "Atendimento humano imediato",
        benefit_1:             c.benefit_1             ?? "Download imediato do Guia Definitivo",
        benefit_2:             c.benefit_2             ?? "Acesso ao Grupo VIP no WhatsApp",
        benefit_3:             c.benefit_3             ?? "Garantia de 7 dias sem risco",
        quick_replies: [
          c.quick_reply_1 ?? "É seguro pagar aqui?",
          c.quick_reply_2 ?? "O que recebo exactamente?",
          c.quick_reply_3 ?? "Como pago no ATM?",
          c.quick_reply_4 ?? "2499 Kz é muito caro?",
        ],
        vip_cta:               c.vip_cta               ?? "Aceder ao Grupo VIP →",
        vip_context_payment:   c.vip_context_payment   ?? "Ainda estás a confirmar o pagamento. O grupo fica disponível após confirmação.",
        vip_context_confirmed: c.vip_context_confirmed ?? "Pagamento confirmado! Entra na comunidade",
        testimonial_1_name:  c.testimonial_1_name  ?? "Maria Santos",
        testimonial_1_text:  c.testimonial_1_text  ?? "Fiz o simulador por curiosidade e em 3 semanas mudei 2 hábitos que estavam a sabotar as minhas finanças.",
        testimonial_1_stars: c.testimonial_1_stars ?? "5",
        testimonial_2_name:  c.testimonial_2_name  ?? "Carlos Mendes",
        testimonial_2_text:  c.testimonial_2_text  ?? "O guia mostrou-me que o problema era a minha forma de pensar. Recomendo a toda a gente.",
        testimonial_2_stars: c.testimonial_2_stars ?? "5",
        testimonial_3_name:  c.testimonial_3_name  ?? "João Ferreira",
        testimonial_3_text:  c.testimonial_3_text  ?? "Conteúdo directo ao ponto. Sem teorias, só estratégias que funcionam mesmo.",
        testimonial_3_stars: c.testimonial_3_stars ?? "5",
      }}
    />
  );
}
