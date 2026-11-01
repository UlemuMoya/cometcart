import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";
import { signOut } from "@/lib/auth-actions";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default function AccountPage() {
  return (
    <section>
      <PageIntro
        title="Your account"
        intro="Tell us your sizes, budget and style if you like. It’s optional and only you can see it."
      />
      <Suspense fallback={<p className="text-mute">Loading your profile…</p>}>
        <Account />
      </Suspense>
    </section>
  );
}

async function Account() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("users")
    .select("name, preferences")
    .eq("id", user.id)
    .maybeSingle();
  const prefs = (row?.preferences ?? {}) as Record<string, string>;

  return (
    <>
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
      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute"
        >
          Sign out
        </button>
      </form>
    </>
  );
}
