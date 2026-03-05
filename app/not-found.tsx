import Link from "next/link";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";

export default function NotFound() {
  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl">Pagina nao encontrada</h1>
          <p className="text-sm leading-relaxed text-soft">O caminho solicitado nao existe nesta versao do funil.</p>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl border border-brand/45 bg-brand px-6 py-3.5 font-semibold text-[#04140c] shadow-hero transition hover:bg-brandDark"
          >
            Voltar ao inicio
          </Link>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
