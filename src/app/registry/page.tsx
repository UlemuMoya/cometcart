import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageIntro } from "@/components/PageIntro";
import { RegistryDetailsForm } from "@/components/RegistryForms";
import { formatEventDate, getMyRegistries, OCCASIONS } from "@/lib/registry";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Gift registries",
  description: "Create a gift registry from any shop for a wedding, baby, birthday or new home, and share one link with guests.",
  robots: { index: false, follow: true },
};

export default function RegistriesPage() {
  return (
    <section>
      <PageIntro
        title="Gift registries"
        intro="One list for your wedding, baby, birthday or new home, with gifts from any shop. Guests tap “I’ll get this” so nobody buys the same thing twice."
      />
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <Registries />
      </Suspense>
    </section>
  );
}

async function Registries() {
  const user = await getCurrentUser();
  if (!user)
    return (
      <div className="max-w-[460px] rounded-[4px] border border-line bg-card p-4">
        <p>Sign in to create a gift registry. It’s free.</p>
        <p className="mt-3 flex gap-4">
          <Link href="/sign-in?next=/registry" className="text-acc underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="text-acc underline">
            Create an account
          </Link>
        </p>
      </div>
    );

  const registries = await getMyRegistries();
  return (
    <>
      {registries.length > 0 && (
        <>
          <h2 className="sec-title !mt-0 !text-2xl">Your registries</h2>
          <ul className="mb-8 grid gap-2.5">
            {registries.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/registry/${r.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-[4px] border border-line bg-card px-4 py-3 hover:border-mute"
                >
                  <span className="font-semibold">🎁 {r.name}</span>
                  <span className="text-sm text-mute">
                    {r.occasion ? OCCASIONS[r.occasion] : "Registry"}
                    {r.eventDate ? ` · ${formatEventDate(r.eventDate)}` : ""} · {r.giftCount} gift
                    {r.giftCount === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className={`sec-title !text-2xl ${registries.length ? "" : "!mt-0"}`}>Create a registry</h2>
      <RegistryDetailsForm />
    </>
  );
}
