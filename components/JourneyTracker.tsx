"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useFunnelStore } from "@/lib/store/funnel-store";
import { captureUtms } from "@/lib/pixel";

const PAGE_NAMES: Record<string, string> = {
    "/": "Landing Page",
    "/simulador": "Simulador/Quiz",
    "/oferta": "Página de Oferta",
    "/checkout": "Checkout",
    "/acesso": "Área de Acesso"
};

export function JourneyTracker() {
    const pathname = usePathname();
    const trackStep = useFunnelStore(state => state.trackStep);

    useEffect(() => {
        captureUtms();
    }, []);

    useEffect(() => {
        const pageName = PAGE_NAMES[pathname] || pathname;
        trackStep(pageName, pathname);
    }, [pathname, trackStep]);

    return null;
}
