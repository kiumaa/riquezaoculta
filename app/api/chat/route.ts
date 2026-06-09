import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(1000)
  })).max(20),
  name: z.string().max(80).optional()
});

const SYSTEM_PROMPT = `És a Sofia, consultora de vendas do guia 1M em Uma Semana — um guia prático e direto sobre como montar uma oferta, fazer copy agressiva, checkout e vender muito em 7 dias em Angola. O produto custa 2.499 Kz (preço promocional, valor normal 4.500 Kz) e inclui: guia prático completo em PDF + acesso ao grupo VIP no WhatsApp + garantia de 7 dias com devolução total sem perguntas.

PRODUTO ADICIONAL (ORDER BUMP):
- Guia Riqueza Oculta: + 999 Kz — estratégias avançadas de geração de riqueza que complementam o guia principal.
- Se o utilizador perguntar, explica que é uma oferta exclusiva disponível apenas no checkout, e que juntando os dois fica tudo por menos de 4.000 Kz.

MÉTODOS DE PAGAMENTO DISPONÍVEIS:
1. Multicaixa Express — pagamento directo no telemóvel (mais rápido)
2. Referência Multicaixa — pagar no ATM ou Internet Banking

INSTRUÇÕES DE PAGAMENTO:
- Express: insere número de telemóvel, recebes notificação no app Multicaixa Express para aprovar
- Referência: gera referência, anota Entidade e Referência, vai ao ATM → Pagamentos de Serviços → Referências → insere Entidade → Referência → Valor

O TEU TOM DE VOZ:
- Confiante, assertiva e persuasiva (como uma consultora de vendas de elite que sabe fechar)
- Usa português angolano natural ("olá", "tudo bem?", "então", "pois é", "não te preocupes")
- Curta e directa (máximo 2-3 frases curtas e de impacto)
- Sem markdown, asteriscos ou emojis excessivos (max 1 emoji por resposta)
- Sempre termina com uma pergunta que conduz à venda ou com um chamado claro à acção
- Usa linguagem de urgência: "as vagas estão a esgotar", "este preço não dura", "o investimento mais barato que podes fazer"

ESTRATÉGIA DE VENDA (AGRESSIVA):
- Cada resposta deve aproximar o utilizador do botão de pagamento
- Antecipa objecções e desmonta-as com confiança e dados
- Reforça: valor (ebook + comunidade VIP), urgência (vagas limitadas ao preço promocional + temporizador activo), garantia (7 dias sem risco = risco ZERO)
- Transforma "muito caro" em "mais caro é ficares onde estás"
- Destaca: acesso imediato, conteúdo exclusivo, comunidade no WhatsApp
- Usa frases de fecho: "Estás pronto para mudar?", "Clica agora e garante o teu lugar", "Se não agora, quando?"

O QUE NÃO FAZER:
- Nunca inventes informação que não esteja neste prompt
- Nunca prometas descontos adicionais
- Nunca digas que aceita outras formas de pagamento além das duas mencionadas
- Evita respostas robotizadas ou demasiado formais
- Nunca sejas passiva — sê sempre directa e orientada para o fecho da venda

CONTEXTO: O utilizador está a navegar no funil de vendas (quiz → resultado → oferta → checkout). Há um temporizador de urgência activo no checkout. Podes perguntar em que etapa está se necessário.`;

