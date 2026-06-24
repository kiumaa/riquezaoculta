"use client";

import { type CSSProperties, useEffect, useState } from "react";

function scoreColor(score: number) {
  if (score >= 70) return {
    text: "text-brand",
    bar: "from-brandDark to-brandBright",
    glow: "[box-shadow:0_0_12px_rgba(32,230,126,0.6)]",
    bg: "border-brand/[0.12] bg-brand/[0.06]"
  };
  if (score >= 40) return {
    text: "text-yellow-400",
    bar: "from-yellow-600 to-yellow-400",
    glow: "[box-shadow:0_0_12px_rgba(234,179,8,0.5)]",
    bg: "border-yellow-400/[0.10] bg-yellow-400/[0.04]"
  };
  return {
    text: "text-red-400",
    bar: "from-red-700 to-red-400",
    glow: "[box-shadow:0_0_12px_rgba(248,113,113,0.5)]",
    bg: "border-red-400/[0.10] bg-red-400/[0.04]"
  };
}
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GlassCard } from "@/components/funnel/glass-card";
import { OfferPanel } from "@/components/funnel/offer-panel";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { useSound } from "@/lib/useSound";
import { trackCustomEvent, trackEvent } from "@/lib/pixel";
import animationData from "@/assets/Future tech Ui.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const Particles = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden mix-blend-screen">
    <div className="absolute left-[15%] top-[20%] h-1.5 w-1.5 rounded-full bg-brandBright/60 blur-[1px] animate-float-1" />
    <div className="absolute right-[25%] top-[15%] h-2 w-2 rounded-full bg-brand/50 blur-[1px] animate-float-2" />
    <div className="absolute left-[35%] bottom-[25%] h-1 w-1 rounded-full bg-accent/70 blur-[0.5px] animate-float-3" />
    <div className="absolute right-[15%] bottom-[15%] h-2.5 w-2.5 rounded-full bg-brandDark/40 blur-[2px] animate-float-1 [animation-delay:1.5s]" />
    <div className="absolute left-[55%] top-[55%] h-2 w-2 rounded-full bg-brandBright/50 blur-[1px] animate-float-2 [animation-delay:0.8s]" />
    <div className="absolute left-[75%] top-[40%] h-1.5 w-1.5 rounded-full bg-brand/60 blur-[0.5px] animate-float-3 [animation-delay:2s]" />
    <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent z-10" />
  </div>
);

type ResultadoContent = {
  explanation_text: string;
  closing_text: string;
  cta_text: string;
};

