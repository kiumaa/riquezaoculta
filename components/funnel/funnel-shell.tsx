import type { PropsWithChildren } from "react";

export function FunnelShell({ children }: PropsWithChildren) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg text-ink">
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,rgba(32,230,126,0.7)_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Aurora orbs animados */}
      <div className="pointer-events-none absolute -left-[14%] -top-[18%] h-[500px] w-[500px] animate-aurora-1 rounded-full bg-brand/[0.11] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-[24%] -right-[12%] h-[480px] w-[480px] animate-aurora-2 rounded-full bg-brandDark/[0.09] blur-[100px]" />
      <div className="pointer-events-none absolute left-[35%] top-[55%] h-[220px] w-[220px] rounded-full bg-accent/[0.06] blur-[70px]" />

      {/* Partículas flutuantes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-[8%]  top-[12%] h-1.5 w-1.5 rounded-full bg-brand/60       animate-float-1                       blur-[1px]" />
        <span className="absolute left-[22%] top-[30%] h-2   w-2   rounded-full bg-brandBright/50  animate-float-2 [animation-delay:1.2s] blur-[1px]" />
        <span className="absolute left-[45%] top-[8%]  h-1.5 w-1.5 rounded-full bg-accent/55      animate-float-3 [animation-delay:0.6s] blur-[1px]" />
        <span className="absolute left-[68%] top-[20%] h-2.5 w-2.5 rounded-full bg-brand/45       animate-float-1 [animation-delay:2.4s] blur-[1.5px]" />
        <span className="absolute left-[85%] top-[35%] h-1.5 w-1.5 rounded-full bg-brandBright/55 animate-float-2 [animation-delay:0.3s] blur-[1px]" />
        <span className="absolute left-[15%] top-[65%] h-2   w-2   rounded-full bg-accent/50      animate-float-3 [animation-delay:1.8s] blur-[1px]" />
        <span className="absolute left-[55%] top-[72%] h-1.5 w-1.5 rounded-full bg-brand/60       animate-float-1 [animation-delay:3.1s] blur-[1px]" />
        <span className="absolute left-[78%] top-[60%] h-2.5 w-2.5 rounded-full bg-brandDark/55   animate-float-2 [animation-delay:0.9s] blur-[1.5px]" />
        <span className="absolute left-[32%] top-[85%] h-1.5 w-1.5 rounded-full bg-brandBright/50 animate-float-3 [animation-delay:2.1s] blur-[1px]" />
        <span className="absolute left-[92%] top-[78%] h-2   w-2   rounded-full bg-accent/55      animate-float-1 [animation-delay:1.5s] blur-[1px]" />
      </div>

      {/* Vignette nas bordas para profundidade */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_50%,rgba(3,8,6,0.65)_100%)]" />

      <div className="relative w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        {children}
      </div>
    </main>
  );
}
