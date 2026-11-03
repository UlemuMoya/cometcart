import type { Offer } from "@/lib/types";

/** Formats rand the South African way: R1 299 */
export function formatRand(amount: number): string {
  return "R" + Math.round(amount).toLocaleString("en-ZA").replace(/ /g, " ");
}

export function lowestOffer(offers: Offer[]): Offer {
  return offers.reduce((best, o) => (o.priceZar < best.priceZar ? o : best));
}

/** "1 Nov 2026", the way price-checked dates are shown. */
export function formatCheckedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

/** Prices older than this are flagged as "may have changed" and listed for re-checking. */
export const STALE_AFTER_DAYS = 14;

/** Whether a price was checked longer ago than STALE_AFTER_DAYS. */
export function isStale(checkedAt: string | undefined): boolean {
  if (!checkedAt) return false;
  return Date.now() - new Date(checkedAt).getTime() > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}
