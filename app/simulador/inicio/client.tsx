"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { PrimaryButton } from "@/components/funnel/primary-button";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { trackCustomEvent, trackEvent } from "@/lib/pixel";

const COUNTRIES = [
  { flag: "🇦🇴", name: "Angola", code: "+244" },
  { flag: "🇵🇹", name: "Portugal", code: "+351" },
  { flag: "🇧🇷", name: "Brasil", code: "+55" },
  { flag: "🇿🇦", name: "África do Sul", code: "+27" },
  { flag: "🇨🇩", name: "RD Congo", code: "+243" },
  { flag: "🇺🇸", name: "EUA", code: "+1" },
];

type SimuladorContent = {
  step_label: string;
  headline: string;
  subtitle: string;
  cta_text: string;
  privacy_text: string;
};

export default function SimuladorInicioClient({ content }: { content: SimuladorContent }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+244");
  const [localPhone, setLocalPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setStoreName = useFunnelStore(state => state.setName);
  const setWhatsapp = useFunnelStore(state => state.setWhatsapp);
  const initQuiz = useFunnelStore(state => state.initQuiz);
  const journey = useFunnelStore(state => state.journey);

  useEffect(() => {
    trackCustomEvent("ViewSimulatorStart", { content_category: "Simulador" });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError("Insere o teu nome completo");
      return;
    }

    const fullPhone = `${countryCode}${localPhone.trim()}`;
    if (!isValidPhone(fullPhone)) {
      setError("Número de WhatsApp inválido");
      return;
    }

    const normalized = normalizePhone(fullPhone);
    setStoreName(cleanName);
    setWhatsapp(normalized);
    setLoading(true);

    // eventId partilhado entre o CAPI (server) e o pixel (client) para o Meta deduplicar o Lead
    const eventId = `lead_${crypto.randomUUID()}`;

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: normalized,
          source: "simulador-inicio",
          journey,
          eventId
        })
      });
      trackEvent("Lead", { content_name: "1M Em Uma Semana - Simulador" }, { eventID: eventId });
    } catch {
      // Lead save failure is non-blocking — continue the funnel
    } finally {
      setLoading(false);
      initQuiz();
      router.push("/simulador/quiz");
    }
  }

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">{content.step_label}</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{content.headline}</h1>
            <p className="text-sm leading-relaxed text-soft">{content.subtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-4">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como te chamas?"
              className="h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-base font-light text-ink outline-none ring-brand/30 transition placeholder:text-soft/80 focus:ring"
              autoFocus
              maxLength={80}
            />

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">WhatsApp para receber a análise</p>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  aria-label="Indicativo do país"
                  className="h-12 shrink-0 rounded-xl border border-white/12 bg-black/30 px-3 text-sm text-ink outline-none ring-brand/30 transition focus:ring appearance-none cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>

                <input
                  value={localPhone}
                  onChange={e => setLocalPhone(e.target.value)}
                  placeholder="9XX XXX XXX"
                  inputMode="tel"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/30 px-4 text-base font-light text-ink outline-none ring-brand/30 transition placeholder:text-soft/80 focus:ring"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <PrimaryButton type="submit" loading={loading}>{content.cta_text}</PrimaryButton>

            <p className="text-center text-[10px] text-muted">{content.privacy_text}</p>
          </form>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