// ─── Fallback inteligente para quando a API não está disponível ──────────────
const FALLBACK_RESPONSES: Record<string, string> = {
  // Preço / valor / objeções de preço
  "caro": "2.499 Kz é menos de 10 Kz por dia durante um mês. Imagina o que podes aprender sobre finanças com este guia. E se não gostares, tens 7 dias para devolver. Sem risco!",
  "preço": "2.499 Kz é o preço promocional (era 4.500 Kz). Inclui ebook completo + grupo VIP no WhatsApp + garantia de 7 dias. Investimento pequeno, retorno potencialmente enorme!",
  "2499": "Exacto, 2.499 Kz! Preço promocional por tempo limitado. Já inclui o ebook, acesso ao grupo VIP e garantia de devolução. Queres que te explique como funciona o pagamento?",
  "valor": "Recebes o Guia Definitivo completo (PDF) com estratégias financeiras práticas, mais acesso ao grupo VIP no WhatsApp com conteúdo exclusivo. Tudo disponível imediatamente após pagamento!",
  "muito caro": "Entendo perfeitamente. Mas pensa: quanto gastas em coisas que não te acrescentam valor? Este guia pode mudar a tua relação com o dinheiro. E tens 7 dias para testar sem compromisso!",
  "desconto": "O preço actual já tem desconto (de 4.500 Kz para 2.499 Kz). Não posso fazer mais desconto, mas posso garantir-te que o valor do conteúdo supera em muito o preço. E tens 7 dias de garantia!",
  "barato": "É um investimento acessível comparado com o valor que podes retirar deste conhecimento. Muitos dos nossos leitores recuperam este valor em pouco tempo aplicando as estratégias!",
  "investimento": "Exacto, é um investimento no teu futuro financeiro. O conhecimento que vais adquirir pode gerar retornos muito superiores a estes 2.499 Kz. E com garantia de 7 dias, não tens nada a perder!",

  // Segurança / confiança / medo de fraude
  "seguro": "Totalmente seguro! Pagas via Multicaixa Express (no telemóvel) ou Referência no ATM/Internet Banking — métodos oficiais do BNA. O site usa ligação segura e tens garantia de 7 dias!",
  "confiança": "Percebo a tua cautela. Pagas através de métodos oficiais (Multicaixa), tens garantia de 7 dias para devolução, e recebes o ebook imediatamente após pagamento. Já somos muitos no grupo VIP!",
  "fraude": "De forma alguma! É pagamento oficial Multicaixa (Express ou Referência), regulado pelo BNA. Não pedimos dados bancários nem nada suspeito. Só pagas quando quiseres, e tens garantia total!",
  "confiavel": "Sim, é confiável! Usamos métodos de pagamento oficiais (Multicaixa), não guardamos dados bancários, e tens 7 dias de garantia. Se não receberes o ebook, devolvemos o dinheiro na hora!",
  "golpe": "Não é golpe nenhum! O pagamento é feito através de canais oficiais da Multicaixa (Express ou ATM), não pedimos dados sensíveis, e tens garantia de 7 dias. Testa e vês por ti!",
  "dados": "Não precisas de dar dados bancários nenhuns! Pagas por Multicaixa Express ou geras referência para o ATM. Nós só recebemos a confirmação do pagamento, nada mais.",
  "privacidade": "A tua privacidade é importante. Só pedimos nome e telemóvel para enviar o acesso. O pagamento é processado directamente pela Multicaixa, nunca vemos os teus dados bancários!",

  // Pagamento / ATM / Express / Como pagar
  "pagar": "Tens duas opções: 1) Multicaixa Express — insere o teu número de telemóvel e aprovas no app. 2) Referência — geras referência e pagas no ATM ou Internet Banking. Qual preferes?",
  "atm": "É simples: 1) Clica em GERAR REFERÊNCIA 2) Anota Entidade e Referência 3) Vai ao ATM → Pagamentos de Serviços → Referências 4) Introduz Entidade, depois Referência 5) Confirma o valor. Pronto!",
  "multicaixa": "Podes usar Multicaixa Express (recebes notificação no telemóvel para aprovar) ou Referência Multicaixa (pagas no ATM ou Internet Banking). Ambos são seguros e confirmam em minutos!",
  "express": "O Express é super prático! Insere o teu número de telemóvel, recebes uma notificação no app Multicaixa Express, aprovas o pagamento, e pronto! Mais rápido que ir ao ATM.",
  "referência": "A referência aparece depois de clicares em GERAR REFERÊNCIA. Vais ver a Entidade (número) e a Referência (número). Anota os dois e usa no ATM ou Internet Banking. Tens 30 minutos para pagar!",
  "internet banking": "No Internet Banking do teu banco, procura 'Pagar por Referência' ou 'Pagamentos'. Introduz a Entidade e Referência que aparecem no ecrã, confirma o valor (2.499 Kz), e pronto!",
  "banco": "Funciona com qualquer banco em Angola que tenha ATM Multicaixa ou Internet Banking — BFA, BIC, Atlântico, BPC, etc. Todos aceitam pagamento por referência!",
  "bfa": "Sim, funciona perfeitamente no BFA! Podes usar o Internet Banking ou ir a um ATM BFA. É o mesmo processo: Pagamentos de Serviços → Referências → Entidade → Referência.",
  "bic": "Sim, funciona no BIC! Podes usar o Internet Banking BIC ou qualquer ATM Multicaixa. O processo é o mesmo para todos os bancos em Angola.",
  "tempo": "O pagamento por Multicaixa Express é imediato (segundos). A referência no ATM demora alguns minutos a ser confirmada, mas normalmente é rápido. Em pouco tempo recebes o teu ebook!",
  "confirmar": "Não precisas de fazer nada! Assim que o pagamento for confirmado (minutos), recebes automaticamente o link para download do ebook e o acesso ao grupo WhatsApp. Tudo automático!",
  "como funciona": "É simples: 1) Escolhes o método (Express ou Referência) 2) Pagas 3) Recebes email/WhatsApp com o link do ebook e convite para o grupo VIP. Tudo imediato após confirmação do pagamento!",

  // O que recebe / conteúdo / entrega
  "recebo": "Recebes o Guia 1M em Uma Semana em PDF (podes ler no telemóvel ou computador) + convite para o grupo VIP no WhatsApp com conteúdo exclusivo. E tens garantia de 7 dias!",
  "ebook": "É um guia completo sobre mentalidade e estratégia financeira, com dezenas de páginas de conteúdo prático. Não são teorias vazias — são estratégias que podes aplicar já no teu dia a dia!",
  "pdf": "Sim, recebes em formato PDF. Podes abrir no telemóvel, tablet ou computador. E podes guardar para sempre, consultar quando quiseres!",
  "acesso": "Recebes acesso imediato! Assim que o pagamento for confirmado, aparece o botão de download no ecrã e recebes o link também. O grupo WhatsApp é por convite directo.",
  "download": "O download é instantâneo após confirmação do pagamento. Clicas no botão de download, guardas o PDF no teu dispositivo, e já podes começar a ler!",
  "whatsapp": "Sim! Tens acesso ao grupo VIP no WhatsApp onde partilhamos conteúdo extra, dicas semanais, e podes interagir com outros membros. É uma comunidade de pessoas focadas em crescer financeiramente!",
  "grupo": "O grupo VIP é no WhatsApp, exclusivo para quem compra o ebook. Lá dentro partilhamos conteúdo extra, dicas práticas, e podes fazer perguntas. É como ter um mentor financeiro na palma da mão!",
  "comunidade": "A comunidade no WhatsApp é incrível! São pessoas como tu e eu, focadas em melhorar a sua vida financeira. Partilhamos experiências, dicas e motivação. Vale muito a pena!",
  "entrega": "É tudo digital e imediato! Não há entrega física — recebes o ebook em PDF no teu telemóvel/email e o acesso ao grupo WhatsApp. Podes começar a ler já, no mesmo minuto!",
  "impresso": "Não, é ebook digital em PDF. A vantagem é que recebes imediatamente, podes ler no telemóvel onde estiveres, e não estraga nem se perde!",
  "ler": "Podes ler no telemóvel, tablet ou computador. O PDF abre com qualquer app de leitura (Adobe Reader, Google Drive, etc.). Muita gente lê no telemóvel no transporte ou antes de dormir!",
  "tempo ler": "Depende do teu ritmo, mas são cerca de 2-3 horas de leitura. Mas é um guia para consultar múltiplas vezes — sempre que precisares de orientação ou motivação!",
  "quando recebo": "Recebes imediatamente! Assim que o sistema confirmar o teu pagamento (minutos), tens acesso ao download do ebook e ao grupo WhatsApp. Sem espera!",

  // Garantia / devolução / risco
  "garantia": "Tens 7 dias de garantia total! Se por qualquer razão não ficares satisfeito, envias uma mensagem e devolvemos os 2.499 Kz sem perguntas nem burocracia. O risco é zero para ti!",
  "devolu": "Sim, durante 7 dias após a compra. Se não gostares, mandas mensagem a dizer que queres devolver e transferimos o valor de volta. Simples assim, sem complicações!",
  "dinheiro de volta": "Totalmente! Se nos primeiros 7 dias decidires que não é para ti, devolvemos 100% do valor. Não fazemos perguntas, não há letras pequeninas. É garantia de verdade!",
  "risco": "Zero risco! Pagas 2.499 Kz, tens 7 dias para experimentar o conteúdo e a comunidade. Se não valer a pena para ti, recebes o dinheiro de volta. Não tens nada a perder, só conhecimento a ganhar!",
  "testar": "É isso mesmo — podes testar durante 7 dias. Lê o ebook, entra no grupo WhatsApp, vê o valor. Se não ficares convencido, devolves e recebes o dinheiro. Justo, não achas?",
  "satisfação": "A tua satisfação é garantida. Ou ficas satisfeito com o ebook e a comunidade, ou recebes o dinheiro de volta. Não há cenário em que saias prejudicado!",

  // Urgência / escassez / tomada de decisão
  "quando": "O preço promocional de 2.499 Kz é por tempo limitado. Não posso garantir que amanhã ainda estará este valor. Se estás interessado, aproveita agora enquanto há vagas ao preço reduzido!",
  "depois": "Podes voltar mais tarde, mas não garanto que o preço ainda seja 2.499 Kz. O valor normal é 4.500 Kz e as vagas ao preço promocional são limitadas. Se queres aproveitar, agora é a hora!",
  "pensar": "Percebo que queiras pensar. Mas pergunta a ti mesmo: o que vai mudar daqui a umas horas? O preço promocional pode não estar disponível. E lembra-te, tens 7 dias de garantia para decidir em paz!",
  "decidir": "Decidir é difícil, por isso é que damos 7 dias de garantia. Compra agora ao preço promocional, vê o conteúdo com calma durante uma semana, e depois decide se ficas ou se pedes devolução!",
  "urgente": "Não é urgente em si, mas as vagas ao preço promocional de 2.499 Kz são limitadas. O preço normal é 4.500 Kz. Se queres aproveitar esta oportunidade, não deixes para depois!",
  "hoje": "Hoje é um bom dia porque o preço ainda está promocional. Mas honestamente, o melhor momento é quando estás pronto. Só te peço que não deixes passar este preço se te interessa o conteúdo!",
  "limitado": "Sim, as vagas ao preço promocional são limitadas. Não é marketing — é porque o valor do grupo VIP é alto e não podemos manter este preço para sempre. Aproveita enquanto podes!",

  // Dúvidas sobre o produto / conteúdo específico
  "conteúdo": "O ebook aborda mentalidade financeira, hábitos de poupança, estratégias de crescimento, e como escapar da rat race. É conteúdo prático, não teorias académicas. Aplica no dia seguinte!",
  "sobre o quê": "É sobre transformar a tua relação com o dinheiro. Vais aprender a pensar como quem prospera financeiramente, não como quem vive mês a mês. Estratégias práticas para Angolanos!",
  "para quem": "É para qualquer pessoa que queira melhorar a sua vida financeira em Angola. Tanto se ganhas pouco como se ganhas bem mas não consegues poupar, o guia dá-te ferramentas úteis.",
  "principiante": "Perfeito para principiantes! Não precisas de saber nada de finanças. O guia começa do básico e vai avançando. Qualquer pessoa consegue acompanhar e aplicar!",
  "experiente": "Mesmo que já saibas alguma coisa, o guia traz perspectivas novas e estratégias específicas para o contexto angolano. E o grupo VIP vale a pena pelas partilhas da comunidade!",
  "idade": "Não há idade mínima nem máxima. Desde jovens que querem começar bem, até pessoas mais velhas que querem reorganizar as finanças. O conteúdo é universal!",
  "crianças": "É mais direcionado para adultos, mas adolescentes responsáveis também podem beneficiar. Se tens filhos na idade de aprender sobre dinheiro, pode ser uma boa introdução!",
  "empresário": "Sim! Mesmo empresários beneficiam. Às vezes sabemos gerar dinheiro mas não sabemos gerir o pessoal. O guia ajuda nos dois lados — crescer e manter riqueza!",
  "funcionário": "É perfeito para funcionários! Vais aprender a maximizar o teu salário, poupar mesmo ganhando pouco, e criar hábitos que te levam à liberdade financeira. Não dependes do patrão!",
  "estudante": "Excelente para estudantes! Quanto mais cedo aprendes a gerir dinheiro, melhor. E 2.499 Kz é um investimento que fazes uma vez e beneficias para a vida toda!",

  // Outras dúvidas comuns
  "outras pessoas": "Já somos centenas no grupo VIP! Pessoas de todas as províncias, de diferentes profissões, todas focadas em crescer financeiramente. A comunidade é muito activa e de apoio!",
  "testemunho": "Tens testemunhos no site de pessoas reais que aplicaram o conteúdo. A Maria Santos mudou hábitos em 3 semanas, o Carlos percebeu que o problema era a mentalidade. Podes ler mais no site!",
  "resultados": "Os resultados variam conforme a aplicação, mas muitos leitores relatam que conseguem poupar mais, organizar melhor as finanças, e até encontrar novas fontes de rendimento. Depende de ti aplicar!",
  "tempo resultados": "Alguns hábitos podes mudar já no primeiro dia. Outros resultados demoram semanas ou meses. O importante é começar — e este guia dá-te o mapa para começar correctamente!",
  "dinheiro de volta quanto tempo": "Se pedires devolução dentro dos 7 dias, processamos em 24-48 horas úteis. O dinheiro volta para a tua conta por transferência bancária. É rápido e sem complicações!",
  "contactar": "Estou aqui para ajudar por chat! Também podes usar o email de suporte que recebes após a compra. E no grupo WhatsApp tens acesso directo à equipa e à comunidade!",
  "quem é sofia": "Sou a Sofia, assistente virtual do Guia 1M em Uma Semana! Estou aqui para tirar as tuas dúvidas sobre o ebook, ajudar com o processo de compra, e apoiar-te. Em que posso ajudar? 😊",
  "quem criou": "O Guia 1M em Uma Semana foi criado por uma equipa de especialistas em finanças pessoais e desenvolvimento pessoal, focados no contexto angolano. O grupo VIP é moderado pela equipa!",
  "empresa": "Somos a equipa do 1M em Uma Semana, focados em educação financeira para Angolanos. Já ajudámos centenas de pessoas a melhorarem a sua relação com o dinheiro através deste ebook e comunidade!",

  // Genérico / saudações / despedidas
  "olá": "Olá! Sou a Sofia, assistente do Guia 1M em Uma Semana. Tudo bem contigo? Estou aqui para tirar todas as tuas dúvidas sobre o ebook e o pagamento! 😊",
  "oi": "Oi! Tudo bem? Sou a Sofia, estou aqui para ajudar com qualquer dúvida sobre o Guia 1M em Uma Semana. Do que precisas?",
  "bom dia": "Bom dia! ☀️ Sou a Sofia, assistente do Guia 1M em Uma Semana. Em que posso ajudar-te hoje?",
  "boa tarde": "Boa tarde! 🌤️ Espero que estejas a ter um dia produtivo! Sou a Sofia, estou aqui para esclarecer as tuas dúvidas sobre o ebook!",
  "boa noite": "Boa noite! 🌙 Ainda acordado a pensar em finanças? Sou a Sofia, posso ajudar com qualquer dúvida sobre o Guia 1M em Uma Semana!",
  "obrigad": "De nada! Fico feliz em ajudar. Se surgir mais alguma dúvida, estou por aqui. E lembra-te, as vagas ao preço promocional são limitadas! 😊",
  "obrigada": "De nada! Fico feliz em ajudar. Se surgir mais alguma dúvida, estou por aqui. E lembra-te, as vagas ao preço promocional são limitadas! 😊",
  "valeu": "Valeu! Fico contente em ajudar. Qualquer coisa é só chamar. Boa sorte na tua jornada financeira! 💪",
  "adeus": "Adeus! Fico por aqui se precisares de mais alguma coisa. Lembra-te: o melhor investimento que podes fazer é em ti mesmo! Até já!",
  "tchau": "Tchau! Estou aqui se precisares. Não deixes escapar esta oportunidade de transformar as tuas finanças! 👋",
  "ajuda": "Posso ajudar-te com: preço (2.499 Kz promoção), métodos de pagamento (Express ou ATM), o que recebes (ebook + grupo VIP), garantia (7 dias), ou conteúdo do ebook. O que te interessa mais?",
  "?": "Tens dúvidas? Posso ajudar-te com o preço, formas de pagamento, o que recebes, garantia, ou conteúdo do ebook. Sobre o que queres saber?",
  "não sei": "Sem problema! Pergunta-me o que quiseres — preço, como pagar, o que vais receber, ou a garantia. Estou aqui para esclarecer tudo!",
  "interessado": "Excelente! Fico feliz que estejas interessado! Posso ajudar-te a esclarecer alguma dúvida antes de comprares, ou preferes ir directo ao checkout?",
  "quero comprar": "Perfeito! Clica no botão DESBLOQUEAR AGORA ou GERAR REFERÊNCIA/PAGAR COM EXPRESS e segue os passos. Se tiveres alguma dúvida durante o processo, estou aqui!",
  "compro": "Boa decisão! Vais ver que vale a pena. Clica no botão de pagamento, escolhe Express ou Referência, e em minutos tens o ebook e acesso ao grupo. Precisas de ajuda com algo?",
};

