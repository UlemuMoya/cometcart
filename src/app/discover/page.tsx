import Link from "next/link";
import { Suspense } from "react";
import { PageIntro } from "@/components/PageIntro";
import { PhotoButton } from "@/components/PhotoButton";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogue } from "@/lib/catalogue";
import { CATEGORIES } from "@/lib/categories";
import { formatRand } from "@/lib/format";
import { searchProducts } from "@/lib/search";

const EXAMPLES = ["handbag under R1500", "linen bedding", "sneakers under R1000"];

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

function href(q: string, cat: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cat) params.set("cat", cat);
  const s = params.toString();
  return s ? `/discover?${s}` : "/discover";
}

async function Results({ searchParams }: Pick<PageProps<"/discover">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const catParam = typeof params.cat === "string" ? params.cat : "";
  const cat = (CATEGORIES as readonly string[]).includes(catParam) ? catParam : null;

  const catalogue = await getCatalogue();
  const { query, results, overBudget } = searchProducts(catalogue, q, cat);

  const what = [
    query.words.length ? `“${query.words.join(" ")}”` : "",
    query.maxPrice ? `under ${formatRand(query.maxPrice)}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  let status = "";
  if (overBudget) status = `Nothing ${what}. Closest options, over your budget:`;
  else if (results.length)
    status = `${results.length} result${results.length > 1 ? "s" : ""}${what ? ` for ${what}` : ""}${cat ? ` in ${cat}` : ""}`;

  return (
    <>
      <form action="/discover" role="search" className="my-4 flex flex-wrap gap-2">
        {cat && <input type="hidden" name="cat" value={cat} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Try: black handbag under R1500"
          aria-label="Search products"
          className="min-w-0 flex-1 rounded-[3px] border border-line bg-card px-4 py-[13px] placeholder:text-mute"
        />
        <button type="submit" className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold">
          Search
        </button>
        <PhotoButton />
      </form>

      <nav aria-label="Categories" className="mb-2">
        <ul className="flex flex-wrap gap-2">
          {[null, ...CATEGORIES].map((c) => {
            const current = c === cat;
            return (
              <li key={c ?? "All"}>
                <Link
                  href={href(q, c)}
                  aria-current={current ? "page" : undefined}
                  className={`block rounded-[3px] border px-3.5 py-[7px] text-sm ${
                    current ? "btn-grad border-transparent" : "border-line bg-card hover:border-mute"
                  }`}
                >
                  {c ?? "All"}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p aria-live="polite" className="mb-3 text-sm text-mute">
        {status}
      </p>
      <p className="mb-[18px] text-sm text-mute">
        Try
        {EXAMPLES.map((ex) => (
          <Link key={ex} href={href(ex, null)} className="px-1.5 text-acc underline">
            {ex}
          </Link>
        ))}
      </p>

      {results.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="px-2 py-9 text-mute">
          {catalogue.length === 0
            ? "No products yet. Be the first to add one you’ve found."
            : `No match for ${what || "that"}${cat ? ` in ${cat}` : ""}. Try another word or a higher budget.`}{" "}
          <Link href="/add" className="text-acc underline">
            Add a product
          </Link>
        </p>
      )}
    </>
  );
}
