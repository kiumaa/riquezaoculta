"use client";

import { type SVGProps, useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { PrimaryButton } from "@/components/funnel/primary-button";
import { useFunnelStore } from "@/lib/store/funnel-store";
import mcLogo from "@/assets/mc.png";
import mcxLogo from "@/assets/mcx.png";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — filename contains spaces
import ebookCover from "@/assets/main ebook cover.png";
import { trackEvent } from "@/lib/pixel";
import { SocialProofBar } from "@/components/funnel/social-proof-bar";
import { ChatWidget } from "@/components/funnel/chat-widget";

type PaymentData = {
  reference: string;
  method: "express" | "reference";
  payment: {
    entity?: string;
    reference: string;
    paymentUrl?: string;
    amount: number;
    mode: "live" | "simulated";
  };
};

type UIState = "select" | "express_waiting" | "reference_active";

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckSmallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EY84u93L1uy3CSOFF6mBl7?mode=gi_t";

const checkoutTestimonials = [
  { name: "Maria Santos", text: "Fiz o simulador por curiosidade e em 3 semanas mudei 2 hábitos que estavam a sabotar as minhas finanças." },
  { name: "Carlos Mendes", text: "O guia mostrou-me que o problema era a minha forma de pensar. Recomendo a toda a gente." },
  { name: "João Ferreira", text: "Conteúdo directo ao ponto. Sem teorias, só estratégias que funcionam mesmo." },
];

function CheckoutPagamentoInner({
  initialPrices
}: {
  initialPrices: { priceOriginal: number; pricePromo: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = useFunnelStore(state => state.name);
  const whatsapp = useFunnelStore(state => state.whatsapp);
  const paymentReference = useFunnelStore(state => state.paymentReference);
  const setPaymentReference = useFunnelStore(state => state.setPaymentReference);
  const paymentStatus = useFunnelStore(state => state.paymentStatus);
  const setPaymentStatus = useFunnelStore(state => state.setPaymentStatus);

  const [uiState, setUiState] = useState<UIState>("select");
  const [paymentMethod, setPaymentMethod] = useState<"express" | "reference" | null>(null);
  const [expressPhone, setExpressPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"entity" | "reference" | null>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isHowToPayOpen, setIsHowToPayOpen] = useState(false);
  const [testimonialSlide, setTestimonialSlide] = useState(0);
  const [urgencyData, setUrgencyData] = useState<{ spots: number; people: number } | null>(null);
  const prices = initialPrices;

  // Initialize and tick dynamic urgency numbers
  useEffect(() => {
    const storedSpots = sessionStorage.getItem("rq_spots");
    const storedPeople = sessionStorage.getItem("rq_people");

    const initialSpots = storedSpots ? parseInt(storedSpots, 10) : Math.floor(Math.random() * 12) + 7; // 7 a 18
    const initialPeople = storedPeople ? parseInt(storedPeople, 10) : Math.floor(Math.random() * 40) + 312; // 312 a 351

    setUrgencyData({ spots: initialSpots, people: initialPeople });

    if (!storedSpots) sessionStorage.setItem("rq_spots", initialSpots.toString());
    if (!storedPeople) sessionStorage.setItem("rq_people", initialPeople.toString());

    const interval = setInterval(() => {
      setUrgencyData(prev => {
        if (!prev) return null;

        // Cerca de 30% de chance de reduzir uma vaga (nunca baixar de 3)
        const dropSpot = Math.random() > 0.7 && prev.spots > 3;
        // Cerca de 50% de chance de adicionar 1 a 2 pessoas
        const addPerson = Math.random() > 0.5;

        const nextSpots = dropSpot ? prev.spots - 1 : prev.spots;
        const nextPeople = addPerson ? prev.people + Math.floor(Math.random() * 2) + 1 : prev.people;

        if (dropSpot) sessionStorage.setItem("rq_spots", nextSpots.toString());
        if (addPerson) sessionStorage.setItem("rq_people", nextPeople.toString());

        return { spots: nextSpots, people: nextPeople };
      });
    }, 12000); // Verifica actualizações a cada 12 segundos

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    trackEvent("InitiateCheckout", { content_name: "Riqueza Oculta Ebook", value: prices.pricePromo, currency: "AOA" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTestimonialSlide(s => (s + 1) % checkoutTestimonials.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Returned from KB Agency hosted payment page — do NOT trust the redirect alone.
    // Set reference and let the polling useEffect verify status in DB.
    if (searchParams.get("success") === "true") {
      const ref = searchParams.get("ref");
      if (ref) setPaymentReference(ref);
      setPaymentStatus("pending"); // will be updated by polling
      return;
    }
    if (!name || !whatsapp) {
      router.replace("/simulador/inicio");
    }
  }, [name, router, searchParams, setPaymentReference, setPaymentStatus, whatsapp]);

  // Poll for payment status
  useEffect(() => {
    if (!paymentReference || paymentStatus === "paid") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/payment/status/${paymentReference}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.status === "paid") {
        setPaymentStatus("paid");
        trackEvent("Purchase", {
          value: data.amount || prices.pricePromo,
          currency: "AOA",
          content_name: "Riqueza Oculta - Infoproduto",
          content_category: "Educação Financeira"
        });
        clearInterval(interval);
      }
      if (data.status === "failed") {
        setPaymentStatus("failed");
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReference, paymentStatus, setPaymentStatus]);

  async function createSession(method: "express" | "reference") {
    setError("");
    setLoading(true);
    setPaymentStatus("pending");

    try {
      const body: Record<string, unknown> = { name, phone: whatsapp, method };
      if (method === "express") body.expressPhone = expressPhone;

      const res = await fetch("/api/payment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error ?? "Não foi possível iniciar o pagamento");
      }

      setPaymentReference(payload.reference);
      setPaymentData(payload as PaymentData);
      setUiState(method === "express" ? "express_waiting" : "reference_active");

      // Fire AddPaymentInfo event to pixel
      trackEvent("AddPaymentInfo", { payment_method: method, content_name: "Riqueza Oculta Ebook" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setPaymentStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, field: "entity" | "reference") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function resetMethod() {
    setUiState("select");
    setError("");
    setExpressPhone("");
    setPaymentData(null);
    setPaymentReference(null);
    setPaymentStatus("idle");
    setPaymentMethod(null);
  }

  /* ── Estado: pagamento confirmado ── */
  if (paymentStatus === "paid") {
    return (
      <FunnelShell>
        <GlassCard>
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
                <span className="mr-2 inline-block animate-glow-pulse">◆</span>
                Acesso libertado
              </p>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                Bem-vindo à Riqueza Oculta!
              </h1>
              <p className="text-sm leading-relaxed text-soft">
                O teu pagamento foi confirmado. Faz o download do guia e junta-te ao grupo VIP.
              </p>
            </div>

            <div className="mx-auto w-44 drop-shadow-[0_24px_48px_rgba(32,230,126,0.18)] sm:w-52">
              <Image src={ebookCover} alt="Riqueza Oculta: Guia Definitivo" className="w-full rounded-lg object-contain" />
            </div>

            <div className="mx-auto w-full max-w-sm space-y-3">
              <a
                href={`/api/download/${paymentReference}`}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative">⬇ DOWNLOAD</span>
              </a>

              <a
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-brand/25 bg-brand/[0.08] px-6 py-3.5 text-sm font-semibold text-brandBright transition-all duration-300 hover:bg-brand/[0.14]"
              >
                Aceder ao Grupo VIP →
              </a>
            </div>
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell>
      <ChatWidget />
      <GlassCard>
        <div className="space-y-6 text-center">

          {/* Social proof topbar */}
          <SocialProofBar />

          {/* Header */}
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">Passo 5 de 5</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {uiState === "select" ? "Escolhe o método de pagamento" : "Finalizar pagamento"}
            </h1>
          </div>

          {/* Resumo da compra */}
          <div className="mx-auto flex w-full max-w-sm items-center gap-4 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-left">
            <div className="w-14 shrink-0 flex items-center justify-center">
              <Image src={ebookCover} alt="Riqueza Oculta" className="w-full rounded-md object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-soft">Riqueza Oculta: Guia Definitivo</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-muted line-through">{prices.priceOriginal.toLocaleString("pt-PT")} Kz</span>
                <span className="text-base font-semibold text-brand">{prices.pricePromo.toLocaleString("pt-PT")} Kz</span>
              </div>
            </div>
          </div>

          {/* FAQ Toggle */}
          <button
            type="button"
            onClick={() => setIsFaqOpen(true)}
            className="mx-auto flex items-center justify-center gap-1 text-[12px] font-medium text-soft hover:text-brand transition -mt-2"
          >
            O que acontece depois de pagar?
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* ── Estado: Selecionar método ── */}
          {uiState === "select" && (
            <div className="mx-auto w-full max-w-sm">
              <div className="text-left space-y-1 mb-4 mt-2">
                <p className="text-[11px] font-bold tracking-wider text-brand uppercase">Método de pagamento</p>
                <p className="text-sm text-soft">
                  Pagar com: <strong className="text-ink font-semibold">{paymentMethod === "reference" ? "Pagamento por Referência" : paymentMethod === "express" ? "Multicaixa Express" : "Selecione..."}</strong>
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                {/* Referência */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("reference")}
                  className={`relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${paymentMethod === "reference"
                    ? "border-brand bg-brand/[0.08]"
                    : "border-white/[0.08] bg-black/20 hover:border-white/[0.15]"
                    }`}
                >
                  {paymentMethod === "reference" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-black shadow-[0_0_10px_rgba(32,230,126,0.3)]">
                      <CheckSmallIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="h-10 w-10 flex shrink-0 items-center justify-center">
                    <Image
                      src={mcLogo}
                      alt="Pagamento por Referência"
                      className={`w-full transition-all duration-300 ${paymentMethod === "reference" ? "" : "grayscale opacity-60"
                        }`}
                    />
                  </div>
                  <div className="text-left pr-6">
                    <p
                      className={`text-sm font-semibold ${paymentMethod === "reference" ? "text-ink" : "text-muted"
                        }`}
                    >
                      Pagamento por Referência
                    </p>
                    <p className={`text-[11px] mt-0.5 ${paymentMethod === "reference" ? "text-soft" : "text-muted/70"}`}>
                      ATM ou Internet Banking
                    </p>
                  </div>
                </button>

                {/* MCX Express */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("express")}
                  className={`relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${paymentMethod === "express"
                    ? "border-brand bg-brand/[0.08]"
                    : "border-white/[0.08] bg-black/20 hover:border-white/[0.15]"
                    }`}
                >
                  {paymentMethod === "express" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-black shadow-[0_0_10px_rgba(32,230,126,0.3)]">
                      <CheckSmallIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="h-10 w-10 flex shrink-0 items-center justify-center">
                    <Image
                      src={mcxLogo}
                      alt="Multicaixa Express"
                      className={`w-full transition-all duration-300 ${paymentMethod === "express" ? "" : "grayscale opacity-60"
                        }`}
                    />
                  </div>
                  <div className="text-left pr-6">
                    <p
                      className={`text-sm font-semibold ${paymentMethod === "express" ? "text-ink" : "text-muted"
                        }`}
                    >
                      Multicaixa Express
                    </p>
                    <p className={`text-[11px] mt-0.5 ${paymentMethod === "express" ? "text-soft" : "text-muted/70"}`}>
                      Aprovação no app MCX
                    </p>
                  </div>
                </button>
              </div>

              {/* Form Content */}
              {paymentMethod === "express" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2 text-left">
                    <label
                      htmlFor="express-phone"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
                    >
                      Número de telemóvel MCX
                    </label>
                    <input
                      id="express-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9XX XXX XXX"
                      value={expressPhone}
                      onChange={e => setExpressPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-center text-lg font-semibold tracking-widest text-ink placeholder:text-muted/40 focus:border-brand/50 focus:outline-none transition-all"
                    />
                    <p className="text-[11px] text-muted text-center pt-1">
                      Receberás uma notificação no app para aprovar
                    </p>
                  </div>

                  <PrimaryButton
                    onClick={() => createSession("express")}
                    loading={loading}
                    disabled={expressPhone.length < 9}
                  >
                    ACTIVAR PAGAMENTO
                  </PrimaryButton>

                  {/* Selo de segurança e garantia */}
                  <div className="pt-2 space-y-3">
                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                      <LockIcon className="h-3 w-3" />
                      Pagamento 100% seguro
                    </p>

                    <div className="flex items-center justify-center gap-2.5 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3">
                      <svg className="h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-brand">Garantia de 7 dias</p>
                        <p className="text-[10px] text-muted">Dinheiro de volta se não ficares satisfeito</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "reference" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <PrimaryButton onClick={() => createSession("reference")} loading={loading}>
                    GERAR REFERÊNCIA
                  </PrimaryButton>

                  {/* Selo de segurança e garantia */}
                  <div className="pt-2 space-y-3">
                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                      <LockIcon className="h-3 w-3" />
                      Pagamento 100% seguro via Multicaixa / Internet Banking
                    </p>

                    <div className="flex items-center justify-center gap-2.5 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3">
                      <svg className="h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-brand">Garantia de 7 dias</p>
                        <p className="text-[10px] text-muted">Dinheiro de volta se não ficares satisfeito</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!paymentMethod && (
                <div className="pt-2 space-y-3 animate-in fade-in duration-300">
                  {/* Escassez */}
                  {urgencyData ? (
                    <>
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.08] px-3 py-2 transition-all">
                        <span className="text-sm text-yellow-400">⚠️ Restam <strong className="tabular-nums">{urgencyData.spots} vagas</strong> ao preço promocional</span>
                      </div>
                      {/* Contador */}
                      <p className="text-xs text-muted text-center pb-2 transition-all">
                        <span className="font-bold text-brand tabular-nums">{urgencyData.people}+ pessoas</span> já garantiram o seu acesso
                      </p>
                    </>
                  ) : (
                    <div className="h-[76px]"></div> // Placeholder height to prevent layout shift
                  )}

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                    <LockIcon className="h-3 w-3" />
                    Pagamento 100% seguro
                  </p>

                  {/* Selo de garantia animado */}
                  <div className="flex items-center justify-center gap-2.5 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3 animate-[pulse_3s_ease-in-out_infinite]">
                    <svg className="h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-brand">Garantia de 7 dias</p>
                      <p className="text-[10px] text-muted">Dinheiro de volta se não ficares satisfeito</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Estado: Express — aguardar aprovação ── */}
          {uiState === "express_waiting" && (
            <div className="mx-auto w-full max-w-sm space-y-4">
              <div className="rounded-xl border border-brand/20 bg-brand/[0.06] p-6 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand/30 bg-brand/[0.10]">
                  <svg className="h-5 w-5 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-ink">A aguardar aprovação no Multicaixa Express…</p>
                <p className="text-[11px] text-muted">Abre o teu app MCX e aprova o pagamento de</p>
                <p className="text-2xl font-bold tabular-nums text-brand">
                  {paymentData?.payment.amount.toLocaleString("pt-PT") ?? prices.pricePromo.toLocaleString("pt-PT")} Kz
                </p>
              </div>

              <button
                type="button"
                onClick={resetMethod}
                className="w-full text-center text-[11px] text-muted transition hover:text-soft"
              >
                ← Mudar método
              </button>
            </div>
          )}

          {/* ── Estado: Referência activa ── */}
          {uiState === "reference_active" && paymentData && (
            <div className="mx-auto w-full max-w-sm space-y-3 text-left">
              {/* Valor */}
              <div className="rounded-xl border border-brand/25 bg-brand/[0.07] px-4 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Valor a pagar</p>
                <p className="mt-1 text-4xl font-bold leading-none tabular-nums text-brand drop-shadow-[0_0_12px_rgba(32,230,126,0.35)]">
                  {paymentData.payment.amount.toLocaleString("pt-PT")} Kz
                </p>
              </div>

              {/* Se tiver paymentUrl (Standard API), redirecionar para KB Agency */}
              {paymentData.payment.paymentUrl ? (
                <>
                  <p className="text-center text-sm text-soft/70">
                    Clica no botão abaixo para pagar por ATM, Internet Banking ou Multicaixa Express.
                  </p>
                  <a
                    href={paymentData.payment.paymentUrl}
                    className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <span className="relative">PROSSEGUIR PARA PAGAMENTO →</span>
                  </a>
                </>
              ) : (
                /* Fallback: mostrar entidade + referência directamente */
                <>
                  {paymentData.payment.entity && (
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Entidade</p>
                        <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">{paymentData.payment.entity}</p>
                      </div>
                      <button type="button" onClick={() => copyToClipboard(paymentData.payment.entity ?? "", "entity")} aria-label="Copiar entidade" className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-muted transition hover:border-brand/30 hover:text-brand">
                        {copied === "entity" ? <CheckSmallIcon className="h-4 w-4 text-brand" /> : <CopyIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Referência</p>
                      <p className="mt-0.5 text-2xl font-semibold tracking-widest tabular-nums text-ink">{paymentData.payment.reference}</p>
                    </div>
                    <button type="button" onClick={() => copyToClipboard(paymentData.payment.reference, "reference")} aria-label="Copiar referência" className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-muted transition hover:border-brand/30 hover:text-brand">
                      {copied === "reference" ? <CheckSmallIcon className="h-4 w-4 text-brand" /> : <CopyIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}

              {/* Como pagar? */}
              <button
                type="button"
                onClick={() => setIsHowToPayOpen(true)}
                className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-soft hover:text-brand transition w-full"
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Como pagar? Ver guia passo a passo
              </button>

              {/* O que recebes */}
              <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Após o pagamento recebes</p>
                {[
                  "Download imediato do Guia Definitivo",
                  "Acesso ao Grupo VIP no WhatsApp",
                  "Garantia de 7 dias sem risco",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckSmallIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="text-[12px] text-soft">{item}</span>
                  </div>
                ))}
              </div>

              {/* Testemunho rotativo */}
              <div className="relative rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3 min-h-[80px]">
                {checkoutTestimonials.map((t, i) => (
                  <div
                    key={t.name}
                    className={`transition-opacity duration-500 ${i === testimonialSlide ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0 px-4 py-3"}`}
                  >
                    <p className="text-[11px] text-soft/80 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                    <p className="mt-1.5 text-[10px] font-semibold text-brand">— {t.name}</p>
                  </div>
                ))}
              </div>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <LockIcon className="h-3 w-3" />
                Pagamento seguro via Multicaixa / Internet Banking
              </p>
              <button type="button" onClick={resetMethod} className="w-full text-center text-[11px] text-muted transition hover:text-soft">
                ← Mudar método
              </button>
            </div>
          )}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      </GlassCard>

      {/* FAQ Modal Content */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] border border-white/[0.08] bg-[#0c0c0c]/95 p-6 shadow-2xl relative">
            <button
              type="button"
              aria-label="Fechar FAQ"
              onClick={() => setIsFaqOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-white transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-6 pr-8">Como funciona?</h3>

            <ul className="space-y-5 text-left mb-6">
              <li className="flex gap-4">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                  <span className="text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Confirmação Mágica</p>
                  <p className="text-[13px] text-soft mt-1 leading-relaxed">Assim que o pagamento for aprovado via Multicaixa ou Express, nós detectamos automaticamente.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Acesso Libertado</p>
                  <p className="text-[13px] text-soft mt-1 leading-relaxed">O ecrã actualiza na hora e poderás fazer o download imediato do teu Guia Definitivo.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Comunidade VIP</p>
                  <p className="text-[13px] text-soft mt-1 leading-relaxed">Vais receber o link directo para o nosso grupo de alunos no WhatsApp.</p>
                </div>
              </li>
            </ul>

            <PrimaryButton onClick={() => setIsFaqOpen(false)}>
              ENTENDI
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Como Pagar Modal */}
      {isHowToPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] border border-white/[0.08] bg-[#0c0c0c]/95 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              aria-label="Fechar guia"
              onClick={() => setIsHowToPayOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-white transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-5 pr-8">Como pagar passo a passo</h3>

            <div className="space-y-5 mb-6 text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-3">Via ATM</p>
                <ol className="space-y-2">
                  {["Introduzir o cartão", "Pagamentos de Serviços", "Referências", "Introduzir Entidade", "Introduzir Referência", "Confirmar valor e aprovação"].map((step, i) => (
                    <li key={step} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-muted mt-0.5">{i + 1}</span>
                      <span className="text-[12px] text-soft">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-white/[0.05] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-3">Via Internet Banking</p>
                <ol className="space-y-2">
                  {["Aceder ao teu banco online", "Transferências / Pagamentos", "Pagar por Referência", "Introduzir Entidade + Referência + Valor", "Confirmar operação"].map((step, i) => (
                    <li key={step} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-muted mt-0.5">{i + 1}</span>
                      <span className="text-[12px] text-soft">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <PrimaryButton onClick={() => setIsHowToPayOpen(false)}>
              ENTENDI
            </PrimaryButton>
          </div>
        </div>
      )}
    </FunnelShell>
  );
}

export default function CheckoutPagamentoClient({
  initialPrices
}: {
  initialPrices: { priceOriginal: number; pricePromo: number };
}) {
  return (
    <Suspense>
      <CheckoutPagamentoInner initialPrices={initialPrices} />
    </Suspense>
  );
}
