import type { QuizQuestion } from "@/lib/types";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q_clareza_1",
    pillar: "clareza",
    prompt: "Quando pensas no teu futuro financeiro, o que acontece primeiro?",
    options: [
      { id: "a", label: "Tenho metas claras e datas definidas.", weights: { clareza: 3, disciplina: 2, acao: 1, emocional: 1 } },
      { id: "b", label: "Tenho ideias, mas ainda sem um plano concreto.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 2 } },
      { id: "c", label: "Sinto confusao e adio decisoes importantes.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 1 } }
    ]
  },
  {
    id: "q_disciplina_1",
    pillar: "disciplina",
    prompt: "Qual e o teu comportamento com dinheiro no fim do mes?",
    options: [
      { id: "a", label: "Reviso despesas e mantenho controle.", weights: { clareza: 2, disciplina: 3, acao: 1, emocional: 1 } },
      { id: "b", label: "As vezes controlo, as vezes nao.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 2 } },
      { id: "c", label: "Normalmente fico sem saber para onde foi.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 1 } }
    ]
  },
  {
    id: "q_acao_1",
    pillar: "acao",
    prompt: "Quando aprendes algo novo sobre renda extra, o que fazes?",
    options: [
      { id: "a", label: "Aplico ainda na mesma semana.", weights: { clareza: 1, disciplina: 2, acao: 3, emocional: 1 } },
      { id: "b", label: "Guardo para depois e raramente comeco.", weights: { clareza: 1, disciplina: 0, acao: 1, emocional: 2 } },
      { id: "c", label: "Quase nunca saio do planeamento.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 1 } }
    ]
  },
  {
    id: "q_emocional_1",
    pillar: "emocional",
    prompt: "Como reages quando aparece uma despesa inesperada?",
    options: [
      { id: "a", label: "Mantenho calma e ajusto o plano.", weights: { clareza: 2, disciplina: 2, acao: 1, emocional: 3 } },
      { id: "b", label: "Fico tenso, mas tento resolver.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 1 } },
      { id: "c", label: "Entro em panico e travo totalmente.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 0 } }
    ]
  },
  {
    id: "q_clareza_2",
    pillar: "clareza",
    prompt: "A tua estrategia de crescimento financeiro para 2026 esta...",
    options: [
      { id: "a", label: "Definida em etapas objetivas.", weights: { clareza: 3, disciplina: 2, acao: 2, emocional: 1 } },
      { id: "b", label: "Parcial, ainda com lacunas.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 1 } },
      { id: "c", label: "Inexistente no momento.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 0 } }
    ]
  },
  {
    id: "q_disciplina_2",
    pillar: "disciplina",
    prompt: "Quanto da tua rotina semanal e dedicada ao teu progresso financeiro?",
    options: [
      { id: "a", label: "Tenho blocos fixos no calendario.", weights: { clareza: 2, disciplina: 3, acao: 2, emocional: 1 } },
      { id: "b", label: "Depende da semana e da motivacao.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 2 } },
      { id: "c", label: "Praticamente nenhuma.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 0 } }
    ]
  },
  {
    id: "q_acao_2",
    pillar: "acao",
    prompt: "Quando tens uma oportunidade de negocio pequena, tu...",
    options: [
      { id: "a", label: "Analiso rapido e testo com criterio.", weights: { clareza: 2, disciplina: 2, acao: 3, emocional: 1 } },
      { id: "b", label: "Fico indeciso e perco timing.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 1 } },
      { id: "c", label: "Nao ajo por medo de errar.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 0 } }
    ]
  },
  {
    id: "q_emocional_2",
    pillar: "emocional",
    prompt: "Qual frase mais descreve tua relacao com dinheiro hoje?",
    options: [
      { id: "a", label: "Tenho controle interno e visao de longo prazo.", weights: { clareza: 2, disciplina: 2, acao: 2, emocional: 3 } },
      { id: "b", label: "Oscilo entre confianca e inseguranca.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 1 } },
      { id: "c", label: "Dinheiro e sempre fonte de ansiedade.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 0 } }
    ]
  },
  {
    id: "q_clareza_3",
    pillar: "clareza",
    prompt: "Se tivesses de explicar teu plano em 1 minuto...",
    options: [
      { id: "a", label: "Conseguiria com clareza total.", weights: { clareza: 3, disciplina: 2, acao: 1, emocional: 1 } },
      { id: "b", label: "Explicaria parcialmente.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 1 } },
      { id: "c", label: "Nao saberia por onde comecar.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 0 } }
    ]
  },
  {
    id: "q_acao_3",
    pillar: "acao",
    prompt: "Nos ultimos 30 dias, quantas iniciativas novas tu testaste?",
    options: [
      { id: "a", label: "2 ou mais iniciativas com execucao real.", weights: { clareza: 1, disciplina: 2, acao: 3, emocional: 1 } },
      { id: "b", label: "1 tentativa pontual.", weights: { clareza: 1, disciplina: 1, acao: 1, emocional: 1 } },
      { id: "c", label: "Nenhuma iniciativa nova.", weights: { clareza: 0, disciplina: 0, acao: 0, emocional: 0 } }
    ]
  }
];
