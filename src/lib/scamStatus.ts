export const SCAM_BANNER_LIFETIME = 7 * 24 * 60 * 60 * 1000;
export type HandledScam = {
  handled_at?: string | null;
  handled_by_name?: string | null;
  handled_note?: string | null;
};
export function scamBannerActive(alert: HandledScam & { created_at: string; senior_viewed_at?: string | null }, now: number) {
  return !alert.handled_at && !alert.senior_viewed_at && now < Date.parse(alert.created_at) + SCAM_BANNER_LIFETIME;
}