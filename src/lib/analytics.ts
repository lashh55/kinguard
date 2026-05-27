// Lightweight GA4 helper. Page views are tracked by the gtag.js snippet in
// __root.tsx; this module only fires custom events.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  return window.gtag;
}

export function track(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    ensureGtag()("event", name, params ?? {});
  } catch {
    // never let analytics break the app
  }
}

let pwaListenerAttached = false;
export function initAnalytics() {
  if (typeof window === "undefined" || pwaListenerAttached) return;
  pwaListenerAttached = true;
  window.addEventListener("appinstalled", () => track("pwa_installed"));
}
