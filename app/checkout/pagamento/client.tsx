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
import { formatPriceKz } from "@/lib/format";
import { SocialProofBar } from "@/components/funnel/social-proof-bar";
import { ChatWidget } from "@/components/funnel/chat-widget";
import dynamic from "next/dynamic";
import animationData from "@/assets/Future tech Ui.json";
import Link from "next/link";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

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

type UIState = "capture" | "select" | "reference_active";

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

type PaymentContent = {
  support_label: string;
  support_cta: string;
  support_context: string;
  benefit_1: string;
  benefit_2: string;
  benefit_3: string;
  quick_replies: string[];
  vip_cta: string;
  vip_context_payment: string;
  vip_context_confirmed: string;
  testimonial_1_name: string; testimonial_1_text: string; testimonial_1_stars: string;
  testimonial_2_name: string; testimonial_2_text: string; testimonial_2_stars: string;
  testimonial_3_name: string; testimonial_3_text: string; testimonial_3_stars: string;
};

// Referência válida por 24 horas
const REFERENCE_EXPIRY_HOURS = 24;

function ReferenceDeadline() {
  const [deadline, setDeadline] = useState<string>("");
  
  useEffect(() => {
    const date = new Date(Date.now() + REFERENCE_EXPIRY_HOURS * 60 * 60 * 1000);
    const formatted = date.toLocaleString("pt-PT", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
    setDeadline(formatted);
  }, []);

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/[0.08] px-4 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400/80">Referência válida até</p>
      <p className="text-xl font-bold tabular-nums mt-1 text-green-400">
        {deadline || "Amanhã"}
      </p>
      <p className="text-[10px] text-muted mt-1">Tens 24 horas para pagar no ATM ou Internet Banking</p>
    </div>
  );
}

