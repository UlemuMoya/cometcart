import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/placeholder";
import { formatRand, lowestOffer } from "@/lib/format";

type Props = {
  product: Product;
  badge?: string;
};

export function ProductCard({ product, badge }: Props) {
  const best = lowestOffer(product.offers);
  const shops = product.offers.length;

  return (
    <article className="lift relative flex h-full flex-col overflow-hidden rounded-[4px] border border-[rgba(140,170,255,.14)] bg-card">
      {badge && (
        <span className="absolute left-2 top-2 z-10 rounded-[3px] bg-[linear-gradient(120deg,#0b7f68,#4a3fd0)] px-2 py-[3px] text-xs text-white">
          {badge}
        </span>
      )}
      <div className="relative aspect-[4/3] bg-line">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="230px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
        <h3 className="min-h-[2.6em] font-semibold">{product.name}</h3>
        <span className="text-sm text-mute">
          {product.category} · {shops} shop{shops > 1 ? "s" : ""}
        </span>
        <span className="text-[19px] font-bold">
          {shops > 1 ? "from " : ""}
          {formatRand(best.priceZar)}
        </span>
        <span className="text-xs text-mute">
          at {best.shop} · checked {best.checkedOn}
        </span>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link
            href="/discover"
            className="flex-1 rounded-[3px] border border-line p-2 text-center hover:border-mute"
          >
            Compare
          </Link>
          <Link
            href="/wishlist"
            className="flex-1 rounded-[3px] border border-line p-2 text-center hover:border-mute"
          >
            ♡ Save to wishlist
          </Link>
        </div>
      </div>
    </article>
  );
}
