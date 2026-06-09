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
export type LeadStatus = "novo" | "contactado" | "comprou" | "abandonou" | "upsell";

export type JourneyStep = {
  page: string;
  url: string;
  timestamp: string;
  duration?: number;
};

export type LeadPayload = {
  name: string;
  phone: string;
  source: string;
  journey?: JourneyStep[];
};

export type LeadRecord = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  province?: string | null;
  source: string;
  quizProfile?: string | null;
  status: LeadStatus;
  notes?: string | null;
  journey: JourneyStep[] | null;
  createdAt: string;
};

export type QuizSubmissionRecord = {
  id: number;
  leadId?: number | null;
  phone: string;
  answers: Record<string, string>;
  scores: Record<string, number>;
  profile: string;
  profileTitle?: string | null;
  createdAt: string;
};

export type FunnelContentRecord = {
  id: number;
  pageType: string;
  sectionKey: string;
  content?: string | null;
  metadata?: unknown;
  updatedAt: string;
};

export type MemberContentRecord = {
  id: number;
  module: string;
  title: string;
  description?: string | null;
  type: string;
  fileUrl?: string | null;
  videoUrl?: string | null;
  ordem: number;
  isActive: boolean;
  createdAt: string;
};

export type CheckoutRecord = {
  id?: number;
  reference: string;
  name: string;
  phone: string;
  amount: number;
  entity: string;
  paymentReference: string;
  status: CheckoutStatus;
  providerPayload?: unknown;
  affiliateToken?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationChannel = "whatsapp" | "sms";
export type CommunicationType = "confirmation" | "reminder_1h" | "reminder_6h" | "abandoned" | "recovery";
export type CommunicationTrigger = "auto" | "manual";

export type CommunicationLog = {
  id: number;
  reference?: string | null;
  leadId?: number | null;
  phone: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  status: "sent" | "failed";
  trigger: CommunicationTrigger;
  messageText?: string | null;
  failureReason?: string | null;
  createdAt: string;
};

export type AffiliateStatus = "pending" | "active" | "suspended";
export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

export type AffiliateRecord = {
  id: number;
  token: string;
  name: string;
  phone: string;
  email?: string | null;
  iban?: string | null;
  status: AffiliateStatus;
  commissionRate: number;
  totalClicks: number;
  totalSales: number;
  totalEarnings: number;
  currentBalance: number;
  createdAt: string;
};

export type PayoutRequestRecord = {
  id: number;
  affiliateId: number;
  amount: number;
  status: PayoutStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};
