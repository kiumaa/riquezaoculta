"use client";

import { type SVGProps, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — filename contains spaces
import ebookCover from "@/assets/main ebook cover.png";
import avatarMaria from "@/assets/avatar_maria.jpg";
import avatarCarlos from "@/assets/avatar_carlos.png";
import avatarJoao from "@/assets/avatar_joao.jpg";
import avatarAna from "@/assets/avatar_ana.png";
import avatarJose from "@/assets/avatar_jose.jpg";
import avatarEtiene from "@/assets/avatar_etiene.png";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { trackEvent } from "@/lib/pixel";
import { SocialProofBar } from "@/components/funnel/social-proof-bar";
import { ChatWidget } from "@/components/funnel/chat-widget";

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const testimonials = [
  {
    name: "Maria Santos",
    avatar: avatarMaria,
    stars: 5,
    text: "Fiz o simulador por curiosidade e fiquei chocada com o resultado. Em 3 semanas mudei 2 hábitos que estavam a sabotar as minhas finanças.",
  },
  {
    name: "Carlos Mendes",
    avatar: avatarCarlos,
    stars: 5,
    text: "Sempre achei que o problema era o salário. O guia mostrou-me que o problema era a minha forma de pensar. Recomendo a toda a gente.",
  },
  {
    name: "João Ferreira",
    avatar: avatarJoao,
    stars: 5,
    text: "Comprei sem muita expectativa, mas o conteúdo é directo ao ponto. Sem teorias, só estratégias que funcionam mesmo.",
  },
  {
    name: "Ana Pereira",
    avatar: avatarAna,
    stars: 5,
    text: "O perfil que recebi descreveu-me exactamente. Senti que foi feito para mim. Já indiquei a 4 amigas.",
  },
  {
    name: "José Nunes",
    avatar: avatarJose,
    stars: 4,
    text: "Vale muito mais do que o preço. Tenho lido e relido o guia — cada vez encontro algo novo para aplicar.",
  },
  {
    name: "Etiene Kimbangu",
    avatar: avatarEtiene,
    stars: 5,
    text: "Nunca pensei que um quiz pudesse revelar tanto sobre mim. Os exercícios práticos mudam mesmo a mentalidade.",
  },
];

const bullets = [
  "Os 5 Pilares da Riqueza Mental",
  "Como Reprogramar Crenças Limitantes",
  "Hábitos Estratégicos de Foco",
  "A Fórmula do Crescimento Financeiro",
  "Checklist de Hábitos Diários",
  "Garantia de 7 dias ou dinheiro de volta",
];

export default function OfertaClient({
  initialPrices
}: {
  initialPrices: { priceOriginal: number; pricePromo: number };
}) {
  const name = useFunnelStore(state => state.name);
  const result = useFunnelStore(state => state.result);

  useEffect(() => {
    trackEvent("ViewContent", { content_name: "Oferta Riqueza Oculta", value: initialPrices.pricePromo, currency: "AOA" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % testimonials.length), 3500);
    return () => clearInterval(t);
  }, []);

  const [timeLeft, setTimeLeft] = useState(15 * 60);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const prices = initialPrices;

  return (
    <FunnelShell>
      <ChatWidget />
      <GlassCard>
        <div className="space-y-6">

          {/* Social proof topbar */}
          <SocialProofBar />

          {/* Header */}
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
              <span className="mr-2 inline-block animate-glow-pulse">◆</span>
              Passo 3 de 5
            </p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Riqueza Oculta: Guia Definitivo</h1>
            <p className="text-sm leading-relaxed text-soft">
              {name ? `${name}, descobre` : "Descobre"} os pilares estratégicos que separam quem gera resultados reais de quem apenas observa.
              {result ? ` ${result.offerAngle}` : ""} Não é sobre sofrer mais, é sobre dominar o sistema.
            </p>
          </div>

          {/* Como funciona */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { n: "①", label: "Completas o simulador" },
              { n: "②", label: "Recebes o guia" },
              { n: "③", label: "Aplicas e transformas" },
            ].map(s => (
              <div key={s.n} className="rounded-xl border border-white/[0.05] bg-black/20 px-2 py-3 space-y-1">
                <p className="text-lg font-bold text-brand">{s.n}</p>
                <p className="text-[11px] font-semibold text-ink leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Imagem centrada */}
          <div className="mx-auto w-48 drop-shadow-[0_24px_48px_rgba(32,230,126,0.18)] sm:w-56">
            <Image src={ebookCover} alt="Riqueza Oculta: Guia Definitivo" className="w-full rounded-lg object-contain" />
          </div>

          {/* Bullets + preço — mesma largura que o botão */}
          <div className="space-y-3">
            <ul className="space-y-2">
              {bullets.map(item => (
                <li key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/20 px-4 py-2.5 text-sm text-soft/90">
                  <CheckIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Price block + CTA */}
            <div className="rounded-xl border border-brand/20 bg-brand/[0.07] p-4 text-center space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Investimento único</p>
              <div className="flex items-end justify-center gap-3">
                <span className="text-lg text-soft/40 line-through">{prices.priceOriginal.toLocaleString("pt-PT")} Kz</span>
                <span className="text-3xl font-semibold text-brand leading-none">{prices.pricePromo.toLocaleString("pt-PT")} Kz</span>
              </div>
              {name && result ? (
                <p className="text-xs text-soft/70">
                  Preço reservado para <strong className="text-soft">{name}</strong> com base no teu perfil &ldquo;{result.profileTitle}&rdquo;
                </p>
              ) : null}
              <div className="flex flex-col items-center gap-1 rounded-xl border border-red-400/25 bg-red-400/[0.09] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400/70">Oferta expira em</p>
                <p className="text-3xl font-bold tabular-nums text-red-300">{mm}:{ss}</p>
              </div>
              {/* Escassez */}
              <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.08] px-3 py-2">
                <span className="text-sm text-yellow-400">⚠️ Restam <strong>14 vagas</strong> ao preço promocional</span>
              </div>
              {/* Contador */}
              <p className="text-xs text-muted">
                <span className="font-bold text-brand">327+ pessoas</span> já garantiram o seu acesso
              </p>
              <p className="text-xs text-muted">Sem mensalidade. Acesso imediato após pagamento.</p>
              {/* Garantia */}
              <div className="flex items-start gap-2 rounded-xl border border-soft/10 bg-white/[0.03] px-3 py-2.5 text-left">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <p className="text-[11px] font-semibold text-soft/90">Garantia de 7 Dias sem Risco</p>
                  <p className="text-[10px] text-soft/50 leading-relaxed">Se não ficares satisfeito, devolvemos 100% do valor. Sem perguntas.</p>
                </div>
              </div>
              <Link
                href="/checkout/pagamento"
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative">DESBLOQUEAR AGORA</span>
              </Link>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <LockIcon className="h-3 w-3" />
                Pagamento seguro via Multicaixa / Internet Banking
              </p>
            </div>
          </div>

          {/* Testemunhos — carrossel automático */}
          <div className="space-y-3">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted">O que dizem os nossos leitores</p>
            <div className="relative">
              {testimonials.map((t, i) => (
                <div
                  key={t.name}
                  className={`rounded-xl border border-white/[0.05] bg-black/20 p-4 space-y-3 transition-opacity duration-500 ${i === slide ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
                >
                  <div className="flex items-center gap-3">
                    <Image src={t.avatar} alt={t.name} width={40} height={40} className="rounded-full object-cover w-10 h-10 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{t.name}</p>
                      <p className="text-xs text-brand tracking-tight">{"★".repeat(t.stars)}{"☆".repeat(5 - t.stars)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-soft/80 leading-relaxed">{t.text}</p>
                </div>
              ))}
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-1.5">
              {testimonials.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  aria-label={`Ver testemunho de ${t.name}`}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${i === slide ? "w-5 bg-brand" : "w-1.5 bg-white/20"}`}
                />
              ))}
            </div>
          </div>

        </div>
      </GlassCard>
    </FunnelShell>
  );
}
