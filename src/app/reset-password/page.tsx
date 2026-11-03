import Link from "next/link";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

// The reset link in the email signs the person in, then brings them here.
export default function ResetPasswordPage() {
  return (
    <section>
      <PageIntro title="Choose a new password" intro="Pick something you haven’t used here before." />
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <Reset />
      </Suspense>
    </section>
  );
}

async function Reset() {
  const user = await getCurrentUser();
  if (!user)
    return (
      <p className="max-w-[460px] text-mute">
        This page needs the link from your reset email.{" "}
        <Link href="/forgot-password" className="text-acc underline">
          Ask for a new link
        </Link>
      </p>
    );
  return <NewPasswordForm />;
}
