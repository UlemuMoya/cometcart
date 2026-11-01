// Discover search, carried over from the prototype: plain-language words plus
// an optional budget like "under R1500".
import { CATEGORY_WORDS } from "@/lib/categories";
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
  const words = text
    .replace(BUDGET, " ")
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 2 && !FILLER.has(w));
  return { words, maxPrice };
}

/** Does a word (or its singular) start any word in the text? "bags" matches "bag", "handbags". */
function matches(haystack: string, word: string): boolean {
  const tokens = haystack.split(/[^a-z0-9]+/);
  const forms = [word, word.replace(/es$/, ""), word.replace(/s$/, "")].filter((f) => f.length >= 3);
  return tokens.some((t) => forms.some((f) => t.startsWith(f)));
}

function haystack(p: Product): string {
  return [p.name, p.category, p.description ?? "", ...CATEGORY_WORDS[p.category]].join(" ").toLowerCase();
}

function score(p: Product, words: string[]): number {
  const h = haystack(p);
  return words.filter((w) => matches(h, w)).length;
}

const price = (p: Product) => lowestOffer(p.offers).priceZar;

export type SearchResult = {
  query: ParsedQuery;
  results: Product[];
  /** True when nothing fit the budget and `results` are the closest matches over it. */
  overBudget: boolean;
};

export function searchProducts(all: Product[], raw: string, category: string | null): SearchResult {
  const query = parseQuery(raw);
  const inCategory = category ? all.filter((p) => p.category === category) : all;

  const rank = (list: Product[]) =>
    query.words.length
      ? list
          .map((p) => [p, score(p, query.words)] as const)
          .filter(([, s]) => s > 0)
          .sort((a, b) => b[1] - a[1] || price(a[0]) - price(b[0]))
          .map(([p]) => p)
      : [...list].sort((a, b) => price(a) - price(b));

  const withinBudget = query.maxPrice ? inCategory.filter((p) => price(p) <= query.maxPrice!) : inCategory;
  const results = rank(withinBudget);
  if (results.length || !query.maxPrice) return { query, results, overBudget: false };

  // Nothing under budget: show the closest matches above it, cheapest first, and say so.
  const closest = rank(inCategory).sort((a, b) => price(a) - price(b)).slice(0, 6);
  return { query, results: closest, overBudget: closest.length > 0 };
}
