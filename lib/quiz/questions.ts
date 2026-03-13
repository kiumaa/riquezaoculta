import type { QuizQuestion } from "@/lib/types";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q_emocional_1",
    pillar: "emocional",
    prompt: "Quando olhas para a tua conta bancária no fim do mês, o que sentes?",
    options: [
      {
        id: "a",
        label: "Frustração. Trabalhei muito e continua sempre a faltar.",
        weights: { emocional: 2, clareza: 2, acao: 1, disciplina: 0 }
      },
      {
        id: "b",
        label: "Conformismo. Já me habituei a este ciclo de nunca sobrar.",
        weights: { emocional: 1, clareza: 1, acao: 0, disciplina: 0 }
      },
      {
        id: "c",
        label: "Determinação. Sei que posso mudar isso, só falta o caminho certo.",
        weights: { emocional: 3, clareza: 3, acao: 2, disciplina: 1 }
      }
    ]
  },
  {
    id: "q_clareza_1",
    pillar: "clareza",
    prompt: "O que mais te impede de ter o dinheiro que mereces?",
    options: [
      {
        id: "a",
        label: "Não sei exactamente por onde começar nem o que fazer.",
        weights: { clareza: 2, emocional: 2, acao: 1, disciplina: 0 }
      },
      {
        id: "b",
        label: "Começo coisas mas não consigo manter o ritmo.",
        weights: { clareza: 1, emocional: 1, acao: 1, disciplina: 0 }
      },
      {
        id: "c",
        label: "O ambiente à minha volta não acredita que é possível.",
        weights: { clareza: 2, emocional: 3, acao: 0, disciplina: 0 }
      }
    ]
  },
  {
    id: "q_acao_1",
    pillar: "acao",
    prompt: "Quantas vezes já disseste 'vou mudar a minha vida financeira' mas continuaste igual?",
    options: [
      {
        id: "a",
        label: "Muitas vezes. É um ciclo que parece não ter fim.",
        weights: { emocional: 2, clareza: 1, acao: 0, disciplina: 0 }
      },
      {
        id: "b",
        label: "Algumas vezes. Tentei mas sem resultados reais.",
        weights: { emocional: 2, clareza: 2, acao: 1, disciplina: 0 }
      },
      {
        id: "c",
        label: "Estou farto de só falar. Quero agir agora com um plano concreto.",
        weights: { emocional: 3, clareza: 3, acao: 2, disciplina: 1 }
      }
    ]
  },
  {
    id: "q_disciplina_1",
    pillar: "disciplina",
    prompt: "Se tivesses agora um guia passo a passo para gerar mais dinheiro, o que farias?",
    options: [
      {
        id: "a",
        label: "Estudava com atenção e seguia cada passo ao detalhe.",
        weights: { disciplina: 2, acao: 2, clareza: 3, emocional: 2 }
      },
      {
        id: "b",
        label: "Começava motivado mas provavelmente parava a meio.",
        weights: { disciplina: 0, acao: 1, clareza: 1, emocional: 1 }
      },
      {
        id: "c",
        label: "Guardava para ler depois e nunca chegava a abrir.",
        weights: { disciplina: 0, acao: 0, clareza: 0, emocional: 1 }
      }
    ]
  },
  {
    id: "q_emocional_2",
    pillar: "emocional",
    prompt: "O que significa para ti ter verdadeira riqueza?",
    options: [
      {
        id: "a",
        label: "Liberdade. Poder pagar as contas, ajudar a família e ainda sobrar.",
        weights: { emocional: 3, clareza: 3, acao: 1, disciplina: 1 }
      },
      {
        id: "b",
        label: "Estabilidade. Nunca mais acordar preocupado com dinheiro.",
        weights: { emocional: 3, clareza: 2, acao: 1, disciplina: 1 }
      },
      {
        id: "c",
        label: "Crescimento. Investir, construir e deixar algo para os meus.",
        weights: { emocional: 3, clareza: 3, acao: 2, disciplina: 2 }
      }
    ]
  }
];
