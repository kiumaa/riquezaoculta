"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommunicationLog, LeadRecord, LeadStatus, QuizSubmissionRecord } from "@/lib/types";
import { JourneyViewer } from "../../components/JourneyViewer";

const PILLAR_LABELS: Record<string, string> = {
  emocional: "Emocional", clareza: "Clareza", acao: "Ação", disciplina: "Disciplina"
};

const COMM_LABELS: Record<string, string> = {
  confirmation: "Confirmação de pagamento",
  reminder_1h: "Lembrete de referência (1h)",
  reminder_6h: "Lembrete de referência (6h)",
  abandoned: "Recuperação de carrinho",
  recovery: "Recuperação (SMS)"
};

const STATUS_OPTIONS: { value: LeadStatus; label: string; className: string }[] = [
  { value: "novo",       label: "Novo",       className: "bg-zinc-500/20 text-zinc-400" },
  { value: "contactado", label: "Contactado", className: "bg-blue-500/20 text-blue-400" },
  { value: "comprou",    label: "Comprou",    className: "bg-green-500/20 text-green-400" },
  { value: "abandonou",  label: "Abandonou",  className: "bg-red-500/20 text-red-400" },
  { value: "upsell",     label: "Upsell",     className: "bg-purple-500/20 text-purple-400" },
];

const PROFILE_COLORS: Record<string, string> = {
  emocional: "bg-amber-500/20 text-amber-400",
  clareza:   "bg-blue-500/20 text-blue-400",
  acao:      "bg-green-500/20 text-green-400",
  disciplina:"bg-purple-500/20 text-purple-400",
};

function profileColor(profile?: string | null) {
  if (!profile) return "bg-white/10 text-muted";
  return PROFILE_COLORS[profile.split("-")[0]] ?? "bg-white/10 text-muted";
}

function statusInfo(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) ?? { label: status, className: "bg-white/10 text-muted" };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
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

