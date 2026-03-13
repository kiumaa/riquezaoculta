"use client";

import React, { useEffect, useState } from "react";
import type { MemberContentRecord } from "@/lib/types";

const TYPES = ["video", "pdf", "text", "link"] as const;

type FormState = {
  id?: number;
  module: string;
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  videoUrl: string;
  ordem: number;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  module: "", title: "", description: "", type: "video",
  fileUrl: "", videoUrl: "", ordem: 0, isActive: true,
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  video: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  pdf: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  text: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  link: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
};

export default function MembrosPage() {
  const [items, setItems] = useState<MemberContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function fetchItems() {
    const res = await fetch("/api/admin/member-content");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { fetchItems().finally(() => setLoading(false)); }, []);

  function openNew() { setForm(EMPTY_FORM); setModalOpen(true); }
  function openEdit(item: MemberContentRecord) {
    setForm({
      id: item.id, module: item.module, title: item.title,
      description: item.description ?? "", type: item.type,
      fileUrl: item.fileUrl ?? "", videoUrl: item.videoUrl ?? "",
      ordem: item.ordem, isActive: item.isActive,
    });
    setModalOpen(true);
  }

  async function saveForm() {
    setSaving(true);
    const payload = {
      module: form.module, title: form.title, description: form.description || undefined,
      type: form.type, fileUrl: form.fileUrl || undefined, videoUrl: form.videoUrl || undefined,
      ordem: form.ordem, isActive: form.isActive,
    };
    if (form.id) {
      await fetch(`/api/admin/member-content/${form.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/member-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    await fetchItems();
    setModalOpen(false);
    setSaving(false);
  }

  async function deleteItem(id: number) {
    if (!confirm("Apagar este conteúdo?")) return;
    await fetch(`/api/admin/member-content/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function toggleActive(item: MemberContentRecord) {
    await fetch(`/api/admin/member-content/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
  }

  // Group by module
  const modules = Array.from(new Set(items.map(i => i.module))).sort();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Área de Membros</h1>
          <p className="text-xs text-muted mt-0.5">Gestão de módulos e lições</p>
        </div>
        <button type="button" onClick={openNew}
          className="rounded-xl bg-gradient-to-r from-brandDark to-brand px-4 py-2 text-sm font-bold text-[#04140c] hover:opacity-90 transition">
          + Adicionar Lição
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-10 text-center space-y-2">
          <div className="flex justify-center"><svg className="w-12 h-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg></div>
          <p className="text-sm text-muted italic">Nenhum conteúdo ainda.</p>
          <button type="button" onClick={openNew}
            className="mt-2 text-xs text-brand hover:underline font-semibold">
            Adicionar primeiro conteúdo →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map(mod => {
            const modItems = items.filter(i => i.module === mod).sort((a, b) => a.ordem - b.ordem);
            return (
              <div key={mod} className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-ink">{mod}</h2>
                  <span className="text-[10px] text-muted">{modItems.length} lição{modItems.length !== 1 ? "ões" : ""}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {modItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                      <span className="text-lg shrink-0">{TYPE_ICON[item.type] ?? "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${item.isActive ? "text-ink" : "text-muted line-through"}`}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted truncate">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => toggleActive(item)}
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition ${
                            item.isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-500/20 text-zinc-500"
                          }`}>
                          {item.isActive ? "Activo" : "Inactivo"}
                        </button>
                        <button type="button" onClick={() => openEdit(item)}
                          className="text-xs text-brand hover:underline font-medium">Editar</button>
                        <button type="button" onClick={() => deleteItem(item.id)}
                          className="text-xs text-red-400/70 hover:text-red-400 transition">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h4 className="font-bold">{form.id ? "Editar Lição" : "Nova Lição"}</h4>
              <button type="button" onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition text-muted"
                aria-label="Fechar">✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { key: "module",      label: "Módulo",        type: "text",   placeholder: "Módulo 1: Mentalidade" },
                { key: "title",       label: "Título",         type: "text",   placeholder: "Introdução" },
                { key: "description", label: "Descrição",      type: "text",   placeholder: "Breve descrição..." },
                { key: "fileUrl",     label: "URL do Ficheiro",type: "url",    placeholder: "https://..." },
                { key: "videoUrl",    label: "URL do Vídeo",   type: "url",    placeholder: "https://..." },
                { key: "ordem",       label: "Ordem",          type: "number", placeholder: "0" },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={(form as Record<string, unknown>)[f.key] as string ?? ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none" />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-ink focus:border-brand/50 focus:outline-none">
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-brand" />
                <span className="text-sm text-ink">Conteúdo activo</span>
              </label>
            </div>
            <div className="p-5 border-t border-white/5 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted hover:text-ink transition">
                Cancelar
              </button>
              <button type="button" onClick={saveForm} disabled={saving || !form.module || !form.title}
                className="rounded-xl bg-gradient-to-r from-brandDark to-brand px-5 py-2 text-sm font-bold text-[#04140c] hover:opacity-90 transition disabled:opacity-50">
                {saving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