const REPROGRAMMING_DATA = {
  clareza: {
    title: "Clareza Financeira",
    power: { title: "Mente Analítica e Visão Estratégica", desc: "Vês os números, traças metas e mapeias caminhos para a riqueza onde outros só veem nevoeiro." },
    saboteur: { title: "A Paralisia por Análise (O Planeador Inerte)", desc: "Planeias tanto à procura do plano perfeito que nunca dás o primeiro passo." },
    microHabit: { title: "A Regra do 'Apenas Um'", desc: "Todas as manhãs, faz uma micro-acção financeira de 2 minutos antes de analisar qualquer coisa." },
    challenge: { title: "Jejum de Planeamento", desc: "Durante 7 dias, nada de planear: só agir. Faz uma venda, poupa, negoceia." },
  },
  disciplina: {
    title: "Disciplina de Execução",
    power: { title: "Foco Inabalável e Consistência de Ferro", desc: "Cumpres rotinas e promessas que fazes a ti mesmo, mesmo quando a motivação desaparece." },
    saboteur: { title: "O Prisioneiro da Rigidez (A Rotina Sem Alma)", desc: "Prendes-te tanto ao processo que executas por hábito, não por resultado, e perdes oportunidades." },
    microHabit: { title: "A Pausa de Alinhamento Estratégico", desc: "Ao meio-dia, pára 60 segundos e pergunta: esta tarefa gera valor real?" },
    challenge: { title: "Exploração Ousada", desc: "Esta semana, quebra uma regra da tua rotina e testa uma ideia nova de negócio." },
  },
  acao: {
    title: "Capacidade de Agir",
    power: { title: "Execução Relâmpago e Coragem Empreendedora", desc: "Enquanto os outros pensam, tu já estás a fazer. O teu arranque é imbatível." },
    saboteur: { title: "A Iniciativa sem Acabativa (O Incendiário Inconsistente)", desc: "Começas dez projetos cheio de força, mas largas tudo a meio quando a novidade passa." },
    microHabit: { title: "A Regra do Fecho Diário", desc: "Antes de dormir, termina uma tarefa por completo. Fecha sempre um ciclo todos os dias." },
    challenge: { title: "Foco de Conclusão Unificado", desc: "Pega num projeto parado. Durante 7 dias não inicies nada novo até o acabares." },
  },
  emocional: {
    title: "Inteligência Emocional",
    power: { title: "Intuição Magnética e Resiliência Psicológica", desc: "Lês pessoas com facilidade e levantas-te depressa de qualquer perda ou rejeição." },
    saboteur: { title: "A Montanha-Russa do Dinheiro (O Decisor Impulsivo)", desc: "Decides com o dinheiro pelo humor do momento e gastas para tapar frustrações." },
    microHabit: { title: "A Respiração da Abundância", desc: "Antes de gastar ou receber, para 5 segundos e respira: é necessidade ou vazio?" },
    challenge: { title: "Quarentena do Gasto Silencioso", desc: "7 dias sem compras por impulso: tudo que não é básico espera 24 horas." },
  },
};

