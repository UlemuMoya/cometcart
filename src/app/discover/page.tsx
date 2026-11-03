import Link from "next/link";
import { Suspense } from "react";
import { PageIntro } from "@/components/PageIntro";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogue } from "@/lib/catalogue";
import { CATEGORIES } from "@/lib/categories";
import { formatRand } from "@/lib/format";
import { searchProducts, type PriceRange } from "@/lib/search";
import { getSavedIds } from "@/lib/wishlist";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description: "Search in your own words and compare prices for the same product at different South African shops.",
};

const EXAMPLES = ["air fryer under R1500", "wireless headphones", "55-inch TV"];

const PRICE_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: "Any price", min: null, max: null },
  { label: "Under R500", min: null, max: 500 },
  { label: "R500 – R1 000", min: 500, max: 1000 },
  { label: "R1 000 – R2 500", min: 1000, max: 2500 },
  { label: "R2 500 – R5 000", min: 2500, max: 5000 },
  { label: "Over R5 000", min: 5000, max: null },
];

type Filters = { q: string; cat: string | null; min: number | null; max: number | null };

export default function DiscoverPage(props: PageProps<"/discover">) {
  return (
    <section>
      <PageIntro
        title="Describe it. Compare it. Keep it."
        intro="Search in your own words, see the same product at different shops, and save it to a wishlist you can share."
      />
      <Suspense fallback={<p className="text-mute">Loading products…</p>}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

function href(f: Filters) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.cat) params.set("cat", f.cat);
  if (f.min != null) params.set("min", String(f.min));
  if (f.max != null) params.set("max", String(f.max));
  const s = params.toString();
  return s ? `/discover?${s}` : "/discover";
}

