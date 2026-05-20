"use client";

import { useEffect, useState } from "react";
import { formatPriceKz } from "@/lib/format";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type AnalyticsData = {
  dailyStats: { date: string; leads: number; checkouts: number; paid: number }[];
  profileDistribution: { profile: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
  provinceDistribution: { province: string; count: number }[];
  profileConversion: { profile: string; leads: number; conversions: number; rate: number }[];
  summary: {
    totalLeads: number;
    totalCheckouts: number;
    totalPaid: number;
    revenue: number;
    checkoutRate: number;
    paymentRate: number;
  };
};

const TOOLTIP_STYLE = {
  contentStyle: { background: "#0c130e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 },
  labelStyle: { color: "#c5d4c8", fontSize: 11 },
  itemStyle: { fontSize: 11 },
};

const PROFILE_COLORS_HEX: Record<string, string> = {
  emocional:  "#f59e0b",
  clareza:    "#3b82f6",
  acao:       "#22c55e",
  disciplina: "#a855f7",
};

function profileHex(profile: string) {
  const dominant = profile.split("-")[0];
  return PROFILE_COLORS_HEX[dominant] ?? "#6b7f71";
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  async function fetchData(d: number) {
    setLoading(true);
    const res = await fetch(`/api/admin/analytics?days=${d}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(days); }, [days]);

  const s = data?.summary;
  const dailyFormatted = (data?.dailyStats ?? []).map(d => ({ ...d, date: d.date.slice(5) }));
  const conversionData = (data?.profileConversion ?? []).map(p => ({
    name: p.profile,
    leads: p.leads,
    compras: p.conversions,
    taxa: p.rate,
  }));
  const maxLeadsConversion = Math.max(...conversionData.map(r => r.leads), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Analytics</h1>
          <p className="text-xs text-muted mt-0.5">Métricas detalhadas do funil</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(d => (
            <button key={d} type="button" onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                days === d ? "bg-brand/20 text-brand border border-brand/30" : "border border-white/[0.07] text-muted hover:text-ink"
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: `Leads (${days}d)`, value: s?.totalLeads ?? 0, color: "text-ink" },
          { label: "Checkouts", value: s?.totalCheckouts ?? 0, color: "text-blue-400" },
          { label: "Pagamentos", value: s?.totalPaid ?? 0, color: "text-green-400" },
          { label: "Receita", value: formatPriceKz(s?.revenue ?? 0), color: "text-amber-400" },
          { label: "Taxa Checkout", value: `${s?.checkoutRate ?? 0}%`, color: "text-brand" },
          { label: "Taxa Pagamento", value: `${s?.paymentRate ?? 0}%`, color: "text-purple-400" },
        ].map(card => (
          <div key={card.label} className="bg-black/20 border border-white/5 p-4 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
            <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily activity chart */}
      {loading ? (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-8 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-ink mb-4">Actividade Diária ({days} dias)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyFormatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7f71", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7f71", fontSize: 10 }} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={false} name="Leads" />
              <Line type="monotone" dataKey="checkouts" stroke="#3b82f6" strokeWidth={2} dot={false} name="Checkouts" />
              <Line type="monotone" dataKey="paid" stroke="#f59e0b" strokeWidth={2} dot={false} name="Pagos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Conversion by Profile */}
      {conversionData.length > 0 && (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-ink">Conversão por Perfil de Quiz</h2>
              <p className="text-[11px] text-muted mt-0.5">Comparação entre leads captados e compras reais por pilar dominante</p>
            </div>
          </div>
          <div className="space-y-4">
            {conversionData.map(row => (
              <div key={row.name}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold capitalize" style={{ color: profileHex(row.name) }}>{row.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted">{row.leads} leads</span>
                    <span className="font-bold text-green-400">{row.compras} compras</span>
                    <span className={`font-black text-sm ${row.taxa >= 10 ? "text-green-400" : row.taxa > 0 ? "text-amber-400" : "text-muted"}`}>
                      {row.taxa}%
                    </span>
                  </div>
                </div>
                {/* Stacked bar: leads base, compras overlay */}
                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full opacity-30"
                    style={{
                      width: `${Math.round((row.leads / maxLeadsConversion) * 100)}%`,
                      background: profileHex(row.name)
                    }} />
                  {row.compras > 0 && (
                    <div className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${Math.round((row.compras / maxLeadsConversion) * 100)}%`,
                        background: "#22c55e"
                      }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-white/20 inline-block" />Leads captados</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-green-400 inline-block" />Compras confirmadas</span>
          </div>
        </div>
      )}

      {/* Province Distribution */}
      {(data?.provinceDistribution ?? []).length > 0 && (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-ink">Distribuição Geográfica — Angola</h2>
            <p className="text-[11px] text-muted mt-0.5">Top 5 províncias com mais leads registados</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.provinceDistribution ?? []} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7f71", fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="province" tick={{ fill: "#8f9d93", fontSize: 10 }} width={100} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(val) => [val, "Leads"]} />
              <Bar dataKey="count" fill="#20e67e" radius={[0, 4, 4, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Side-by-side charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Traffic sources */}
        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-ink mb-4">Origens de Tráfego</h2>
          {(data?.sourceDistribution ?? []).length === 0 ? (
            <p className="text-sm text-muted italic py-4">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.sourceDistribution ?? []} layout="vertical" margin={{ left: 20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7f71", fontSize: 10 }} />
                <YAxis type="category" dataKey="source" tick={{ fill: "#8f9d93", fontSize: 10 }} width={100} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(val) => [val, "Leads"]} />
                <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profile distribution */}
        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-ink mb-4">Perfis Mais Populares</h2>
          {(data?.profileDistribution ?? []).length === 0 ? (
            <p className="text-sm text-muted italic py-4">Sem submissões de quiz ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.profileDistribution ?? []} layout="vertical" margin={{ left: 20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7f71", fontSize: 10 }} />
                <YAxis type="category" dataKey="profile" tick={{ fill: "#8f9d93", fontSize: 10 }} width={120} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(val) => [val, "Submissões"]} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
