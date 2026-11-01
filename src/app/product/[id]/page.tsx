import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct } from "@/lib/catalogue";
import { formatRand } from "@/lib/format";

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
  const product = UUID.test(id) ? await getProduct(id) : null;
  if (!product || product.offers.length === 0) notFound();

  const offers = product.offers; // already cheapest first
  const several = offers.length > 1;

  return (
    <article className="mt-[26px] grid gap-6 md:grid-cols-[minmax(0,420px)_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-3xl text-white/85">
            {product.category}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <Link href={`/discover?cat=${encodeURIComponent(product.category)}`} className="text-sm text-acc underline">
          {product.category}
        </Link>
        <h1 className="mb-2 mt-1 font-display text-[clamp(28px,5vw,40px)] font-medium leading-[1.1]">
          {product.name}
        </h1>
        <p className="text-[19px] font-bold">
          {several ? "from " : ""}
          {formatRand(offers[0].priceZar)}
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
                  <div className="text-xs text-mute">checked {o.checkedOn}</div>
                </td>
                <td className={`border-b border-line px-2 py-3 ${i === 0 && several ? "font-semibold text-warm" : ""}`}>
                  {formatRand(o.priceZar)}
                  {i === 0 && several && <span className="block text-xs">lowest</span>}
                </td>
                <td className="border-b border-line py-3 pl-2 text-right">
                  <a
                    href={`/go/${o.id}`}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-block rounded-[3px] border border-line px-3 py-2 text-sm hover:border-mute"
                  >
                    Visit shop<span className="sr-only"> {o.shop} (opens in a new tab)</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-mute">
          Prices can change. Always check the price on the shop’s site before you buy.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/wishlist" className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold">
            ♡ Save to wishlist
          </Link>
        </div>

        <h2 className="sec-title !mt-8 !text-2xl">Reviews</h2>
        <p className="text-mute">
          No reviews yet. We only show real reviews, with where they came from.
        </p>
      </div>
    </article>
  );
}
