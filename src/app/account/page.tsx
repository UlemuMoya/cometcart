import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DeleteAccountForm, ProfileForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";
import { signOut } from "@/lib/auth-actions";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default function AccountPage(props: PageProps<"/account">) {
  return (
    <section>
      <PageIntro
        title="Your account"
        intro="Tell us your sizes, budget and style if you like. It’s optional and only you can see it."
      />
      <Suspense fallback={<p className="text-mute">Loading your profile…</p>}>
        <Account searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

const ghostClass = "rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute";

async function Account({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { password } = await searchParams;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("users")
    .select("name, preferences")
    .eq("id", user.id)
    .maybeSingle();
  const prefs = (row?.preferences ?? {}) as Record<string, string>;

  return (
    <>
      {password === "changed" && (
        <p role="status" className="mb-4 text-warm">
          Your new password is saved.
        </p>
      )}
      <p className="mb-4 text-mute">
        Signed in as <strong className="text-ink">{user.email}</strong>
      </p>
      <ProfileForm
        profile={{
          name: row?.name ?? "",
          sizes: prefs.sizes ?? "",
          budget: prefs.budget ?? "",
          style: prefs.style ?? "",
        }}
      />
      <div className="mt-6 flex flex-wrap gap-2">
        <form action={signOut}>
          <button type="submit" className={ghostClass}>
            Sign out
          </button>
        </form>
        <Link href="/reset-password" className={ghostClass}>
          Change password
        </Link>
      </div>

      <h2 className="sec-title">Delete your account</h2>
      <div className="max-w-[560px] text-mute">
        <p>This can’t be undone. We delete:</p>
        <ul className="my-2 list-disc pl-5">
          <li>your sign-in and profile (email, name, sizes, budget, style)</li>
          <li>your wishlist, and its share link stops working</li>
          <li>your finds, including any photos you uploaded</li>
        </ul>
        <p className="mb-4">
          Shop prices you added to products in Discover stay, so other shoppers can still compare,
          but they’re no longer linked to you.
        </p>
      </div>
      <DeleteAccountForm />
    </>
  );
}
