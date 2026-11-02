import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { PageIntro } from "@/components/PageIntro";
import { ProductCard } from "@/components/ProductCard";
import { CopyLinkButton, DeleteWishlistButton, RenameForm } from "@/components/WishlistTools";
import { getMyFinds, getProducts } from "@/lib/catalogue";
import type { Product } from "@/lib/types";
import { getMyWishlist } from "@/lib/wishlist";
import { newShareLink, setPublic } from "@/lib/wishlist-actions";

export default function WishlistPage() {
  return (
    <section>
      <PageIntro
        title="Your wishlist"
        intro="Products from any shop, in one place: ones you’ve saved from Discover and ones you’ve added from shop links."
      />
      <Suspense fallback={<p className="text-mute">Loading your wishlist…</p>}>
        <MyWishlist />
      </Suspense>
    </section>
  );
}

const ghostClass = "rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute";

function ItemGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} saved />
      ))}
    </div>
  );
}

async function MyWishlist() {
  const list = await getMyWishlist();
  if (list === undefined)
    return (
      <div className="max-w-[460px] rounded-[4px] border border-line bg-card p-4">
        <p>Sign in to save products and share your wishlist.</p>
        <p className="mt-3 flex gap-4">
          <Link href="/sign-in?next=/wishlist" className="text-acc underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="text-acc underline">
            Create an account
          </Link>
        </p>
      </div>
    );

  // Products saved from Discover, plus products you added from shop links (only you see those).
  const [saved, finds] = await Promise.all([getProducts(list?.productIds ?? []), getMyFinds()]);
  const items = [...finds, ...saved.filter((p) => p.listed)];

  if (!items.length)
    return (
      <p className="py-6 text-mute">
        Nothing saved yet. Tap “♡ Save” on any product in{" "}
        <Link href="/discover" className="text-acc underline">
          Discover
        </Link>
        , or{" "}
        <Link href="/add" className="text-acc underline">
          paste a link from any shop
        </Link>
        , and it appears here.
      </p>
    );

  if (!list)
    return (
      <>
        <ItemGrid items={items} />
        <p className="mt-6 text-mute">Save a product from Discover to get a link you can share.</p>
      </>
    );

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const shareUrl = `${origin}/w/${list.shareCode}`;
  const shareText = `${list.name} on Cometcart: ${shareUrl}`;

  return (
    <>
      <h2 className="mb-3 font-display text-3xl font-medium">{list.name}</h2>
      <p className="mb-4 text-sm text-mute">
        {items.length} saved · {list.isPublic ? "Public" : "Private"}
      </p>
      <ItemGrid items={items} />

      <h2 className="sec-title">Share it</h2>
      <p className="mb-3 max-w-[560px] text-mute">
        Anyone you send this link to can see your list, but can’t change it. Items marked “Only you can
        see this” stay private.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={shareUrl}
          aria-label="Share link"
          className="min-w-0 flex-1 basis-[260px] rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink"
        />
        <CopyLinkButton url={shareUrl} />
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener"
          className={ghostClass}
        >
          WhatsApp<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(list.name)}&body=${encodeURIComponent(shareText)}`} className={ghostClass}>
          Email
        </a>
      </div>
      <form action={newShareLink} className="mt-3">
        <input type="hidden" name="wishlistId" value={list.id} />
        <button type="submit" className="text-sm text-acc underline">
          Stop old links working (make a new link)
        </button>
      </form>

      <h2 className="sec-title">Settings</h2>
      <div className="grid gap-6">
        <RenameForm wishlistId={list.id} name={list.name} />

        <form action={setPublic} className="grid max-w-[560px] gap-2">
          <input type="hidden" name="wishlistId" value={list.id} />
          <input type="hidden" name="public" value={String(!list.isPublic)} />
          <p>
            <strong>{list.isPublic ? "Public" : "Private"}.</strong>{" "}
            <span className="text-mute">
              {list.isPublic
                ? "Anyone on Cometcart may see it, even without the link."
                : "Only you, and people you send the link to, can see it."}
            </span>
          </p>
          <button type="submit" className={`${ghostClass} w-fit`}>
            {list.isPublic ? "Make it private" : "Make it public"}
          </button>
        </form>

        <DeleteWishlistButton wishlistId={list.id} />
      </div>
    </>
  );
}
