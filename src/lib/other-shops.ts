// "Check other shops": plain links to each shop's own search page for a product.
// Nothing is fetched or read from the shops (CLAUDE.md: no scraping); the shopper
// looks, and if they find it, pastes the link to add that shop's price.
import type { Category } from "./types";

type Shop = { name: string; search: (q: string) => string };

const q = encodeURIComponent;
const SHOPS = {
  takealot: { name: "Takealot", search: (s) => `https://www.takealot.com/all?qsearch=${q(s)}` },
  amazon: { name: "Amazon.co.za", search: (s) => `https://www.amazon.co.za/s?k=${q(s)}` },
  makro: { name: "Makro", search: (s) => `https://www.makro.co.za/search?q=${q(s)}` },
  woolworths: { name: "Woolworths", search: (s) => `https://www.woolworths.co.za/browse?searchterm=${q(s)}` },
  superbalist: { name: "Superbalist", search: (s) => `https://superbalist.com/search?q=${q(s)}` },
  mrphome: { name: "Mr Price Home", search: (s) => `https://www.mrphome.com/en_za/catalogsearch/result/?q=${q(s)}` },
  clicks: { name: "Clicks", search: (s) => `https://clicks.co.za/search?text=${q(s)}` },
  dischem: { name: "Dis-Chem", search: (s) => `https://www.dischem.co.za/catalogsearch/result/?q=${q(s)}` },
  incredible: { name: "Incredible", search: (s) => `https://www.incredible.co.za/catalogsearch/result/?q=${q(s)}` },
} satisfies Record<string, Shop>;

const FASHION = [SHOPS.superbalist, SHOPS.woolworths, SHOPS.takealot, SHOPS.amazon];
const HOME = [SHOPS.woolworths, SHOPS.mrphome, SHOPS.makro, SHOPS.takealot];
const BEAUTY = [SHOPS.clicks, SHOPS.dischem, SHOPS.woolworths, SHOPS.takealot];
const TECH = [SHOPS.takealot, SHOPS.makro, SHOPS.incredible, SHOPS.amazon];

const BY_CATEGORY: Record<Category, Shop[]> = {
  Tops: FASHION,
  Pants: FASHION,
  Shoes: FASHION,
  Bags: FASHION,
  Furniture: HOME,
  Bedding: HOME,
  Lighting: HOME,
  Kitchen: HOME,
  Makeup: BEAUTY,
  Skincare: BEAUTY,
  Fragrance: BEAUTY,
  Headphones: TECH,
  Laptops: TECH,
  TVs: TECH,
  Watches: TECH,
  Appliances: TECH,
};

/** Search links at shops suited to this category, leaving out shops already compared. */
export function otherShopLinks(name: string, category: Category, knownShops: string[]) {
  const known = knownShops.map((s) => s.toLowerCase());
  // Shops' own search works best with a few key words: drop anything in brackets and keep the
  // first 5 words, e.g. "Philips 1000 Series Airfryer 6.2L NA130/00" → "Philips 1000 Series Airfryer 6.2L".
  const term = name.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 5).join(" ");
  return BY_CATEGORY[category]
    .filter((shop) => !known.some((k) => k.includes(shop.name.toLowerCase().split(/[ .]/)[0])))
    .map((shop) => ({ name: shop.name, href: shop.search(term) }));
}
