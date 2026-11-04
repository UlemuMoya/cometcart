import Image from "next/image";
import { CategoryTile } from "@/components/CategoryIcon";
import { isOwnPhoto } from "@/lib/photos";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { INSPIRATION } from "@/data/inspiration";
import { getCatalogue, getMyFinds, getProducts, getTrending } from "@/lib/catalogue";
import type { Product } from "@/lib/types";
import { getMyRegistries } from "@/lib/registry";
import { getMyWishlist } from "@/lib/wishlist";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home(props: PageProps<"/">) {
  return (
    <>
      <Suspense>
        <AccountDeleted searchParams={props.searchParams} />
      </Suspense>
      <section className="mast mb-3.5 mt-[22px] rounded-[6px] px-6 py-[30px]">
        <h1 className="mb-2 mt-1.5 font-display text-[clamp(38px,7vw,64px)] font-medium leading-none">
          Find anything. Compare every price. Save what you love.
        </h1>
        <p className="text-[#dcd6ff]">
          Search any product in your own words, compare prices from different shops side by side,
          and keep a wishlist you can share.
        </p>
      </section>

      <SearchBar />

      <h2 className="sec-title">What you can do</h2>
      <ul className="grid gap-2.5 min-[561px]:grid-cols-2 md:grid-cols-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="rounded-[4px] border border-line bg-card px-4 py-3.5">
            <h3 className="mb-1 font-semibold">
              {f.href ? (
                <Link href={f.href} className="hover:underline">
                  {f.title}
                </Link>
              ) : (
                f.title
              )}
            </h3>
            <p className="text-[15px] text-mute">{f.text}</p>
          </li>
        ))}
      </ul>

      <h2 className="sec-title">Inspiration</h2>
      <ul className="grid grid-cols-2 gap-2.5 min-[561px]:grid-cols-4">
        {INSPIRATION.map((tile) => (
          <li key={tile.category}>
            <Link
              href={`/discover?cat=${encodeURIComponent(tile.category)}`}
              className="relative flex aspect-[3/2] items-end overflow-hidden rounded-[4px] p-3 text-white"
            >
              <Image
                src={tile.image}
                alt={tile.alt}
                fill
                sizes="(max-width: 560px) 50vw, 240px"
                className="object-cover"
                style={{ objectPosition: tile.focus ?? "50% 50%" }}
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,11,36,.8),rgba(5,11,36,0)_60%)]"
              />
              <span className="relative font-display text-2xl font-semibold [text-shadow:0_1px_6px_rgba(0,0,0,.35)]">
                {tile.category}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Suspense
        fallback={
          <>
            <h2 className="sec-title">Trending and new</h2>
            <p className="text-mute">Loading…</p>
          </>
        }
      >
        <Finds />
      </Suspense>

      <h2 className="sec-title">Your collections</h2>
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <Collections />
      </Suspense>
    </>
  );
}

// What Cometcart does, for first-time visitors.
const FEATURES: { title: string; text: string; href?: string }[] = [
  {
    title: "Search in plain words",
    text: "Type a product, a category or a budget, like “air fryer”, “shoes” or “headphones under R1000”.",
    href: "/discover",
  },
  {
    title: "Compare prices",
    text: "See the same product at different shops, cheapest first, each with the date the price was checked.",
    href: "/discover",
  },
  {
    title: "Save, share and gift",
    text: "Save to your wishlist, or create a gift registry for a wedding, baby or birthday (free account). Share it on WhatsApp or with a link.",
    href: "/wishlist",
  },
  {
    title: "Paste a link from any shop",
    text: "Seen something in another shop? Paste its link to save it to your wishlist. If we have it, you’ll see how the price compares.",
    href: "/add",
  },
];

