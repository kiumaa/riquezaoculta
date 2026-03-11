import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { z } from "zod";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(1000)
  })).max(20),
  name: z.string().max(80).optional()
});

const SYSTEM_PROMPT = `És a Sofia, assistente da Riqueza Oculta. O produto é um ebook sobre mentalidade e estratégia financeira vendido em Angola por 4500 Kz. O cliente tem garantia de 7 dias com devolução total. O utilizador está na página de checkout ou oferta. Responde em português angolano natural, de forma amigável e directa. Resolve objecções com confiança. Nunca inventes informação. As principais objecções são: preço (4500 Kz é acessível para o valor que oferece), confiança no site (site seguro, pagamento via Multicaixa/ATM), valor do produto (ebook + grupo VIP + garantia), processo de pagamento (ATM: Pagamentos de Serviços > Referências > Entidade > Referência; Internet Banking: Pagar por Referência), e o que recebem (download imediato do Guia Definitivo + acesso ao grupo VIP WhatsApp). Mantém respostas curtas (máximo 3 frases). Não uses asteriscos ou markdown.`;

export async function POST(req: NextRequest) {
  if (!env.GROK_API_KEY) {
    return NextResponse.json({ error: "Chat unavailable" }, { status: 503 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, name } = parsed.data;

  const systemContent = name
    ? `${SYSTEM_PROMPT} O nome do utilizador é ${name.split(" ")[0]}.`
    : SYSTEM_PROMPT;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: "grok-3-mini",
      messages: [
        { role: "system", content: systemContent },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 200
    })
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Chat service error" }, { status: 502 });
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? "Desculpa, não consegui responder. Tenta de novo.";

  return NextResponse.json({ reply });
}
