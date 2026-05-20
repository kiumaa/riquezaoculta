"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { formatPriceKz } from "@/lib/format";
import type { PayoutRequestRecord } from "@/lib/types";

type AffiliateStats = {
  name: string;
  token: string;
  commissionRate: number;
  totalClicks: number;
  totalSales: number;
  totalEarnings: number;
  currentBalance: number;
  status: string;
  payouts: PayoutRequestRecord[];
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pendente",  cls: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Aprovado",  cls: "bg-brand/20 text-brand" },
  paid:     { label: "Pago",      cls: "bg-brand/30 text-brand" },
  rejected: { label: "Rejeitado", cls: "bg-red-500/20 text-red-400" },
};

function Badge({ status }: { status: string }) {
  const { label, cls } = STATUS_LABEL[status] ?? { label: status, cls: "bg-white/10 text-muted" };
  return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function AfiliiadoDashboardPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const shareLink = `https://www.riquezaoculta.click/simulador/inicio?ref=${token}`;

  useEffect(() => {
    fetch(`/api/afiliados/${token}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [token]);

  async function handlePayout(e: React.FormEvent) {
    e.preventDefault();
    setPayoutError("");
    setPayoutLoading(true);
    try {
      const res = await fetch(`/api/afiliados/${token}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payoutAmount) }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPayoutError(body.error ?? "Erro ao solicitar levantamento.");
      } else {
        setPayoutSuccess(true);
        setPayoutAmount("");
        // Reload stats
        const updated = await fetch(`/api/afiliados/${token}`).then(r => r.json());
        setData(updated);
      }
    } catch {
      setPayoutError("Erro de ligação. Tenta novamente.");
    } finally {
      setPayoutLoading(false);
    }
  }

  if (loading) {
    return (
      <FunnelShell>
        <GlassCard>
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  if (notFound || !data) {
    return (
      <FunnelShell>
        <GlassCard>
          <div className="space-y-4 text-center py-8">
            <p className="text-2xl">🔍</p>
            <h1 className="text-lg font-bold text-ink">Afiliado não encontrado</h1>
            <p className="text-sm text-muted">O link que usaste pode estar incorreto ou a conta foi suspensa.</p>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Link href={"/afiliados/registar" as any} className="inline-block text-sm text-brand hover:underline">
              Registar como afiliado
            </Link>
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  const canRequestPayout = data.currentBalance >= 5000 && data.status === "active";

  return (
    <FunnelShell>
      <GlassCard>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-ink">{data.name}</h1>
              <p className="text-xs text-muted font-mono">{token}</p>
            </div>
            <Badge status={data.status} />
          </div>

          {data.status === "pending" && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.07] px-4 py-3 text-sm text-yellow-300">
              A tua conta está a aguardar aprovação. Assim que for aprovada, poderás começar a partilhar o teu link.
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Cliques</p>
              <p className="text-3xl font-black text-ink">{data.totalClicks}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Vendas</p>
              <p className="text-3xl font-black text-brand">{data.totalSales}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Ganho</p>
              <p className="text-xl font-black text-ink">{formatPriceKz(data.totalEarnings)}</p>
            </div>
            <div className="rounded-xl border border-brand/20 bg-brand/[0.07] p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Saldo disponível</p>
              <p className="text-xl font-black text-brand">{formatPriceKz(data.currentBalance)}</p>
            </div>
          </div>

          <p className="text-center text-xs text-muted">
            Comissão: <strong className="text-brand">{data.commissionRate}%</strong> por venda confirmada
          </p>

          {/* Share link */}
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">O teu link de partilha</p>
            <p className="font-mono text-[11px] break-all text-soft/70">{shareLink}</p>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(shareLink)}
              className="w-full rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/20"
            >
              Copiar link
            </button>
          </div>

          {/* Payout request */}
          {data.status === "active" && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Solicitar levantamento</p>
              {canRequestPayout ? (
                payoutSuccess ? (
                  <div className="rounded-xl border border-brand/20 bg-brand/[0.07] px-4 py-3 text-sm text-brand">
                    Pedido submetido com sucesso. Será processado em até 7 dias úteis.
                  </div>
                ) : (
                  <form onSubmit={handlePayout} className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-soft/60 uppercase tracking-widest">
                        Valor (Kz) — mínimo 5.000 Kz
                      </label>
                      <input
                        required
                        type="number"
                        min={5000}
                        max={data.currentBalance}
                        step={100}
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        placeholder="5000"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-ink placeholder-muted outline-none transition focus:border-brand/40"
                      />
                    </div>
                    {payoutError && (
                      <p className="text-sm text-red-400">{payoutError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={payoutLoading || !payoutAmount}
                      className="w-full rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#04140c] transition hover:scale-[1.02] disabled:opacity-60"
                    >
                      {payoutLoading ? "A processar…" : "Solicitar levantamento"}
                    </button>
                  </form>
                )
              ) : (
                <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-muted">
                  Saldo mínimo para levantamento: <strong className="text-soft">5.000 Kz</strong>
                  {data.currentBalance > 0 && (
                    <span> (faltam {formatPriceKz(5000 - data.currentBalance)})</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payout history */}
          {data.payouts.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Histórico de levantamentos</p>
              <div className="space-y-2">
                {data.payouts.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{formatPriceKz(p.amount)}</p>
                      <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString("pt-PT")}</p>
                    </div>
                    <Badge status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </FunnelShell>
  );
}
