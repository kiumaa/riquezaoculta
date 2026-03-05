import { QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import type { Pillar, QuizQuestion, QuizResult } from "@/lib/types";

const PILLARS: Pillar[] = ["clareza", "disciplina", "acao", "emocional"];

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function shuffle<T>(arr: T[], seed: number) {
  const copy = [...arr];
  const rand = seededRandom(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildQuizOrder(seed: number, count = 8): string[] {
  const guaranteed: QuizQuestion[] = [];

  for (const pillar of PILLARS) {
    const pool = QUIZ_QUESTIONS.filter(q => q.pillar === pillar);
    const chosen = shuffle(pool, seed + pillar.length)[0];
    if (chosen) guaranteed.push(chosen);
  }

  const guaranteedIds = new Set(guaranteed.map(q => q.id));
  const remainingPool = QUIZ_QUESTIONS.filter(q => !guaranteedIds.has(q.id));
  const remaining = shuffle(remainingPool, seed + 111);

  const finalQuestions = [...shuffle(guaranteed, seed + 29), ...remaining].slice(0, count);

  return finalQuestions.map(q => q.id);
}

function pillarLabel(pillar: Pillar) {
  switch (pillar) {
    case "clareza":
      return "Clareza Estrategica";
    case "disciplina":
      return "Disciplina de Crescimento";
    case "acao":
      return "Acao de Alto Impacto";
    case "emocional":
      return "Estabilidade Emocional";
    default:
      return "Equilibrio";
  }
}

function resolveSummary(dominant: Pillar, weakest: Pillar) {
  const dominantText: Record<Pillar, string> = {
    clareza: "Tens capacidade de visao e sabes onde queres chegar.",
    disciplina: "A tua forca esta na consistencia e no controlo das rotinas.",
    acao: "Tu tens energia de execucao e tendencia a testar rapido.",
    emocional: "Tu mantens a mente estavel mesmo sob pressao."
  };

  const weakestText: Record<Pillar, string> = {
    clareza: "O ponto cego atual e transformar vontade em plano mensuravel.",
    disciplina: "O ponto cego atual e manter constancia semanal nas acoes-chave.",
    acao: "O ponto cego atual e acelerar execucao sem esperar motivacao perfeita.",
    emocional: "O ponto cego atual e reduzir ansiedade financeira nas decisoes."
  };

  return `${dominantText[dominant]} ${weakestText[weakest]}`;
}

function resolveOfferAngle(weakest: Pillar) {
  const map: Record<Pillar, string> = {
    clareza: "Oferta ideal para ti: roadmap pronto para executar sem confusao.",
    disciplina: "Oferta ideal para ti: metodo com checklists para manter ritmo diario.",
    acao: "Oferta ideal para ti: plano de implementacao em passos simples e imediatos.",
    emocional: "Oferta ideal para ti: estrutura para decidir com calma e confianca."
  };

  return map[weakest];
}

export function evaluateQuiz(answers: Record<string, string>): QuizResult {
  const scores: Record<Pillar, number> = {
    clareza: 0,
    disciplina: 0,
    acao: 0,
    emocional: 0
  };

  for (const question of QUIZ_QUESTIONS) {
    const selectedId = answers[question.id];
    if (!selectedId) continue;

    const option = question.options.find(opt => opt.id === selectedId);
    if (!option) continue;

    for (const pillar of PILLARS) {
      scores[pillar] += option.weights[pillar] ?? 0;
    }
  }

  const ranking = [...PILLARS].sort((a, b) => scores[b] - scores[a]);
  const dominant = ranking[0] ?? "clareza";
  const weakest = ranking[ranking.length - 1] ?? "emocional";

  return {
    dominant,
    weakest,
    scores,
    profileTitle: `${pillarLabel(dominant)} com ajuste em ${pillarLabel(weakest)}`,
    profileSummary: resolveSummary(dominant, weakest),
    offerAngle: resolveOfferAngle(weakest)
  };
}
