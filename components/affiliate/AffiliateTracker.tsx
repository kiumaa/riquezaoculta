"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useFunnelStore } from "@/lib/store/funnel-store";

const COOKIE_NAME = "affiliate_ref";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function AffiliateTrackerInner() {
  const searchParams = useSearchParams();
  const setAffiliateToken = useFunnelStore(state => state.setAffiliateToken);

  useEffect(() => {
    const refFromUrl = searchParams.get("ref");

    if (refFromUrl) {
      // Nova visita via link de afiliado — definir cookie e registar click
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(refFromUrl)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
      setAffiliateToken(refFromUrl);

      // Registar click (fire-and-forget — apenas na primeira visita via URL)
      fetch("/api/afiliados/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refFromUrl }),
      }).catch(() => {});
    } else {
      // Sem ?ref na URL — verificar se cookie existe (visita subsequente)
      const cookieToken = getCookie(COOKIE_NAME);
      if (cookieToken) {
        setAffiliateToken(cookieToken);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function AffiliateTracker() {
  return (
    <Suspense fallback={null}>
      <AffiliateTrackerInner />
    </Suspense>
  );
}
