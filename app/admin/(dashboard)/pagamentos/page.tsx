"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPriceKz } from "@/lib/format";
import { CheckoutRecord } from "@/lib/types";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    paid:    { label: "Pago",     className: "bg-brand/20 text-brand" },
    pending: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-400" },
    failed:  { label: "Falhou",   className: "bg-red-500/20 text-red-400" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-white/10 text-muted" };
  return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${className}`}>{label}</span>;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-muted">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="px-3 py-1 rounded-lg border border-white/[0.07] disabled:opacity-30 hover:border-brand/30 hover:text-ink transition disabled:cursor-not-allowed">
        ← Anterior
      </button>
      <span>{page} / {totalPages}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="px-3 py-1 rounded-lg border border-white/[0.07] disabled:opacity-30 hover:border-brand/30 hover:text-ink transition disabled:cursor-not-allowed">
        Próxima →
      </button>
    </div>
  );
}

type PagedCheckouts = { data: CheckoutRecord[]; total: number; page: number; totalPages: number };

export default function PagamentosPage() {
  const [result, setResult] = useState<PagedCheckouts>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<Record<string, boolean>>({});
  const [recovered, setRecovered] = useState<Record<string, "sent" | "error">>({});
  const [recoverError, setRecoverError] = useState<Record<string, string>>({});

  const fetchData = useCallback(async (p: number) => {
    const res = await fetch(`/api/admin/checkouts?page=${p}&limit=20`);
    if (res.ok) setResult(await res.json());
  }, []);

  useEffect(() => { fetchData(1).finally(() => setLoading(false)); }, [fetchData]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) fetchData(page); }, [page]);

  async function sendRecovery(reference: string) {
    setRecovering(r => ({ ...r, [reference]: true }));
    setRecoverError(e => ({ ...e, [reference]: "" }));
    try {
      const res = await fetch("/api/admin/recover", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference })
      });
      if (res.ok) {
        setRecovered(r => ({ ...r, [reference]: "sent" }));
      } else {
        const body = await res.json().catch(() => ({}));
        setRecovered(r => ({ ...r, [reference]: "error" }));
        setRecoverError(e => ({ ...e, [reference]: body?.error ?? "Erro desconhecido" }));
      }
    } catch { setRecovered(r => ({ ...r, [reference]: "error" })); }
    finally { setRecovering(r => ({ ...r, [reference]: false })); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  const paidTotal = result.data.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const pendingCount = result.data.filter(c => c.status === "pending").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Pagamentos</h1>
          <p className="text-xs text-muted mt-0.5">Histórico de checkouts e recuperação de abandonados</p>
        </div>
        <button type="button" onClick={() => fetchData(page)}
          className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total</p>
          <p className="text-3xl font-black mt-1">{result.total}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Pagos</p>
          <p className="text-3xl font-black mt-1 text-brand">{result.data.filter(c => c.status === "paid").length}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Pendentes</p>
          <p className="text-3xl font-black mt-1 text-yellow-400">{pendingCount}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Receita</p>
          <p className="text-xl font-black mt-1">{formatPriceKz(paidTotal)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Recuperar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.data.map(c => (
                <tr key={c.reference} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-medium">{c.name}</td>
                  <td className="px-4 py-4 text-muted font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-4 text-xs text-muted">{c.entity === "express" ? "Express" : "Referência"}</td>
                  <td className="px-4 py-4 font-bold tabular-nums">{formatPriceKz(c.amount)}</td>
                  <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">{formatDateTime(c.createdAt)}</td>
                  <td className="px-4 py-4">
                    {c.status === "pending" && (
                      recovered[c.reference] === "sent" ? (
                        <span className="text-xs font-semibold text-brand flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Enviado
                        </span>
                      ) : recovered[c.reference] === "error" ? (
                        <div className="space-y-1">
                          <button type="button" onClick={() => sendRecovery(c.reference)} disabled={recovering[c.reference]}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 transition">
                            Erro — Tentar de novo
                          </button>
                          {recoverError[c.reference] && (
                            <p className="text-[10px] text-red-400/70 max-w-[200px] break-words">{recoverError[c.reference]}</p>
                          )}
                        </div>
                      ) : (
                        <button type="button" onClick={() => sendRecovery(c.reference)} disabled={recovering[c.reference]}
                          className="rounded-lg border border-yellow-500/30 bg-yellow-500/[0.07] px-3 py-1.5 text-xs font-bold text-yellow-400 transition hover:bg-yellow-500/[0.14] disabled:opacity-50">
                          {recovering[c.reference] ? "A enviar…" : "Recuperar"}
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted italic">Nenhum checkout encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
