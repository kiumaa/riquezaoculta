// Copy da VARIANTE B (agressiva, Meta-safe) por superfície do funil.
// A variante A é a copy atual (admin/defaults). Cada objeto é um override parcial:
// o componente faz { ...content, ...AB_COPY.x } quando a variante é "B".
//
// Princípio: persuasão afiada (dor, identidade, urgência, objeções, prova) SEM
// promessas de rendimento. Urgência sobre preço/vagas/acesso, nunca sobre ganho.

export const AB_COPY = {
  landing: {
    headline: "Ganhas dinheiro. Mas no fim do mês, para onde é que ele foi?",
    subtitle:
      "Não é o salário. Não é a crise. É um padrão invisível que decide por ti antes de pensares. Em 3 minutos descobres qual é o teu — e o primeiro passo para o quebrar.",
    cta_text: "Quero ver o que me está a travar →"
  },
  simulador: {
    step_label: "Falta 1 passo • a tua análise está pronta",
    headline: "Para onde enviamos o teu diagnóstico?",
    subtitle:
      "O teu resultado é único — baseado em como TU pensas sobre dinheiro. Deixa o WhatsApp e recebe-o já, com o plano para corrigir o teu ponto fraco.",
    cta_text: "Ver o meu resultado →",
    privacy_text: "🔒 Sem spam. Só o teu resultado."
  },
  oferta: {
    headline: "Pára de adiar. Em 7 dias montas uma oferta e começas a vender — passo a passo.",
    subheading:
      "Sem teorias. Um plano diário, Dia 1 ao Dia 7, com a oferta, os scripts de WhatsApp, o checkout e o fecho. Tu só executas.",
    cta_text: "QUERO COMEÇAR HOJE",
    guarantee_text:
      "Testa 7 dias. Se não for para ti, devolvemos cada kwanza — sem perguntas, sem letra pequena.",
    scarcity_text: "Preço promocional só enquanto houver vagas — depois sobe.",
    social_proof: "Junta-te a 327+ pessoas que já estão a aplicar",
    bullets: [
      "O plano diário do Dia 1 ao Dia 7 (é só seguir)",
      "A oferta que faz o cliente dizer sim sem pedir desconto",
      "Os scripts de WhatsApp que fecham a venda por ti",
      "Checkout simples para receber por Multicaixa/Express",
      "Como criar urgência real sem parecer desesperado",
      "Garantia de 7 dias — o risco é todo nosso"
    ] as string[]
  },
  resultado: {
    explanation_text:
      "O dinheiro passa pelas tuas mãos mas nunca fica — e agora sabes porquê. As tuas respostas expõem o padrão exato que te trava todos os meses.",
    closing_text:
      "Tens duas escolhas: fechar esta página e estar igual no próximo mês. Ou dar o primeiro passo agora.",
    cta_text: "Quero a solução agora →"
  },
  provas: {
    headline: "Vê quem já parou de adiar — e o que mudou em 48 horas",
    subtitle:
      "Conversas reais de quem comprou o Guia e aplicou. O próximo print aqui podes ser tu."
  },
  checkout: {
    benefit_1: "Acesso imediato ao Guia 1M em Uma Semana (logo após pagar)",
    benefit_2: "Entrada no Grupo VIP no WhatsApp com os outros alunos",
    benefit_3: "7 dias de garantia — ou devolvemos tudo",
    countdown_text: "O preço promocional segura por:",
    order_bump_title: "SIM! Quero também o Guia Riqueza Oculta",
    order_bump_subtitle:
      "Só nesta página: por +{preço} levas as estratégias avançadas para encontrar dinheiro que já é teu. Quando saíres do checkout, esta oferta desaparece.",
    order_bump_label: "Só aqui, só agora"
  }
};
