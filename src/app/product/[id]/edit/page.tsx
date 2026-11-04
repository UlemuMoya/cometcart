import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ChangePhotoForm } from "@/components/ChangePhotoForm";
import { DetailsForm, PriceForm } from "@/components/EditProductForms";
import { PageIntro } from "@/components/PageIntro";
import { getProduct } from "@/lib/catalogue";
import { getCurrentUser, isOwner } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit product", robots: { index: false, follow: false } };

export default function EditProductPage(props: PageProps<"/product/[id]/edit">) {
  return (
    <section>
      <PageIntro title="Edit product" intro="Fix a name, category or photo, or update the prices you added." />
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <Edit params={props.params} />
      </Suspense>
    </section>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Edit({ params }: Pick<PageProps<"/product/[id]/edit">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=/product/${id}/edit`);
  const product = UUID.test(id) ? await getProduct(id) : null;
  if (!product) notFound();

  // Details: your own private product, or (site owner) a Discover product. Prices: the ones you added.
  const canEditDetails = product.listed ? await isOwner(user.id) : product.addedBy === user.id;
  const myPrices = product.offers.filter((o) => o.addedBy === user.id && o.id);
  if (!canEditDetails && !myPrices.length) notFound();

  return (
    <>
      <p className="mb-5">
        <Link href={`/product/${product.id}`} className="text-acc underline">
          ← Back to {product.name}
        </Link>
      </p>

      {canEditDetails && (
        <>
          <h2 className="sec-title !mt-0 !text-2xl">Details</h2>
          <DetailsForm
            productId={product.id}
            name={product.name}
            category={product.category}
            similarItems={product.similarItems === true}
          />
          <div className="mt-4">
            <ChangePhotoForm productId={product.id} />
          </div>
        </>
      )}

      {myPrices.length > 0 && (
        <>
          <h2 className="sec-title !text-2xl">Your prices</h2>
          <p className="mb-3 max-w-[560px] text-sm text-mute">
            Saving a price marks it as checked today, so only save after checking it on the shop’s site.
          </p>
          <div className="grid max-w-[560px] gap-2.5">
            {myPrices.map((o) => (
              <PriceForm
                key={o.id}
                productId={product.id}
                offerId={o.id!}
                shop={o.shop}
                priceZar={o.priceZar}
                checkedOn={o.checkedOn}
                canRemove={product.offers.length > 1}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
