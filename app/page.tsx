import Link from "next/link";
import { FunnelShell } from "@/components/funnel/funnel-shell";

export default function LandingPage() {
  return (
    <FunnelShell>
      <section className="space-y-8 text-center sm:space-y-9">
        <div className="mx-auto inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-brandBright">
          Simulador Riqueza 2026
        </div>

        <h1 className="text-3xl font-semibold leading-[1.08] sm:text-4xl md:text-5xl">
          Trabalhas, corres, prometes mudar...
          <span className="block text-brand">mas sentes que nada muda?</span>
        </h1>

        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-soft sm:text-base">
          O que te trava nao e azar. E um padrao invisivel na tua mente que decide as tuas escolhas sem que percebas.
        </p>

        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-soft sm:text-base">
          Este simulador revela em 2 minutos qual e o teu padrao mental e o que esta a travar a tua abundancia.
        </p>

        <div className="mx-auto max-w-sm">
          <Link
            href="/simulador/inicio"
            className="inline-flex w-full items-center justify-center rounded-xl border border-brand/45 bg-brand px-6 py-4 text-base font-semibold text-[#04140c] shadow-hero transition hover:bg-brandDark sm:text-lg"
          >
            Iniciar simulador
          </Link>
        </div>

        <div className="mx-auto flex items-center justify-center gap-6 text-[11px] text-soft">
          <span>100% Anonimo</span>
          <span>Resultado Imediato</span>
        </div>
      </section>
    </FunnelShell>
  );
}