function CheckoutPagamentoInner({
  initialPrices,
  whatsappLink,
  content,
}: {
  initialPrices: { priceOriginal: number; pricePromo: number; priceQuiz: number };
  whatsappLink: string;
  content: PaymentContent;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = useFunnelStore(state => state.name);
  const whatsapp = useFunnelStore(state => state.whatsapp);
  const affiliateToken = useFunnelStore(state => state.affiliateToken);
  const paymentReference = useFunnelStore(state => state.paymentReference);
  const setPaymentReference = useFunnelStore(state => state.setPaymentReference);
  const paymentStatus = useFunnelStore(state => state.paymentStatus);
  const setPaymentStatus = useFunnelStore(state => state.setPaymentStatus);
  const quizPaid = useFunnelStore(state => state.quizPaid);
  const ebookPaid = useFunnelStore(state => state.ebookPaid);

  const [uiState, setUiState] = useState<UIState>("select");
  const [paymentMethod, setPaymentMethod] = useState<"express" | "reference" | null>(null);
  const [expressPhone, setExpressPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"entity" | "reference" | null>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isHowToPayOpen, setIsHowToPayOpen] = useState(false);
  const [testimonialSlide, setTestimonialSlide] = useState(0);
  const [urgencyData, setUrgencyData] = useState<{ spots: number; people: number } | null>(null);

  const productParam = searchParams.get("product") as "ebook" | "quiz" | "ebook_upsell" | null;
  const product = productParam || "ebook";

  const isProductPaid = product === "quiz" ? quizPaid : ebookPaid;

  useEffect(() => {
    if (!isProductPaid && paymentStatus === "paid") {
      console.log("[Checkout] Resetting payment status because current product is not paid.");
      setPaymentStatus("idle");
      setPaymentReference(null);
    }
  }, [product, isProductPaid, paymentStatus, setPaymentStatus, setPaymentReference]);

  const prices = {
    priceOriginal: product === "quiz" ? Math.round(initialPrices.priceQuiz * 2.5) : (product === "ebook_upsell" ? 4500 : initialPrices.priceOriginal),
    pricePromo: product === "quiz" ? initialPrices.priceQuiz : (product === "ebook_upsell" ? 3000 : initialPrices.pricePromo)
  };

  const benefits = product === "quiz"
    ? [
        "Análise completa dos teus 4 pilares financeiros",
        "Sabotador oculto identificado e como neutralizá-lo",
        "Plano prático de 7 dias para começar hoje",
        "Micro-hábito dos 2 minutos personalizado",
        "Acesso imediato — desbloqueio automático após pagamento",
        "7 dias de garantia total ou devolução do valor"
      ]
    : [
        content.benefit_1,
        content.benefit_2,
        content.benefit_3,
        "Audiobook para ouvir em qualquer lugar",
        "Garantia de 7 dias ou dinheiro de volta"
      ];

  // Estados para captura de dados quando não existem no store
  const [captureName, setCaptureName] = useState("");
  const [capturePhone, setCapturePhone] = useState("");
  const [hasStoredData, setHasStoredData] = useState(false);
  const setStoreName = useFunnelStore(state => state.setName);
  const setStoreWhatsapp = useFunnelStore(state => state.setWhatsapp);

  // Preencher campos de captura se dados existirem no localStorage
  useEffect(() => {
    if (name || whatsapp) return; // Já temos dados no store
    
    try {
      const stored = localStorage.getItem("ro-v2-funnel");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state?.name) {
          setCaptureName(parsed.state.name);
          setHasStoredData(true);
        }
        if (parsed.state?.whatsapp) {
          // Remover prefixo +244 se existir
          const phone = parsed.state.whatsapp.replace(/^\+?244/, "");
          setCapturePhone(phone);
        }
      }
    } catch (e) {
      console.error("[Checkout] Erro ao ler dados:", e);
    }
  }, [name, whatsapp]);

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
    trackEvent("InitiateCheckout", { 
      content_name: product === "quiz" ? "Riqueza Oculta Relatório Quiz" : "Riqueza Oculta Ebook", 
      value: prices.pricePromo, 
      currency: "AOA" 
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, prices.pricePromo]);

  const checkoutTestimonials = [
    { name: content.testimonial_1_name, text: content.testimonial_1_text, stars: Number(content.testimonial_1_stars) || 5 },
    { name: content.testimonial_2_name, text: content.testimonial_2_text, stars: Number(content.testimonial_2_stars) || 5 },
    { name: content.testimonial_3_name, text: content.testimonial_3_text, stars: Number(content.testimonial_3_stars) || 5 },
  ];

  useEffect(() => {
    const t = setInterval(() => setTestimonialSlide(s => (s + 1) % checkoutTestimonials.length), 4000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tentar recuperar dados do localStorage/Zustand na montagem
  useEffect(() => {
    // Se já temos dados, não precisamos fazer nada
    if (name && whatsapp) return;
    
    // Tentar recuperar do localStorage directamente (backup)
    try {
      const stored = localStorage.getItem("ro-v2-funnel");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state?.name && parsed.state?.whatsapp) {
          console.log("[Checkout] Recuperando dados do localStorage");
          setStoreName(parsed.state.name);
          setStoreWhatsapp(parsed.state.whatsapp);
          // Não mudamos o uiState aqui, o useEffect abaixo vai detectar os dados
        }
      }
    } catch (e) {
      console.error("[Checkout] Erro ao recuperar dados:", e);
    }
  }, [name, whatsapp, setStoreName, setStoreWhatsapp]);

  useEffect(() => {
    // Returned from KB Agency hosted payment page — do NOT trust the redirect alone.
    // Set reference and let the polling useEffect verify status in DB.
    if (searchParams.get("success") === "true") {
      const ref = searchParams.get("ref");
      if (ref) setPaymentReference(ref);
      setPaymentStatus("pending"); // will be updated by polling
      return;
    }
    // Se não temos dados do utilizador, mostrar formulário de captura em vez de redirecionar
    if (!name || !whatsapp) {
      setUiState("capture");
    }
  }, [name, router, searchParams, setPaymentReference, setPaymentStatus, whatsapp]);

  // Poll for payment status - verificação imediata + polling a cada 2s
  useEffect(() => {
    if (!paymentReference || paymentStatus === "paid") return;

    let pollCount = 0;
    const maxPolls = 300; // 10 minutos máximo (300 * 2s)

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/status/${paymentReference}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.status === "paid") {
          setPaymentStatus("paid");
          if (product === "quiz") {
            useFunnelStore.getState().setQuizPaid(true);
          } else {
            useFunnelStore.getState().setEbookPaid(true);
          }
          trackEvent("Purchase", {
            value: data.amount || prices.pricePromo,
            currency: "AOA",
            content_name: product === "quiz" ? "Riqueza Oculta - Relatório Quiz" : "Riqueza Oculta - Ebook",
            content_category: "Educação Financeira"
          });
          return true; // Stop polling
        }
        if (data.status === "failed") {
          setPaymentStatus("failed");
          return true; // Stop polling
        }
      } catch (err) {
        console.error("[Payment Polling] Error:", err);
      }
      return false;
    };

    // Verificação imediata ao montar
    checkStatus();

    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        console.log("[Payment Polling] Max polls reached");
        return;
      }
      const shouldStop = await checkStatus();
      if (shouldStop) clearInterval(interval);
    }, 2000); // 2 segundos para resposta mais rápida

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReference, paymentStatus, setPaymentStatus]);

  async function createSession(method: "express" | "reference") {
    setError("");
    setLoading(true);
    setPaymentStatus("pending");

    // Mensagens progressivas para Express (demora ~10-12s)
    let messageInterval: NodeJS.Timeout | null = null;
    if (method === "express") {
      const messages = [
        "A contactar Multicaixa Express...",
        "A enviar notificação para o teu telemóvel...",
        "A aguardar resposta do banco...",
        "Quase pronto..."
      ];
      let msgIndex = 0;
      setLoadingMessage(messages[0]);
      messageInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        setLoadingMessage(messages[msgIndex]);
      }, 3000); // Muda a cada 3 segundos
    } else {
      setLoadingMessage("A gerar referência...");
    }

    try {
      // MCX Express uses dedicated route pinned to Vercel Cape Town (cpt1) region
      // to ensure South African IP for KB Agency APIx compatibility
      const endpoint = method === "express" ? "/api/payment/express" : "/api/payment/session";
      const body: Record<string, unknown> = { name, phone: whatsapp, product };
      if (method === "express") body.expressPhone = expressPhone;
      if (method === "reference") body.method = "reference";
      if (affiliateToken) body.affiliateToken = affiliateToken;

      const res = await fetch(endpoint, {
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
      setUiState("reference_active");

      // Fire AddPaymentInfo event to pixel
      trackEvent("AddPaymentInfo", { 
        payment_method: method, 
        content_name: product === "quiz" ? "Riqueza Oculta Relatório Quiz" : "Riqueza Oculta Ebook" 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setPaymentStatus("failed");
    } finally {
      if (messageInterval) clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessage("");
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

  // Função para validar e salvar dados capturados
  function handleCaptureSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanName = captureName.trim();
    if (cleanName.length < 2) {
      setError("Insere o teu nome completo");
      return;
    }

    const phoneRegex = /^\d{9,15}$/;
    const cleanPhone = capturePhone.replace(/\D/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      setError("Número de telefone inválido. Usa formato: 9XX XXX XXX");
      return;
    }

    // Salvar no store e continuar
    setStoreName(cleanName);
    setStoreWhatsapp(`244${cleanPhone}`);
    setUiState("select");
    
    // Enviar lead para API (non-blocking)
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanName,
        phone: `244${cleanPhone}`,
        source: "checkout-direct",
      }),
    }).catch(() => {});
  }

  /* ── Estado: pagamento confirmado ── */
  if (isProductPaid) {
    const isQuiz = product === "quiz";
    return (
      <FunnelShell>
        <GlassCard>
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
                <span className="mr-2 inline-block animate-glow-pulse">◆</span>
                {isQuiz ? "Análise Desbloqueada" : "Acesso libertado"}
              </p>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {isQuiz ? "Relatório Desbloqueado!" : "Bem-vindo à Riqueza Oculta!"}
              </h1>
              <p className="text-sm leading-relaxed text-soft">
                {isQuiz 
                  ? "Parabéns! O teu pagamento foi confirmado e a tua análise financeira está 100% libertada."
                  : "O teu pagamento foi confirmado. Faz o download do guia e junta-te ao grupo VIP."}
              </p>
            </div>

            <div className="mx-auto w-44 drop-shadow-[0_24px_48px_rgba(32,230,126,0.18)] sm:w-52">
              {isQuiz ? (
                <div className="w-40 h-40 mx-auto">
                  <Lottie animationData={animationData} loop={true} />
                </div>
              ) : (
                <Image src={ebookCover} alt="Riqueza Oculta: Guia Definitivo" className="w-full rounded-lg object-contain" />
              )}
            </div>

            <div className="mx-auto w-full max-w-sm space-y-3">
              {isQuiz ? (
                <Link
                  href="/simulador/resultado"
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <span className="relative flex items-center gap-2">
                    VER RELATÓRIO COMPLETO
                  </span>
                </Link>
              ) : (
                <a
                  href={`/api/download/${paymentReference}`}
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <span className="relative flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    DOWNLOAD
                  </span>
                </a>
              )}

              <div className="space-y-1">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-brand/25 bg-brand/[0.08] px-6 py-3.5 text-sm font-semibold text-brandBright transition-all duration-300 hover:bg-brand/[0.14]"
                >
                  {content.vip_cta}
                </a>
                <p className="text-center text-[10px] text-muted">{content.vip_context_confirmed}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell>
      <ChatWidget quickReplies={content.quick_replies} />
      <GlassCard>
        <div className="space-y-6 text-center">

          {/* Social proof topbar */}
          <SocialProofBar />

          {/* Header */}
          <div className="space-y-3">
            {product === "quiz" ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brandBright flex items-center justify-center gap-1.5">
                  <span>ANÁLISE COMPLETA DESBLOQUEADA</span>
                </p>
                <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                  {uiState === "select" ? "Desbloquear Análise" : "Finalizar Pagamento"}
                </h1>
                <p className="text-xs text-soft max-w-sm mx-auto leading-relaxed">
                  O teu diagnóstico financeiro está pronto. Só precisas de confirmar o pagamento para ver tudo.
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">Passo 5 de 5</p>
                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {uiState === "select" ? "Garantir acesso agora" : "Finalizar pagamento"}
                </h1>
              </>
            )}
          </div>

          {/* Resumo da compra */}
          <div className="mx-auto flex w-full max-w-sm items-center gap-4 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-left">
            <div className="w-14 shrink-0 flex items-center justify-center">
              {product === "quiz" ? (
                <div className="w-10 h-10">
                  <Lottie animationData={animationData} loop={true} />
                </div>
              ) : (
                <Image src={ebookCover} alt="Riqueza Oculta" className="w-full rounded-md object-contain" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-soft">
                {product === "quiz" ? "Desbloqueio: Relatório Financeiro Completo" : "Riqueza Oculta: Guia Definitivo"}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-muted line-through">{formatPriceKz(prices.priceOriginal)}</span>
                <span className="text-base font-semibold text-brand">{formatPriceKz(prices.pricePromo)}</span>
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

          {/* ── Estado: Capturar dados ── */}
          {uiState === "capture" && (
            <div className="mx-auto w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted text-left">
                  Preenche os teus dados para continuar
                </p>
                {hasStoredData && (
                  <div className="rounded-lg border border-brand/20 bg-brand/[0.06] px-3 py-2">
                    <p className="text-[11px] text-brand">
                      ✓ Recuperámos os teus dados do quiz. Verifica se estão correctos e continua.
                    </p>
                  </div>
                )}
              </div>
              <form onSubmit={handleCaptureSubmit} className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-muted mb-1.5">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={captureName}
                    onChange={(e) => setCaptureName(e.target.value)}
                    placeholder="Como te chamas?"
                    className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand focus:outline-none transition"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-muted mb-1.5">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    value={capturePhone}
                    onChange={(e) => setCapturePhone(e.target.value)}
                    placeholder="9XX XXX XXX"
                    className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand focus:outline-none transition"
                  />
                  <p className="text-[10px] text-muted mt-1.5">
                    Usamos para enviar a confirmação e acesso ao material.
                  </p>
                </div>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <PrimaryButton type="submit">
                  CONTINUAR →
                </PrimaryButton>
              </form>
            </div>
          )}

          {/* ── Estado: Selecionar método ── */}
          {uiState === "select" && (
            <div className="mx-auto w-full max-w-sm space-y-3">
              {/* Título de seleção */}
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted text-left">
                Escolhe o método de pagamento
              </p>

              {/* Opção: Multicaixa Express */}
              <button
                type="button"
                onClick={() => setPaymentMethod("express")}
                className={`w-full flex items-center gap-4 rounded-xl border p-4 transition-all text-left ${
                  paymentMethod === "express"
                    ? "border-brand bg-brand/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                }`}
              >
                <div className="h-10 w-10 flex shrink-0 items-center justify-center">
                  <Image src={mcxLogo} alt="Multicaixa Express" className="w-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Multicaixa Express</p>
                  <p className="text-[11px] mt-0.5 text-soft">Pagamento direto no teu telemóvel</p>
                </div>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  paymentMethod === "express" ? "bg-brand text-black" : "border border-white/[0.2]"
                }`}>
                  {paymentMethod === "express" && <CheckSmallIcon className="h-4 w-4" />}
                </div>
              </button>

              {/* Opção: Referência */}
              <button
                type="button"
                onClick={() => setPaymentMethod("reference")}
                className={`w-full flex items-center gap-4 rounded-xl border p-4 transition-all text-left ${
                  paymentMethod === "reference"
                    ? "border-brand bg-brand/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                }`}
              >
                <div className="h-10 w-10 flex shrink-0 items-center justify-center">
                  <Image src={mcLogo} alt="Pagamento por Referência" className="w-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Referência Multicaixa</p>
                  <p className="text-[11px] mt-0.5 text-soft">ATM ou Internet Banking</p>
                </div>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  paymentMethod === "reference" ? "bg-brand text-black" : "border border-white/[0.2]"
                }`}>
                  {paymentMethod === "reference" && <CheckSmallIcon className="h-4 w-4" />}
                </div>
              </button>

              {/* Formulário Express */}
              {paymentMethod === "express" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-muted mb-2 text-left">
                      Número do telemóvel (Multicaixa Express)
                    </label>
                    <input
                      type="tel"
                      value={expressPhone}
                      onChange={(e) => setExpressPhone(e.target.value)}
                      placeholder="9XX XXX XXX"
                      className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand focus:outline-none transition"
                    />
                    <p className="text-[10px] text-muted mt-1.5 text-left">
                      Vais receber uma notificação no Multicaixa Express para aprovar o pagamento.
                    </p>
                  </div>

                  <PrimaryButton 
                    onClick={() => createSession("express")} 
                    loading={loading}
                    loadingText={
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {loadingMessage || "A processar..."}
                      </span>
                    }
                    disabled={!expressPhone || expressPhone.length < 9}
                  >
                    PAGAR COM EXPRESS
                  </PrimaryButton>

                  {/* Selo de segurança */}
                  <div className="pt-2 space-y-3">
                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                      <LockIcon className="h-3 w-3" />
                      Pagamento 100% seguro via Multicaixa Express
                    </p>

                    <div className="flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3">
                      <svg className="h-5 w-5 shrink-0 text-brand mt-0.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <div className="text-left flex-1">
                        <p className="text-xs font-semibold text-brand">Garantia de 7 dias</p>
                        <p className="text-[10px] text-muted">Dinheiro de volta se não ficares satisfeito</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulário Referência */}
              {paymentMethod === "reference" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-2">
                  <PrimaryButton 
                    onClick={() => createSession("reference")} 
                    loading={loading}
                    loadingText={loadingMessage || "A gerar referência..."}
                  >
                    GERAR REFERÊNCIA
                  </PrimaryButton>

                  {/* Selo de segurança e garantia */}
                  <div className="pt-2 space-y-3">
                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                      <LockIcon className="h-3 w-3" />
                      Pagamento 100% seguro via Multicaixa / Internet Banking
                    </p>

                    <div className="flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3">
                      <svg className="h-5 w-5 shrink-0 text-brand mt-0.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <div className="text-left flex-1">
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
                        <span className="text-sm text-yellow-400">Restam <strong className="tabular-nums">{urgencyData.spots} vagas</strong> ao preço promocional</span>
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
                  <div className="flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3 animate-[pulse_3s_ease-in-out_infinite]">
                    <svg className="h-5 w-5 shrink-0 text-brand mt-0.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <div className="text-left flex-1">
                      <p className="text-xs font-semibold text-brand">Garantia de 7 dias</p>
                      <p className="text-[10px] text-muted">Dinheiro de volta se não ficares satisfeito</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Estado: Pagamento activo ── */}
          {uiState === "reference_active" && paymentData && (
            <div className="mx-auto w-full max-w-sm space-y-3 text-left">
              {/* Valor */}
              <div className="rounded-xl border border-brand/25 bg-brand/[0.07] px-4 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Valor a pagar</p>
                <p className="mt-1 text-4xl font-bold leading-none tabular-nums text-brand drop-shadow-[0_0_12px_rgba(32,230,126,0.35)]">
                  {formatPriceKz(paymentData.payment.amount)}
                </p>
              </div>

              {/* Multicaixa Express: Animacao de espera */}
              {paymentData.method === "express" ? (
                <div className="rounded-xl border border-brand/20 bg-brand/[0.06] px-6 py-6 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Image src={mcxLogo} alt="Multicaixa Express" className="h-6 w-auto" />
                    <span className="text-sm font-semibold text-brand">Multicaixa Express</span>
                  </div>
                  
                  {/* Spinner animado */}
                  <div className="flex justify-center">
                    <div className="relative h-12 w-12">
                      <div className="absolute inset-0 rounded-full border-2 border-brand/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-ink">A aguardar confirmação...</p>
                    <p className="text-[12px] text-soft leading-relaxed">
                      Abre a app do Multicaixa Express no teu telemóvel e confirma o pagamento.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="rounded-lg bg-black/20 px-3 py-2">
                      <p className="text-[10px] text-muted">
                        Ref: <span className="font-mono text-soft">{paymentData.payment.reference}</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-brand/70">
                      Tens até 5 minutos para confirmar
                    </p>
                  </div>
                </div>
              ) : (
                /* Referência: mostrar entidade + referência */
                <>
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
                </>
              )}



              {/* Deadline de 24h - só para Referência */}
              {paymentData.method !== "express" && <ReferenceDeadline />}

              {/* Botão Guardar no WhatsApp - só para Referência */}
              {paymentData.method !== "express" && paymentData.payment.entity && (
                <a
                  href={`https://wa.me/?text=*Referência Riqueza Oculta*%0A%0AEntidade: ${paymentData.payment.entity}%0AReferência: ${paymentData.payment.reference}%0AValor: ${paymentData.payment.amount} Kz%0A%0APaga no ATM ou Internet Banking.%0A%0ASite: ${typeof window !== 'undefined' ? window.location.origin : 'https://www.riquezaoculta.click'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 px-4 py-3 text-sm text-[#25D366] hover:bg-[#25D366]/20 transition"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="font-medium">Guardar referência no WhatsApp</span>
                </a>
              )}

              {/* Como pagar? - só para Referência */}
              {paymentData.method !== "express" && (
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
              )}

              {/* O que recebes */}
              <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Após o pagamento recebes</p>
                {(product === "quiz" ? benefits : benefits.slice(0, 3)).map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-left">
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
  initialPrices,
  whatsappLink,
  content,
}: {
  initialPrices: { priceOriginal: number; pricePromo: number; priceQuiz: number };
  whatsappLink: string;
  content: PaymentContent;
}) {
  return (
    <Suspense>
      <CheckoutPagamentoInner initialPrices={initialPrices} whatsappLink={whatsappLink} content={content} />
    </Suspense>
  );
}
