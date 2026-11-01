import Link from "next/link";
import { Suspense } from "react";
import { AddProductForm } from "@/components/AddProductForm";
import { PageIntro } from "@/components/PageIntro";
import { getCurrentUser } from "@/lib/supabase/server";

export default function AddProductPage() {
  return (
    <section>
      <PageIntro
        title="Add a product"
        intro="Paste a link from any shop and fill in what you see. It joins the search results."
      />
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <AddOrSignIn />
      </Suspense>
    </section>
  );
}

async function AddOrSignIn() {
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
  return <AddProductForm />;
}