export default function LeadsPage() {
  const [result, setResult] = useState<{ data: LeadRecord[]; total: number; page: number; totalPages: number }>({
    data: [], total: 0, page: 1, totalPages: 1
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [quizData, setQuizData] = useState<QuizSubmissionRecord | null>(null);
  const [comms, setComms] = useState<CommunicationLog[]>([]);
  const [commsError, setCommsError] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProfile, setFilterProfile] = useState("");
  const [search, setSearch] = useState("");

  const fetchLeads = useCallback(async (p: number) => {
    const res = await fetch(`/api/admin/leads?page=${p}&limit=50`);
    if (res.ok) setResult(await res.json());
  }, []);

  useEffect(() => { fetchLeads(1).finally(() => setLoading(false)); }, [fetchLeads]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) fetchLeads(page); }, [page]);

  async function openLead(lead: LeadRecord) {
    setSelectedLead(lead);
    setNotes(lead.notes ?? "");
    setQuizData(null);
    setComms([]);
    setCommsError(false);
    // fetch quiz submission for this phone
    const res = await fetch(`/api/admin/quiz-submissions`);
    if (res.ok) {
      const data = await res.json();
      const sub = (data.submissions as QuizSubmissionRecord[]).find(s => s.phone === lead.phone);
      setQuizData(sub ?? null);
    }
    // fetch communication timeline for this phone
    try {
      const cres = await fetch(`/api/admin/communications?phone=${encodeURIComponent(lead.phone)}`);
      if (cres.ok) {
        const cd = await cres.json();
        setComms((cd.data as CommunicationLog[]) ?? []);
      } else {
        setCommsError(true);
      }
    } catch {
      setCommsError(true);
    }
  }

  async function patchStatus(lead: LeadRecord, status: LeadStatus) {
    // Optimistic update
    setResult(prev => ({
      ...prev,
      data: prev.data.map(l => l.id === lead.id ? { ...l, status } : l)
    }));
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
  }

  async function saveNotes() {
    if (!selectedLead) return;
    setSavingNotes(true);
    await fetch(`/api/admin/leads/${selectedLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
    });
    setSelectedLead(prev => prev ? { ...prev, notes } : prev);
    setSavingNotes(false);
  }

  function exportCSV() {
    const rows = filtered.map(l =>
      [l.name, l.phone, l.email ?? "", l.province ?? "", l.source, l.quizProfile ?? "", l.status, l.createdAt].join(",")
    );
    const csv = ["Nome,Telefone,Email,Provincia,Fonte,Perfil,Estado,Data", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = result.data.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterProfile && !l.quizProfile?.startsWith(filterProfile)) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Leads <span className="text-muted font-normal text-sm">({result.total})</span></h1>
          <p className="text-xs text-muted mt-0.5">Gestão de contactos e estado do funil</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => fetchLeads(page)}
            className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
            Actualizar
          </button>
          <button type="button" onClick={exportCSV}
            className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/20 transition">
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text" placeholder="Pesquisar nome ou telefone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none w-56"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-ink focus:border-brand/50 focus:outline-none">
          <option value="">Todos os estados</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterProfile} onChange={e => setFilterProfile(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-ink focus:border-brand/50 focus:outline-none">
          <option value="">Todos os perfis</option>
          {["emocional", "clareza", "acao", "disciplina"].map(p => <option key={p} value={p}>{PILLAR_LABELS[p]}</option>)}
        </select>
        {(filterStatus || filterProfile || search) && (
          <button type="button" onClick={() => { setFilterStatus(""); setFilterProfile(""); setSearch(""); }}
            className="rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-muted hover:text-ink transition">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fonte</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{lead.phone}</td>
                  <td className="px-4 py-3">
                    {lead.quizProfile ? (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${profileColor(lead.quizProfile)}`}>
                        {lead.quizProfile.split("-")[0]}
                      </span>
                    ) : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={e => patchStatus(lead, e.target.value as LeadStatus)}
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand/50 ${statusInfo(lead.status).className}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value} className="bg-zinc-900 text-ink normal-case font-normal text-sm">{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-muted">
                      {lead.source ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{timeAgo(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openLead(lead)}
                      className="text-xs text-brandBright hover:underline font-bold">
                      Ver →
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted italic">Nenhum lead encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
      </div>

      {/* Lead detail modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <div>
                <h4 className="text-lg font-bold">{selectedLead.name}</h4>
                <p className="text-sm text-muted font-mono">{selectedLead.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedLead(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-muted"
                aria-label="Fechar">✕</button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              <div className="p-5 space-y-5">
                {/* Contact info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Email", value: selectedLead.email ?? "—" },
                    { label: "Província", value: selectedLead.province ?? "—" },
                    { label: "Fonte", value: selectedLead.source },
                    { label: "Perfil", value: selectedLead.quizProfile ?? "—" },
                    { label: "Estado", value: statusInfo(selectedLead.status).label },
                    { label: "Data", value: new Date(selectedLead.createdAt).toLocaleDateString("pt-PT") },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-black/20 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
                      <p className="text-sm text-ink mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Quiz scores */}
                {quizData && (
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-muted">Perfil do Quiz</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(quizData.scores).map(([pillar, score]) => {
                        const pct = Math.min(Math.max(Number(score), 0), 100);
                        return (
                          <div key={pillar} className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{PILLAR_LABELS[pillar] ?? pillar}</span>
                              <span className="text-sm font-bold text-ink">{score}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-brand/60 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Communications timeline */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted">Comunicações</h5>
                  {commsError ? (
                    <p className="text-xs text-red-400/80 italic">Erro ao carregar comunicações. Tenta reabrir a ficha.</p>
                  ) : comms.length === 0 ? (
                    <p className="text-xs text-muted italic">Nenhuma comunicação registada para este contacto.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {comms.map(log => (
                        <div key={log.id} className="flex items-center gap-2.5 bg-black/20 rounded-xl p-2.5 border border-white/5">
                          <span className="text-base shrink-0" aria-hidden>{log.channel === "whatsapp" ? "🟢" : "✉️"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-ink truncate">{COMM_LABELS[log.type] ?? log.type}</p>
                            <p className="text-[10px] text-muted">
                              {new Date(log.createdAt).toLocaleString("pt-PT")} · {log.trigger === "manual" ? "manual" : "automático"} · {log.channel}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase shrink-0 ${log.status === "sent" ? "text-brand" : "text-red-400"}`}>
                            {log.status === "sent" ? "enviado" : "falhou"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted">Notas</h5>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Adicionar notas sobre este lead..."
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none resize-none"
                  />
                  <button type="button" onClick={saveNotes} disabled={savingNotes}
                    className="rounded-lg bg-brand/20 border border-brand/30 px-4 py-2 text-xs font-bold text-brand hover:bg-brand/30 transition disabled:opacity-50">
                    {savingNotes ? "A guardar..." : "Guardar notas"}
                  </button>
                </div>

                {/* Journey */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted">Jornada</h5>
                  <JourneyViewer journey={selectedLead.journey} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
