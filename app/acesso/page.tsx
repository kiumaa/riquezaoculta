import Link from "next/link";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EY84u93L1uy3CSOFF6mBl7?mode=gi_t";

export default function AcessoPage() {
  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-5 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Pagamento confirmado</p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Acesso libertado com sucesso</h1>
          <p className="text-sm leading-relaxed text-soft">
            O teu acesso está confirmado. A próxima etapa é receber o conteúdo e iniciar a execução do plano.
          </p>

          <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm text-soft/80 space-y-2 text-left">
            <p>1. Verifica o WhatsApp para instruções e suporte.</p>
            <p>2. Inicia pelo módulo 1 do ebook no mesmo dia.</p>
            <p>3. Executa a checklist de 7 dias sem interrupção.</p>
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
