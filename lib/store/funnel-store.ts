"use client";

import { buildQuizOrder, evaluateQuiz } from "@/lib/quiz/engine";
import type { QuizResult, JourneyStep } from "@/lib/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FunnelState = {
  name: string;
  whatsapp: string;
  affiliateToken: string | null;
  quizSeed: number;
  quizOrder: string[];
  answers: Record<string, string>;
  result: QuizResult | null;
  journey: JourneyStep[];
  paymentReference: string | null;
  paymentStatus: "idle" | "pending" | "paid" | "failed";
  paymentMethod: "express" | "reference" | null;
  quizPaid: boolean;
  ebookPaid: boolean;
  setName: (name: string) => void;
  setWhatsapp: (whatsapp: string) => void;
  setAffiliateToken: (token: string | null) => void;
  initQuiz: () => void;
  trackStep: (page: string, url: string) => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  finalizeResult: () => QuizResult;
  setPaymentReference: (reference: string | null) => void;
  setPaymentStatus: (status: FunnelState["paymentStatus"]) => void;
  setPaymentMethod: (method: FunnelState["paymentMethod"]) => void;
  setQuizPaid: (paid: boolean) => void;
  setEbookPaid: (paid: boolean) => void;
  resetFunnel: () => void;
};

const initialSeed = Math.floor(Math.random() * 10_000_000);

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      name: "",
      whatsapp: "",
      affiliateToken: null,
      quizSeed: initialSeed,
      quizOrder: [],
      answers: {},
      result: null,
      journey: [],
      paymentReference: null,
      paymentStatus: "idle",
      paymentMethod: null,
      quizPaid: true,
      ebookPaid: false,
      setName: name => set({ name }),
      setWhatsapp: whatsapp => set({ whatsapp }),
      setAffiliateToken: token => set({ affiliateToken: token }),
      initQuiz: () => {
        const seed = Math.floor(Math.random() * 10_000_000);
        set({
          quizSeed: seed,
          quizOrder: buildQuizOrder(seed),
          answers: {},
          result: null,
          paymentReference: null,
          paymentStatus: "idle",
          paymentMethod: null,
          quizPaid: true
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
      setQuizPaid: quizPaid => set({ quizPaid }),
      setEbookPaid: ebookPaid => set({ ebookPaid }),
      resetFunnel: () => {
        set({
          name: "",
          whatsapp: "",
          affiliateToken: null,
          quizSeed: Math.floor(Math.random() * 10_000_000),
          quizOrder: [],
          answers: {},
          result: null,
          journey: [],
          paymentReference: null,
          paymentStatus: "idle",
          paymentMethod: null,
          quizPaid: true,
          ebookPaid: false
        });
      }
    }),
    {
      name: "ro-v2-funnel"
    }
  )
);
