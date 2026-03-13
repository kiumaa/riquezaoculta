"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FunnelContentRecord } from "@/lib/types";

type PageType = "landing" | "oferta" | "resultado" | "payment";

const PAGES: { id: PageType; label: string }[] = [
  { id: "landing",   label: "Landing Page" },
  { id: "oferta",    label: "Página de Oferta" },
  { id: "resultado", label: "Resultado do Quiz" },
  { id: "payment",   label: "Pagamento" },
];

const LANDING_FIELDS = [
  { key: "badge_text",    label: "Texto do Badge",           rows: 1 },
  { key: "headline",      label: "Título Principal",         rows: 2 },
  { key: "subtitle",      label: "Subtítulo / Corpo",        rows: 3 },
  { key: "cta_text",      label: "Texto do Botão CTA",       rows: 1 },
  { key: "trust_badge_1", label: "Badge de Confiança 1",     rows: 1 },
  { key: "trust_badge_2", label: "Badge de Confiança 2",     rows: 1 },
];

const OFERTA_FIELDS = [
  { key: "headline",       label: "Título Principal",        rows: 1 },
  { key: "subheading",     label: "Subtítulo / Corpo",       rows: 3 },
  { key: "cta_text",       label: "Texto do Botão CTA",      rows: 1 },
  { key: "guarantee_text", label: "Texto da Garantia",       rows: 2 },
  { key: "scarcity_text",  label: "Texto de Escassez",       rows: 1 },
  { key: "social_proof",   label: "Prova Social (contador)", rows: 1 },
  { key: "bullet_1",       label: "Bullet 1",                rows: 1 },
  { key: "bullet_2",       label: "Bullet 2",                rows: 1 },
  { key: "bullet_3",       label: "Bullet 3",                rows: 1 },
  { key: "bullet_4",       label: "Bullet 4",                rows: 1 },
  { key: "bullet_5",       label: "Bullet 5",                rows: 1 },
  { key: "bullet_6",       label: "Bullet 6",                rows: 1 },
];

const PAYMENT_FIELDS = [
  { key: "support_label",         label: "Texto de Suporte WA (label)",       rows: 2 },
  { key: "support_cta",           label: "Texto Botão Suporte WA",            rows: 1 },
  { key: "support_context",       label: "Contexto Suporte (sub-texto)",       rows: 1 },
  { key: "benefit_1",             label: "Benefício 1 (pós-compra)",          rows: 1 },
  { key: "benefit_2",             label: "Benefício 2 (pós-compra)",          rows: 1 },
  { key: "benefit_3",             label: "Benefício 3 (pós-compra)",          rows: 1 },
  { key: "quick_reply_1",         label: "Resposta Rápida 1 (chat Sofia)",    rows: 1 },
  { key: "quick_reply_2",         label: "Resposta Rápida 2 (chat Sofia)",    rows: 1 },
  { key: "quick_reply_3",         label: "Resposta Rápida 3 (chat Sofia)",    rows: 1 },
  { key: "quick_reply_4",         label: "Resposta Rápida 4 (chat Sofia)",    rows: 1 },
  { key: "vip_cta",               label: "Botão VIP (pós-pagamento)",         rows: 1 },
  { key: "vip_context_payment",   label: "Contexto VIP (durante pagamento)",  rows: 2 },
  { key: "vip_context_confirmed", label: "Contexto VIP (pós-confirmação)",    rows: 2 },
];

const RESULTADO_PROFILES = [
  "emocional-clareza", "emocional-disciplina", "emocional-acao",
  "clareza-emocional", "clareza-disciplina",   "clareza-acao",
  "acao-clareza",      "acao-disciplina",       "acao-emocional",
  "disciplina-clareza","disciplina-acao",       "disciplina-emocional",
];

