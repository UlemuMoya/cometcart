import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryTile } from "@/components/CategoryIcon";
import { ProductCard } from "@/components/ProductCard";
import { GuestGiftButton } from "@/components/RegistryForms";
import { ShareButtons } from "@/components/ShareButtons";
import { getProducts } from "@/lib/catalogue";
import { formatRand } from "@/lib/format";
import { isOwnPhoto } from "@/lib/photos";
import { formatEventDate, getRegistryByCode, OCCASIONS, type RegistryGift } from "@/lib/registry";
import { getSavedIds, getSharedWishlist } from "@/lib/wishlist";

// The preview shown when the link is sent, e.g. on WhatsApp. Shared lists and registries
// are private-by-link, so they're kept out of search engines.
export async function generateMetadata(props: PageProps<"/w/[code]">): Promise<Metadata> {
  const { code } = await props.params;
  const registry = await getRegistryByCode(code);
  const list = registry ? null : await getSharedWishlist(code);
  const title = registry ? `🎁 ${registry.name}` : list ? list.name : "Shared wishlist";
  const description = registry
    ? `Gift registry${registry.eventDate ? ` for ${formatEventDate(registry.eventDate)}` : ""}. Choose a gift and tap “I’ll get this” so nobody doubles up.`
    : list
      ? `${list.productIds.length} saved on Cometcart. Tap to see them and compare prices.`
      : "A wishlist shared on Cometcart.";
  return { title, description, openGraph: { title, description }, robots: { index: false, follow: false } };
}

export default function SharedListPage(props: PageProps<"/w/[code]">) {
  return (
    <Suspense fallback={<p className="mt-[26px] text-mute">Loading…</p>}>
      <SharedList params={props.params} />
    </Suspense>
  );
}

async function SharedList({ params }: Pick<PageProps<"/w/[code]">, "params">) {
  const { code } = await params;
  const registry = await getRegistryByCode(code);
  if (registry) return <RegistryView code={code} registry={registry} />;

  const list = await getSharedWishlist(code);
  if (!list) notFound();
  const [items, savedIds] = await Promise.all([getProducts(list.productIds), getSavedIds()]);

  return (
    <section>
      <p className="mt-[26px] text-sm text-mute">A wishlist shared with you</p>
      <h1 className="mb-1 font-display text-[clamp(30px,5vw,44px)] font-medium leading-[1.1]">{list.name}</h1>
      <p className="mb-3 text-mute">
        {items.length} saved. Tap Compare to see each product’s price at every shop.
      </p>
      <div className="mb-5">
        <ShareButtons url={`https://www.cometcart.co.za/w/${code}`} title={list.name} text={`${list.name} on Cometcart:`} />
      </div>

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

function RegistryView({ code, registry }: { code: string; registry: NonNullable<Awaited<ReturnType<typeof getRegistryByCode>>> }) {
  const open = registry.gifts.filter((g) => !g.taken).length;
  return (
    <section>
      <p className="mt-[26px] text-sm text-mute">
        🎁 Gift registry{registry.occasion ? ` · ${OCCASIONS[registry.occasion]}` : ""}
      </p>
      <h1 className="mb-1 font-display text-[clamp(30px,5vw,44px)] font-medium leading-[1.1]">{registry.name}</h1>
      {registry.eventDate && <p className="text-[17px]">{formatEventDate(registry.eventDate)}</p>}
      {registry.message && (
        <p className="mt-3 max-w-[640px] whitespace-pre-line rounded-[4px] border border-line bg-card px-4 py-3 text-[#dcd6ff]">
          {registry.message}
        </p>
      )}
      <p className="mb-5 mt-4 max-w-[640px] text-sm text-mute">
        {registry.gifts.length} gift{registry.gifts.length === 1 ? "" : "s"}, {open} still available. Choose one, tap{" "}
        <strong className="text-ink">I’ll get this</strong> so nobody doubles up, then buy it from the shop.
      </p>
      <div className="mb-5">
        <ShareButtons
          url={`https://www.cometcart.co.za/w/${code}`}
          title={registry.name}
          text={`${registry.name}: gift registry on Cometcart.`}
        />
      </div>

      {registry.gifts.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5">
          {registry.gifts.map((g) => (
            <GiftCard key={g.id} code={code} gift={g} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-mute">No gifts added yet. Check back soon.</p>
      )}

      <p className="mt-8 text-sm text-mute">
        Planning your own celebration?{" "}
        <Link href="/registry" className="text-acc underline">
          Create a free gift registry on Cometcart
        </Link>
      </p>
    </section>
  );
}

function GiftCard({ code, gift }: { code: string; gift: RegistryGift }) {
  const best = gift.offers[0];
  const high = gift.offers.at(-1)!.priceZar;
  // Discover products go through the "Visit shop" counter; products added from a link go straight to the shop.
  const shopHref = gift.listed && best.id ? `/go/${best.id}` : best.url;
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-[4px] border border-[rgba(140,170,255,.14)] bg-card ${gift.taken ? "opacity-70" : ""}`}
    >
      <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]">
        {gift.image ? (
          <Image
            src={gift.image}
            alt={gift.name}
            fill
            unoptimized={!isOwnPhoto(gift.image)}
            sizes="(max-width: 560px) 100vw, 240px"
            className="object-cover"
          />
        ) : (
          <CategoryTile category={gift.category} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
        <h2 className="font-semibold">{gift.name}</h2>
        <span className="text-[19px] font-bold">
          {formatRand(best.priceZar)}
          {high > best.priceZar && <span className="font-semibold text-mute"> – {formatRand(high)}</span>}
        </span>
        <span className="text-xs text-mute">
          {gift.offers.length > 1 ? "Lowest at " : "At "}
          {best.shop} · checked {best.checkedOn}
        </span>
        <div className="mt-auto grid gap-2 pt-2">
          {shopHref && (
            <a
              href={shopHref}
              target="_blank"
              rel="noopener nofollow"
              className="rounded-[3px] border border-line p-2 text-center text-sm hover:border-mute"
            >
              Visit {best.shop}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <GuestGiftButton code={code} productId={gift.id} taken={gift.taken} />
        </div>
      </div>
    </article>
  );
}
