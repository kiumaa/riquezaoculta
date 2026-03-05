"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { OfferPanel } from "@/components/funnel/offer-panel";
import { useFunnelStore } from "@/lib/store/funnel-store";

export default function SimuladorResultadoPage() {
  const router = useRouter();
  const name = useFunnelStore(state => state.name);
  const answers = useFunnelStore(state => state.answers);
  const result = useFunnelStore(state => state.result);
  const finalizeResult = useFunnelStore(state => state.finalizeResult);

  useEffect(() => {
    if (!name) {
      router.replace("/simulador/inicio");
      return;
    }

    if (!result && Object.keys(answers).length > 0) {
      finalizeResult();
    }
  }, [answers, finalizeResult, name, result, router]);

  if (!name) {
    return null;
  }

  if (!result) {
    return (
      <FunnelShell>
        <GlassCard>
          <p className="text-sm text-soft">Analisando o teu padrao mental...</p>
        </GlassCard>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <GlassCard>
          <div className="space-y-4 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Analise concluida</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{name}, o teu resultado revela um ponto importante</h1>
            <p className="text-lg font-medium text-brand">{result.profileTitle}</p>
            <p className="text-sm leading-relaxed text-soft">
              Muitas vezes trabalhamos duro, corremos de manha a noite, mas o progresso parece nao acompanhar o esforco.
              Isso nao e falta de sorte, e o teu codigo mental que precisa de ser atualizado para uma nova realidade.
            </p>
            <p className="text-sm leading-relaxed text-soft">{result.profileSummary}</p>
            <p className="text-sm leading-relaxed text-soft">
              Vais continuar a aceitar os mesmos resultados ou vais desbloquear o caminho de abundancia que mereces construir?
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(result.scores).map(([pillar, score]) => (
                <div key={pillar} className="rounded-xl border border-white/12 bg-black/28 p-3 text-center ring-1 ring-white/5">
                  <p className="text-xs uppercase tracking-[0.15em] text-soft">{pillar}</p>
                  <p className="mt-1 text-xl font-semibold">{score}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <OfferPanel angle={result.offerAngle} />
      </div>
    </FunnelShell>
  );
}
