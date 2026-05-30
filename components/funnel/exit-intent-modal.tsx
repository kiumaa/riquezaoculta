"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import ebookCover from "@/public/capa_1m_v1.jpg";
import { formatPriceKz } from "@/lib/format";
import { trackEvent } from "@/lib/pixel";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prices: {
    original: number;
    promo: number;
    exitDiscount: number;
  };
  onAccept: () => void;
  onDecline: () => void;
}

export function ExitIntentModal({
  isOpen,
  onClose,
  prices,
  onAccept,
  onDecline
}: ExitIntentModalProps) {
  const [isDeclining, setIsDeclining] = useState(false);

  if (!isOpen) return null;

  const discountedPrice = prices.promo - prices.exitDiscount;

  const handleAccept = () => {
    trackEvent("ExitIntentAccepted", {
      value: discountedPrice,
      currency: "AOA",
      discount: prices.exitDiscount
    });
    onAccept();
  };

  const handleDecline = () => {
    setIsDeclining(true);
    // Small delay to show the "are you sure" state
    setTimeout(() => {
      trackEvent("ExitIntentDeclined", {});
      onDecline();
      setIsDeclining(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[24px] border border-brand/20 bg-[#0a1712] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-white transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isDeclining ? (
          <div className="space-y-5 text-center">
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/[0.12] px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
                Espera! Oferta de despedida
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                Não percas esta oportunidade!
              </h2>
              <p className="text-sm text-soft leading-relaxed">
                Vemo-nos quase lá. Não deixes escapar o conhecimento que pode transformar as tuas finanças.
              </p>
            </div>

            {/* Product image */}
            <div className="mx-auto w-32 drop-shadow-[0_12px_24px_rgba(32,230,126,0.15)]">
              <Image 
                src={ebookCover} 
                alt="1M em Uma Semana" 
                className="w-full rounded-lg object-contain" 
              />
            </div>

            {/* Special offer */}
            <div className="rounded-xl border border-brand/20 bg-brand/[0.06] p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
                Desconto exclusivo de saída
              </p>
              
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg text-soft/40 line-through">
                  {formatPriceKz(prices.promo)}
                </span>
                <span className="text-3xl font-bold text-brand">
                  {formatPriceKz(discountedPrice)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-muted">Poupas</span>
                <span className="font-semibold text-green-400">
                  {formatPriceKz(prices.original - discountedPrice)}
                </span>
              </div>

              {/* Countdown hint */}
              <p className="text-[11px] text-red-400">
                ⚠️ Esta oferta desaparece quando fechares esta janela
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2 text-left">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Inclui:</p>
              <ul className="space-y-1.5">
                {[
                  "Ebook 1M em Uma Semana completo",
                  "Acesso ao Grupo VIP WhatsApp",
                  "Garantia de 7 dias",
                  "BÔNUS: Checklist de Hábitos"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-soft">
                    <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAccept}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative">
                  SIM, QUERO O DESCONTO EXTRA!
                </span>
              </button>

              <button
                type="button"
                onClick={handleDecline}
                className="w-full text-xs text-muted hover:text-soft transition py-2"
              >
                Não, prefiro pagar o preço normal depois →
              </button>
            </div>

            {/* Trust */}
            <p className="text-[10px] text-muted flex items-center justify-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pagamento seguro via Multicaixa
            </p>
          </div>
        ) : (
          /* Are you sure state */
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-white">
              Tens a certeza?
            </h3>
            
            <p className="text-sm text-soft">
              Vais perder o desconto de <strong className="text-red-400">{formatPriceKz(prices.exitDiscount)}</strong> e pagar o preço completo mais tarde.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeclining(false)}
                className="w-full rounded-xl border border-brand/30 bg-brand/[0.08] px-4 py-3 text-sm font-semibold text-brand hover:bg-brand/[0.12] transition"
              >
                Voltar e aceitar o desconto
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs text-muted hover:text-soft transition py-2"
              >
                Sim, tenho a certeza. Fechar.
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
