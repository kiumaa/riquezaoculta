"use client";

import { useState } from "react";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";

export default function AfiliadosRegistarPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", iban: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ token: string } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/afiliados/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao registar. Tenta novamente.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Erro de ligação. Verifica a tua conexão e tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  const shareLink = result ? `https://www.riquezaoculta.click/simulador/inicio?ref=${result.token}` : "";

  if (result) {
    return (
      <FunnelShell>
        <GlassCard>
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/20">
              <svg className="h-8 w-8 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">Pedido recebido!</h1>
              <p className="mt-2 text-sm text-soft/70">
                A tua candidatura foi submetida e está a aguardar aprovação. Receberás confirmação em breve.
              </p>
            </div>
            <div className="rounded-xl border border-brand/20 bg-brand/[0.07] p-4 space-y-3 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">O teu link de afiliado</p>
              <p className="font-mono text-xs break-all text-soft/80">{shareLink}</p>
              <p className="text-[11px] text-muted">Guarda este link. Podes começar a partilhar após aprovação.</p>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(shareLink)}
                className="w-full rounded-xl border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20"
              >
                Copiar link
              </button>
            </div>
            <p className="text-xs text-muted">
              Acede ao teu dashboard em:{" "}
              <a href={`/afiliados/${result.token}`} className="text-brand hover:underline font-medium">
                /afiliados/{result.token}
              </a>
            </p>
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-ink">Torna-te Afiliado</h1>
            <p className="text-sm text-soft/70">
              Partilha o Riqueza Oculta e ganha <strong className="text-brand">30% de comissão</strong> por cada venda.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { n: "30%", label: "Comissão por venda" },
              { n: "30d", label: "Cookie de atribuição" },
              { n: "7d", label: "Pagamento em 7 dias" },
            ].map(s => (
              <div key={s.n} className="rounded-xl border border-white/[0.05] bg-black/20 px-2 py-3 space-y-1">
                <p className="text-lg font-bold text-brand">{s.n}</p>
                <p className="text-[10px] font-semibold text-muted leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-soft/70 uppercase tracking-widest">
                  Nome completo *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="O teu nome completo"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-ink placeholder-muted outline-none transition focus:border-brand/40 focus:bg-white/[0.06]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-soft/70 uppercase tracking-widest">
                  Telefone (WhatsApp) *
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="9XX XXX XXX"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-ink placeholder-muted outline-none transition focus:border-brand/40 focus:bg-white/[0.06]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-soft/70 uppercase tracking-widest">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-ink placeholder-muted outline-none transition focus:border-brand/40 focus:bg-white/[0.06]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-soft/70 uppercase tracking-widest">
                  IBAN para pagamentos (opcional)
                </label>
                <input
                  type="text"
                  value={form.iban}
                  onChange={e => setForm(f => ({ ...f, iban: e.target.value }))}
                  placeholder="AO06 0006 0000 0000 0000 0000 0"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-ink placeholder-muted outline-none transition focus:border-brand/40 focus:bg-white/[0.06]"
                />
                <p className="mt-1 text-[10px] text-muted">Podes adicionar mais tarde no teu dashboard.</p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "A submeter…" : "Candidatar-me como Afiliado"}
            </button>

            <p className="text-center text-[11px] text-muted">
              Ao submeter, aceitas os termos do programa de afiliados. A aprovação é manual e pode demorar até 24h.
            </p>
          </form>
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
