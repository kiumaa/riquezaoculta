"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { PrimaryButton } from "@/components/funnel/primary-button";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { useFunnelStore } from "@/lib/store/funnel-store";

export default function CheckoutContatoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const name = useFunnelStore(state => state.name);
  const setWhatsapp = useFunnelStore(state => state.setWhatsapp);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("Numero de WhatsApp invalido");
      return;
    }

    const normalized = normalizePhone(phone);
    setWhatsapp(normalized);

    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Lead", phone: normalized, source: "ebook-offer" })
      });
    } finally {
      setLoading(false);
      router.push("/checkout/pagamento");
    }
  }

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Passo 5 de 6</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Onde enviamos o teu acesso?</h1>
            <p className="text-sm leading-relaxed text-soft">
              Insere teu WhatsApp para receber confirmacao e suporte rapido.
            </p>
          </div>

          <form className="mx-auto w-full max-w-md space-y-4" onSubmit={onSubmit}>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ex: +244 923 456 789"
              className="h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-base font-light text-ink outline-none ring-brand/30 transition placeholder:text-soft/80 focus:ring"
            />

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <PrimaryButton type="submit" loading={loading}>
              Ir para pagamento
            </PrimaryButton>
          </form>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