function amount(value: string | string[] | undefined): number | null {
  const n = typeof value === "string" ? parseInt(value.replace(/[^\d]/g, ""), 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function describeRange({ min, max }: PriceRange) {
  if (min != null && max != null) return `${formatRand(min)} – ${formatRand(max)}`;
  if (max != null) return `under ${formatRand(max)}`;
  if (min != null) return `over ${formatRand(min)}`;
  return "";
}

async function Results({ searchParams }: Pick<PageProps<"/discover">, "searchParams">) {
  const params = await searchParams;
  const catParam = typeof params.cat === "string" ? params.cat : "";
  const f: Filters = {
    q: typeof params.q === "string" ? params.q.trim() : "",
    cat: (CATEGORIES as readonly string[]).includes(catParam) ? catParam : null,
    min: amount(params.min),
    max: amount(params.max),
  };

  const [catalogue, savedIds] = await Promise.all([getCatalogue(), getSavedIds()]);
  const { query, range, results, overBudget } = searchProducts(catalogue, f.q, f.cat, {
    min: f.min,
    max: f.max,
  });

  const what = [query.words.length ? `“${query.words.join(" ")}”` : "", describeRange(range)]
    .filter(Boolean)
    .join(", ");

  let status = "";
  if (overBudget) status = `Nothing ${what}. Closest options, over your budget:`;
  else if (results.length)
    status = `${results.length} result${results.length > 1 ? "s" : ""}${what ? ` for ${what}` : ""}${f.cat ? ` in ${f.cat}` : ""}`;

  const chip = (current: boolean) =>
    `block whitespace-nowrap rounded-[3px] border px-3.5 py-[7px] text-sm ${
      current ? "btn-grad border-transparent" : "border-line bg-card hover:border-mute"
    }`;
  const fieldClass =
    "w-full min-w-0 rounded-[3px] border border-line bg-card px-2.5 py-2 text-sm placeholder:text-mute";

  // The price ranges plus your own min and max, shown as a side panel or (on phones) folded away.
  const priceFilter = (
    <>
      <ul className="flex flex-wrap gap-2 md:flex-col">
        {PRICE_RANGES.map((r) => {
          const current = r.min === f.min && r.max === f.max;
          return (
            <li key={r.label}>
              <Link
                href={href({ ...f, min: r.min, max: r.max })}
                aria-current={current ? "true" : undefined}
                className={chip(current)}
              >
                {r.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action="/discover" className="mt-4 grid gap-2 border-t border-line pt-4">
        {f.q && <input type="hidden" name="q" value={f.q} />}
        {f.cat && <input type="hidden" name="cat" value={f.cat} />}
        <span className="text-sm text-mute">Your own range (R)</span>
        <div className="flex items-center gap-2">
          <input
            name="min"
            inputMode="numeric"
            defaultValue={f.min ?? ""}
            placeholder="Min"
            aria-label="Minimum price in rand"
            className={fieldClass}
          />
          <span aria-hidden="true" className="text-mute">
            –
          </span>
          <input
            name="max"
            inputMode="numeric"
            defaultValue={f.max ?? ""}
            placeholder="Max"
            aria-label="Maximum price in rand"
            className={fieldClass}
          />
        </div>
        <button
          type="submit"
          className="rounded-[3px] border border-line px-3 py-2 text-sm font-semibold hover:border-mute"
        >
          Apply
        </button>
      </form>
    </>
  );

  return (
    <>
      <form action="/discover" role="search" className="my-4 flex flex-wrap gap-2">
        {f.cat && <input type="hidden" name="cat" value={f.cat} />}
        {f.min != null && <input type="hidden" name="min" value={f.min} />}
        {f.max != null && <input type="hidden" name="max" value={f.max} />}
        <input
          type="search"
          name="q"
          defaultValue={f.q}
          placeholder="Try: air fryer under R1500"
          aria-label="Search products"
          className="min-w-0 flex-1 rounded-[3px] border border-line bg-card px-4 py-[13px] placeholder:text-mute"
        />
        <button type="submit" className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold">
          Search
        </button>
      </form>
      {/* Until Cometcart's own photo search arrives (step 7). */}
      <p className="-mt-1 mb-4 text-sm text-mute">
        <span aria-hidden="true">📷 </span>
        <strong className="font-semibold text-ink">Have a photo?</strong> Use{" "}
        <a href="https://lens.google/" target="_blank" rel="noopener" className="text-acc underline">
          Google Lens<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        on your phone to find the product’s name, then search for it here.
      </p>

      <nav aria-label="Categories" className="mb-5">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {[null, ...CATEGORIES].map((c) => (
            <li key={c ?? "All"} className="flex-none">
              <Link
                href={href({ ...f, cat: c })}
                aria-current={c === f.cat ? "page" : undefined}
                className={chip(c === f.cat)}
              >
                {c ?? "All"}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-6 md:grid-cols-[190px_1fr]">
        <aside aria-labelledby="price-heading" className="hidden self-start rounded-[4px] border border-line bg-card p-4 md:block">
          <h2 id="price-heading" className="mb-3 font-display text-2xl font-semibold">
            Price
          </h2>
          {priceFilter}
        </aside>

        <div className="min-w-0">
          {/* On phones the price filter folds away, so products show without scrolling past it. */}
          <details
            open={f.min != null || f.max != null}
            className="mb-4 rounded-[4px] border border-line bg-card px-4 py-3 md:hidden"
          >
            <summary className="cursor-pointer font-semibold">
              Price{describeRange({ min: f.min, max: f.max }) && `: ${describeRange({ min: f.min, max: f.max })}`}
            </summary>
            <div className="mt-3">{priceFilter}</div>
          </details>
          <p aria-live="polite" className="mb-3 text-sm text-mute">
            {status}
          </p>
          <p className="mb-[18px] text-sm text-mute">
            Try
            {EXAMPLES.map((ex) => (
              <Link key={ex} href={href({ q: ex, cat: null, min: null, max: null })} className="px-1.5 text-acc underline">
                {ex}
              </Link>
            ))}
          </p>

          {results.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} saved={savedIds?.has(p.id) ?? false} />
              ))}
            </div>
          ) : (
            <p className="px-2 py-9 text-mute">
              {catalogue.length === 0
                ? "No products yet. Be the first to add one you’ve found."
                : `No match for ${what || "that"}${f.cat ? ` in ${f.cat}` : ""}. Try another word or a different price range.`}{" "}
              <Link href="/add" className="text-acc underline">
                Add a product
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
