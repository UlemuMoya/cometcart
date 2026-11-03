import Image from "next/image";
import { isOwnPhoto } from "@/lib/photos";
import Link from "next/link";
import { formatRand, isStale, lowestOffer } from "@/lib/format";
import type { Product } from "@/lib/types";
import { RemoveFindButton } from "./RemoveFindButton";
import { SaveButton } from "./SaveButton";

type Props = {
  product: Product;
  badge?: string;
  /** Whether it's in the visitor's wishlist. */
  saved: boolean;
};

export function ProductCard({ product, badge, saved }: Props) {
  const best = lowestOffer(product.offers);
  const shops = product.offers.length;
  const highest = Math.max(...product.offers.map((o) => o.priceZar));
  // Added by the visitor from a shop link: it lives only in their wishlist.
  const ownFind = product.listed === false;
  badge ??= ownFind ? "Only you can see this" : undefined;

  return (
    <article className="lift relative flex h-full flex-col overflow-hidden rounded-[4px] border border-[rgba(140,170,255,.14)] bg-card">
      {badge && (
        <span className="absolute left-2 top-2 z-10 rounded-[3px] bg-[linear-gradient(120deg,#0b7f68,#4a3fd0)] px-2 py-[3px] text-xs text-white">
          {badge}
        </span>
      )}
      <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized={!isOwnPhoto(product.image)}
            sizes="(max-width: 560px) 100vw, 240px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-4 text-center font-display text-2xl text-white/85">
            {product.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
        <h3 className="min-h-[2.6em] font-semibold">{product.name}</h3>
        <span className="text-sm text-mute">
          {product.category} · {shops} shop{shops > 1 ? "s" : ""}
        </span>
        {/* Lowest to highest across shops, so the comparison shows at a glance. */}
        <span className="text-[19px] font-bold">
          {formatRand(best.priceZar)}
          {highest > best.priceZar && <span className="font-semibold text-mute"> – {formatRand(highest)}</span>}
        </span>
        <span className="text-xs text-mute">
          {shops > 1 ? "Lowest at " : "At "}
          {best.shop} · checked {best.checkedOn}
          {isStale(best.checkedAt) && <span className="text-[#fcd34d]"> · may have changed</span>}
        </span>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link
            href={product.href ?? "/discover"}
            className="flex-1 rounded-[3px] border border-line p-2 text-center hover:border-mute"
          >
            Compare
          </Link>
          {ownFind ? (
            <RemoveFindButton
              productId={product.id}
              className="flex-1 rounded-[3px] border border-line p-2 text-center hover:border-mute"
            />
          ) : (
            <SaveButton
              productId={product.id}
              saved={saved}
              short
              className={`flex-1 rounded-[3px] border p-2 text-center ${
                saved ? "border-warm text-warm" : "border-line hover:border-mute"
              }`}
            />
          )}
        </div>
      </div>
    </article>
  );
}
