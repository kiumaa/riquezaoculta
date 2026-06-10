import { QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import type { Pillar, QuizQuestion, QuizResult } from "@/lib/types";

const PILLARS: Pillar[] = ["clareza", "disciplina", "acao", "emocional"];

// Max weight per question per pillar × number of questions
const MAX_WEIGHT_PER_Q = 3;
const TOTAL_QUESTIONS = 5;
const RAW_MAX = MAX_WEIGHT_PER_Q * TOTAL_QUESTIONS; // 15

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

export function buildQuizOrder(seed: number, count = 5): string[] {
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
      return "Clareza Financeira";
    case "disciplina":
      return "Disciplina de Execução";
    case "acao":
      return "Capacidade de Agir";
    case "emocional":
      return "Inteligência Emocional";
    default:
      return "Equilíbrio";
  }
}

// 12 perfis únicos indexados por dominant-weakest
const profileMap: Record<string, { title: string; summary: string }> = {
  "emocional-clareza": {
    title: "Coração de Leão, Rota a Afinar",
    summary: "Tens uma força interior fora do comum e sentes profundamente o que queres da vida. O que ainda te separa dos resultados é um plano claro e estruturado que transforme essa energia em acção concreta."
  },
  "emocional-acao": {
    title: "Visão Poderosa, Momento de Agir",
    summary: "A tua inteligência emocional é o teu maior trunfo — percebes as situações com uma clareza que poucos têm. O próximo passo é converter essa consciência em decisões rápidas e acção consistente."
  },
  "emocional-disciplina": {
    title: "Alma Forte, Sistema a Construir",
    summary: "Tens determinação e visão para criar uma vida diferente — isso já é mais do que a maioria. O que te falta é um sistema diário que mantenha o teu foco mesmo nos dias difíceis."
  },
  "clareza-emocional": {
    title: "Mente Estratégica, Combustível a Despertar",
    summary: "Sabes exactamente onde queres chegar e tens o mapa na cabeça. O que ainda te trava é aprender a usar as tuas emoções como combustível em vez de obstáculo."
  },
  "clareza-acao": {
    title: "Estratégia Definida, Execução a Libertar",
    summary: "Tens visão e clareza para identificar as oportunidades certas — isso é raro e valioso. Agora é hora de passar do plano para a acção com um método concreto que elimine a hesitação."
  },
  "clareza-disciplina": {
    title: "Visão Nítida, Ritmo a Solidificar",
    summary: "A tua clareza sobre o que queres é uma vantagem enorme num mundo cheio de distracções. O que falta é construir rotinas práticas que tornem o progresso inevitável dia após dia."
  },
  "acao-emocional": {
    title: "Energia em Movimento, Equilíbrio a Encontrar",
    summary: "Tens coragem para agir quando os outros hesitam — esse instinto de acção é um dom poderoso. Aprender a alinhar essa energia com a tua inteligência emocional vai multiplicar os teus resultados."
  },
  "acao-clareza": {
    title: "Força de Fazer, Direcção a Afinar",
    summary: "A tua capacidade de agir rapidamente coloca-te à frente da maioria das pessoas. Com um plano mais claro e estruturado, essa energia deixa de se dispersar e passa a gerar resultados reais."
  },
  "acao-disciplina": {
    title: "Impulso Real, Consistência a Cultivar",
    summary: "Tens a coragem de dar o primeiro passo — e isso já é metade do caminho. O que vai transformar os teus resultados é aprender a manter esse impulso com consistência ao longo do tempo."
  },
  "disciplina-emocional": {
    title: "Método Sólido, Chama Interior a Acender",
    summary: "A tua consistência e força interior são a base de qualquer conquista duradoura. Despertar a tua inteligência emocional vai dar-te o combustível que transforma o esforço em resultados exponenciais."
  },
  "disciplina-clareza": {
    title: "Ritmo Forte, Mapa a Definir",
    summary: "Tens a disciplina que a maioria das pessoas nunca consegue desenvolver — isso é o teu maior activo. Com um plano financeiro mais claro, essa consistência vai levar-te exactamente onde queres chegar."
  },
  "disciplina-acao": {
    title: "Consistência Presente, Coragem de Agir a Soltar",
    summary: "A tua capacidade de manter o ritmo e não desistir é uma qualidade rara e poderosa. Agora é hora de adicionar a coragem de agir com decisão nas oportunidades que já estão à tua frente."
  }
};

