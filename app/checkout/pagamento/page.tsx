"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { PrimaryButton } from "@/components/funnel/primary-button";
import { useFunnelStore } from "@/lib/store/funnel-store";

type PaymentData = {
  reference: string;
  payment: {
    entity: string;
    reference: string;
    amount: number;
    mode: "live" | "simulated";
  };
};

export default function CheckoutPagamentoPage() {
  const router = useRouter();
  const name = useFunnelStore(state => state.name);
  const whatsapp = useFunnelStore(state => state.whatsapp);
  const paymentReference = useFunnelStore(state => state.paymentReference);
  const setPaymentReference = useFunnelStore(state => state.setPaymentReference);
  const paymentStatus = useFunnelStore(state => state.paymentStatus);
  const setPaymentStatus = useFunnelStore(state => state.setPaymentStatus);

  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!name || !whatsapp) {
      router.replace("/checkout/contato");
    }
  }, [name, router, whatsapp]);

  useEffect(() => {
    if (!paymentReference) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/payment/status/${paymentReference}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.status === "paid") {
        setPaymentStatus("paid");
        clearInterval(interval);
        router.push(`/acesso?ref=${encodeURIComponent(paymentReference)}`);
      }

      if (data.status === "failed") {
        setPaymentStatus("failed");
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentReference, router, setPaymentStatus]);

  async function createSession() {
    setError("");
    setLoading(true);
    setPaymentStatus("pending");

    try {
      const res = await fetch("/api/payment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: whatsapp })
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error ?? "Nao foi possivel iniciar o pagamento");
      }

      setPaymentReference(payload.reference);
      setPaymentData(payload as PaymentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setPaymentStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  const helperText = useMemo(() => {
    if (paymentStatus === "paid") return "Pagamento confirmado.";
    if (paymentStatus === "failed") return "Pagamento nao confirmado. Tenta gerar nova referencia.";
    if (paymentStatus === "pending") return "A aguardar confirmacao bancaria...";
    return "Gera tua referencia para pagar no Multicaixa.";
  }, [paymentStatus]);

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Passo 6 de 6</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Pagamento por referencia</h1>
            <p className="text-sm leading-relaxed text-soft">{helperText}</p>
          </div>

          {!paymentData ? (
            <PrimaryButton className="mx-auto max-w-md" onClick={createSession} loading={loading}>
              Gerar referencia de pagamento
            </PrimaryButton>
          ) : (
            <div className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-white/12 bg-black/28 p-4">
              <div className="rounded-lg border border-white/12 bg-black/28 px-3 py-2">
                <span className="text-xs text-soft">Entidade</span>
                <p className="text-lg font-semibold">{paymentData.payment.entity}</p>
              </div>

              <div className="rounded-lg border border-white/12 bg-black/28 px-3 py-2">
                <span className="text-xs text-soft">Referencia</span>
                <p className="text-lg font-semibold text-brand">{paymentData.payment.reference}</p>
              </div>

              <div className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2">
                <span className="text-xs text-soft">Montante</span>
                <p className="text-lg font-semibold">{paymentData.payment.amount.toLocaleString("pt-PT")} Kz</p>
              </div>

              <p className="text-xs text-soft">
                Modo: {paymentData.payment.mode === "live" ? "live" : "simulado"}. Confirmacao automatica por polling.
              </p>
            </div>
          )}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
