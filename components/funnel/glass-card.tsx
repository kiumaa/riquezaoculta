import type { PropsWithChildren } from "react";

export function GlassCard({ children }: PropsWithChildren) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-panel/80 p-4 shadow-panel backdrop-blur-2xl sm:p-6">
      {/* Linha de luz no topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent" />
      {/* Reflexo de luz suave vindo de cima */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-28 w-3/4 -translate-x-1/2 rounded-full bg-brand/[0.04] blur-2xl" />
      {children}
    </div>
  );
}
