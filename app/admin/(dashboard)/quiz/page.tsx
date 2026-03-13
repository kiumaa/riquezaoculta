"use client";

import { useEffect, useState } from "react";
import type { QuizSubmissionRecord } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PROFILE_COLORS: Record<string, string> = {
  emocional: "#f59e0b",
  clareza:   "#3b82f6",
  acao:      "#22c55e",
  disciplina:"#a855f7",
};

function barColor(profile: string) {
  return PROFILE_COLORS[profile.split("-")[0]] ?? "#6b7f71";
}

export default function QuizPage() {
  const [data, setData] = useState<{
    submissions: QuizSubmissionRecord[];
    profileDistribution: { profile: string; count: number }[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/quiz-submissions")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  const profileDist = (data?.profileDistribution ?? []).map(d => ({
    ...d,
    fill: barColor(d.profile),
    short: d.profile.split("-")[0],
  }));

  // Build answer distribution per profile
  const submissionsByProfile: Record<string, number> = {};
  for (const d of data?.profileDistribution ?? []) {
    submissionsByProfile[d.profile] = d.count;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-ink">Quiz / Perfis</h1>
        <p className="text-xs text-muted mt-0.5">
          Análise de perfis e respostas — {data?.total ?? 0} submissões totais
        </p>
      </div>

      {/* Profile distribution chart */}
      {profileDist.length > 0 ? (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-ink mb-4">Distribuição de Perfis</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={profileDist} margin={{ top: 4, right: 4, bottom: 30, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="profile"
                tick={{ fill: "#6b7f71", fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: "#6b7f71", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0c130e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelStyle={{ color: "#c5d4c8", fontSize: 11 }}
                formatter={(val) => [val, "Submissões"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {profileDist.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-8 text-center">
          <p className="text-muted italic text-sm">Nenhuma submissão de quiz ainda.</p>
          <p className="text-xs text-muted mt-1">Os dados aparecem aqui após utilizadores completarem o quiz.</p>
        </div>
      )}

      {/* Profile cards grid */}
      {profileDist.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {profileDist.map(({ profile, count, fill }) => {
            const total = data?.total ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={profile} className="bg-black/20 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold truncate" style={{ color: fill }}>{profile}</span>
                  <span className="text-lg font-black text-ink">{count}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fill }} />
                </div>
                <p className="text-[10px] text-muted mt-1">{pct}% do total</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent submissions */}
      {(data?.submissions ?? []).length > 0 && (
        <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-ink">Últimas Submissões</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted">
                <tr>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data?.submissions ?? []).slice(0, 20).map(sub => (
                  <tr key={sub.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{sub.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-muted">
                        {sub.profile}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-soft truncate max-w-[200px]">{sub.profileTitle ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
