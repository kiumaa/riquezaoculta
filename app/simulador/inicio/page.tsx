"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { PrimaryButton } from "@/components/funnel/primary-button";
import { useFunnelStore } from "@/lib/store/funnel-store";

export default function SimuladorInicioPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const setStoreName = useFunnelStore(state => state.setName);
  const initQuiz = useFunnelStore(state => state.initQuiz);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clean = name.trim();
    if (clean.length < 2) return;

    setStoreName(clean);
    initQuiz();
    router.push("/simulador/quiz");
  }

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Passo 1 de 6</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Identificacao Necessaria</h1>
            <p className="text-sm leading-relaxed text-soft">
              Para gerar o teu perfil financeiro personalizado, precisamos de saber quem es.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-4">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como te chamas?"
              className="h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-base font-light text-ink outline-none ring-brand/30 transition placeholder:text-soft/80 focus:ring"
              autoFocus
              maxLength={80}
            />

            <PrimaryButton type="submit">Continuar para o quiz</PrimaryButton>
          </form>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
