/* eslint-disable @typescript-eslint/no-explicit-any */
export const trackEvent = (eventName: string, data?: Record<string, unknown>, options?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", eventName, data, options);
    }
};

export const trackCustomEvent = (eventName: string, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("trackCustom", eventName, data);
    }
};

// ─── Meta advanced matching (browser identifiers para o CAPI server-side) ────
function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[1]) : undefined;
}

/** Cookie do pixel (_fbp), usado para correspondência de eventos server-side. */
export function getFbp(): string | undefined {
    return readCookie("_fbp");
}

/** Identificador de clique (_fbc); deriva-o do parâmetro fbclid se o cookie ainda não existir. */
export function getFbc(): string | undefined {
    const cookie = readCookie("_fbc");
    if (cookie) return cookie;
    if (typeof window === "undefined") return undefined;
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

const UTM_KEY = "ro-utms";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function captureUtms() {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(UTM_KEY)) return; // already captured
    const params = new URLSearchParams(window.location.search);
    const utms: Record<string, string> = {};
    for (const key of UTM_PARAMS) {
        const val = params.get(key);
        if (val) utms[key] = val;
    }
    if (Object.keys(utms).length > 0) {
        localStorage.setItem(UTM_KEY, JSON.stringify(utms));
    }
}

export function getStoredUtms(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(localStorage.getItem(UTM_KEY) ?? "{}");
    } catch {
        return {};
    }
}
