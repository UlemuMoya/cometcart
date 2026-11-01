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
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}
