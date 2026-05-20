"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPriceKz } from "@/lib/format";
import type { PayoutRequestRecord } from "@/lib/types";

type PayoutWithAffiliate = PayoutRequestRecord & { affiliateName?: string; affiliateToken?: string };

const STATUS_OPTIONS = [
  { value: "paid",     label: "Marcar Pago",    cls: "border-brand/30 bg-brand/10 text-brand hover:bg-brand/20" },
  { value: "approved", label: "Aprovar",         cls: "border-blue-400/30 bg-blue-400/[0.07] text-blue-400 hover:bg-blue-400/[0.14]" },
  { value: "rejected", label: "Rejeitar",        cls: "border-red-400/30 bg-red-400/[0.07] text-red-400 hover:bg-red-400/[0.14]" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: "Pendente",  cls: "bg-yellow-500/20 text-yellow-400" },
    approved: { label: "Aprovado",  cls: "bg-blue-400/20 text-blue-400" },
    paid:     { label: "Pago",      cls: "bg-brand/20 text-brand" },
    rejected: { label: "Rejeitado", cls: "bg-red-500/20 text-red-400" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-white/10 text-muted" };
  return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutWithAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const fetchData = useCallback(async (status: string) => {
    const url = status === "all" ? "/api/admin/afiliados/payouts" : `/api/admin/afiliados/payouts?status=${status}`;
    const res = await fetch(url);
    if (res.ok) setPayouts(await res.json());
  }, []);

  useEffect(() => { fetchData(filter).finally(() => setLoading(false)); }, [fetchData, filter]);

  async function updatePayout(id: number, status: string) {
    setSaving(s => ({ ...s, [id]: true }));
    try {
      await fetch(`/api/admin/afiliados/payouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes[id] }),
      });
      await fetchData(filter);
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  }

  const pendingTotal = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Levantamentos</h1>
          <p className="text-xs text-muted mt-0.5">Pedidos de levantamento dos afiliados</p>
        </div>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link href={"/admin/afiliados" as any}
            className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
            ← Afiliados
          </Link>
          <button type="button" onClick={() => fetchData(filter)}
            className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      {filter === "pending" && pendingTotal > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.07] px-4 py-3 text-sm text-yellow-300">
          <strong>{payouts.filter(p => p.status === "pending").length} pedidos pendentes</strong> totalizando{" "}
          <strong>{formatPriceKz(pendingTotal)}</strong>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: "pending", label: "Pendentes" },
          { value: "approved", label: "Aprovados" },
          { value: "paid", label: "Pagos" },
          { value: "all", label: "Todos" },
        ].map(f => (
          <button key={f.value} type="button"
            onClick={() => { setFilter(f.value); setLoading(true); }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === f.value
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-white/[0.07] bg-black/20 text-muted hover:border-brand/20 hover:text-ink"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {payouts.map(p => (
          <div key={p.id} className="rounded-2xl border border-white/5 bg-black/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">{p.affiliateName ?? `Afiliado #${p.affiliateId}`}</p>
                {p.affiliateToken && (
                  <p className="text-xs font-mono text-muted">{p.affiliateToken}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-brand">{formatPriceKz(p.amount)}</p>
                <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString("pt-PT")}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status={p.status} />
              {p.notes && (
                <p className="text-xs text-muted italic max-w-[60%] text-right">{p.notes}</p>
              )}
            </div>
            {(p.status === "pending" || p.status === "approved") && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <input
                  type="text"
                  value={notes[p.id] ?? ""}
                  onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                  placeholder="Notas (ex: referência de transferência)"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs text-ink placeholder-muted outline-none focus:border-brand/40"
                />
                <div className="flex gap-2">
                  {STATUS_OPTIONS.filter(o => o.value !== p.status && !(p.status === "pending" && o.value === "approved" ? false : p.status === "pending" && o.value === "paid")).map(o => (
                    <button key={o.value} type="button"
                      onClick={() => updatePayout(p.id, o.value)}
                      disabled={saving[p.id]}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${o.cls}`}>
                      {saving[p.id] ? "…" : o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {payouts.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-8 text-center text-muted italic">
            Nenhum pedido encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
