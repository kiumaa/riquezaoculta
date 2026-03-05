"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { ProgressBar } from "@/components/funnel/progress-bar";
import { QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import { useFunnelStore } from "@/lib/store/funnel-store";

export default function SimuladorQuizPage() {
  const router = useRouter();
  const name = useFunnelStore(state => state.name);
  const quizOrder = useFunnelStore(state => state.quizOrder);
  const answers = useFunnelStore(state => state.answers);
  const answerQuestion = useFunnelStore(state => state.answerQuestion);
  const finalizeResult = useFunnelStore(state => state.finalizeResult);

  const questions = useMemo(() => {
    const byId = new Map(QUIZ_QUESTIONS.map(q => [q.id, q]));
    return quizOrder
      .map(id => byId.get(id))
      .filter((question): question is (typeof QUIZ_QUESTIONS)[number] => question !== undefined);
  }, [quizOrder]);

  const answeredCount = Object.keys(answers).length;
  const currentIndex = Math.min(answeredCount, questions.length - 1);
  const current = questions[currentIndex];

  useEffect(() => {
    if (!name || questions.length === 0 || !current) {
      router.replace("/simulador/inicio");
    }
  }, [current, name, questions.length, router]);

  if (!name || questions.length === 0 || !current) {
    return null;
  }

  function handleAnswer(optionId: string) {
    answerQuestion(current.id, optionId);

    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      finalizeResult();
      router.push("/simulador/resultado");
    }
  }

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">
              Etapa {currentIndex + 1} de {questions.length} · Matrix 2026
            </p>
            <ProgressBar current={currentIndex + 1} total={questions.length} />
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm leading-relaxed text-soft">
              {name}, responde com honestidade. Em menos de 2 minutos vamos revelar o teu padrao mental financeiro.
            </p>
            <h2 className="text-xl font-semibold leading-tight sm:text-2xl">{current.prompt}</h2>
          </div>

          <div className="mx-auto w-full max-w-xl space-y-3">
            {current.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                className="w-full rounded-xl border border-white/12 bg-black/28 px-4 py-4 text-center text-sm font-light leading-relaxed text-ink transition hover:border-brand/45 hover:bg-brand/10"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
