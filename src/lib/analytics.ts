// Lightweight GA4 helper. Page views are tracked by the gtag.js snippet in
// __root.tsx; this module only fires custom events.

export function track(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  try {
    w.gtag?.("event", name, params ?? {});
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
