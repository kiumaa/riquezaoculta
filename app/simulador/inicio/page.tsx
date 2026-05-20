import { getFunnelContentMap } from "@/lib/storage";
import SimuladorInicioClient from "./client";

export const dynamic = "force-dynamic";

export default async function SimuladorInicioPage() {
  const c = await getFunnelContentMap("simulador");

  return (
    <SimuladorInicioClient
      content={{
        step_label:   c.step_label   ?? "Passo 1 de 5",
        headline:     c.headline     ?? "Cria o teu Perfil Financeiro",
        subtitle:     c.subtitle     ?? "Vamos enviar a tua análise personalizada directamente para o teu WhatsApp. É rápido e gratuito.",
        cta_text:     c.cta_text     ?? "Iniciar análise gratuita →",
        privacy_text: c.privacy_text ?? "Não partilhamos os teus dados. Apenas usamos para te enviar os resultados.",
      }}
    />
  );
}
