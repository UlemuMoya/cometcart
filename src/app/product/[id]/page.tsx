import type { Metadata } from "next";
import Image from "next/image";
import { CategoryTile } from "@/components/CategoryIcon";
import { isOwnPhoto } from "@/lib/photos";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct } from "@/lib/catalogue";
import { ChangePhotoForm } from "@/components/ChangePhotoForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { RemoveFindButton } from "@/components/RemoveFindButton";
import { SaveButton } from "@/components/SaveButton";
import { formatRand, isStale } from "@/lib/format";
import { otherShopLinks } from "@/lib/other-shops";
import { setListed } from "@/lib/product-actions";
import { getCurrentUser, isOwner } from "@/lib/supabase/server";
import { getSavedIds } from "@/lib/wishlist";

// The title and preview shown when a product link is shared, e.g. on WhatsApp.
export async function generateMetadata(props: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = UUID.test(id) ? await getProduct(id) : null;
  if (!product || product.offers.length === 0)
    return { title: "Product not found", robots: { index: false, follow: false } };
  const low = product.offers[0].priceZar;
  const high = product.offers.at(-1)!.priceZar;
  const shops = product.offers.length;
  const description = `${high > low ? `${formatRand(low)} – ${formatRand(high)}` : formatRand(low)} at ${shops} shop${
    shops > 1 ? "s" : ""
  }. Compare prices on Cometcart.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      // Only our own photos: a shop's photo is shown on its product, not reused in previews.
      ...(product.image && isOwnPhoto(product.image) ? { images: [{ url: product.image }] } : {}),
    },
    // A shopper's private product stays out of search engines.
    ...(product.listed ? {} : { robots: { index: false, follow: false } }),
  };
}

export default function ProductPage(props: PageProps<"/product/[id]">) {
  return (
    <Suspense fallback={<p className="mt-[26px] text-mute">Loading product…</p>}>
      <Product params={props.params} />
    </Suspense>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Product({ params }: Pick<PageProps<"/product/[id]">, "params">) {
  const { id } = await params;
  const [product, savedIds] = UUID.test(id) ? await Promise.all([getProduct(id), getSavedIds()]) : [null, null];
  if (!product || product.offers.length === 0) notFound();
  const saved = savedIds?.has(product.id) ?? false;
  // The site owner looks after Discover products; shoppers can change photos on their own private ones.
  const user = savedIds ? await getCurrentUser() : null;
  const owner = !!user && product.listed === true && (await isOwner(user.id));
  const canChangePhoto = owner || (!!user && !product.listed && product.addedBy === user.id);
  const canEdit = canChangePhoto || (!!user && product.offers.some((o) => o.addedBy === user.id));
  // Only while a comparison is still thin (fewer than 3 shops); after that the leftover
  // suggestions are usually shops that don't sell the product.
  const elsewhere =
    product.offers.length < 3 ? otherShopLinks(product.name, product.category, product.offers.map((o) => o.shop)) : [];

  const offers = product.offers; // already cheapest first
  const several = offers.length > 1;

  // Product and price details in the format search engines read (schema.org), only for
  // Discover products, and only with the real prices, shops and dates shown on the page.
  const structuredData = product.listed
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        category: product.category,
        url: `https://www.cometcart.co.za/product/${product.id}`,
        ...(product.image && isOwnPhoto(product.image)
          ? { image: product.image.startsWith("/") ? `https://www.cometcart.co.za${product.image}` : product.image }
          : {}),
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "ZAR",
          lowPrice: offers[0].priceZar.toFixed(2),
          highPrice: offers.at(-1)!.priceZar.toFixed(2),
          offerCount: offers.length,
          offers: offers.map((o) => ({
            "@type": "Offer",
            price: o.priceZar.toFixed(2),
            priceCurrency: "ZAR",
            seller: { "@type": "Organization", name: o.shop },
            ...(o.url ? { url: o.url } : {}),
          })),
        },
      }
    : null;

  return (
    <article className="mt-[26px] grid gap-6 md:grid-cols-[minmax(0,420px)_1fr]">
      {structuredData && (
        <script
          type="application/ld+json"
          // Escape "<" so product names can't break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      )}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized={!isOwnPhoto(product.image)}
            priority
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover"
          />
        ) : (
          <CategoryTile category={product.category} />
        )}
      </div>

      <div className="min-w-0">
        {product.listed ? (
          <Link href={`/discover?cat=${encodeURIComponent(product.category)}`} className="text-sm text-acc underline">
            {product.category}
          </Link>
        ) : (
          <Link href="/wishlist" className="text-sm text-acc underline">
            In your wishlist · only you can see this
          </Link>
        )}
        <h1 className="mb-2 mt-1 font-display text-[clamp(28px,5vw,40px)] font-medium leading-[1.1]">
          {product.name}
        </h1>
        <p className="text-[19px] font-bold">
          {formatRand(offers[0].priceZar)}
          {offers.at(-1)!.priceZar > offers[0].priceZar && (
            <span className="font-semibold text-mute"> – {formatRand(offers.at(-1)!.priceZar)}</span>
          )}
          <span className="ml-2 text-sm font-normal text-mute">
            {offers.length} shop{several ? "s" : ""}
          </span>
        </p>

        <h2 className="sec-title !mt-6 !text-2xl">Compare prices</h2>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-sm text-mute">
              <th scope="col" className="border-b border-line py-2 pr-2 font-normal">Shop</th>
              <th scope="col" className="border-b border-line px-2 py-2 font-normal">Price</th>
              <th scope="col" className="border-b border-line py-2 pl-2 font-normal">
                <span className="sr-only">Link</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o, i) => (
              <tr key={o.id ?? o.shop}>
                <td className="border-b border-line py-3 pr-2">
                  {o.shop}
                  <div className="text-xs text-mute">
                    checked {o.checkedOn}
                    {isStale(o.checkedAt) && <span className="text-[#fcd34d]"> · may have changed</span>}
                  </div>
                </td>
                <td className={`border-b border-line px-2 py-3 ${i === 0 && several ? "font-semibold text-warm" : ""}`}>
                  {formatRand(o.priceZar)}
                  {i === 0 && several && <span className="block text-xs">lowest</span>}
                </td>
                <td className="border-b border-line py-3 pl-2 text-right">
                  {o.url ? (
                    <a
                      href={`/go/${o.id}`}
                      target="_blank"
                      rel="noopener nofollow"
                      className="inline-block rounded-[3px] border border-line px-3 py-2 text-sm hover:border-mute"
                    >
                      Visit shop<span className="sr-only"> {o.shop} (opens in a new tab)</span>
                    </a>
                  ) : (
                    // Added from a photo taken in a shop: no website link.
                    <span className="text-sm text-mute">In store</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-mute">
          Prices can change. Always check the price on the shop’s site before you buy.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {product.listed ? (
            <SaveButton
              productId={product.id}
              saved={saved}
              className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold disabled:opacity-60"
            />
          ) : (
            <RemoveFindButton
              productId={product.id}
              thenGoToWishlist
              className="rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute"
            />
          )}
          <Link
            href={`/add?product=${product.id}`}
            className="rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute"
          >
            + Add another shop’s price
          </Link>
        </div>
        {canEdit && (
          <p className="mt-3 text-sm">
            <Link href={`/product/${product.id}/edit`} className="text-acc underline">
              ✎ Edit name, category, photo or your prices
            </Link>
          </p>
        )}

        {elsewhere.length > 0 && (
          <>
            <h2 className="sec-title !mt-8 !text-2xl">Check other shops</h2>
            <p className="mb-3 text-sm text-mute">
              Searches each shop’s own website for this product. Results depend on the shop, so it may
              show similar items or nothing at all. If you find the same product, copy its link and add the price.
            </p>
            <ul className="flex flex-wrap gap-2">
              {elsewhere.map((shop) => (
                <li key={shop.name}>
                  <a
                    href={shop.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block rounded-[3px] border border-line px-3.5 py-2 text-sm hover:border-mute"
                  >
                    Search {shop.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {canChangePhoto && (
          <div className="mt-6 grid gap-2 border-t border-line pt-4 text-sm text-mute">
            {owner && (
              <span>
                Owner tools for this Discover product (or see them all in{" "}
                <Link href="/manage" className="text-acc underline">
                  Manage Discover
                </Link>
                ):
              </span>
            )}
            <ChangePhotoForm productId={product.id} />
            {owner && (
              <form action={setListed}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="show" value="false" />
                <ConfirmButton message={`Remove “${product.name}” from Discover?`} className="text-acc underline">
                  Remove from Discover
                </ConfirmButton>{" "}
                {product.addedBy === user?.id
                  ? "(it moves back to your wishlist)"
                  : "(no shopper will see it any more)"}
              </form>
            )}
          </div>
        )}

        <h2 className="sec-title !mt-8 !text-2xl">Reviews</h2>
        <p className="text-mute">
          No reviews yet. We only show real reviews, with where they came from.
        </p>
      </div>
    </article>
  );
}
