import { getFunnelContentMap } from "@/lib/storage";
import LandingClient from "./landing-client";

// ISR: o conteúdo da landing muda raramente (via admin). Servir do CDN da Vercel
// em vez de render on-demand corta segundos no LCP em 3G. Revalida a cada 5 min.
export const revalidate = 300;

export default async function LandingPage() {
  const c = await getFunnelContentMap("landing");
  return (
    <LandingClient content={{
      badge_text:    c.badge_text    ?? "Simulador Riqueza 2026",
      headline:      c.headline      ?? "Trabalhas, corres, prometes mudar... mas nada muda.",
      subtitle:      c.subtitle      ?? "O que te trava não é azar. É um padrão invisível que decide as tuas escolhas sem que percebas. Este simulador revela-o em 2 minutos.",
      cta_text:      c.cta_text      ?? "Iniciar simulador →",
      trust_badge_1: c.trust_badge_1 ?? "100% Anónimo",
      trust_badge_2: c.trust_badge_2 ?? "Resultado Imediato",
    }} />
  );
}
