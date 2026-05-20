"use client";

import { useState } from "react";
// import Image from "next/image";
import { formatPriceKz } from "@/lib/format";
import { trackEvent } from "@/lib/pixel";

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const UPSELL_CONFIG = {
  originalPrice: 15000,
  upsellPrice: 7500,
  discount: 7500
};

export function UpsellModal({
  isOpen,
  // onClose - available if needed for external close handling
  userName,
  onAccept,
  onDecline
}: UpsellModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firstName = userName?.split(" ")[0] || "";

  if (!isOpen) return null;

  const handleAccept = async () => {
    setIsLoading(true);
    trackEvent("UpsellAccepted", {
      value: UPSELL_CONFIG.upsellPrice,
      currency: "AOA",
      product: "Consultoria Individual"
    });
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    onAccept();
  };

  const handleDecline = () => {
    trackEvent("UpsellDeclined", {
      product: "Consultoria Individual"
    });
    onDecline();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-[28px] border border-brand/20 bg-[#0a1712] p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close button - hidden to force decision */}
        <button
          type="button"
          onClick={handleDecline}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-white transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-6 text-center">
          {/* Success badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.12] px-4 py-1.5">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-green-400">
              Pagamento confirmado!
            </span>
          </div>

          {/* Celebration headline */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              🎉 Parabéns{firstName ? `, ${firstName}` : ""}!
            </h2>
            <p className="text-sm text-soft">
              Fizeste uma excelente decisão ao investir no teu futuro financeiro.
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a1712] px-4 text-[11px] font-semibold uppercase tracking-wider text-brand">
                Oferta Exclusiva de Novo Membro
              </span>
            </div>
          </div>

          {/* Upsell content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Queres acelerar os teus resultados?
            </h3>
            
            <p className="text-sm text-soft leading-relaxed">
              Antes de acederes ao teu ebook, tens a oportunidade de adicionar uma 
              <strong className="text-white"> sessão de consultoria individual 1-a-1</strong>.
            </p>

            {/* Value proposition cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {[
                { icon: "👤", title: "30 Minutos", desc: "Sessão 1-a-1 exclusiva" },
                { icon: "📊", title: "Análise", desc: "Da tua situação actual" },
                { icon: "🎯", title: "Plano", desc: "De acção personalizado" }
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-[11px] text-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Price comparison */}
            <div className="rounded-xl border border-brand/20 bg-brand/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl text-soft/40 line-through">
                  {formatPriceKz(UPSELL_CONFIG.originalPrice)}
                </span>
                <span className="text-4xl font-bold text-brand">
                  {formatPriceKz(UPSELL_CONFIG.upsellPrice)}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1">
                <span className="text-xs font-semibold text-red-400">
                  🔥 Poupa {formatPriceKz(UPSELL_CONFIG.discount)} (50% OFF)
                </span>
              </div>

              <p className="text-[11px] text-muted">
                Preço exclusivo para novos membros. Só disponível neste momento.
              </p>
            </div>

            {/* Scarcity */}
            <div className="flex items-center justify-center gap-2 text-xs text-yellow-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Oferta expira quando fechares esta página</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isLoading}
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow disabled:opacity-70"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="relative flex items-center gap-2">
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    A processar...
                  </>
                ) : (
                  <>
                    SIM, QUERO A CONSULTORIA
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDecline}
              disabled={isLoading}
              className="w-full rounded-xl border border-white/[0.08] bg-transparent px-4 py-3 text-sm text-muted hover:text-soft hover:bg-white/[0.03] transition disabled:opacity-50"
            >
              Não, obrigado. Só quero o ebook
            </button>

            <p className="text-[10px] text-muted">
              A consultoria será agendada após confirmação. Horários sujeitos a disponibilidade.
            </p>
          </div>

          {/* Guarantee */}
          <div className="flex items-center justify-center gap-2 text-xs text-soft/60 pt-2">
            <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Garantia de 7 dias também aplicável à consultoria</span>
          </div>
        </div>
      </div>
    </div>
  );
}