const profileMap3: Record<string, { title: string; summary: string }> = {
  "clareza-disciplina-acao": { title: "Mapa Certo, Pés a Mexer", summary: "Vês o caminho com clareza e tens disciplina para o seguir. Falta-te uma coisa: dar o passo. Quando agires sem hesitar, o dinheiro deixa de ser plano e vira realidade." },
  "clareza-disciplina-emocional": { title: "Plano Frio, Chama a Acender", summary: "Sabes onde queres chegar e tens método para lá chegar. O que ainda te trava é o medo por dentro. Domina essa emoção e nada te segura mais." },
  "clareza-acao-disciplina": { title: "Visão e Garra, Ritmo a Fixar", summary: "Tens clareza no alvo e coragem para disparar — isso é raro. Só te falta constância. Com um sistema diário, essa força para de dispersar e começa a render." },
  "clareza-acao-emocional": { title: "Estratega Ousado, Cabeça a Firmar", summary: "Vês a oportunidade e ages depressa. O que te atrapalha é a emoção a mandar nas horas erradas. Controla isso e a tua clareza passa a gerar dinheiro de verdade." },
  "clareza-emocional-disciplina": { title: "Mente Clara, Alma Forte, Rotina a Construir", summary: "Tens visão nítida e força interior — duas armas poderosas. Falta-te o hábito que sustenta tudo. Constrói uma rotina simples e o teu próximo nível vem sozinho." },
  "clareza-emocional-acao": { title: "Sabes Tudo, Falta Fazer", summary: "Tens o plano na cabeça e a vontade no peito. Mas pensar não enche bolso. Transforma essa clareza em acção hoje e os resultados aparecem rápido." },
  "disciplina-clareza-acao": { title: "Disciplina de Aço, Coragem a Soltar", summary: "A tua disciplina e a tua visão clara já te põem à frente de quase todos. Falta-te só a coragem de agir sem hesitar. Solta esse passo e o dinheiro vem." },
  "disciplina-clareza-emocional": { title: "Método e Mapa, Chama a Acender", summary: "Tens disciplina rara e sabes para onde vais — isso é ouro. O que falta afinar é o teu controlo emocional. Acende essa chama e os resultados disparam." },
  "disciplina-acao-clareza": { title: "Ritmo Forte, Rota a Traçar", summary: "A tua disciplina e a tua coragem de agir são uma combinação poderosa. Só te falta clareza sobre o caminho certo. Traça a rota e essa força leva-te longe." },
  "disciplina-acao-emocional": { title: "Força Constante, Equilíbrio a Domar", summary: "Tens disciplina e ages quando é preciso — poucos têm isso. O que ainda te trava é o lado emocional. Doma essa parte e nada te segura na corrida ao dinheiro." },
  "disciplina-emocional-clareza": { title: "Base Sólida, Caminho a Iluminar", summary: "A tua disciplina e a tua força interior são alicerces que duram. Falta-te um plano claro para apontar. Ilumina o caminho e essa consistência transforma-se em riqueza." },
  "disciplina-emocional-acao": { title: "Constância Firme, Salto a Dar", summary: "Tens disciplina e equilíbrio emocional — a base que a maioria nunca constrói. Só te falta dar o salto e agir. Dá esse passo agora e os resultados aparecem." },
  "acao-clareza-disciplina": { title: "Tu Fazes Acontecer, Falta Ritmo", summary: "Ages e ainda vês claro onde queres chegar — isso poucos têm. O que te falta é constância: manter o passo todos os dias. Afina a disciplina e o dinheiro vem." },
  "acao-clareza-emocional": { title: "Mãos à Obra, Cabeça Fria a Treinar", summary: "Tu não esperas, tu fazes — e ainda sabes para onde vais. O que te trava é o lado emocional nos momentos quentes. Domina isso e nada te para." },
  "acao-disciplina-clareza": { title: "Motor Forte, Mapa a Desenhar", summary: "Ages com força e tens disciplina para não parar — base de ouro. Só te falta clareza no rumo, senão a energia espalha-se. Define o caminho e dispara." },
  "acao-disciplina-emocional": { title: "Faz e Mantém, Coração a Firmar", summary: "Tu executas e seguras o ritmo — isso é raro em Angola. O que te falta é firmeza emocional quando aperta. Acende esse lado e os resultados explodem." },
  "acao-emocional-clareza": { title: "Garra de Sobra, Direcção a Achar", summary: "Tu ages com coragem e sentes fundo o que queres — combustível puro. Só te falta um mapa claro para não correres em círculos. Define o rumo e avança." },
  "acao-emocional-disciplina": { title: "Coragem que Move, Constância a Forjar", summary: "Tu dás o primeiro passo quando todos hesitam, e a força não te falta. O que te trava é manter o ritmo dia após dia. Forja a disciplina e ganha." },
  "emocional-clareza-disciplina": { title: "Coração e Visão, Rotina a Cravar", summary: "Sentes forte e enxergas longe — isso já te põe na frente. Falta-te a disciplina diária que segura o foco nos dias maus. Constrói o sistema e o dinheiro vem." },
  "emocional-clareza-acao": { title: "Alma Forte, Mente Clara, Hora de Agir", summary: "Tens garra por dentro e sabes onde queres chegar. O que te trava é dar o passo. Para de planear e age — é aí que o jogo vira." },
  "emocional-disciplina-clareza": { title: "Fogo Constante, Mapa a Traçar", summary: "Sentes profundo e não desistes fácil — duas armas raras. Só te falta clareza de para onde correr. Com um rumo certo, essa força gera resultado a sério." },
  "emocional-disciplina-acao": { title: "Chama e Ritmo, Coragem a Disparar", summary: "Tens emoção forte e consistência que poucos têm. O que falta é coragem de agir nas oportunidades à tua frente. Dá o salto e tudo muda." },
  "emocional-acao-clareza": { title: "Coração de Leão, Direcção a Afinar", summary: "Sentes forte e ages sem medo — combinação poderosa. Só te falta clareza para não dispersar essa energia. Com um plano certo, paras de correr em círculos." },
  "emocional-acao-disciplina": { title: "Força Bruta, Constância a Construir", summary: "Tens paixão e coragem de fazer acontecer — isso já te separa da maioria. Falta-te a disciplina que mantém o ritmo. Cria o sistema e o resultado fica." },
};

