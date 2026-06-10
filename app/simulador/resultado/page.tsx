import { getFunnelContentMap, getSettings, getSocialProofEnabled } from "@/lib/storage";
import SimuladorResultadoClient from "./client";

export const dynamic = "force-dynamic";

export default async function SimuladorResultadoPage() {
  const [prices, c, socialProofEnabled] = await Promise.all([
    getSettings(), getFunnelContentMap("resultado"), getSocialProofEnabled()
  ]);
  return (
    <SimuladorResultadoClient
      initialPrices={prices}
      socialProofEnabled={socialProofEnabled}
      content={{
        explanation_text: c.explanation_text ?? "Muitas vezes trabalhamos duro, corremos de manhã a noite, mas o progresso parece não acompanhar o esforço. Isso não é falta de sorte — é o teu código mental que precisa de ser atualizado para uma nova realidade.",
        closing_text:     c.closing_text     ?? "Vais continuar a aceitar os mesmos resultados ou vais desbloquear o caminho de abundância que mereces construir?",
        cta_text:         c.cta_text         ?? "Quero a solução →",
      }}
    />
  );
}
