"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { trackCustomEvent } from "@/lib/pixel";
import { useABVariant } from "@/lib/use-ab";
import { AB_COPY } from "@/lib/ab-copy";

type LandingContent = {
  badge_text: string;
  headline: string;
  subtitle: string;
  cta_text: string;
  trust_badge_1: string;
  trust_badge_2: string;
};

export default function LandingClient({ content }: { content: LandingContent }) {
  const variant = useABVariant("entrada_copy");
  const c = variant === "B" ? { ...content, ...AB_COPY.landing } : content;

  useEffect(() => {
    trackCustomEvent("ViewLandingPage", { content_category: "Simulador" });
  }, []);

  return (
    <FunnelShell>
      <section className="space-y-8 text-center sm:space-y-10">

        {/* Badge com pulsing dot */}
        <div className="animate-fade-up mx-auto inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-brand/[0.08] px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-glow-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brandBright">
            {content.badge_text}
          </span>
        </div>

        {/* Headline */}
        <div className="animate-fade-up [animation-delay:0.1s] space-y-3">
          <h1 className="text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl">
            {c.headline}
          </h1>
        </div>

        {/* Body */}
        <p className="animate-fade-up [animation-delay:0.2s] mx-auto max-w-xl text-base leading-relaxed text-soft sm:text-lg">
          {c.subtitle}
        </p>

        {/* CTA */}
        <div className="animate-fade-up [animation-delay:0.3s] mx-auto max-w-sm">
          <Link
            href="/simulador/inicio"
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-base font-semibold text-[#04140c] shadow-hero transition-all duration-300 hover:scale-[1.02] hover:shadow-glow sm:text-lg"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span className="relative">{c.cta_text}</span>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="animate-fade-up [animation-delay:0.4s] mx-auto flex items-center justify-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="text-brand/50">◆</span>
            {content.trust_badge_1}
          </span>
          <span className="text-white/10">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-brand/50">◆</span>
            {content.trust_badge_2}
          </span>
        </div>

      </section>
    </FunnelShell>
  );
}
