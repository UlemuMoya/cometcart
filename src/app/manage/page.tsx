import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChangePhotoForm } from "@/components/ChangePhotoForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageIntro } from "@/components/PageIntro";
import { getCatalogue } from "@/lib/catalogue";
import { formatRand } from "@/lib/format";
import { setListed } from "@/lib/product-actions";
import { getCurrentUser, isOwner } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Manage Discover", robots: { index: false, follow: false } };

// Site owner only: every Discover product in one list, to change photos or take products out.
export default function ManagePage() {
  return (
    <section>
      <PageIntro
        title="Manage Discover"
        intro="Owner only. Every product shoppers see in Discover. To add one, use Add a product and tick “Put it in Discover”."
      />
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <Manage />
      </Suspense>
    </section>
  );
}

async function Manage() {
  const user = await getCurrentUser();
  if (!user || !(await isOwner(user.id))) notFound();
  const products = await getCatalogue();

  return (
    <>
      <p className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/add" className="btn-grad inline-block rounded-[3px] px-[18px] py-3 font-semibold">
          + Add a product
        </Link>
        <span className="text-sm text-mute">{products.length} products in Discover</span>
      </p>
      <ul className="grid gap-2.5">
        {products.map((p) => (
          <li key={p.id} className="flex flex-wrap items-start gap-3 rounded-[4px] border border-line bg-card p-3">
            {p.image ? (
              <Image src={p.image} alt="" width={64} height={64} className="h-16 w-16 flex-none rounded-[3px] object-cover" />
            ) : (
              <span className="h-16 w-16 flex-none rounded-[3px] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]" />
            )}
            <div className="min-w-0 flex-1 basis-[200px]">
              <Link href={p.href ?? "#"} className="font-semibold hover:underline">
                {p.name}
              </Link>
              <div className="text-sm text-mute">
                {p.category} · {p.offers.length} shop{p.offers.length > 1 ? "s" : ""} · from {formatRand(p.offers[0].priceZar)}
                {p.addedBy === user.id ? "" : " · sample"}
              </div>
              <div className="mt-1.5">
                <ChangePhotoForm productId={p.id} />
              </div>
            </div>
            <form action={setListed}>
              <input type="hidden" name="productId" value={p.id} />
              <input type="hidden" name="show" value="false" />
              <input type="hidden" name="then" value="stay" />
              <ConfirmButton
                message={
                  p.addedBy === user.id
                    ? `Remove “${p.name}” from Discover? It moves back to your wishlist.`
                    : `Remove “${p.name}” from Discover? No shopper will see it any more.`
                }
                className="rounded-[3px] border border-line px-3.5 py-2 text-sm font-semibold hover:border-mute"
              >
                Remove
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
