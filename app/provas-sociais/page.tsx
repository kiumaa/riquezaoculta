import type { Metadata } from "next";
import { getFunnelContentMap } from "@/lib/storage";
import ProvasSociaisClient from "./client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultados Reais | 1M Em Uma Semana",
  description:
    "Vê conversas reais de pessoas que compraram o Guia 1M Em Uma Semana e transformaram os seus resultados em menos de 48 horas.",
};

export default async function ProvasSociaisPage() {
  const c = await getFunnelContentMap("provasSociais");
  return (
    <ProvasSociaisClient
      content={{
        badge_text: c.badge_text ?? "Resultados Reais",
        headline: c.headline ?? "Vê o que está a acontecer com quem já tomou a decisão…",
        subtitle: c.subtitle ?? "Conversas reais de pessoas que compraram o Guia e aplicaram em menos de 48 horas.",
        cta_text: c.cta_text ?? "QUERO ESTES RESULTADOS →",
        trust_badge: c.trust_badge ?? "⚠️ Estas são conversas reais. Os nomes foram usados com autorização.",
      }}
    />
  );
}