export default function SimuladorResultadoClient({
  initialPrices,
  socialProofEnabled,
  content,
}: {
  initialPrices: { priceOriginal: number; pricePromo: number; priceQuiz: number };
  socialProofEnabled: boolean;
  content: ResultadoContent;
}) {
  const router = useRouter();
  const name = useFunnelStore(state => state.name);
  const answers = useFunnelStore(state => state.answers);
  const result = useFunnelStore(state => state.result);
  const finalizeResult = useFunnelStore(state => state.finalizeResult);
  const ebookPaid = useFunnelStore(state => state.ebookPaid);
  const paymentReference = useFunnelStore(state => state.paymentReference);
  const { playReveal } = useSound();
  const [isPremiumExpanded, setIsPremiumExpanded] = useState(false);

  useEffect(() => {
    // Play reveal sound on mount (slight delay for perceived drama)
    const t = setTimeout(() => playReveal(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!name) {
      router.replace("/simulador/inicio");
      return;
    }

    if (!result && Object.keys(answers).length > 0) {
      finalizeResult();
    }
  }, [answers, finalizeResult, name, result, router]);

  useEffect(() => {
    if (result) {
      trackCustomEvent("ViewSimulatorResult", { content_name: result.profileTitle, content_category: "ResultadoQuiz" });

      // Persist quiz result to DB (non-blocking)
      const store = useFunnelStore.getState();
      if (store.whatsapp) {
        fetch("/api/quiz-submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: store.whatsapp,
            answers: store.answers,
            scores: result.scores,
            profile: `${result.dominant}-${result.weakest}`,
            profileTitle: result.profileTitle,
          }),
        }).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.profileTitle]);

  // Mede a visualização da oferta (upsell) — fecha o buraco de medição resultado→oferta
  useEffect(() => {
    if (result && !ebookPaid) {
      trackEvent("ViewContent", { content_name: "Oferta (Upsell Resultado)", value: initialPrices.pricePromo, currency: "AOA" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.profileTitle, ebookPaid]);

  if (!name) {
    return null;
  }

  if (!result) {
    return (
      <FunnelShell>
        <GlassCard>
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="w-40 h-40">
              <Lottie animationData={animationData} loop={true} />
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-brandBright animate-pulse">
              Analisando...
            </p>
          </div>
        </GlassCard>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell>
      <Particles />
      <div className="mx-auto w-full max-w-2xl space-y-6 relative z-10">
        <GlassCard>
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
                <span className="mr-2 inline-block animate-glow-pulse">◆</span>
                Análise concluída
              </p>

              <div className="mx-auto w-44 h-44 md:w-56 md:h-56">
                <Lottie animationData={animationData} loop={true} />
              </div>

              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {name}, o teu resultado revela um ponto importante
              </h1>
              <p className="bg-gradient-to-r from-brand to-brandBright bg-clip-text text-lg font-semibold text-transparent">
                {result.profileTitle}
              </p>
            </div>

            {/* Score cards com cores dinâmicas */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Object.entries(result.scores).map(([pillar, score]) => {
                const pct = Math.min(Math.max(Number(score), 0), 100);
                const color = scoreColor(pct);

                return (
                  <div
                    key={pillar}
                    className={`rounded-xl border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] relative overflow-hidden transition-all duration-500 ${color.bg}`}
                  >
                    <div className="mb-3 flex items-end justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                        {pillar}
                      </p>
                      <p className={`text-xl font-bold tabular-nums leading-none ${color.text}`}>
                        {score}
                      </p>
                    </div>
                    <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color.bar} ${color.glow} [width:var(--score-pct)] transition-all duration-1000 ease-out`}
                        style={{ "--score-pct": `${pct}%` } as CSSProperties}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation Text — análise sempre visível (quiz é grátis) */}
            {(
              <div className="space-y-6 pt-4 text-left">
                <div className="space-y-4 text-sm leading-relaxed text-soft/90">
                  <p>{content.explanation_text}</p>
                  <p className="font-medium text-white/90">{result.profileSummary}</p>
                  <p>{content.closing_text}</p>
                </div>

                {/* CTA principal — navega direto para a oferta (com tracking que sobrevive à navegação SPA) */}
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("InitiateCheckout", { content_name: "Resultado -> Oferta", value: initialPrices.pricePromo, currency: "AOA" });
                    router.push(socialProofEnabled ? "/provas-sociais?product=ebook" : "/checkout/pagamento?product=ebook");
                  }}
                  className="group relative mt-6 flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full" />
                  <span className="relative">{content.cta_text}</span>
                </button>

                {/* Plano de Reprogramação Financeira (colapsável, fechado por defeito — o CTA acima é o caminho principal) */}
                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                  <button
                    type="button"
                    onClick={() => setIsPremiumExpanded(prev => !prev)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-brand/25 bg-brand/[0.07] px-4 py-3 transition-all duration-300 hover:bg-brand/[0.12] hover:border-brand/40"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand animate-pulse" />
                      <span className="min-w-0 text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-brandBright">Acesso Premium Ativo</span>
                        <span className="block text-sm font-semibold text-white">
                          {isPremiumExpanded ? "Fechar plano" : "Ver o meu plano completo"}
                        </span>
                      </span>
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-brandBright transition-transform duration-300 ${isPremiumExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div
                    className={`space-y-6 overflow-hidden transition-all duration-500 ease-in-out ${
                      isPremiumExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="text-center space-y-2 pt-2">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-white via-soft to-white/70 bg-clip-text text-transparent">
                        O Teu Plano de Reprogramação Financeira
                      </h2>
                      <p className="text-xs text-muted max-w-md mx-auto">
                        Diretrizes estratégicas personalizadas para neutralizar os teus bloqueios e acelerar a tua atração de riqueza.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Quadrante 1: Superpotência */}
                      <div className="bg-black/40 border border-emerald-500/10 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/[0.04] transition-all" />
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl text-emerald-400">✦</span>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            A Tua Superpotência ({REPROGRAMMING_DATA[result.dominant as keyof typeof REPROGRAMMING_DATA]?.title || result.dominant})
                          </h3>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">
                          {REPROGRAMMING_DATA[result.dominant as keyof typeof REPROGRAMMING_DATA]?.power.title}
                        </h4>
                        <p className="text-xs text-muted leading-relaxed">
                          {REPROGRAMMING_DATA[result.dominant as keyof typeof REPROGRAMMING_DATA]?.power.desc}
                        </p>
                      </div>

                      {/* Quadrante 2: Sabotador Oculto */}
                      <div className="bg-black/40 border border-red-500/10 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/20 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-red-500/[0.04] transition-all" />
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl text-red-400">✦</span>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">
                            O Teu Sabotador Oculto ({REPROGRAMMING_DATA[result.weakest as keyof typeof REPROGRAMMING_DATA]?.title || result.weakest})
                          </h3>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">
                          {REPROGRAMMING_DATA[result.weakest as keyof typeof REPROGRAMMING_DATA]?.saboteur.title}
                        </h4>
                        <p className="text-xs text-muted leading-relaxed">
                          {REPROGRAMMING_DATA[result.weakest as keyof typeof REPROGRAMMING_DATA]?.saboteur.desc}
                        </p>
                      </div>

                      {/* Quadrante 3: Micro-Hábito Diário */}
                      <div className="bg-black/40 border border-cyan-500/10 p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/[0.04] transition-all" />
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl text-cyan-400">✦</span>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                            Fórmula dos 2 Minutos
                          </h3>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">
                          {REPROGRAMMING_DATA[result.weakest as keyof typeof REPROGRAMMING_DATA]?.microHabit.title}
                        </h4>
                        <p className="text-xs text-muted leading-relaxed">
                          {REPROGRAMMING_DATA[result.weakest as keyof typeof REPROGRAMMING_DATA]?.microHabit.desc}
                        </p>
                      </div>

                      {/* Quadrante 4: Desafio dos 7 Dias */}
                      <div className="bg-black/40 border border-purple-500/10 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/[0.04] transition-all" />
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl text-purple-400">✦</span>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                            Desafio Semanal dos 7 Dias
                          </h3>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">
                          {REPROGRAMMING_DATA[result.weakest as keyof typeof REPROGRAMMING_DATA]?.challenge.title}
                        </h4>
                        <p className="text-xs text-muted leading-relaxed">
                          {REPROGRAMMING_DATA[result.weakest as keyof typeof REPROGRAMMING_DATA]?.challenge.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Exibição condicional do painel de Upsell / Painel de Acesso ao Ebook Comprado */}
        {!ebookPaid && (
          <OfferPanel
            angle={result.offerAngle}
            initialPrices={initialPrices}
            badge="Desconto de Aluno Ativado"
            ctaHref={socialProofEnabled ? "/provas-sociais?product=ebook" : "/checkout/pagamento?product=ebook"}
          />
        )}

        {ebookPaid && (
          <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-brand/[0.08] p-6 text-center space-y-5">
            {/* Linha de luz no topo */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
            
            <div className="mx-auto w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand">
              <svg className="h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brandBright">
                Acesso Garantido
              </p>
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                O Teu Ebook e Grupo VIP Estão Prontos!
              </h3>
              <p className="text-sm text-soft max-w-md mx-auto">
                Parabéns! Adquiriste o Guia 1M em Uma Semana. Podes fazer o download e juntar-te ao grupo de alunos abaixo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto pt-2">
              <a
                href={paymentReference ? `/api/download/${paymentReference}` : "#"}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brandDark via-brand to-accent px-6 py-4 text-sm font-bold uppercase tracking-wider text-[#04140c] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-[650ms] ease-in-out group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  DOWNLOAD DO GUIA (PDF)
                </span>
              </a>

              <a
                href="https://chat.whatsapp.com/EY84u93L1uy3CSOFF6mBl7?mode=gi_t"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-6 py-3.5 text-sm font-semibold text-[#25D366] transition-all duration-300 hover:bg-[#25D366]/20"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Aceder ao Grupo VIP no WhatsApp →
                  </a>
                </div>
              </div>
            )}
      </div>
    </FunnelShell>
  );
}