function ContentField({
  pageType, sectionKey, label, rows, initialValue
}: {
  pageType: string; sectionKey: string; label: string; rows: number; initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fieldId = `field-${pageType}-${sectionKey}`;

  // Sync when initialValue changes (e.g. after page switch)
  useEffect(() => { setValue(initialValue); }, [initialValue]);

  function save(v: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await fetch("/api/admin/funnel-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageType, sectionKey, content: v }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="text-[10px] font-bold uppercase tracking-widest text-muted">
          {label}
        </label>
        {saved && (
          <span className="text-[10px] text-brand font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Guardado
          </span>
        )}
      </div>
      <textarea
        id={fieldId}
        rows={rows}
        value={value}
        placeholder={label}
        onChange={e => { setValue(e.target.value); save(e.target.value); }}
        className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none resize-none font-mono"
      />
    </div>
  );
}

function WhatsAppLinkField() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => { setValue(d.whatsappGroupLink ?? ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function save(v: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappGroupLink: v }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  if (loading) return <div className="h-10 animate-pulse rounded-xl bg-white/5" />;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="wa-group-link" className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Link do Grupo WhatsApp
        </label>
        {saved && (
          <span className="text-[10px] text-brand font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Guardado
          </span>
        )}
      </div>
      <input
        id="wa-group-link"
        type="url"
        value={value}
        placeholder="https://chat.whatsapp.com/..."
        onChange={e => { setValue(e.target.value); save(e.target.value); }}
        className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none font-mono"
      />
      <p className="text-[10px] text-muted">Este link é usado em todos os botões de WhatsApp da aplicação.</p>
    </div>
  );
}

export default function FunilPage() {
  const [activePage, setActivePage] = useState<PageType>("landing");
  const [content, setContent] = useState<FunnelContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(RESULTADO_PROFILES[0]);

  const fetchContent = useCallback(async (page: PageType) => {
    setLoading(true);
    const res = await fetch(`/api/admin/funnel-content?page=${page}`);
    if (res.ok) setContent(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchContent(activePage); }, [activePage, fetchContent]);

  // Auto-seed defaults when content is empty for this page
  useEffect(() => {
    if (!loading && content.length === 0 && activePage !== "resultado") {
      fetch("/api/admin/funnel-content/seed", { method: "POST" }).catch(() => {});
      fetchContent(activePage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, content.length]);

  function getContent(key: string) {
    return content.find(c => c.sectionKey === key)?.content ?? "";
  }

  const activeFields =
    activePage === "landing"  ? LANDING_FIELDS  :
    activePage === "oferta"   ? OFERTA_FIELDS   :
    activePage === "payment"  ? PAYMENT_FIELDS  : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Funil — CMS</h1>
        <p className="text-xs text-muted mt-0.5">Edita o conteúdo das páginas. Alterações guardam automaticamente.</p>
      </div>

      {/* Page tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1 w-fit">
        {PAGES.map(p => (
          <button key={p.id} type="button" onClick={() => setActivePage(p.id)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activePage === p.id ? "bg-brand/15 text-brand border border-brand/25" : "text-muted hover:text-ink"
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Landing / Oferta / Payment — lista de campos */}
          {activeFields && activeFields.map(f => (
            <ContentField key={f.key} pageType={activePage} sectionKey={f.key} label={f.label} rows={f.rows} initialValue={getContent(f.key)} />
          ))}

          {/* Resultado — por perfil */}
          {activePage === "resultado" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="select-profile" className="text-[10px] font-bold uppercase tracking-widest text-muted">Perfil</label>
                <select
                  id="select-profile"
                  title="Seleccionar perfil"
                  value={selectedProfile}
                  onChange={e => setSelectedProfile(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-ink focus:border-brand/50 focus:outline-none"
                >
                  {RESULTADO_PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {[
                { key: `profile_${selectedProfile}_title`,       label: "Título do Perfil",  rows: 1 },
                { key: `profile_${selectedProfile}_summary`,     label: "Resumo do Perfil",  rows: 3 },
                { key: `profile_${selectedProfile}_offer_angle`, label: "Ângulo da Oferta",  rows: 2 },
              ].map(f => (
                <ContentField key={f.key} pageType="resultado" sectionKey={f.key} label={f.label} rows={f.rows} initialValue={getContent(f.key)} />
              ))}

              {/* Global resultado fields */}
              <div className="border-t border-white/[0.06] pt-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Textos globais da página de resultado</p>
                {[
                  { key: "explanation_text", label: "Texto de Explicação",   rows: 3 },
                  { key: "closing_text",     label: "Texto de Fecho / CTA",  rows: 2 },
                  { key: "cta_text",         label: "Texto do Botão CTA",    rows: 1 },
                ].map(f => (
                  <ContentField key={f.key} pageType="resultado" sectionKey={f.key} label={f.label} rows={f.rows} initialValue={getContent(f.key)} />
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp section — visible on payment tab */}
          {activePage === "payment" && (
            <div className="border-t border-white/[0.06] pt-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Configuração WhatsApp</p>
              <WhatsAppLinkField />
            </div>
          )}

          <p className="text-[11px] text-muted border border-brand/20 bg-brand/5 rounded-xl px-4 py-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Todas as alterações guardam automaticamente e são usadas imediatamente pelas páginas públicas.</span>
          </p>
        </div>
      )}
    </div>
  );
}
