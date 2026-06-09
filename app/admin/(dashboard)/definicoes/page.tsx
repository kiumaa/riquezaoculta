"use client";

import { useCallback, useEffect, useState } from "react";

// Icons
const SettingsIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const WarningIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const CheckIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;

export default function DefinicoesPage() {
  const [prices, setPrices] = useState({ priceOriginal: 4500, pricePromo: 2499, priceQuiz: 1000, priceOrderBump: 999, socialProofEnabled: true });
  const [form, setForm] = useState({ priceOriginal: 4500, pricePromo: 2499, priceQuiz: 1000, priceOrderBump: 999, socialProofEnabled: true });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const [confirm, setConfirm] = useState<{ leads: boolean; checkouts: boolean }>({ leads: false, checkouts: false });
  const [clearing, setClearing] = useState<{ leads: boolean; checkouts: boolean }>({ leads: false, checkouts: false });
  const [clearError, setClearError] = useState<{ leads?: string; checkouts?: string }>({});

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) { const s = await res.json(); setPrices(s); setForm(s); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function saveSettings() {
    setSaving(true); setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setPrices(updated); setForm(updated); setFeedback("saved");
    } catch { setFeedback("error"); }
    finally { setSaving(false); setTimeout(() => setFeedback(null), 3000); }
  }

  function requestConfirm(target: keyof typeof confirm) {
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
    } catch { setClearError(e => ({ ...e, [target]: "Erro ao limpar dados." })); }
    finally { setClearing(c => ({ ...c, [target]: false })); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Definições</h1>
        <p className="text-xs text-muted mt-0.5">Configuração de preços e dados do sistema</p>
      </div>

      {/* Preços */}
      <div className="bg-black/20 border border-white/5 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-brand">{SettingsIcon}</span>
          <div>
            <h2 className="text-sm font-bold text-ink">Configuração de Preços</h2>
            <p className="text-[11px] text-muted">Altera os preços exibidos no funil de vendas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="price-original" className="text-[10px] font-bold uppercase tracking-widest text-muted">Preço Original Ebook (Kz)</label>
            <input id="price-original" type="number" min={1} value={form.priceOriginal}
              onChange={e => setForm(f => ({ ...f, priceOriginal: Number(e.target.value) }))}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-base font-semibold text-ink focus:border-brand/50 focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="price-promo" className="text-[10px] font-bold uppercase tracking-widest text-muted">Preço Promocional Ebook (Kz)</label>
            <input id="price-promo" type="number" min={1} value={form.pricePromo}
              onChange={e => setForm(f => ({ ...f, pricePromo: Number(e.target.value) }))}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-base font-semibold text-ink focus:border-brand/50 focus:outline-none" />
          </div>
        </div>
        {/* Preço do Quiz — linha separada com destaque visual */}
        <div className="border-t border-white/[0.05] pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">🧠 Quiz</span>
            <span className="text-[11px] text-muted">Preço independente do funil de análise do quiz</span>
          </div>
          <div className="max-w-xs space-y-1.5">
            <label htmlFor="price-quiz" className="text-[10px] font-bold uppercase tracking-widest text-muted">Preço da Análise do Quiz (Kz)</label>
            <input id="price-quiz" type="number" min={1} value={form.priceQuiz}
              onChange={e => setForm(f => ({ ...f, priceQuiz: Number(e.target.value) }))}
              className="w-full rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-base font-semibold text-ink focus:border-accent/60 focus:outline-none" />
            <p className="text-[10px] text-muted">Atual: <strong className="text-accent">{prices.priceQuiz.toLocaleString("pt-AO")} Kz</strong></p>
          </div>
        </div>
        {/* Preço do Order Bump */}
        <div className="border-t border-white/[0.05] pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">📦 Order Bump</span>
            <span className="text-[11px] text-muted">Upsell no momento de checkout (Guia Riqueza Oculta)</span>
          </div>
          <div className="max-w-xs space-y-1.5">
            <label htmlFor="price-order-bump" className="text-[10px] font-bold uppercase tracking-widest text-muted">Preço do Order Bump (Kz)</label>
            <input id="price-order-bump" type="number" min={1} value={form.priceOrderBump}
              onChange={e => setForm(f => ({ ...f, priceOrderBump: Number(e.target.value) }))}
              className="w-full rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-base font-semibold text-ink focus:border-brand/60 focus:outline-none" />
            <p className="text-[10px] text-muted">Atual: <strong className="text-brand">{prices.priceOrderBump?.toLocaleString("pt-AO") ?? "999"} Kz</strong></p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button type="button" onClick={saveSettings} disabled={saving}
            className="rounded-xl bg-gradient-to-r from-brandDark to-brand px-5 py-2.5 text-sm font-bold text-[#04140c] transition hover:opacity-90 disabled:opacity-50">
            {saving ? "A guardar..." : "Guardar Preços"}
          </button>
          {feedback === "saved" && (
            <p className="text-xs font-semibold text-brand flex items-center gap-1">
              <span className="w-4 h-4">{CheckIcon}</span>
              Guardado com sucesso
            </p>
          )}
          {feedback === "error"  && <p className="text-xs font-semibold text-red-400">Erro ao guardar</p>}
          <p className="text-xs text-muted ml-auto">
            Desconto Ebook: <strong className="text-ink">{prices.priceOriginal > 0 ? Math.round((1 - prices.pricePromo / prices.priceOriginal) * 100) : 0}%</strong>
          </p>
        </div>
      </div>

      {/* Controlo do Funil (feature flags) */}
      <div className="bg-black/20 border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-brand">{SettingsIcon}</span>
          <div>
            <h2 className="text-sm font-bold text-ink">Controlo do Funil</h2>
            <p className="text-[11px] text-muted">Liga/desliga passos do funil sem mexer no código</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Página de Provas Sociais</p>
            <p className="text-[11px] text-muted">Ligada: o botão da oferta passa por /provas-sociais antes do checkout. Desligada: vai direto ao checkout.</p>
          </div>
          <button type="button" role="switch" aria-checked={form.socialProofEnabled} aria-label="Ativar página de provas sociais"
            onClick={() => setForm(f => ({ ...f, socialProofEnabled: !f.socialProofEnabled }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.socialProofEnabled ? "bg-brand" : "bg-white/15"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${form.socialProofEnabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={saveSettings} disabled={saving}
            className="rounded-xl bg-gradient-to-r from-brandDark to-brand px-5 py-2.5 text-sm font-bold text-[#04140c] transition hover:opacity-90 disabled:opacity-50">
            {saving ? "A guardar..." : "Guardar"}
          </button>
          <p className="text-[11px] text-muted">Estado: <strong className={prices.socialProofEnabled ? "text-brand" : "text-muted"}>{prices.socialProofEnabled ? "Ligada" : "Desligada"}</strong></p>
        </div>
      </div>

      {/* Zona de Perigo */}
      <div className="border border-red-500/20 bg-red-500/[0.04] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-red-400">{WarningIcon}</span>
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
  );
}
