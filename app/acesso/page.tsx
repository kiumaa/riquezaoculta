"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { UpsellModal } from "@/components/funnel/upsell-modal";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { trackEvent } from "@/lib/pixel";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EY84u93L1uy3CSOFF6mBl7?mode=gi_t";

export default function AcessoPage() {
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellAccepted, setUpsellAccepted] = useState(false);
  const [upsellDeclined, setUpsellDeclined] = useState(false);
  const name = useFunnelStore(state => state.name);
  const paymentStatus = useFunnelStore(state => state.paymentStatus);

  // Show upsell modal when page loads (if payment was confirmed)
  useEffect(() => {
    // Check if we've already shown upsell this session
    const hasSeenUpsell = sessionStorage.getItem("ro_upsell_shown");
    
    if (paymentStatus === "paid" && !hasSeenUpsell && !upsellDeclined) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowUpsell(true);
        sessionStorage.setItem("ro_upsell_shown", "true");
        trackEvent("UpsellShown", { page: "acesso" });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, upsellDeclined]);

  const handleUpsellAccept = () => {
    setUpsellAccepted(true);
    setShowUpsell(false);
    trackEvent("UpsellAccepted", { product: "consultoria" });
    
    // Here you would redirect to a payment page for the upsell
    // For now, we'll just show a success state
  };

  const handleUpsellDecline = () => {
    setUpsellDeclined(true);
    setShowUpsell(false);
    trackEvent("UpsellDeclined", { product: "consultoria" });
  };

  // If upsell was accepted, show special confirmation
  if (upsellAccepted) {
    return (
      <FunnelShell>
        <GlassCard>
          <div className="space-y-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
              <svg className="h-10 w-10 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">
                Upsell confirmado!
              </p>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                Consultoria adicionada
              </h1>
              <p className="text-sm leading-relaxed text-soft">
                Parabéns por investires ainda mais no teu crescimento! 
                Vamos contactar-te em breve para agendar a tua sessão.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm text-soft/80 space-y-2 text-left">
              <p className="font-semibold text-white">Próximos passos:</p>
              <p>1. Receberás um email/SMS com a confirmação.</p>
              <p>2. A nossa equipa vai contactar-te em 24-48h.</p>
              <p>3. Agenda a tua sessão no horário que te convier.</p>
            </div>

            <div className="space-y-3">
              <a
                href="/Riqueza_Oculta.pdf"
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative">⬇ DOWNLOAD DO GUIA</span>
              </a>

              <Link
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-brand/25 bg-brand/[0.08] px-6 py-3.5 text-sm font-semibold text-brandBright transition-all duration-300 hover:bg-brand/[0.14]"
              >
                Aceder ao Grupo VIP →
              </Link>
            </div>
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  return (
    <>
      <FunnelShell>
        <GlassCard>
          <div className="space-y-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.12] px-3 py-1">
              <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
                Pagamento confirmado
              </span>
            </div>

            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              Acesso libertado com sucesso
            </h1>
            <p className="text-sm leading-relaxed text-soft">
              O teu acesso está confirmado. A próxima etapa é receber o conteúdo e iniciar a execução do plano.
            </p>

            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm text-soft/80 space-y-2 text-left">
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">1</span>
                Verifica o WhatsApp para instruções e suporte.
              </p>
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">2</span>
                Inicia pelo módulo 1 do ebook no mesmo dia.
              </p>
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">3</span>
                Executa a checklist de 7 dias sem interrupção.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="/Riqueza_Oculta.pdf"
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  DOWNLOAD DO GUIA
                </span>
              </a>

              <Link
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-6 py-3.5 text-sm font-semibold text-[#25D366] transition-all duration-300 hover:bg-[#25D366]/20"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Aceder ao Grupo VIP →
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-4 flex items-center justify-center gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Garantia 7 dias
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Download seguro
              </span>
            </div>
          </div>
        </GlassCard>
      </FunnelShell>

      {/* Upsell Modal */}
      <UpsellModal
        isOpen={showUpsell}
        onClose={handleUpsellDecline}
        userName={name}
        onAccept={handleUpsellAccept}
        onDecline={handleUpsellDecline}
      />
    </>
  );
}
