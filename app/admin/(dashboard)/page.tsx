"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { formatPriceKz } from "@/lib/format";
import { LeadRecord } from "@/lib/types";
import { ActivityChart } from "../components/ActivityChart";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

const PROFILE_COLORS: Record<string, string> = {
  emocional: "bg-amber-500/20 text-amber-400",
  clareza:   "bg-blue-500/20 text-blue-400",
  acao:      "bg-green-500/20 text-green-400",
  disciplina:"bg-purple-500/20 text-purple-400",
};

function profileColor(profile?: string | null) {
  if (!profile) return "bg-white/10 text-muted";
  const dominant = profile.split("-")[0];
  return PROFILE_COLORS[dominant] ?? "bg-white/10 text-muted";
}

const STATUS_COLORS: Record<string, string> = {
  novo:       "bg-zinc-500/20 text-zinc-400",
  contactado: "bg-blue-500/20 text-blue-400",
  comprou:    "bg-green-500/20 text-green-400",
  abandonou:  "bg-red-500/20 text-red-400",
  upsell:     "bg-purple-500/20 text-purple-400",
};

type Analytics = {
  dailyStats: { date: string; leads: number; checkouts: number; paid: number }[];
  profileDistribution: { profile: string; count: number }[];
  summary: {
    totalLeads: number;
    totalCheckouts: number;
    totalPaid: number;
    revenue: number;
    checkoutRate: number;
    paymentRate: number;
  };
};

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [analyticsRes, leadsRes] = await Promise.all([
      fetch("/api/admin/analytics?days=7"),
      fetch("/api/admin/leads?page=1&limit=10"),
    ]);
    if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    if (leadsRes.ok) {
      const data = await leadsRes.json();
      setRecentLeads(data.data ?? []);
    }
  }, []);

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, [fetchAll]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = analytics?.summary;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Dashboard</h1>
          <p className="text-xs text-muted mt-0.5">Visão geral do negócio — últimos 7 dias</p>
        </div>
        <button type="button" onClick={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}
          className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand/30 hover:text-ink transition">
          Actualizar
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Leads", value: s?.totalLeads ?? 0, color: "text-ink" },
          { label: "Checkouts", value: s?.totalCheckouts ?? 0, color: "text-brand" },
          { label: "Pagos", value: s?.totalPaid ?? 0, color: "text-green-400" },
          { label: "Conversão", value: `${s?.paymentRate ?? 0}%`, color: "text-amber-400" },
        ].map(card => (
          <div key={card.label} className="bg-black/20 border border-white/5 p-5 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
            <p className={`text-3xl font-black mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Receita", value: formatPriceKz(s?.revenue ?? 0), color: "text-ink" },
          { label: "Taxa Checkout", value: `${s?.checkoutRate ?? 0}%`, color: "text-blue-400" },
          { label: "Perfil Dominante", value: analytics?.profileDistribution?.[0]?.profile?.split("-")[0] ?? "—", color: "text-amber-400" },
          { label: "Abandonos", value: `${s?.totalCheckouts ? s.totalCheckouts - s.totalPaid : 0}`, color: "text-red-400" },
        ].map(card => (
          <div key={card.label} className="bg-black/20 border border-white/5 p-5 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
            <p className={`text-xl font-black mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      {analytics?.dailyStats && analytics.dailyStats.length > 0 && (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">Actividade (7 dias)</h2>
            <Link href={"/admin/analytics" as Route} className="text-xs text-brand hover:underline">Ver mais →</Link>
          </div>
          <ActivityChart data={analytics.dailyStats} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent leads */}
        <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-ink">Últimos Leads</h2>
            <Link href={"/admin/leads" as Route} className="text-xs text-brand hover:underline">Ver todos →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentLeads.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted italic">Nenhum lead ainda.</p>
            )}
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{lead.name}</p>
                  <p className="text-xs text-muted font-mono">{lead.phone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lead.quizProfile && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${profileColor(lead.quizProfile)}`}>
                      {lead.quizProfile.split("-")[0]}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] ?? "bg-white/10 text-muted"}`}>
                    {lead.status}
                  </span>
                  <span className="text-[10px] text-muted">{timeAgo(lead.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile distribution */}
        <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-ink">Distribuição de Perfis</h2>
            <Link href={"/admin/quiz" as Route} className="text-xs text-brand hover:underline">Análise completa →</Link>
          </div>
          <div className="p-5 space-y-3">
            {(analytics?.profileDistribution ?? []).length === 0 && (
              <p className="text-sm text-muted italic">Nenhuma submissão de quiz ainda.</p>
            )}
            {(analytics?.profileDistribution ?? []).slice(0, 6).map(({ profile, count }) => {
              const total = (analytics?.profileDistribution ?? []).reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={profile}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-semibold px-1.5 py-0.5 rounded ${profileColor(profile)}`}>{profile}</span>
                    <span className="text-muted">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
