import "server-only";
// Reads the product list a Shopify store publishes for every shop (its products.json),
// for shops that have agreed to list on Cometcart. Only ever run by the owner for an
// approved shop, on that shop's own website.
import { CATEGORIES } from "./categories.ts";
import type { FeedProblem, FeedRow } from "./feed-csv";
import { guessCategory } from "./link-guess.ts";
import type { Category } from "./types";

type ShopifyProduct = {
  title: string;
  handle: string;
  product_type?: string;
  tags?: string[] | string;
  images?: { src: string }[];
  variants?: { price: string; available?: boolean }[];
};

const MAX_PAGES = 8; // up to 2 000 products
const TIMEOUT_MS = 15_000;

async function getJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Cometcart product import (approved shop)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function categoryFor(p: ShopifyProduct): Category | "" {
  const type = (p.product_type ?? "").trim().toLowerCase();
  const exact = (CATEGORIES as readonly string[]).find((c) => c.toLowerCase() === type);
  if (exact) return exact as Category;
  const tags = Array.isArray(p.tags) ? p.tags.join(" ") : (p.tags ?? "");
  return guessCategory(`${p.title} ${p.product_type ?? ""} ${tags}`);
}

/**
 * Reads an approved shop's Shopify product list. Products in stock only, at their
 * lowest in-stock price. Products that don't fit a Cometcart category are left out.
 */
export async function readShopifyStore(website: string): Promise<{ rows: FeedRow[]; problems: FeedProblem[] }> {
  const site = new URL(website);
  if (site.protocol !== "https:") throw new Error("The shop's website must start with https://");
  const base = `https://${site.hostname}`;

  // Prices must be in rand. Every Shopify store reports its currency in cart.js.
  const cart = await getJson(`${base}/cart.js`).catch(() => null);
  if (!cart) throw new Error("This doesn’t look like a Shopify store, or it isn’t reachable.");
  if (cart.currency && cart.currency !== "ZAR") throw new Error(`This store shows prices in ${cart.currency}, not rand.`);

  const rows: FeedRow[] = [];
  const problems: FeedProblem[] = [];
  let count = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await getJson(`${base}/products.json?limit=250&page=${page}`).catch(() => null);
    const products: ShopifyProduct[] = data?.products ?? [];
    if (!products.length) break;
    for (const p of products) {
      count++;
      const line = count;
      const name = (p.title ?? "").trim().slice(0, 120);
      const prices = (p.variants ?? [])
        .filter((v) => v.available !== false)
        .map((v) => Number(v.price))
        .filter((n) => Number.isFinite(n) && n > 0);
      const category = categoryFor(p);
      if (!name) continue;
      if (!prices.length) {
        problems.push({ line, reason: `“${name}”: out of stock.` });
        continue;
      }
      if (!category) {
        problems.push({ line, reason: `“${name}”: doesn’t fit a Cometcart category.` });
        continue;
      }
      const image = p.images?.[0]?.src ?? "";
      rows.push({
        name,
        category,
        price: Math.min(...prices),
        url: `${base}/products/${encodeURIComponent(p.handle)}`,
        image: image.startsWith("//") ? `https:${image}` : image.startsWith("https://") ? image : "",
      });
    }
    if (products.length < 250) break;
  }
  if (!count) throw new Error("No products found. The store may have its product list switched off.");
  return { rows, problems };
}
