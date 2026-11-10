import Image from "next/image";
import { BlackFridayNote } from "@/components/BlackFridayNote";
import { CategoryFlipTiles } from "@/components/CategoryFlipTiles";
import { CategoryTile } from "@/components/CategoryIcon";
import { isOwnPhoto } from "@/lib/photos";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
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
      <section className="mast-sky mb-3.5 mt-[22px] rounded-[6px] px-6 py-[30px]">
        <h1 className="mb-2.5 mt-1.5 font-display text-[clamp(38px,7vw,64px)] font-medium leading-none">
          Find anything. Compare every price. Save what you love.
        </h1>
        <p className="max-w-[640px] text-[#dcd6ff]">
          Search any product in your own words, compare prices from different shops side by side, and keep a wishlist
          you can share.
        </p>
      </section>

      <SearchBar placeholder="Search anything" />

      <SectionHead title="Shop by category" />
      <CategoryFlipTiles />

      <Suspense
        fallback={
          <>
            <SectionHead title="Trending finds" />
            <p className="text-mute">Loading…</p>
          </>
        }
      >
        <Finds />
      </Suspense>

      <h2 className="sec-title !mt-12">Your collections</h2>
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <Collections />
      </Suspense>
    </>
  );
}

/** A section heading with a "See all" link on the right, as in the phone design. */
function SectionHead({ title, href = "/discover" }: { title: string; href?: string }) {
  return (
    <div className="mt-12 flex items-end justify-between gap-4">
      <h2 className="sec-title !mb-3.5 !mt-0 flex-1">{title}</h2>
      <Link href={href} className="mb-3.5 py-2.5 text-sm text-warm hover:underline">
        See all<span className="sr-only"> {title.toLowerCase()}</span>
      </Link>
    </div>
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
    <ProductCard key={p.id} product={p} badge={badge} saved={wishlist === undefined ? false : saved.has(p.id)} />
  );

  return (
    <>
      <SectionHead title={trending.length ? "Trending finds" : "New in Discover"} />
      <section className="rounded-[6px] border border-[rgba(140,170,255,.14)] bg-[#0a1440] px-3.5 pb-4 pt-3.5 md:px-4">
        <p className="mb-3.5 text-sm text-mute">
          {trending.length
            ? "Most saved and visited in the last 30 days, and new in Discover"
            : "The latest products added to Discover"}
          <BlackFridayNote />
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {trending.map((p) => card(p, "Trending"))}
          {fresh.map((p) => card(p, trending.length ? "New" : undefined))}
        </div>
      </section>
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
