"use client";

import { useCallback, useEffect, useState } from "react";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { trackEvent } from "@/lib/pixel";
import { ChatWidget } from "@/components/funnel/chat-widget";

const PROOF_SLIDES = [
  {
    id: 1,
    name: "Cliente verificado",
    caption: "Recuperou o investimento em menos de 24 horas",
    placeholder: false,
    src: "/provas-sociais/prova-1.jpeg",
  },
  {
    id: 2,
    name: "Cliente verificado",
    caption: "Fechou o primeiro cliente de 50.000 Kz",
    placeholder: false,
    src: "/provas-sociais/prova-2.jpeg",
  },
  {
    id: 3,
    name: "Cliente verificado",
    caption: "Comprou com ceticismo — agora não larga o guia",
    placeholder: false,
    src: "/provas-sociais/prova-3.jpeg",
  },
  {
    id: 4,
    name: "Cliente verificado",
    caption: "Resultado incrível logo na primeira semana",
    placeholder: false,
    src: "/provas-sociais/prova-4.jpeg",
  },
  {
    id: 5,
    name: "Cliente verificado",
    caption: "Aplicou o método e já está a faturar",
    placeholder: false,
    src: "/provas-sociais/prova-5.jpeg",
  },
];

// Texto do CTA fixo (curto e chamativo) — garante bom enquadramento no botão
const CTA_LABEL = "QUERO ESTES RESULTADOS →";

export default function ProvasSociaisClient({
  content,
}: {
  content: {
    badge_text: string;
    headline: string;
    subtitle: string;
    cta_text: string;
    trust_badge: string;
  };
}) {
  const name = useFunnelStore((state) => state.name);
  const trackStep = useFunnelStore((state) => state.trackStep);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    trackStep("provas-sociais", "/provas-sociais");
    trackEvent("ViewContent", { content_name: "Provas Sociais" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegação manual (sem auto) — o user lê ao seu ritmo
  const prev = () => setSlide((s) => (s - 1 + PROOF_SLIDES.length) % PROOF_SLIDES.length);
  const next = () => setSlide((s) => (s + 1) % PROOF_SLIDES.length);

  const handleCheckoutClick = useCallback(() => {
    trackEvent("InitiateCheckout", { content_name: "Provas Sociais -> Checkout" });
    window.location.href = "/checkout/pagamento";
  }, []);

  return (
    <FunnelShell>
      <ChatWidget />
      <GlassCard>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
              <span className="mr-2 inline-block animate-glow-pulse">◆</span>
              {content.badge_text}
            </p>
            <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
              {name ? `${name}, ${content.headline.toLowerCase()}` : content.headline}
            </h1>
            <p className="text-sm leading-relaxed text-soft">
              {content.subtitle}
            </p>
          </div>

          {/* CTA topo */}
          <button
            type="button"
            onClick={handleCheckoutClick}
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span className="relative">{CTA_LABEL}</span>
          </button>

          {/* Carousel */}
          <div className="relative mx-auto w-full max-w-sm">
            {/* Setas de navegação */}
            <button
              type="button"
              onClick={prev}
              aria-label="Conversa anterior"
              className="absolute left-1 top-[42%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur transition hover:bg-black/80"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Conversa seguinte"
              className="absolute right-1 top-[42%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur transition hover:bg-black/80"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            {PROOF_SLIDES.map((p, i) => (
              <div
                key={p.id}
                className={`w-full transition-all duration-500 ${
                  i === slide
                    ? "relative opacity-100"
                    : "pointer-events-none absolute inset-0 opacity-0"
                }`}
              >
                {/* WhatsApp screenshot or placeholder */}
                {p.placeholder || !p.src ? (
                  /* ── Placeholder cinzento ── */
                  <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0b1e14] to-[#0a1a11]">
                    {/* Fake WhatsApp header */}
                    <div className="w-full rounded-t-2xl bg-[#1f2c34] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-white/10" />
                        <div className="space-y-1">
                          <div className="h-3 w-24 rounded-full bg-white/15" />
                          <div className="h-2 w-16 rounded-full bg-white/8" />
                        </div>
                      </div>
                    </div>

                    {/* Fake chat bubbles */}
                    <div className="flex flex-1 w-full flex-col gap-2.5 px-3 py-4">
                      {/* Received bubble */}
                      <div className="max-w-[75%] self-start rounded-xl rounded-tl-sm bg-[#1f2c34] px-3 py-2">
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-full rounded bg-white/10" />
                          <div className="h-2.5 w-4/5 rounded bg-white/10" />
                          <div className="h-2.5 w-3/5 rounded bg-white/8" />
                        </div>
                      </div>
                      {/* Sent bubble */}
                      <div className="max-w-[70%] self-end rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2">
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-full rounded bg-white/15" />
                          <div className="h-2.5 w-2/3 rounded bg-white/12" />
                        </div>
                      </div>
                      {/* Received bubble (longer) */}
                      <div className="max-w-[80%] self-start rounded-xl rounded-tl-sm bg-[#1f2c34] px-3 py-2">
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-full rounded bg-white/10" />
                          <div className="h-2.5 w-full rounded bg-white/10" />
                          <div className="h-2.5 w-4/5 rounded bg-white/8" />
                          <div className="h-2.5 w-2/5 rounded bg-white/6" />
                        </div>
                      </div>
                      {/* Sent bubble */}
                      <div className="max-w-[65%] self-end rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2">
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-full rounded bg-white/15" />
                          <div className="h-2.5 w-3/4 rounded bg-white/12" />
                        </div>
                      </div>
                      {/* Received bubble */}
                      <div className="max-w-[75%] self-start rounded-xl rounded-tl-sm bg-[#1f2c34] px-3 py-2">
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-full rounded bg-white/10" />
                          <div className="h-2.5 w-3/5 rounded bg-white/8" />
                        </div>
                      </div>
                    </div>

                    {/* Label */}
                    <p className="text-[10px] text-soft/40 pb-3">
                      Substituir por screenshot real
                    </p>
                  </div>
                ) : (
                  /* ── Screenshot real ── */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.src}
                    alt={`Conversa com ${p.name}`}
                    className="w-full rounded-2xl border border-white/[0.06] shadow-xl"
                  />
                )}

                {/* Caption */}
                <div className="mt-3 text-center">
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-soft/70 mt-0.5">{p.caption}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            {PROOF_SLIDES.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Ver conversa de ${p.name}`}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                  i === slide ? "w-5 bg-brand" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.08] px-3 py-2">
            <span className="text-xs text-yellow-400 font-medium">
              {content.trust_badge}
            </span>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleCheckoutClick}
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span className="relative">
              {content.cta_text}
            </span>
          </button>

          <p className="text-center text-[10px] text-muted">
            Só pagas quando decidires. Zero compromisso nesta etapa.
          </p>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