function resolveOfferAngle(weakest: Pillar) {
  const map: Record<Pillar, string> = {
    clareza: "O teu perfil precisa de um roteiro claro. O 1M em Uma Semana dá-te exactamente isso.",
    disciplina: "O teu perfil precisa de um sistema prático. O 1M em Uma Semana é o teu método.",
    acao: "O teu perfil precisa de acções imediatas. O 1M em Uma Semana mostra-te cada passo.",
    emocional: "O teu perfil precisa de estrutura e confiança. O 1M em Uma Semana é o teu guia."
  };

  return map[weakest];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function evaluateQuiz(answers: Record<string, string>): QuizResult {
  const rawScores: Record<Pillar, number> = {
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
      rawScores[pillar] += option.weights[pillar] ?? 0;
    }
  }

  // Normalize to 0–100, then apply aspirational multipliers:
  // Emocional and Clareza go UP (person has the desire), Acao and Disciplina go DOWN (ebook fixes this)
  const multipliers: Record<Pillar, number> = {
    emocional: 1.40,
    clareza: 1.25,
    acao: 0.90,
    disciplina: 0.80
  };

  const scores: Record<Pillar, number> = {
    clareza: 0,
    disciplina: 0,
    acao: 0,
    emocional: 0
  };

  for (const pillar of PILLARS) {
    const normalized = (rawScores[pillar] / RAW_MAX) * 100;
    scores[pillar] = Math.round(clamp(normalized * multipliers[pillar], 0, 100));
  }

  const ranking = [...PILLARS].sort((a, b) => scores[b] - scores[a]);
  const dominant = ranking[0] ?? "emocional";
  const weakest = ranking[ranking.length - 1] ?? "disciplina";

  const second = ranking[1] ?? weakest;
  const key3 = `${dominant}-${second}-${weakest}`;
  const key2 = `${dominant}-${weakest}`;
  const profile = profileMap3[key3] ?? profileMap[key2] ?? {
    title: `${pillarLabel(dominant)} Elevada, ${pillarLabel(weakest)} a Desenvolver`,
    summary: `Tens potencial acima da média no pilar ${pillarLabel(dominant)}. Trabalhar o ${pillarLabel(weakest)} vai desbloqueiar o teu próximo nível financeiro.`
  };

  return {
    dominant,
    weakest,
    scores,
    profileTitle: profile.title,
    profileSummary: profile.summary,
    offerAngle: resolveOfferAngle(weakest)
  };
}