async function AccountDeleted({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { account } = await searchParams;
  if (account !== "deleted") return null;
  return (
    <p role="status" className="mt-5 rounded-[4px] border border-line bg-card p-3 text-warm">
      Your account and personal data have been deleted. Thanks for trying Cometcart.
    </p>
  );
}

/**
 * Trending products first (once at least 3 have saves or clicks), then the newest in Discover,
 * marked "New", so products nobody has clicked yet still appear. Up to 8 in all.
 */
async function Finds() {
  const [catalogue, wishlist] = await Promise.all([getCatalogue(), getMyWishlist()]);
  const found = await getTrending(catalogue);
  const trending = found.length >= 3 ? found.slice(0, 8) : [];
  const fresh = catalogue.filter((p) => !trending.includes(p)).slice(0, 8 - trending.length);
  if (!trending.length && !fresh.length) return null;
  const saved = new Set(wishlist?.productIds ?? []);
  const card = (p: (typeof catalogue)[number], badge?: string) => (
    <div key={p.id} className="w-[230px] flex-none">
      <ProductCard product={p} badge={badge} saved={wishlist === undefined ? false : saved.has(p.id)} />
    </div>
  );

  return (
    <>
      <h2 className="sec-title">{trending.length ? "Trending and new" : "New in Discover"}</h2>
      <div className="flex gap-3.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {trending.map((p) => card(p, "Trending"))}
        {fresh.map((p) => card(p, trending.length ? "New" : undefined))}
      </div>
      <p className="mt-1.5 text-[13px] text-mute">
        {trending.length
          ? "Trending: most saved and visited in the last 30 days. New: just added to Discover."
          : "The latest products added to Discover."}{" "}
        <Link href="/discover" className="text-acc underline">
          See everything
        </Link>
      </p>
    </>
  );
}

function Thumbs({ products }: { products: Product[] }) {
  return (
    <span className="flex gap-1.5" aria-hidden="true">
      {products.slice(0, 5).map((p) =>
        p.image ? (
          <Image key={p.id} src={p.image} unoptimized={!isOwnPhoto(p.image)} alt="" width={40} height={40} className="h-10 w-10 rounded-[3px] object-cover" />
        ) : (
          <span key={p.id} className="grid h-10 w-10 place-items-center rounded-[3px] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]">
            <CategoryTile category={p.category} size="small" />
          </span>
        ),
      )}
    </span>
  );
}

const openClass = "rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute";
const boxClass = "flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-line bg-card p-4";

async function Collections() {
  const wishlist = await getMyWishlist();
  if (wishlist === undefined)
    return (
      <div className={boxClass}>
        <div>
          <strong>My wishlist</strong>
          <div className="text-sm text-mute">Sign in to save products and share your list.</div>
        </div>
        <Link href="/sign-in?next=/" className={openClass}>
          Sign in
        </Link>
      </div>
    );

  // Same as the Wishlist page: products added from shop links, then ones saved from Discover.
  const [saved, finds, registries] = await Promise.all([
    getProducts(wishlist?.productIds ?? []),
    getMyFinds(),
    getMyRegistries(),
  ]);
  const items = [...finds, ...saved.filter((p) => p.listed)];
  return (
    <div className="grid gap-2.5">
      <div className={boxClass}>
        <div>
          <strong>{wishlist?.name ?? "My wishlist"}</strong>
          <div className="text-sm text-mute">{items.length} saved</div>
        </div>
        {items.length ? (
          <Thumbs products={items} />
        ) : (
          <span className="text-[15px] text-mute">Save something and it appears here</span>
        )}
        <Link href="/wishlist" className={openClass}>
          Open<span className="sr-only"> your wishlist</span>
        </Link>
      </div>
      <div className={boxClass}>
        <div>
          <strong>🎁 Gift registries</strong>
          <div className="text-sm text-mute">
            {registries.length
              ? registries.map((r) => r.name).slice(0, 2).join(", ") + (registries.length > 2 ? ` and ${registries.length - 2} more` : "")
              : "For a wedding, baby, birthday or new home"}
          </div>
        </div>
        <Link href="/registry" className={openClass}>
          {registries.length ? "Open" : "Create one"}
          <span className="sr-only"> gift registries</span>
        </Link>
      </div>
    </div>
  );
}
