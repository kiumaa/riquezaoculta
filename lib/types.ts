export type Pillar = "clareza" | "disciplina" | "acao" | "emocional";

export type QuizOption = {
  id: string;
  label: string;
  weights: Record<Pillar, number>;
};

export type QuizQuestion = {
  id: string;
  pillar: Pillar;
  prompt: string;
  options: QuizOption[];
};

export type QuizResult = {
  dominant: Pillar;
  weakest: Pillar;
  scores: Record<Pillar, number>;
  profileTitle: string;
  profileSummary: string;
  offerAngle: string;
};

export type CheckoutStatus = "pending" | "paid" | "failed";

export type LeadPayload = {
  name: string;
  phone: string;
  source: string;
};

export type CheckoutRecord = {
  reference: string;
  name: string;
  phone: string;
  amount: number;
  entity: string;
  paymentReference: string;
  status: CheckoutStatus;
  providerPayload?: unknown;
  createdAt: string;
  updatedAt: string;
};
