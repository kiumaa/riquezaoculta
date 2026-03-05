import type { PropsWithChildren } from "react";

export function GlassCard({ children }: PropsWithChildren) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/75 p-4 shadow-panel backdrop-blur-xl ring-1 ring-white/5 sm:p-6">
      {children}
    </div>
  );
}
