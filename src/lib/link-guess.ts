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
        // drop shop stock codes (PLID73456789, 385000abiv6, 6009219123456), keep model numbers like 1000xm5
        .filter((w) => w && !/\d{5,}/.test(w))
        .join(" ")
        // "women s" (from women-s in the address) → "women's"
        .replace(/\b([a-z]+) s\b/gi, "$1's"),
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

// Sites whose links are a detour to a shop (search results, ads, social posts), not the shop itself.
const NOT_A_SHOP = /(^|\.)(google\.[a-z.]+|googleadservices\.com|share\.google|goo\.gl|g\.co|bing\.com|facebook\.com|fb\.me|instagram\.com|tiktok\.com|pinterest\.[a-z.]+|pin\.it|x\.com|twitter\.com|t\.co|whatsapp\.com|wa\.me)$/i;
// Where those sites tuck the real destination: google.com/aclk?adurl=…, /url?q=…, l.facebook.com/l.php?u=…
const REDIRECT_PARAMS = ["adurl", "url", "q", "u", "dest", "destination"];

function siteName(host: string): string {
  const h = host.toLowerCase();
  if (/google|goo\.gl|g\.co/.test(h)) return "Google";
  if (/facebook|fb\.me/.test(h)) return "Facebook";
  if (/pinterest|pin\.it/.test(h)) return "Pinterest";
  if (/instagram/.test(h)) return "Instagram";
  if (/tiktok/.test(h)) return "TikTok";
  if (/whatsapp|wa\.me/.test(h)) return "WhatsApp";
  if (/bing/.test(h)) return "Bing";
  return "social media";
}

function webUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

// Ad and tracking codes added by Google Shopping, social ads and search pages, plus other
// sites' Amazon commission tags. They're not needed to open the product.
const TRACKING = /^(utm_|gad_|hv)|^(gclid|gclsrc|gbraid|wbraid|fbclid|msclkid|srsltid|sfdr_ptcid|sfdr_hash|clickref|tag|linkcode|mcid|ref_|otracker1?|fm|iid|ppt|ppn|ssid|qh|srno|spotlighttagid)$/i;

/** The shop link without tracking codes, so it's tidy and ours to swap for a tracked link later. */
export function cleanShopUrl(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
    // Amazon's "/ref=asc_df_…" path ending is tracking too.
    if (/amazon\./.test(url.hostname)) url.pathname = url.pathname.replace(/\/ref=[^/]*$/, "");
    // Makro's product code is all its link needs; the rest is the search that found it.
    if (/makro\./.test(url.hostname) && url.searchParams.has("pid")) url.search = `?pid=${url.searchParams.get("pid")}`;
    return url.toString();
  } catch {
    return raw;
  }
}

export type ShopLink =
  | { ok: true; url: string; /** true when the shop link was dug out of a Google/social link */ unwrapped: boolean }
  | { ok: false; problem: string };

/** Turns what someone pasted into the shop's own product link, or explains why it isn't one. */
export function resolveShopLink(raw: string): ShopLink | null {
  let url = webUrl(raw);
  if (!url) return null;
  let unwrapped = false;
  for (let hops = 0; hops < 3 && NOT_A_SHOP.test(url.hostname); hops++) {
    const inner = REDIRECT_PARAMS.map((p) => webUrl(url!.searchParams.get(p) ?? "")).find(Boolean);
    if (!inner) {
      const name = siteName(url.hostname);
      return {
        ok: false,
        problem: `That’s a ${name} link, not the shop’s own page. Open the product on the shop’s website, then copy the link from there.`,
      };
    }
    url = inner;
    unwrapped = true;
  }
  if (NOT_A_SHOP.test(url.hostname))
    return { ok: false, problem: "That link doesn’t lead to a shop. Please copy the link from the shop’s product page." };
  return { ok: true, url: cleanShopUrl(url.toString()), unwrapped };
}

export function guessFromLink(raw: string): LinkGuess | null {
  const link = resolveShopLink(raw);
  if (!link?.ok) return null;
  const url = new URL(link.url);
  const name = guessName(url);
  return { shop: guessShop(url), name, category: name ? guessCategory(name) : "" };
}
