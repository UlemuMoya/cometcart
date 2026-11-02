import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { INSPIRATION } from "@/data/inspiration";
import { getCatalogue, getMyFinds, getProducts, getTrending } from "@/lib/catalogue";
import type { Product } from "@/lib/types";
import { getMyWishlist } from "@/lib/wishlist";

export default function Home() {
  return (
    <>
      <section className="mast mb-3.5 mt-[22px] rounded-[6px] px-6 py-[30px]">
        <h1 className="mb-2 mt-1.5 font-display text-[clamp(38px,7vw,64px)] font-medium leading-none">
          Find anything. Compare every price. Save what you love.
        </h1>
        <p className="text-[#dcd6ff]">
          Describe it or snap a photo. Cometcart finds it across South African shops, compares
          prices, and keeps your wishlist ready to share.
        </p>
      </section>

      <SearchBar />

      <h2 className="sec-title">Inspiration</h2>
      <ul className="grid auto-rows-[120px] grid-cols-2 gap-2.5 min-[561px]:grid-cols-4">
        {INSPIRATION.map((tile) => (
          <li key={tile.category}>
            <Link
              href={`/discover?cat=${encodeURIComponent(tile.category)}`}
              className="relative flex h-full items-end overflow-hidden rounded-[4px] p-3 text-white"
            >
              <Image
                src={tile.image}
                alt={tile.alt}
                fill
                sizes="(max-width: 560px) 50vw, 240px"
                className="object-cover"
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
            <h2 className="sec-title">Trending finds</h2>
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
      <p className="mt-2 text-sm text-mute">Registries and shared collections come in the full app.</p>
    </>
  );
}

/** Trending once people are saving and visiting products; until then, the newest in Discover. */
async function Finds() {
  const [catalogue, wishlist] = await Promise.all([getCatalogue(), getMyWishlist()]);
  const trending = await getTrending(catalogue);
  const isTrending = trending.length >= 3;
  const products = isTrending ? trending : catalogue.slice(0, 8);
  if (!products.length) return null;
  const saved = new Set(wishlist?.productIds ?? []);

  return (
    <>
      <h2 className="sec-title">{isTrending ? "Trending finds" : "New in Discover"}</h2>
      <div className="flex gap-3.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {products.map((p) => (
          <div key={p.id} className="w-[230px] flex-none">
            <ProductCard product={p} saved={wishlist === undefined ? false : saved.has(p.id)} />
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[13px] text-mute">
        {isTrending
          ? "The most saved and visited products on Cometcart in the last 30 days."
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
          <Image key={p.id} src={p.image} alt="" width={40} height={40} className="h-10 w-10 rounded-[3px] object-cover" />
        ) : (
          <span key={p.id} className="h-10 w-10 rounded-[3px] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]" />
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

  const [saved, finds] = await Promise.all([getProducts(wishlist?.productIds ?? []), getMyFinds()]);
  return (
    <div className="grid gap-2.5">
      <div className={boxClass}>
        <div>
          <strong>{wishlist?.name ?? "My wishlist"}</strong>
          <div className="text-sm text-mute">{saved.length} saved</div>
        </div>
        {saved.length ? (
          <Thumbs products={saved} />
        ) : (
          <span className="text-[15px] text-mute">Save something and it appears here</span>
        )}
        <Link href="/wishlist" className={openClass}>
          Open<span className="sr-only"> your wishlist</span>
        </Link>
      </div>
      <div className={boxClass}>
        <div>
          <strong>My finds</strong>
          <div className="text-sm text-mute">
            {finds.length} added from shop links · only you can see these
          </div>
        </div>
        {finds.length ? (
          <Thumbs products={finds} />
        ) : (
          <span className="text-[15px] text-mute">Paste a link from any shop to keep it here</span>
        )}
        <Link href="/finds" className={openClass}>
          Open<span className="sr-only"> My finds</span>
        </Link>
      </div>
    </div>
  );
}
