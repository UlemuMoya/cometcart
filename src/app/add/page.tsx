import Link from "next/link";
import { Suspense } from "react";
import { AddProductForm } from "@/components/AddProductForm";
import { PageIntro } from "@/components/PageIntro";
import { getProduct } from "@/lib/catalogue";
import { formatRand } from "@/lib/format";
import { getCurrentUser } from "@/lib/supabase/server";

export default function AddProductPage(props: PageProps<"/add">) {
  return (
    <section>
      <PageIntro
        title="Add a product"
        intro="Found something at a shop? Paste its link. If it’s in Discover, its price joins the comparison. If not, it’s kept in My finds, just for you."
      />
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <AddOrSignIn searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function AddOrSignIn({ searchParams }: Pick<PageProps<"/add">, "searchParams">) {
  const user = await getCurrentUser();
  if (!user)
    return (
      <div className="max-w-[460px] rounded-[4px] border border-line bg-card p-4">
        <p>Sign in to add a product. It only takes a moment, and it means you can edit what you add.</p>
        <p className="mt-3 flex gap-4">
          <Link href="/sign-in" className="text-acc underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="text-acc underline">
            Create an account
          </Link>
        </p>
      </div>
    );

  // Opened from a product page's "Add another shop's price".
  const { product: productParam } = await searchParams;
  const id = typeof productParam === "string" && UUID.test(productParam) ? productParam : null;
  const product = id ? await getProduct(id) : null;
  const forProduct =
    product && product.offers.length
      ? {
          id: product.id,
          name: product.name,
          image: product.image ?? null,
          summary: `from ${formatRand(product.offers[0].priceZar)} · ${product.offers.length} shop${product.offers.length > 1 ? "s" : ""}`,
        }
      : undefined;

  return <AddProductForm key={forProduct?.id ?? "new"} forProduct={forProduct} />;
}
