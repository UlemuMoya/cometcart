import type { CATEGORIES } from "@/lib/categories";

export type Category = (typeof CATEGORIES)[number];

export type Offer = {
  id?: string;
  shop: string;
  priceZar: number;
  checkedOn: string; // date the price was checked, shown next to every price
  /** The same moment as an ISO date, for working out how old a price is. */
  checkedAt?: string;
  url?: string;
  /** Who added this price (a user id), if anyone. */
  addedBy?: string | null;
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  image?: string | null;
  description?: string | null;
  offers: Offer[];
  /** The shops sell similar items, not the identical product, so no "lowest price" claim. */
  similarItems?: boolean;
  /** In Discover. False for a shopper's private find. */
  listed?: boolean;
  /** Who added it (a user id), if anyone. */
  addedBy?: string | null;
  /** Product page. Placeholder products have none yet. */
  href?: string;
};
