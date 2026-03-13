"use client";

import { buildQuizOrder, evaluateQuiz } from "@/lib/quiz/engine";
import type { QuizResult, JourneyStep } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FunnelState = {
  name: string;
  whatsapp: string;
  quizSeed: number;
  quizOrder: string[];
  answers: Record<string, string>;
  result: QuizResult | null;
  journey: JourneyStep[];
  paymentReference: string | null;
  paymentStatus: "idle" | "pending" | "paid" | "failed";
  paymentMethod: "express" | "reference" | null;
  setName: (name: string) => void;
  setWhatsapp: (whatsapp: string) => void;
  initQuiz: () => void;
  trackStep: (page: string, url: string) => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  finalizeResult: () => QuizResult;
  setPaymentReference: (reference: string | null) => void;
  setPaymentStatus: (status: FunnelState["paymentStatus"]) => void;
  setPaymentMethod: (method: FunnelState["paymentMethod"]) => void;
  resetFunnel: () => void;
};

const initialSeed = Math.floor(Math.random() * 10_000_000);

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      name: "",
      whatsapp: "",
      quizSeed: initialSeed,
      quizOrder: [],
      answers: {},
      result: null,
      journey: [],
      paymentReference: null,
      paymentStatus: "idle",
      paymentMethod: null,
      setName: name => set({ name }),
      setWhatsapp: whatsapp => set({ whatsapp }),
      initQuiz: () => {
        const seed = Math.floor(Math.random() * 10_000_000);
        set({
          quizSeed: seed,
          quizOrder: buildQuizOrder(seed),
          answers: {},
          result: null,
          paymentReference: null,
          paymentStatus: "idle",
          paymentMethod: null
        });
      },
      trackStep: (page, url) => {
        set(state => {
          const now = new Date();
          const lastStep = state.journey[state.journey.length - 1];
          const newJourney = [...state.journey];

          if (lastStep) {
            lastStep.duration = Math.floor((now.getTime() - new Date(lastStep.timestamp).getTime()) / 1000);
          }

          newJourney.push({
            page,
            url,
            timestamp: now.toISOString()
          });

          return { journey: newJourney };
        });
      },
      answerQuestion: (questionId, optionId) => {
        set(state => ({
          answers: {
            ...state.answers,
            [questionId]: optionId
          }
        }));
      },
      finalizeResult: () => {
        const result = evaluateQuiz(get().answers);
        set({ result });
        return result;
      },
      setPaymentReference: reference => set({ paymentReference: reference }),
      setPaymentStatus: status => set({ paymentStatus: status }),
      setPaymentMethod: method => set({ paymentMethod: method }),
      resetFunnel: () => {
        set({
          name: "",
          whatsapp: "",
          quizSeed: Math.floor(Math.random() * 10_000_000),
          quizOrder: [],
          answers: {},
          result: null,
          journey: [],
          paymentReference: null,
          paymentStatus: "idle",
          paymentMethod: null
        });
      }
    }),
    {
      name: "ro-v2-funnel"
    }
  )
);
