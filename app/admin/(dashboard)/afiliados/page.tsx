"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPriceKz } from "@/lib/format";
import type { AffiliateRecord } from "@/lib/types";

type PagedAffiliates = { data: AffiliateRecord[]; total: number; page: number; totalPages: number };

const STATUS_OPTIONS = [
  { value: "active",    label: "Aprovar",   cls: "border-brand/30 bg-brand/10 text-brand hover:bg-brand/20" },
  { value: "suspended", label: "Suspender", cls: "border-red-400/30 bg-red-400/[0.07] text-red-400 hover:bg-red-400/[0.14]" },
  { value: "pending",   label: "Pendente",  cls: "border-yellow-500/30 bg-yellow-500/[0.07] text-yellow-400 hover:bg-yellow-500/[0.14]" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "Pendente",   cls: "bg-yellow-500/20 text-yellow-400" },
    active:    { label: "Activo",     cls: "bg-brand/20 text-brand" },
    suspended: { label: "Suspenso",   cls: "bg-red-500/20 text-red-400" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-white/10 text-muted" };
  return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function AdminAfiliadosPage() {
  const [result, setResult] = useState<PagedAffiliates>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<number, { commissionRate: string }>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const fetchData = useCallback(async (p: number) => {
    const res = await fetch(`/api/admin/afiliados?page=${p}&limit=20`);
    if (res.ok) setResult(await res.json());
  }, []);

  useEffect(() => { fetchData(1).finally(() => setLoading(false)); }, [fetchData]);

  async function updateAffiliate(id: number, patch: Record<string, unknown>) {
    setSaving(s => ({ ...s, [id]: true }));
    try {
      await fetch(`/api/admin/afiliados/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await fetchData(page);
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Afiliados</h1>
          <p className="text-xs text-muted mt-0.5">Gestão de afiliados e comissões</p>
        </div>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link href={"/admin/afiliados/payouts" as any}
            className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
            Ver Levantamentos
          </Link>
          <button type="button" onClick={() => fetchData(page)}
            className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total</p>
          <p className="text-3xl font-black mt-1">{result.total}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Activos</p>
          <p className="text-3xl font-black mt-1 text-brand">{result.data.filter(a => a.status === "active").length}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Pendentes</p>
          <p className="text-3xl font-black mt-1 text-yellow-400">{result.data.filter(a => a.status === "pending").length}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Vendas</p>
          <p className="text-3xl font-black mt-1">{result.data.reduce((s, a) => s + a.totalSales, 0)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Comissão %</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Vendas</th>
                <th className="px-4 py-3">Ganhos</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.data.map(a => (
                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-muted">{a.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-muted">
                    <a href={`/afiliados/${a.token}`} target="_blank" className="hover:text-brand transition">{a.token}</a>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editing[a.id]?.commissionRate ?? a.commissionRate}
                        onChange={e => setEditing(ed => ({ ...ed, [a.id]: { commissionRate: e.target.value } }))}
                        className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-ink outline-none focus:border-brand/40"
                      />
                      {editing[a.id] && Number(editing[a.id].commissionRate) !== a.commissionRate && (
                        <button type="button"
                          onClick={() => updateAffiliate(a.id, { commissionRate: Number(editing[a.id].commissionRate) })}
                          disabled={saving[a.id]}
                          className="rounded border border-brand/30 bg-brand/10 px-2 py-1 text-[10px] font-bold text-brand hover:bg-brand/20 transition disabled:opacity-50">
                          {saving[a.id] ? "…" : "OK"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 tabular-nums">{a.totalClicks}</td>
                  <td className="px-4 py-4 font-bold tabular-nums text-brand">{a.totalSales}</td>
                  <td className="px-4 py-4 tabular-nums text-sm">{formatPriceKz(a.totalEarnings)}</td>
                  <td className="px-4 py-4 tabular-nums text-sm font-bold">{formatPriceKz(a.currentBalance)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {STATUS_OPTIONS.filter(o => o.value !== a.status).map(o => (
                        <button key={o.value} type="button"
                          onClick={() => updateAffiliate(a.id, { status: o.value })}
                          disabled={saving[a.id]}
                          className={`rounded border px-2 py-1 text-[10px] font-bold transition disabled:opacity-50 ${o.cls}`}>
                          {saving[a.id] ? "…" : o.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted italic">Nenhum afiliado encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {result.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-muted">
            <button type="button" onClick={() => setPage(p => p - 1)} disabled={page <= 1}
              className="px-3 py-1 rounded-lg border border-white/[0.07] disabled:opacity-30 hover:border-brand/30 hover:text-ink transition">
              ← Anterior
            </button>
            <span>{page} / {result.totalPages}</span>
            <button type="button" onClick={() => setPage(p => p + 1)} disabled={page >= result.totalPages}
              className="px-3 py-1 rounded-lg border border-white/[0.07] disabled:opacity-30 hover:border-brand/30 hover:text-ink transition">
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
