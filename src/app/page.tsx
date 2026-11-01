import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { INSPIRATION, TRENDING } from "@/data/placeholder";

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
              href={`/discover?q=${encodeURIComponent(tile.category.toLowerCase())}`}
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

      <h2 className="sec-title">Trending finds</h2>
      <div className="flex gap-3.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {TRENDING.map((p) => (
          <div key={p.id} className="w-[230px] flex-none">
            <ProductCard product={p} badge={`Sample · ${p.category}`} />
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[13px] text-mute">
        These are sample products to show the layout. Real trending finds come once shops are
        connected.
      </p>

      <h2 className="sec-title">Your collections</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-line bg-card p-4">
        <div>
          <strong>My wishlist</strong>
          <div className="text-sm text-mute">0 saved</div>
        </div>
        <span className="text-[15px] text-mute">Save something and it appears here</span>
        <Link
          href="/wishlist"
          className="rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute"
        >
          Open
        </Link>
      </div>
      <p className="mt-2 text-sm text-mute">
        Registries and shared collections come in the full app.
      </p>
    </>
  );
}
