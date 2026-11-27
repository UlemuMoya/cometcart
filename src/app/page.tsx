import Image from "next/image";
import { CategoryFlipTiles } from "@/components/CategoryFlipTiles";
import { CategoryTile, categoryWash } from "@/components/CategoryIcon";
import { formatRand, shopLabel } from "@/lib/format";
import { isOwnPhoto } from "@/lib/photos";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { HOME_INSPIRATION, INSPIRATION } from "@/data/inspiration";
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

      <Suspense
        fallback={
          <>
            <h2 className="sec-title">Biggest savings today</h2>
            <div className="h-[230px] animate-pulse rounded-[10px] bg-card motion-reduce:animate-none" />
          </>
        }
      >
        <Savings />
      </Suspense>

      <Suspense>
        <Inspiration />
      </Suspense>

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

      <h2 className="sec-title">Shop by budget</h2>
      <p className="mb-3 text-[15px] text-mute">Tap a category to pick a price range.</p>
      <CategoryFlipTiles />

      <h2 className="sec-title">Your collections</h2>
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <Collections />
      </Suspense>
    </>
  );
}

/**
 * Products where shopping around saves the most: the gap between the dearest and cheapest shop.
 * Only identical products (not "similar items"), so the saving is real.
 */
async function Savings() {
  const catalogue = await getCatalogue();
  const deals = catalogue
    .filter((p) => p.offers.length > 1 && !p.similarItems)
    .map((p) => ({ p, best: p.offers[0], save: p.offers.at(-1)!.priceZar - p.offers[0].priceZar }))
    .filter((d) => d.save >= 20)
    .sort((x, y) => y.save - x.save)
    .slice(0, 8);
  if (!deals.length) return null;
  return (
    <>
      <h2 className="sec-title">Biggest savings today</h2>
      <p className="-mt-2 mb-3 text-sm text-mute">Where comparing shops saves you the most.</p>
      <ul className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {deals.map(({ p, best, save }) => (
          <li key={p.id} className="w-[180px] flex-none">
            <Link
              href={p.href ?? "/discover"}
              className="lift flex h-full flex-col overflow-hidden rounded-[10px] border border-line bg-card"
            >
              <span className="relative block h-[104px]" style={{ background: categoryWash(p.category) }}>
                {p.image ? (
                  <Image src={p.image} unoptimized={!isOwnPhoto(p.image)} alt="" fill sizes="180px" className="object-cover" />
                ) : (
                  <CategoryTile category={p.category} />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-warm px-2 py-[3px] text-xs font-bold text-[#04211b]">
                  Save {formatRand(save)}
                </span>
              </span>
              <span className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                <span className="line-clamp-2 min-h-[2.6em] text-sm font-medium">{p.name}</span>
                <span className="mt-1 text-lg font-bold">{formatRand(best.priceZar)}</span>
                <span className="text-xs text-mute">at {shopLabel(best.shop).name} · checked {best.checkedOn}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Inspiration tiles, only for categories that have products in Discover, so no tile
 * leads to an empty page. The usual 8 picks come first, then any other category with products.
 */
async function Inspiration() {
  const catalogue = await getCatalogue();
  const stocked = new Set(catalogue.map((p) => p.category));
  const picks = HOME_INSPIRATION.filter((t) => stocked.has(t.category));
  const extra = INSPIRATION.filter((t) => stocked.has(t.category) && !picks.includes(t));
  const tiles = [...picks, ...extra].slice(0, 8);
  if (!tiles.length) return null;
  return (
    <>
      <h2 className="sec-title">Inspiration</h2>
      <ul className="grid grid-cols-2 gap-2.5 min-[561px]:grid-cols-4">
        {tiles.map((tile) => (
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
    </>
  );
}

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
