"use client";

import { useCallback, useEffect, useState } from "react";
import { LeadRecord, CheckoutRecord } from "@/lib/types";
import { JourneyViewer } from "../components/JourneyViewer";

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
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
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

type PagedLeads    = { data: LeadRecord[];    total: number; page: number; totalPages: number };
type PagedCheckouts= { data: CheckoutRecord[];total: number; page: number; totalPages: number };
type ConfirmState  = { leads: boolean; checkouts: boolean };
type Tab           = "leads" | "checkouts" | "settings";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("leads");

  const [leadsResult,    setLeadsResult]    = useState<PagedLeads>    ({ data: [], total: 0, page: 1, totalPages: 1 });
  const [checkoutsResult,setCheckoutsResult]= useState<PagedCheckouts>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [leadsPage,    setLeadsPage]    = useState(1);
  const [checkoutsPage,setCheckoutsPage]= useState(1);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  const [prices,       setPrices]       = useState({ priceOriginal: 7500, pricePromo: 4500 });
  const [priceForm,    setPriceForm]    = useState({ priceOriginal: 7500, pricePromo: 4500 });
  const [priceSaving,  setPriceSaving]  = useState(false);
  const [priceFeedback,setPriceFeedback]= useState<"saved" | "error" | null>(null);

  const [confirm,    setConfirm]    = useState<ConfirmState>({ leads: false, checkouts: false });
  const [clearing,   setClearing]   = useState<ConfirmState>({ leads: false, checkouts: false });
  const [clearError, setClearError] = useState<{ leads?: string; checkouts?: string }>({});

  const [recovering,    setRecovering]    = useState<Record<string, boolean>>({});
  const [recovered,     setRecovered]     = useState<Record<string, "sent" | "error">>({});
  const [recoverError,  setRecoverError]  = useState<Record<string, string>>({});

  /* ── Data fetching ── */
  const fetchLeads = useCallback(async (page: number) => {
    const res = await fetch(`/api/admin/leads?page=${page}&limit=20`);
    if (res.ok) setLeadsResult(await res.json());
  }, []);

  const fetchCheckouts = useCallback(async (page: number) => {
    const res = await fetch(`/api/admin/checkouts?page=${page}&limit=20`);
    if (res.ok) setCheckoutsResult(await res.json());
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) { const s = await res.json(); setPrices(s); setPriceForm(s); }
  }, []);

  useEffect(() => {
    Promise.all([fetchLeads(1), fetchCheckouts(1), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchLeads, fetchCheckouts, fetchSettings]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) fetchLeads(leadsPage); }, [leadsPage]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) fetchCheckouts(checkoutsPage); }, [checkoutsPage]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([fetchLeads(leadsPage), fetchCheckouts(checkoutsPage), fetchSettings()]);
    setRefreshing(false);
  }

  /* ── Settings ── */
  async function saveSettings() {
    setPriceSaving(true); setPriceFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceForm)
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setPrices(updated); setPriceForm(updated); setPriceFeedback("saved");
    } catch { setPriceFeedback("error"); }
    finally { setPriceSaving(false); setTimeout(() => setPriceFeedback(null), 3000); }
  }

  /* ── Clear data ── */
  function requestConfirm(target: keyof ConfirmState) {
    setConfirm(c => ({ ...c, [target]: true }));
    setClearError(e => ({ ...e, [target]: undefined }));
    setTimeout(() => setConfirm(c => ({ ...c, [target]: false })), 5000);
  }

  async function clearData(target: "leads" | "checkouts") {
    setClearing(c => ({ ...c, [target]: true }));
    setConfirm(c => ({ ...c, [target]: false }));
    try {
      const res = await fetch(`/api/admin/data?target=${target}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (target === "leads") { setLeadsPage(1); await fetchLeads(1); }
      else { setCheckoutsPage(1); await fetchCheckouts(1); }
    } catch { setClearError(e => ({ ...e, [target]: "Erro ao limpar dados." })); }
    finally { setClearing(c => ({ ...c, [target]: false })); }
  }

  /* ── Recovery ── */
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const paidTotal     = checkoutsResult.data.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const pendingCount  = checkoutsResult.data.filter(c => c.status === "pending").length;
  const conversionRate= leadsResult.total > 0 ? Math.round(checkoutsResult.total / leadsResult.total * 100) : 0;

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "leads",     label: "Leads",     count: leadsResult.total },
    { id: "checkouts", label: "Checkouts", count: checkoutsResult.total },
    { id: "settings",  label: "Definições" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Dashboard</h1>
          <p className="text-xs text-muted mt-0.5">Riqueza Oculta — Painel de Controlo</p>
        </div>
        <button type="button" onClick={handleRefresh} disabled={refreshing} title="Actualizar dados"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand/30 hover:text-ink disabled:opacity-50">
          <svg className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? "A actualizar…" : "Actualizar"}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/20 border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Leads</p>
          <p className="text-3xl font-black mt-1">{leadsResult.total}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Checkouts</p>
          <p className="text-3xl font-black mt-1 text-brand">{checkoutsResult.total}</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Receita (pág.)</p>
          <p className="text-2xl font-black mt-1">{paidTotal.toLocaleString("pt-PT")} Kz</p>
        </div>
        <div className="bg-black/20 border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Conversão</p>
          <p className="text-3xl font-black mt-1">{conversionRate}%</p>
          {pendingCount > 0 && (
            <p className="text-[10px] text-yellow-400 mt-1">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-brand/15 text-brand border border-brand/25"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.id ? "bg-brand/20 text-brand" : "bg-white/[0.06] text-muted"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB: LEADS ══ */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Leads <span className="text-muted font-normal text-sm">({leadsResult.total})</span></h2>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Fonte</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Jornada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leadsResult.data.map(lead => (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4 font-medium">{lead.name}</td>
                      <td className="px-4 py-4 text-muted font-mono text-xs">{lead.phone}</td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-muted">
                          {lead.source ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">{formatDateTime(lead.createdAt)}</td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => setSelectedLead(lead)}
                          className="text-xs text-brandBright hover:underline font-bold">
                          Ver →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leadsResult.data.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted italic">Nenhum lead encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={leadsResult.page} totalPages={leadsResult.totalPages} onChange={setLeadsPage} />
          </div>
        </div>
      )}

      {/* ══ TAB: CHECKOUTS ══ */}
      {activeTab === "checkouts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Checkouts <span className="text-muted font-normal text-sm">({checkoutsResult.total})</span></h2>
            {pendingCount > 0 && (
              <span className="text-xs text-yellow-400 font-semibold bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
                {pendingCount} carrinho{pendingCount > 1 ? "s" : ""} abandonado{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
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
                  {checkoutsResult.data.map(c => (
                    <tr key={c.reference} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4 font-medium">{c.name}</td>
                      <td className="px-4 py-4 text-muted font-mono text-xs">{c.phone}</td>
                      <td className="px-4 py-4 text-xs text-muted">{c.entity === "express" ? "MCX Express" : "Referência"}</td>
                      <td className="px-4 py-4 font-bold tabular-nums">{c.amount.toLocaleString("pt-PT")} Kz</td>
                      <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">{formatDateTime(c.createdAt)}</td>
                      <td className="px-4 py-4">
                        {c.status === "pending" && (
                          recovered[c.reference] === "sent" ? (
                            <span className="text-xs font-semibold text-brand">Enviado ✓</span>
                          ) : recovered[c.reference] === "error" ? (
                            <div className="space-y-1">
                              <button type="button" onClick={() => sendRecovery(c.reference)}
                                disabled={recovering[c.reference]}
                                className="text-xs font-semibold text-red-400 hover:text-red-300 transition">
                                Erro — Tentar de novo
                              </button>
                              {recoverError[c.reference] && (
                                <p className="text-[10px] text-red-400/70 max-w-[200px] break-words">{recoverError[c.reference]}</p>
                              )}
                            </div>
                          ) : (
                            <button type="button" onClick={() => sendRecovery(c.reference)}
                              disabled={recovering[c.reference]}
                              className="rounded-lg border border-yellow-500/30 bg-yellow-500/[0.07] px-3 py-1.5 text-xs font-bold text-yellow-400 transition hover:bg-yellow-500/[0.14] disabled:opacity-50">
                              {recovering[c.reference] ? "A enviar…" : "Recuperar"}
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                  {checkoutsResult.data.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted italic">Nenhum checkout encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={checkoutsResult.page} totalPages={checkoutsResult.totalPages} onChange={setCheckoutsPage} />
          </div>
        </div>
      )}

      {/* ══ TAB: DEFINIÇÕES ══ */}
      {activeTab === "settings" && (
        <div className="space-y-6">

          {/* Preços */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-brand text-lg">⚙</span>
              <div>
                <h2 className="text-sm font-bold text-ink">Configuração de Preços</h2>
                <p className="text-[11px] text-muted">Altera os preços exibidos no funil de vendas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="price-original" className="text-[10px] font-bold uppercase tracking-widest text-muted">Preço Original (Kz)</label>
                <input id="price-original" type="number" min={1} title="Preço original" placeholder="7500"
                  value={priceForm.priceOriginal}
                  onChange={e => setPriceForm(f => ({ ...f, priceOriginal: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-base font-semibold text-ink focus:border-brand/50 focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="price-promo" className="text-[10px] font-bold uppercase tracking-widest text-muted">Preço Promocional (Kz)</label>
                <input id="price-promo" type="number" min={1} title="Preço promocional" placeholder="4500"
                  value={priceForm.pricePromo}
                  onChange={e => setPriceForm(f => ({ ...f, pricePromo: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-base font-semibold text-ink focus:border-brand/50 focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button type="button" onClick={saveSettings} disabled={priceSaving}
                className="rounded-xl bg-gradient-to-r from-brandDark to-brand px-5 py-2.5 text-sm font-bold text-[#04140c] transition hover:opacity-90 disabled:opacity-50">
                {priceSaving ? "A guardar..." : "Guardar Preços"}
              </button>
              {priceFeedback === "saved" && <p className="text-xs font-semibold text-brand">✓ Guardado com sucesso</p>}
              {priceFeedback === "error"  && <p className="text-xs font-semibold text-red-400">Erro ao guardar</p>}
              <p className="text-xs text-muted ml-auto">
                Desconto actual: <strong className="text-ink">{prices.priceOriginal > 0 ? Math.round((1 - prices.pricePromo / prices.priceOriginal) * 100) : 0}%</strong>
              </p>
            </div>
          </div>

          {/* Zona de Perigo */}
          <div className="border border-red-500/20 bg-red-500/[0.04] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-lg">⚠</span>
              <div>
                <h2 className="text-sm font-bold text-red-400">Zona de Perigo</h2>
                <p className="text-[11px] text-muted">Apaga permanentemente todos os registos. Usa apenas para limpar dados de teste.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Limpar Leads */}
              <div className="flex items-center gap-2">
                {!confirm.leads ? (
                  <button type="button" onClick={() => requestConfirm("leads")} disabled={clearing.leads}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                    {clearing.leads ? "A limpar…" : "Limpar Leads"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 font-medium">Tens a certeza?</span>
                    <button type="button" onClick={() => clearData("leads")}
                      className="rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/30">
                      Confirmar
                    </button>
                    <button type="button" onClick={() => setConfirm(c => ({ ...c, leads: false }))}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:text-ink">
                      Cancelar
                    </button>
                  </div>
                )}
                {clearError.leads && <p className="text-xs text-red-400">{clearError.leads}</p>}
              </div>

              {/* Limpar Checkouts */}
              <div className="flex items-center gap-2">
                {!confirm.checkouts ? (
                  <button type="button" onClick={() => requestConfirm("checkouts")} disabled={clearing.checkouts}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                    {clearing.checkouts ? "A limpar…" : "Limpar Checkouts"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 font-medium">Tens a certeza?</span>
                    <button type="button" onClick={() => clearData("checkouts")}
                      className="rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/30">
                      Confirmar
                    </button>
                    <button type="button" onClick={() => setConfirm(c => ({ ...c, checkouts: false }))}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:text-ink">
                      Cancelar
                    </button>
                  </div>
                )}
                {clearError.checkouts && <p className="text-xs text-red-400">{clearError.checkouts}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Journey Modal ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <h4 className="text-xl font-bold">{selectedLead.name}</h4>
                <p className="text-sm text-muted font-mono">{selectedLead.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedLead(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Fechar">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <JourneyViewer journey={selectedLead.journey} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
