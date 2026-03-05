import type { PropsWithChildren } from "react";

export function FunnelShell({ children }: PropsWithChildren) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg text-ink">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(32,230,126,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(32,230,126,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute left-[-16%] top-[-9%] h-[320px] w-[320px] rounded-full bg-brand/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-22%] right-[-16%] h-[320px] w-[320px] rounded-full bg-brandDark/14 blur-3xl" />
      <div className="relative w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">{children}</div>
    </main>
  );
}