const DEFAULT_FALLBACK = "Boas pergunta! Posso ajudar-te com o preço (2.499 Kz promoção), métodos de pagamento (Multicaixa Express ou Referência no ATM/Internet Banking), o que recebes exactamente (ebook + grupo VIP), ou a garantia de 7 dias. Qual destes te interessa mais?";

function findFallbackResponse(userMessage: string, userName?: string): string {
  const msg = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Procurar pela keyword com melhor match
  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (msg.includes(normalizedKeyword)) {
      // Personalizar com o nome se disponível
      if (userName) {
        return response.replace(/^(Olá|Oi|Bom dia|Boa tarde|Boa noite)!/,
          `$1 ${userName.split(" ")[0]}!`);
      }
      return response;
    }
  }

  return DEFAULT_FALLBACK;
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  const { allowed } = consumeRateLimit(`chat:${ip}`, 15, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { reply: "Estás a enviar muitas mensagens. Espera um minutinho e tenta de novo 😊" },
      { status: 429 }
    );
  }

  // Parse body com try/catch
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, name } = parsed.data;
  const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content ?? "";

  const systemContent = name
    ? `${SYSTEM_PROMPT} O nome do utilizador é ${name.split(" ")[0]}.`
    : SYSTEM_PROMPT;

  // ─── 1) Tentar Google Gemini Flash (principal) ──────────
  if (env.GEMINI_API_KEY) {
    try {
      // Converter mensagens para o formato Gemini (contents)
      const geminiContents = messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemContent }] },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250
            }
          }),
          signal: AbortSignal.timeout(12_000)
        }
      );

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return NextResponse.json({ reply });
        }
      }

      console.error("[chat] Gemini error", res.status, await res.text().catch(() => ""));
    } catch (err) {
      console.error("[chat] Gemini fetch error", err instanceof Error ? err.message : err);
    }
  }


  // ─── Fallback inteligente ─────────────────
  const reply = findFallbackResponse(lastUserMessage, name);
  return NextResponse.json({ reply });
}
