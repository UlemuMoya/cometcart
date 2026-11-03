// Discover search, carried over from the prototype: plain-language words plus
// an optional budget like "under R1500".
import { CATEGORIES, CATEGORY_WORDS } from "@/lib/categories";
import { lowestOffer } from "@/lib/format";
import type { Product } from "@/lib/types";

const BUDGET = /(?:under|below|less than|max|up to|<)\s*r?\s*([\d\s,]+)/i;
const FILLER = new Set([
  "for", "the", "and", "find", "with", "something", "need", "want", "looking",
  "please", "can", "you", "show", "some", "any", "nice", "good", "cheap", "new",
]);

export type ParsedQuery = { words: string[]; maxPrice: number | null };

export function parseQuery(raw: string): ParsedQuery {
  const text = raw.toLowerCase();
  const m = text.match(BUDGET);
  const maxPrice = m ? parseInt(m[1].replace(/[\s,]/g, ""), 10) || null : null;
  // Short words are skipped, except numbers like "55" and the common "tv".
  const words = text
    .replace(BUDGET, " ")
    .split(/[^a-z0-9]+/)
    .filter((w) => (w.length > 2 || /^\d{2,}$/.test(w) || w === "tv") && !FILLER.has(w));
  return { words, maxPrice };
}

/** Does a word (or its singular) start any word in the text? "bags" matches "bag", "handbags". */
function matches(haystack: string, word: string): boolean {
  const tokens = haystack.split(/[^a-z0-9]+/);
  const forms = [word, word.replace(/es$/, ""), word.replace(/s$/, "")].filter((f) => f.length >= Math.min(3, word.length));
  return tokens.some((t) => forms.some((f) => t.startsWith(f)));
}

function haystack(p: Product): string {
  return [p.name, p.category, p.description ?? "", ...CATEGORY_WORDS[p.category]].join(" ").toLowerCase();
}

/** Every word is in the product's own name or description, not just its category's everyday words. */
function isExact(p: Product, words: string[]): boolean {
  const own = [p.name, p.description ?? ""].join(" ").toLowerCase();
  // "air fryer" is exact for a product spelled "Airfryer".
  if (words.length > 1 && own.replace(/[^a-z0-9]/g, "").includes(words.join(""))) return true;
  return words.every((w) => matches(own, w));
}

function score(p: Product, words: string[]): number {
  const h = haystack(p);
  return words.filter((w) => matches(h, w)).length;
}

/** A typed word that names a category ("shoes", "laptop", "tvs") picks that category. */
function categoryIn(words: string[]): { category: string; word: string } | null {
  for (const word of words)
    for (const c of CATEGORIES) {
      const name = c.toLowerCase();
      if ([name, name.replace(/s$/, "")].includes(word) || word.replace(/s$/, "") === name.replace(/s$/, ""))
        return { category: c, word };
    }
  return null;
}

const price = (p: Product) => lowestOffer(p.offers).priceZar;

export type PriceRange = { min: number | null; max: number | null };

export type SearchResult = {
  query: ParsedQuery;
  /** The price limits actually applied: the side filter combined with any typed budget. */
  range: PriceRange;
  results: Product[];
  /** True when nothing fit the budget and `results` are the closest matches over it. */
  overBudget: boolean;
  /** True when no result is exactly what was typed, only something in the same category ("kettle" finds the air fryer). */
  related: boolean;
  /** The category searched in: the one chosen, or one named in the typed words. */
  category: string | null;
  /** True when the category came from the typed words rather than a category button. */
  categoryTyped: boolean;
};

export function searchProducts(
  all: Product[],
  raw: string,
  category: string | null,
  filter: PriceRange = { min: null, max: null },
): SearchResult {
  const query = parseQuery(raw);
  // "shoes under R1000" searches the Shoes category; "black bags" looks for "black" within Bags.
  const typed = category ? null : categoryIn(query.words);
  if (typed) {
    category = typed.category;
    query.words = query.words.filter((w) => w !== typed.word);
  }
  const categoryTyped = typed != null;
  // A typed "under R1000" and the side filter both apply; the lower maximum wins.
  const maxes = [query.maxPrice, filter.max].filter((n): n is number => n != null);
  const range: PriceRange = { min: filter.min, max: maxes.length ? Math.min(...maxes) : null };

  const inCategory = (category ? all.filter((p) => p.category === category) : all).filter(
    (p) => range.min == null || price(p) >= range.min,
  );

  // Only the best matches: "air fryer" shows the air fryer, not everything with "air" in its name.
  const rank = (list: Product[]) => {
    if (!query.words.length) return [...list].sort((a, b) => price(a) - price(b));
    const scored = list.map((p) => [p, score(p, query.words)] as const);
    const best = Math.max(0, ...scored.map(([, s]) => s));
    return scored
      .filter(([, s]) => s > 0 && s === best)
      .sort((a, b) => price(a[0]) - price(b[0]))
      .map(([p]) => p);
  };

  const max = range.max;
  const withinBudget = max != null ? inCategory.filter((p) => price(p) <= max) : inCategory;
  const related = (list: Product[]) =>
    query.words.length > 0 && list.length > 0 && !list.some((p) => isExact(p, query.words));

  const results = rank(withinBudget);
  if (results.length || max == null)
    return { query, range, results, overBudget: false, related: related(results), category, categoryTyped };

  // Nothing under budget: show the closest matches above it, cheapest first, and say so.
  const closest = rank(inCategory).sort((a, b) => price(a) - price(b)).slice(0, 6);
  return {
    query,
    range,
    results: closest,
    overBudget: closest.length > 0,
    related: related(closest),
    category,
    categoryTyped,
  };
}
