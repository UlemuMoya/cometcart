// Guesses product details from a shop link's ADDRESS ONLY. It never fetches
// the shop's page (CLAUDE.md: no scraping). Shoppers can correct any guess.
import { CATEGORIES, CATEGORY_WORDS } from "./categories.ts";

type Category = (typeof CATEGORIES)[number];

export type LinkGuess = { shop: string; name: string; category: Category | "" };

/** takealot.com, m.takealot.com and woolworths.co.za all give the brand part. */
export function guessShop(url: URL): string {
  const parts = url.hostname.split(".");
  const secondLevel = ["co", "com", "org", "net", "ac"].includes(parts.at(-2) ?? "");
  const name = (secondLevel && parts.length >= 3 ? parts.at(-3) : parts.at(-2)) ?? parts[0];
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
}

// Path pieces that are never the product name.
const NOISE = new Set(["p", "dp", "product", "products", "item", "items", "en", "za", "en-za", "shop", "buy", "pd", "prod"]);

/** "black-leather-handbag" in /black-leather-handbag/PLID123 → "Black leather handbag" */
export function guessName(url: URL): string {
  const candidates = url.pathname
    .split("/")
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .map((s) => s.replace(/\.(html?|aspx|php)$/i, ""))
    .filter((s) => s && !NOISE.has(s.toLowerCase()))
    .map((s) =>
      s
        .split(/[-_+\s]+/)
        // drop shop codes like PLID73456789 or 6009219123456, keep model numbers like 1000xm5
        .filter((w) => w && !/^\d{5,}$/.test(w) && !/^[a-z]{1,4}\d{5,}$/i.test(w) && !/\d{5,}_/.test(w))
        .join(" "),
    )
    .filter((s) => /[a-z]{3,}/i.test(s));

  // The product name is usually the piece with the most words.
  const best = candidates.sort((a, b) => b.split(" ").length - a.split(" ").length)[0] ?? "";
  if (best.split(" ").length < 2) return "";
  const text = best.toLowerCase().slice(0, 120);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Picks the category whose everyday words appear most in the name. */
export function guessCategory(name: string): Category | "" {
  const words = name.toLowerCase().split(/[^a-z0-9]+/);
  let best: Category | "" = "";
  let bestScore = 0;
  for (const category of CATEGORIES) {
    const score = [category.toLowerCase(), ...CATEGORY_WORDS[category]].filter((w) =>
      w.includes(" ") ? name.toLowerCase().includes(w) : words.some((x) => x === w || x === `${w}s` || x === `${w}es`),
    ).length;
    if (score > bestScore) [best, bestScore] = [category, score];
  }
  return best;
}

export function guessFromLink(raw: string): LinkGuess | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!["https:", "http:"].includes(url.protocol)) return null;
  const name = guessName(url);
  return { shop: guessShop(url), name, category: name ? guessCategory(name) : "" };
}
