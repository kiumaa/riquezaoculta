import Link from "next/link";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";

export default function AcessoPage() {
  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Pagamento confirmado</p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Acesso libertado com sucesso</h1>
          <p className="text-sm leading-relaxed text-soft">
            O teu acesso esta confirmado. A proxima etapa e receber o conteudo e iniciar execucao do plano.
          </p>

          <div className="rounded-xl border border-white/12 bg-black/28 p-4 text-sm font-light leading-relaxed text-soft">
            <p>1. Verifica o WhatsApp para instrucoes e suporte.</p>
            <p>2. Inicia pelo modulo 1 do ebook no mesmo dia.</p>
            <p>3. Executa a checklist de 7 dias sem interrupcao.</p>
          </div>

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
