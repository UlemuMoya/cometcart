import type { Offer } from "@/data/placeholder";

/** Formats rand the South African way: R1 299 */
export function formatRand(amount: number): string {
  return "R" + Math.round(amount).toLocaleString("en-ZA").replace(/ /g, " ");
}

export function lowestOffer(offers: Offer[]): Offer {
  return offers.reduce((best, o) => (o.priceZar < best.priceZar ? o : best));
}
