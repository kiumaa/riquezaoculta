"use client";

import { useEffect, useState } from "react";
import { assignVariant, type ABTestKey } from "@/lib/ab";
import { trackCustomEvent } from "@/lib/pixel";

const VID_KEY = "ro_vid";
const AB_KEY = "ro_ab";

function getVisitorId(): string {
  let vid = localStorage.getItem(VID_KEY);
  if (!vid) {
    vid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VID_KEY, vid);
  }
  return vid;
}

/** Variantes ativas deste visitante (para anexar à conversão no checkout). */
export function getActiveVariants(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(AB_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Resolve a variante de um teste para este visitante (estável), persiste-a para
 * atribuição de conversão e dispara o evento de exposição (ABExposure) ao pixel.
 * Devolve null no primeiro frame (antes da hidratação) — o caller deve usar o
 * default da variante "A" nesse caso, mantendo a página estática/ISR intacta.
 */
export function useABVariant(test: ABTestKey): string | null {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const v = assignVariant(test, getVisitorId());
    setVariant(v);

    const active = getActiveVariants();
    if (active[test] !== v) {
      active[test] = v;
      localStorage.setItem(AB_KEY, JSON.stringify(active));
    }

    trackCustomEvent("ABExposure", { test, variant: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return variant;
}
