import Link from "next/link";

export function OfferPanel({ angle }: { angle: string }) {
  return (
    <div className="rounded-2xl border border-brand/25 bg-brand/10 p-4 text-center ring-1 ring-brand/15 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brandBright">Oferta recomendada</p>
      <h3 className="mt-2 text-lg font-semibold text-ink sm:text-xl">Riqueza Oculta: Guia Definitivo</h3>
      <p className="mt-2 text-sm leading-relaxed text-soft">
        Descobre os pilares estrategicos que separam quem gera resultados reais de quem apenas observa.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-soft">{angle}</p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-2xl font-semibold text-ink sm:text-xl">4.500 Kz</p>
        <Link
          href="/oferta"
          className="inline-flex items-center justify-center rounded-lg border border-brand/45 bg-brand px-4 py-2 text-sm font-medium text-[#04140c] transition hover:bg-brandDark"
        >
          Desbloquear agora
        </Link>
      </div>
    </div>
  );
}
