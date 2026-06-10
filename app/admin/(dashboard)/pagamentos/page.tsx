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

type PagedCheckouts = {
  data: CheckoutRecord[];
  total: number;
  page: number;
  totalPages: number;
  stats?: {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    revenueQuiz: number;
    revenueEbook: number;
    salesQuiz: number;
    salesEbook: number;
  };
};

function ProductBadge({ amount, providerPayload }: { amount: number; providerPayload: unknown }) {
  const payload = providerPayload as Record<string, unknown> | null;
  const isQuiz = payload?.product === "quiz" || amount === 1000;
  const isUpsell = payload?.product === "ebook_upsell";

  if (isQuiz) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
        🧠 Análise Quiz
      </span>
    );
  }

  if (isUpsell) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
        ⚡ Upsell Ebook
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.1)]">
      📘 Guia Completo
    </span>
  );
}

// Link "click-to-chat" do WhatsApp com mensagem pré-escrita — o operador envia
// do PRÓPRIO WhatsApp (entrega garantida, sem depender do OpenWA).
function waMeUrl(c: CheckoutRecord): string {
  const phone = c.phone.replace(/\D/g, "");
  const first = (c.name || "").trim().split(" ")[0] || "olá";
  let msg: string;
  if (c.status === "paid") {
    msg = `Olá ${first}! O teu pagamento do Guia 1M em Uma Semana foi confirmado ✅. Acede e descarrega aqui: https://www.riquezaoculta.click/acesso?ref=${c.reference}`;
  } else if (c.entity !== "express") {
    msg = `Olá ${first}! A tua referência do Guia 1M em Uma Semana — Entidade ${c.entity} | Referência ${c.paymentReference} | Valor ${c.amount} Kz. Paga no Multicaixa/ATM ou Express e o acesso liberta automaticamente. Precisas de ajuda?`;
  } else {
    msg = `Olá ${first}! Vi que estiveste quase a garantir o teu acesso ao Guia 1M em Uma Semana mas o pagamento Express não concluiu. Queres que te ajude a finalizar agora?`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export default function PagamentosPage() {
  const [result, setResult] = useState<PagedCheckouts>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<Record<string, boolean>>({});
  const [recovered, setRecovered] = useState<Record<string, "sent" | "error">>({});
  const [recoverError, setRecoverError] = useState<Record<string, string>>({});
  const [wa, setWa] = useState<Record<string, "sending" | "sent" | "error">>({});
  const [waError, setWaError] = useState<Record<string, string>>({});
  const [waStatus, setWaStatus] = useState<{ connected: boolean; status: string } | null>(null);

  const fetchData = useCallback(async (p: number) => {
    const res = await fetch(`/api/admin/checkouts?page=${p}&limit=20`);
    if (res.ok) setResult(await res.json());
  }, []);

  useEffect(() => { fetchData(1).finally(() => setLoading(false)); }, [fetchData]);
  useEffect(() => {
    fetch("/api/admin/whatsapp-status").then(r => r.ok ? r.json() : null).then(setWaStatus).catch(() => {});
  }, []);
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

  type WaAction = "confirmation" | "reminder" | "abandoned";
  async function sendWhatsApp(reference: string, action: WaAction) {
    const key = `${reference}:${action}`;
    setWa(w => ({ ...w, [key]: "sending" }));
    setWaError(e => ({ ...e, [key]: "" }));
    try {
      const res = await fetch("/api/admin/communications/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, action })
      });
      if (res.ok) {
        setWa(w => ({ ...w, [key]: "sent" }));
      } else {
        const body = await res.json().catch(() => ({}));
        setWa(w => ({ ...w, [key]: "error" }));
        setWaError(e => ({ ...e, [key]: body?.error ?? "Erro ao enviar" }));
      }
    } catch {
      setWa(w => ({ ...w, [key]: "error" }));
      setWaError(e => ({ ...e, [key]: "Erro de rede" }));
    }
  }

  function waBtn(reference: string, action: WaAction, label: string, palette: string) {
    const key = `${reference}:${action}`;
    const st = wa[key];
    const display = st === "sending" ? "…" : st === "sent" ? `✓ ${label}` : st === "error" ? `↻ ${label}` : label;
    const title = st === "error" ? (waError[key] || "Erro ao enviar")
      : st === "sent" ? `Enviado — clica para reenviar ${label}`
      : `Enviar ${label} via WhatsApp`;
    const tone = st === "error" ? "border-red-500/40 bg-red-500/[0.07] text-red-400"
      : st === "sent" ? "border-brand/40 bg-brand/[0.10] text-brand"
      : palette;
    return (
      <button type="button" onClick={() => sendWhatsApp(reference, action)} disabled={st === "sending"}
        title={title}
        className={`rounded-lg border px-2 py-1 text-[10px] font-bold whitespace-nowrap transition disabled:opacity-50 ${tone}`}>
        {display}
      </button>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  const stats = result.stats ?? {
    totalRevenue: result.data.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0),
    totalPaid: result.data.filter(c => c.status === "paid").length,
    totalPending: result.data.filter(c => c.status === "pending").length,
    revenueQuiz: result.data.filter(c => c.status === "paid" && c.amount === 1000).reduce((s, c) => s + c.amount, 0),
    revenueEbook: result.data.filter(c => c.status === "paid" && c.amount !== 1000).reduce((s, c) => s + c.amount, 0),
    salesQuiz: result.data.filter(c => c.status === "paid" && c.amount === 1000).length,
    salesEbook: result.data.filter(c => c.status === "paid" && c.amount !== 1000).length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Pagamentos</h1>
          <p className="text-xs text-muted mt-0.5">Histórico de checkouts e recuperação de abandonados</p>
        </div>
        <div className="flex items-center gap-3">
          {waStatus && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${waStatus.connected ? "border-brand/30 bg-brand/[0.08] text-brand" : "border-red-500/30 bg-red-500/[0.08] text-red-400"}`}
              title={`Sessão OpenWA: ${waStatus.status}`}>
              <span className={`h-2 w-2 rounded-full ${waStatus.connected ? "bg-brand" : "bg-red-400"}`} />
              WhatsApp {waStatus.connected ? "ligado" : "desligado"}
            </span>
          )}
          <button type="button" onClick={() => fetchData(page)}
            className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Receita Ebooks</p>
          <p className="text-2xl font-black mt-1 text-purple-400 tabular-nums">{formatPriceKz(stats.revenueEbook)}</p>
          <p className="text-[9px] text-muted mt-1">{stats.salesEbook} vendas efetuadas</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Receita Quizzes</p>
          <p className="text-2xl font-black mt-1 text-emerald-400 tabular-nums">{formatPriceKz(stats.revenueQuiz)}</p>
          <p className="text-[9px] text-muted mt-1">{stats.salesQuiz} análises pagas</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Volume de Vendas</p>
          <p className="text-2xl font-black mt-1 text-yellow-400 tabular-nums">
            {stats.salesEbook + stats.salesQuiz}
          </p>
          <p className="text-[9px] text-muted mt-1">
            {stats.salesEbook} Ebooks / {stats.salesQuiz} Quizzes
          </p>
        </div>
        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Agregado</p>
          <p className="text-2xl font-black mt-1 text-brand tabular-nums">{formatPriceKz(stats.totalRevenue)}</p>
          <p className="text-[9px] text-muted mt-1">{stats.totalPending} checkouts pendentes</p>
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
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">SMS</th>
                <th className="px-4 py-3">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.data.map(c => (
                <tr key={c.reference} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-medium">{c.name}</td>
                  <td className="px-4 py-4 text-muted font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-4"><ProductBadge amount={c.amount} providerPayload={c.providerPayload} /></td>
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
                          {recovering[c.reference] ? "A enviar…" : "Recuperar SMS"}
                        </button>
                      )
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.status === "paid" && waBtn(c.reference, "confirmation", "Confirmação", "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-400 hover:bg-emerald-500/[0.14]")}
                      {c.status === "pending" && c.entity !== "express" && waBtn(c.reference, "reminder", "Lembrete", "border-blue-500/30 bg-blue-500/[0.07] text-blue-400 hover:bg-blue-500/[0.14]")}
                      {c.status === "pending" && c.entity === "express" && waBtn(c.reference, "abandoned", "Recuperar", "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-400 hover:bg-emerald-500/[0.14]")}
                      {c.status === "failed" && c.entity === "express" && waBtn(c.reference, "abandoned", "Recuperar", "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-400 hover:bg-emerald-500/[0.14]")}
                      <a href={waMeUrl(c)} target="_blank" rel="noopener noreferrer"
                        title="Abrir o teu WhatsApp com a mensagem pronta — tu carregas enviar (entrega garantida)"
                        className="rounded-lg border border-[#25D366]/40 bg-[#25D366]/[0.1] px-2 py-1 text-[10px] font-bold text-[#25D366] whitespace-nowrap transition hover:bg-[#25D366]/[0.2]">
                        ✍️ Manual
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted italic">Nenhum checkout encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
