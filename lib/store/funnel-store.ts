"use client";

import { buildQuizOrder, evaluateQuiz } from "@/lib/quiz/engine";
import type { QuizResult } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FunnelState = {
  name: string;
  whatsapp: string;
  quizSeed: number;
  quizOrder: string[];
  answers: Record<string, string>;
  result: QuizResult | null;
  paymentReference: string | null;
  paymentStatus: "idle" | "pending" | "paid" | "failed";
  setName: (name: string) => void;
  setWhatsapp: (whatsapp: string) => void;
  initQuiz: () => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  finalizeResult: () => QuizResult;
  setPaymentReference: (reference: string | null) => void;
  setPaymentStatus: (status: FunnelState["paymentStatus"]) => void;
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
      paymentReference: null,
      paymentStatus: "idle",
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
          paymentStatus: "idle"
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
      resetFunnel: () => {
        set({
          name: "",
          whatsapp: "",
          quizSeed: Math.floor(Math.random() * 10_000_000),
          quizOrder: [],
          answers: {},
          result: null,
          paymentReference: null,
          paymentStatus: "idle"
        });
      }
    }),
    {
      name: "ro-v2-funnel"
    }
  )
);
