import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/lib/catalogue";
import { getSavedIds, getSharedWishlist } from "@/lib/wishlist";

// The preview shown when the link is sent, e.g. on WhatsApp. Shared lists are
// private-by-link, so they're kept out of search engines.
export async function generateMetadata(props: PageProps<"/w/[code]">): Promise<Metadata> {
  const { code } = await props.params;
  const list = await getSharedWishlist(code);
  const title = list ? list.name : "Shared wishlist";
  const description = list
    ? `${list.productIds.length} saved on Cometcart. Tap to see them and compare prices.`
    : "A wishlist shared on Cometcart.";
  return { title, description, openGraph: { title, description }, robots: { index: false, follow: false } };
}

export default function SharedWishlistPage(props: PageProps<"/w/[code]">) {
  return (
    <Suspense fallback={<p className="mt-[26px] text-mute">Loading wishlist…</p>}>
      <SharedWishlist params={props.params} />
    </Suspense>
  );
}

async function SharedWishlist({ params }: Pick<PageProps<"/w/[code]">, "params">) {
  const { code } = await params;
  const list = await getSharedWishlist(code);
  if (!list) notFound();

  const [items, savedIds] = await Promise.all([getProducts(list.productIds), getSavedIds()]);

  return (
    <section>
      <p className="mt-[26px] text-sm text-mute">A wishlist shared with you</p>
      <h1 className="mb-1 font-display text-[clamp(30px,5vw,44px)] font-medium leading-[1.1]">{list.name}</h1>
      <p className="mb-5 text-mute">
        {items.length} saved. Tap Compare to see each product’s price at every shop.
      </p>

      {items.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} saved={savedIds?.has(p.id) ?? false} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-mute">Nothing in this wishlist yet.</p>
      )}

      <p className="mt-8 text-sm text-mute">
        Want your own?{" "}
        <Link href="/discover" className="text-acc underline">
          Find something you love on Cometcart
        </Link>
      </p>
    </section>
  );
}
