"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

type DayStat = { date: string; leads: number; checkouts: number; paid: number };

export function ActivityChart({ data }: { data: DayStat[] }) {
  const formatted = data.map(d => ({ ...d, date: d.date.slice(5) })); // "MM-DD"
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: "#6b7f71", fontSize: 10 }} />
        <YAxis tick={{ fill: "#6b7f71", fontSize: 10 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#0c130e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
          labelStyle={{ color: "#c5d4c8", fontSize: 11 }}
          itemStyle={{ fontSize: 11 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={false} name="Leads" />
        <Line type="monotone" dataKey="checkouts" stroke="#3b82f6" strokeWidth={2} dot={false} name="Checkouts" />
        <Line type="monotone" dataKey="paid" stroke="#f59e0b" strokeWidth={2} dot={false} name="Pagos" />
      </LineChart>
    </ResponsiveContainer>
  );
}
