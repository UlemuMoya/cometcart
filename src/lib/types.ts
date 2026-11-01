import type { CATEGORIES } from "@/lib/categories";

export type Category = (typeof CATEGORIES)[number];

export type Offer = {
  id?: string;
  shop: string;
  priceZar: number;
  checkedOn: string; // date the price was checked, shown next to every price
  url?: string;
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  image?: string | null;
  description?: string | null;
  offers: Offer[];
  /** Product page. Placeholder products have none yet. */
  href?: string;
};
