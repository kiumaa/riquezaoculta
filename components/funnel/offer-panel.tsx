import type { SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPriceKz } from "@/lib/format";
import ebookCover from "@/assets/ebook_cover_3d.webp";

const features = [
  "Ebook Completo Riqueza Oculta (PDF)",
  "Acesso ao Simulador de Riqueza 2026",
  "Checklist de Hábitos Diários",
  "Audiobook para ouvir em qualquer lugar",
  "Garantia de 7 dias ou dinheiro de volta"
];

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}

export function OfferPanel({
  angle,
  initialPrices,
  isUpsell = false,
}: {
  angle: string;
  initialPrices: { priceOriginal: number; pricePromo: number };
  isUpsell?: boolean;
}) {
  const priceOriginal = isUpsell ? 4500 : initialPrices.priceOriginal;
  const pricePromo = isUpsell ? 3000 : initialPrices.pricePromo;
  const ctaLink = isUpsell ? "/checkout/pagamento?product=ebook_upsell" : "/oferta";
  const ctaText = isUpsell ? "ADICIONAR GUIA AO MEU PEDIDO (3.000 Kz) 🛒" : "ACESSAR AGORA";
  const badgeText = isUpsell ? "Desconto de Aluno Ativado" : "Oferta recomendada";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-brand/[0.08] p-5 sm:p-6" id="upsell">
      {/* Linha de luz no topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

      <div className="space-y-5">
        {/* Badge */}
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
          <span className="mr-2 inline-block animate-glow-pulse">◆</span>
          {badgeText}
        </p>

        {/* Imagem largura total */}
        <div className="w-full drop-shadow-[0_20px_40px_rgba(32,230,126,0.15)]">
          <Image
            src={ebookCover}
            alt="Riqueza Oculta: Guia Definitivo"
            className="w-full rounded-xl object-contain"
          />
        </div>

        {/* Título + ângulo */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-ink sm:text-2xl">Riqueza Oculta: Guia Definitivo</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-soft">{angle}</p>
        </div>

        {/* Preço */}
        <div className="flex items-end justify-center gap-3 font-semibold">
          <span className="text-lg text-soft/45 line-through">{formatPriceKz(priceOriginal)}</span>
          <span className="text-4xl text-brand leading-none tracking-tight">{formatPriceKz(pricePromo)}</span>
        </div>

        {/* Features */}
        <ul className="space-y-2.5">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-soft/90">
              <CheckIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA — largura total */}
        <Link
          href={ctaLink}
          className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <span className="relative">{ctaText}</span>
        </Link>
      </div>
    </div>
  );
}
