"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { ProgressBar } from "@/components/funnel/progress-bar";
import { QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { useSound } from "@/lib/useSound";
import { trackCustomEvent } from "@/lib/pixel";

export default function SimuladorQuizPage() {
  const router = useRouter();
  const name = useFunnelStore(state => state.name);
  const quizOrder = useFunnelStore(state => state.quizOrder);
  const answers = useFunnelStore(state => state.answers);
  const answerQuestion = useFunnelStore(state => state.answerQuestion);
  const finalizeResult = useFunnelStore(state => state.finalizeResult);
  const { playClick } = useSound();

  const questions = useMemo(() => {
    const byId = new Map(QUIZ_QUESTIONS.map(q => [q.id, q]));
    return quizOrder
      .map(id => byId.get(id))
      .filter((question): question is (typeof QUIZ_QUESTIONS)[number] => question !== undefined);
  }, [quizOrder]);

  const answeredCount = Object.keys(answers).length;
  const currentIndex = Math.min(answeredCount, questions.length - 1);
  const current = questions[currentIndex];

  const contextText = useMemo(() => {
    const userName = name || "";
    if (currentIndex < 2) {
      return `${userName}, as tuas respostas estão a construir o teu perfil exclusivo...`;
    }
    if (currentIndex < questions.length - 1) {
      return `Muito bem ${userName}. Cada resposta revela uma camada do teu padrão.`;
    }
    return `🔒 O teu resultado está quase pronto, ${userName}.`;
  }, [currentIndex, name, questions.length]);

  useEffect(() => {
    if (!name || questions.length === 0 || !current) {
      router.replace("/simulador/inicio");
    } else if (currentIndex === 0) {
      trackCustomEvent("QuizStarted", { questions: questions.length });
    }
  }, [current, name, questions.length, router, currentIndex]);

  if (!name || questions.length === 0 || !current) {
    return null;
  }

  function handleAnswer(optionId: string, e: React.MouseEvent<HTMLButtonElement>) {
    // Blur immediately to prevent focus/hover state bleeding into the next question
    e.currentTarget.blur();
    playClick();
    answerQuestion(current.id, optionId);

    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      trackCustomEvent("QuizCompleted", { questions: questions.length });
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
              Diagnóstico {currentIndex + 1}/{questions.length} — Quase lá!
            </p>
            <ProgressBar current={currentIndex + 1} total={questions.length} />
          </div>

          <div className="space-y-2 text-center">
            <p className="text-[11px] leading-relaxed text-soft/50">
              {contextText}
            </p>
            <h2 className="text-xl font-semibold leading-tight sm:text-2xl">{current.prompt}</h2>
          </div>

          {/* key={current.id} força desmontagem dos botões entre perguntas → elimina estados hover/focus residuais */}
          <div key={current.id} className="mx-auto w-full max-w-xl space-y-3">
            {current.options.map(option => (
              <button
                key={option.id}
                tabIndex={-1}
                onClick={e => handleAnswer(option.id, e)}
                className="w-full rounded-xl border border-white/12 bg-black/28 px-4 py-4 text-center text-sm font-light leading-relaxed text-ink transition hover:border-brand/45 hover:bg-brand/10 active:border-brand/45 active:bg-brand/10 focus:outline-none"
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
