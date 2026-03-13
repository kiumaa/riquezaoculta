"use client";

import { type CSSProperties, useEffect } from "react";

function scoreColor(score: number) {
  if (score >= 70) return {
    text: "text-brand",
    bar: "from-brandDark to-brandBright",
    glow: "[box-shadow:0_0_12px_rgba(32,230,126,0.6)]",
    bg: "border-brand/[0.12] bg-brand/[0.06]"
  };
  if (score >= 40) return {
    text: "text-yellow-400",
    bar: "from-yellow-600 to-yellow-400",
    glow: "[box-shadow:0_0_12px_rgba(234,179,8,0.5)]",
    bg: "border-yellow-400/[0.10] bg-yellow-400/[0.04]"
  };
  return {
    text: "text-red-400",
    bar: "from-red-700 to-red-400",
    glow: "[box-shadow:0_0_12px_rgba(248,113,113,0.5)]",
    bg: "border-red-400/[0.10] bg-red-400/[0.04]"
  };
}
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { OfferPanel } from "@/components/funnel/offer-panel";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { useSound } from "@/lib/useSound";
import { trackCustomEvent } from "@/lib/pixel";
import animationData from "@/assets/Future tech Ui.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const Particles = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden mix-blend-screen">
    <div className="absolute left-[15%] top-[20%] h-1.5 w-1.5 rounded-full bg-brandBright/60 blur-[1px] animate-float-1" />
    <div className="absolute right-[25%] top-[15%] h-2 w-2 rounded-full bg-brand/50 blur-[1px] animate-float-2" />
    <div className="absolute left-[35%] bottom-[25%] h-1 w-1 rounded-full bg-accent/70 blur-[0.5px] animate-float-3" />
    <div className="absolute right-[15%] bottom-[15%] h-2.5 w-2.5 rounded-full bg-brandDark/40 blur-[2px] animate-float-1 [animation-delay:1.5s]" />
    <div className="absolute left-[55%] top-[55%] h-2 w-2 rounded-full bg-brandBright/50 blur-[1px] animate-float-2 [animation-delay:0.8s]" />
    <div className="absolute left-[75%] top-[40%] h-1.5 w-1.5 rounded-full bg-brand/60 blur-[0.5px] animate-float-3 [animation-delay:2s]" />
    <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent z-10" />
  </div>
);

type ResultadoContent = {
  explanation_text: string;
  closing_text: string;
  cta_text: string;
};

export default function SimuladorResultadoClient({
  initialPrices,
  content,
}: {
  initialPrices: { priceOriginal: number; pricePromo: number };
  content: ResultadoContent;
}) {
  const router = useRouter();
  const name = useFunnelStore(state => state.name);
  const answers = useFunnelStore(state => state.answers);
  const result = useFunnelStore(state => state.result);
  const finalizeResult = useFunnelStore(state => state.finalizeResult);
  const { playReveal } = useSound();

  useEffect(() => {
    // Play reveal sound on mount (slight delay for perceived drama)
    const t = setTimeout(() => playReveal(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!name) {
      router.replace("/simulador/inicio");
      return;
    }

    if (!result && Object.keys(answers).length > 0) {
      finalizeResult();
    }
  }, [answers, finalizeResult, name, result, router]);

  useEffect(() => {
    if (result) {
      trackCustomEvent("ViewSimulatorResult", { content_name: result.profileTitle, content_category: "ResultadoQuiz" });

      // Persist quiz result to DB (non-blocking)
      const store = useFunnelStore.getState();
      if (store.whatsapp) {
        fetch("/api/quiz-submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: store.whatsapp,
            answers: store.answers,
            scores: result.scores,
            profile: `${result.dominant}-${result.weakest}`,
            profileTitle: result.profileTitle,
          }),
        }).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.profileTitle]);

  if (!name) {
    return null;
  }

  if (!result) {
    return (
      <FunnelShell>
        <GlassCard>
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="w-40 h-40">
              <Lottie animationData={animationData} loop={true} />
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-brandBright animate-pulse">
              Analisando...
            </p>
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell>
      <Particles />
      <div className="mx-auto w-full max-w-2xl space-y-6 relative z-10">
        <GlassCard>
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
                <span className="mr-2 inline-block animate-glow-pulse">◆</span>
                Análise concluída
              </p>

              <div className="mx-auto w-44 h-44 md:w-56 md:h-56">
                <Lottie animationData={animationData} loop={true} />
              </div>

              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {name}, o teu resultado revela um ponto importante
              </h1>
              <p className="bg-gradient-to-r from-brand to-brandBright bg-clip-text text-lg font-semibold text-transparent">
                {result.profileTitle}
              </p>
            </div>

            {/* Score cards com cores dinâmicas */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Object.entries(result.scores).map(([pillar, score]) => {
                const pct = Math.min(Math.max(Number(score), 0), 100);
                const color = scoreColor(pct);
                return (
                  <div
                    key={pillar}
                    className={`rounded-xl border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${color.bg}`}
                  >
                    <div className="mb-3 flex items-end justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                        {pillar}
                      </p>
                      <p className={`text-xl font-bold tabular-nums leading-none ${color.text}`}>
                        {score}
                      </p>
                    </div>
                    <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color.bar} ${color.glow} [width:var(--score-pct)] transition-all duration-1000 ease-out`}
                        style={{ "--score-pct": `${pct}%` } as CSSProperties}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation Text */}
            <div className="space-y-4 pt-4 text-sm leading-relaxed text-soft/90">
              <p>{content.explanation_text}</p>
              <p className="font-medium text-white/90">{result.profileSummary}</p>
              <p>{content.closing_text}</p>
            </div>

            {/* CTA para a oferta */}
            <Link
              href="/oferta"
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="relative">{content.cta_text}</span>
            </Link>
          </div>
        </GlassCard>

        <OfferPanel angle={result.offerAngle} initialPrices={initialPrices} />
      </div>
    </FunnelShell>
  );
}
