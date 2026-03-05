"use client";

import Link from "next/link";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { useFunnelStore } from "@/lib/store/funnel-store";

const bullets = [
  "Os 5 Pilares da Riqueza Mental",
  "Como Reprogramar Crencas Limitantes",
  "Rituais Estrategicos de Foco",
  "A Formula do Crescimento Financeiro"
];

export default function OfertaPage() {
  const name = useFunnelStore(state => state.name);
  const result = useFunnelStore(state => state.result);

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Passo 4 de 6</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Riqueza Oculta: Guia Definitivo</h1>
            <p className="text-sm leading-relaxed text-soft">
              {name ? `${name},` : ""} descobre os pilares estrategicos que separam quem gera resultados reais de
              quem apenas observa.
              {result ? ` ${result.offerAngle}` : ""} Nao e sobre sofrer mais, e sobre dominar o sistema.
            </p>
          </div>

          <ul className="mx-auto w-full max-w-xl space-y-3">
            {bullets.map(item => (
              <li key={item} className="rounded-xl border border-white/12 bg-black/28 px-4 py-3 text-sm font-light leading-relaxed text-soft">
                {item}
              </li>
            ))}
          </ul>

          <div className="mx-auto w-full max-w-sm rounded-xl border border-brand/25 bg-brand/10 p-4 ring-1 ring-brand/15">
            <p className="text-xs uppercase tracking-[0.16em] text-soft">Investimento unico</p>
            <p className="mt-1 text-3xl font-semibold">4.500 Kz</p>
            <p className="text-sm text-soft">Sem mensalidade. Acesso imediato apos pagamento.</p>
          </div>

          <Link
            href="/checkout/contato"
            className="mx-auto inline-flex w-full max-w-md items-center justify-center rounded-xl border border-brand/45 bg-brand px-6 py-4 text-base font-semibold text-[#04140c] shadow-hero transition hover:bg-brandDark sm:text-lg"
          >
            Desbloquear agora
          </Link>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
