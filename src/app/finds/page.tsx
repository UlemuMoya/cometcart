import Link from "next/link";
import { Suspense } from "react";
import { PageIntro } from "@/components/PageIntro";
import { ProductCard } from "@/components/ProductCard";
import { getMyFinds } from "@/lib/catalogue";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSavedIds } from "@/lib/wishlist";

export default function FindsPage() {
  return (
    <section>
      <PageIntro
        title="My finds"
        intro="Products you’ve added from shop links. Only you can see them. Add another shop’s link to any of them to compare prices."
      />
      <Suspense fallback={<p className="text-mute">Loading your finds…</p>}>
        <MyFinds />
      </Suspense>
    </section>
  );
}

async function MyFinds() {
  const user = await getCurrentUser();
  if (!user)
    return (
      <div className="max-w-[460px] rounded-[4px] border border-line bg-card p-4">
        <p>Sign in to keep products you find at any shop.</p>
        <p className="mt-3 flex gap-4">
          <Link href="/sign-in?next=/finds" className="text-acc underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="text-acc underline">
            Create an account
          </Link>
        </p>
      </div>
    );

  const [finds, savedIds] = await Promise.all([getMyFinds(), getSavedIds()]);
  return (
    <>
      <p className="mb-4">
        <Link href="/add" className="btn-grad inline-block rounded-[3px] px-[18px] py-3 font-semibold">
          + Add a product link
        </Link>
      </p>
      {finds.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
          {finds.map((p) => (
            <ProductCard key={p.id} product={p} saved={savedIds?.has(p.id) ?? false} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-mute">
          Nothing here yet. Paste a product link from any shop and it’s kept here, just for you.
        </p>
      )}
    </>
  );
}
