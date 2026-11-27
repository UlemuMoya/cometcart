import type { Metadata } from "next";
import Image from "next/image";
import { CategoryTile, categoryWash } from "@/components/CategoryIcon";
import { ShopBadge } from "@/components/ShopBadge";
import { isOwnPhoto } from "@/lib/photos";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct } from "@/lib/catalogue";
import { ChangePhotoForm } from "@/components/ChangePhotoForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { RemoveFindButton } from "@/components/RemoveFindButton";
import { SaveButton } from "@/components/SaveButton";
import { ShareButtons } from "@/components/ShareButtons";
import { formatRand, isStale, shopLabel } from "@/lib/format";
import { otherShopLinks } from "@/lib/other-shops";
import { setListed } from "@/lib/product-actions";
import { getCurrentUser, isOwner } from "@/lib/supabase/server";
import { AddToRegistryForm } from "@/components/RegistryForms";
import { getMyRegistries } from "@/lib/registry";
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
  const registries = user ? await getMyRegistries() : [];
  // Only while a product has a single shop, to help find a second price; after that the leftover
  // suggestions are usually shops that don't sell the product.
  const elsewhere =
    product.offers.length < 2 ? otherShopLinks(product.name, product.category, product.offers.map((o) => o.shop)) : [];

  const offers = product.offers; // already cheapest first
  const several = offers.length > 1;
  const cheapest = offers[0].priceZar;
  // Only mark a "lowest" price when some shop really charges more.
  const priceDiffers = offers.at(-1)!.priceZar > cheapest;
  // Similar items at each shop, not the identical product: say so, and call it "cheapest", not "lowest".
  const similar = several && product.similarItems === true;
  const saving = offers.at(-1)!.priceZar - cheapest;
  const best = offers.find((o) => o.url) ?? null;

  // Product and price details in the format search engines read (schema.org), only for
  // Discover products, and only with the real prices, shops and dates shown on the page.
  const structuredData = product.listed && !similar
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
      <div className="relative aspect-[4/3] overflow-hidden rounded-[10px]" style={{ background: categoryWash(product.category) }}>
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
        <p className="text-sm text-mute">
          {several && !priceDiffers
            ? `Same price at all ${offers.length} shops`
            : `${offers.length} shop${several ? "s" : ""}`}
        </p>

        {/* The answer first: where it's cheapest and how much shopping around saves. */}
        <div className="mt-4 max-w-[560px] rounded-[10px] border border-[#2a4a9a] bg-[linear-gradient(120deg,rgba(11,127,104,.35),rgba(74,63,208,.35))] p-4">
          <div className="text-[13px] font-semibold tracking-[.02em] text-[#c9f5ec]">
            {similar ? "CHEAPEST" : several && priceDiffers ? "BEST PRICE" : "PRICE"}
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-[34px] font-bold leading-tight">{formatRand(cheapest)}</span>
            <span className="text-[#dcd6ff]">at {shopLabel(offers[0].shop).name}</span>
          </div>
          {priceDiffers && !similar && (
            <div className="mt-1 text-sm font-semibold text-warm">
              {formatRand(saving)} less than the most expensive shop
            </div>
          )}
        </div>
        {similar && (
          <p className="mt-3 max-w-[560px] rounded-[4px] border border-line bg-card px-4 py-3 text-sm">
            <strong className="font-semibold">Similar items.</strong>{" "}
            <span className="text-mute">
              Each shop sells its own version, not the identical product. Check the details on the shop’s site before you buy.
            </span>
          </p>
        )}

        <h2 className="sec-title !mt-6 !text-2xl">Compare shops</h2>
        <ul className="overflow-hidden rounded-[10px] border border-line bg-card">
          {offers.map((o, i) => {
            const label = shopLabel(o.shop);
            const stale = isStale(o.checkedAt);
            const isLow = priceDiffers && o.priceZar === cheapest;
            return (
              <li key={o.id ?? o.shop} className={`flex flex-wrap items-center gap-3 p-3.5 ${i ? "border-t border-line" : ""}`}>
                <ShopBadge name={label.name} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{label.name}</div>
                  {label.note && <div className="text-xs text-mute">{label.note}</div>}
                  <div className="flex items-center gap-1.5 text-xs text-mute">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2 w-2 rounded-full ${stale ? "bg-[#fbbf24]" : "bg-[#34d399]"}`}
                    />
                    checked {o.checkedOn}
                    {stale && <span className="text-[#fcd34d]"> · may have changed</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${isLow ? "text-warm" : ""}`}>{formatRand(o.priceZar)}</div>
                  {priceDiffers && (
                    <div className="text-xs font-semibold text-mute">
                      {isLow ? <span className="text-warm">{similar ? "cheapest" : "lowest"}</span> : `+${formatRand(o.priceZar - cheapest)}`}
                    </div>
                  )}
                </div>
                {o.url ? (
                  <a
                    href={`/go/${o.id}`}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-flex min-h-[44px] items-center rounded-[6px] border border-line px-3 text-sm hover:border-mute"
                  >
                    Visit<span className="sr-only"> {label.name} (opens in a new tab)</span>
                  </a>
                ) : (
                  // Added from a photo taken in a shop: no website link.
                  <span className="text-sm text-mute">In store</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-mute">
          Prices can change. Always check the price on the shop’s site before you buy.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {product.listed ? (
            <SaveButton
              productId={product.id}
              saved={saved}
              className="btn-grad rounded-[6px] px-[18px] py-3 font-semibold disabled:opacity-60"
            />
          ) : (
            <RemoveFindButton
              productId={product.id}
              thenGoToWishlist
              className="rounded-[6px] border border-line px-[18px] py-3 font-semibold hover:border-mute"
            />
          )}
        </div>

        {/* Sharing and gifting tucked into one menu, so the page leads with the prices. */}
        {(product.listed || user) && (
          <details className="mt-4 max-w-[560px] rounded-[6px] border border-line bg-card">
            <summary className="flex min-h-[44px] cursor-pointer items-center px-4 font-semibold">Share or gift</summary>
            <div className="grid gap-3 border-t border-line p-4">
              {product.listed && (
                <ShareButtons
                  url={`https://www.cometcart.co.za/product/${product.id}`}
                  title={product.name}
                  text={`${product.name}: ${formatRand(cheapest)}${
                    priceDiffers ? ` – ${formatRand(offers.at(-1)!.priceZar)}` : ""
                  }${several ? ` at ${offers.length} shops` : ` at ${offers[0].shop}`} on Cometcart.`}
                />
              )}
              {user &&
                (registries.length ? (
                  <AddToRegistryForm productId={product.id} registries={registries.map((r) => ({ id: r.id, name: r.name }))} />
                ) : (
                  <p className="text-sm text-mute">
                    🎁 Planning a wedding, baby shower or birthday?{" "}
                    <Link href="/registry" className="text-acc underline">
                      Create a gift registry
                    </Link>
                  </p>
                ))}
            </div>
          </details>
        )}

        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href={`/add?product=${product.id}`} className="text-acc underline">
            + Add another shop’s price
          </Link>
          {canEdit && (
            <Link href={`/product/${product.id}/edit`} className="text-acc underline">
              ✎ Edit name, category, photo or your prices
            </Link>
          )}
        </p>

        {user && elsewhere.length > 0 && (
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
      {/* Phones: best price and the shop button stay within thumb reach, above the bottom tabs. */}
      {best && (
        <>
          <div aria-hidden="true" className="h-20 md:hidden" />
          <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 border-t border-line bg-[rgba(8,16,52,.97)] px-4 py-3 md:hidden">
            <div className="flex-none">
              <div className="text-xs text-mute">{best.priceZar === cheapest ? (similar ? "Cheapest" : "Best price") : "Price"}</div>
              <div className="text-xl font-bold">{formatRand(best.priceZar)}</div>
            </div>
            <a
              href={`/go/${best.id}`}
              target="_blank"
              rel="noopener nofollow"
              className="btn-grad flex min-h-[48px] flex-1 items-center justify-center rounded-[10px] font-bold"
            >
              Visit {shopLabel(best.shop).name}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </>
      )}
    </article>
  );
}
