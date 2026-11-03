import Link from "next/link";
import { SignUpForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free Cometcart account to save products and share your wishlist.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
  return (
    <section>
      <PageIntro
        title="Create your account"
        intro="Save products from any shop to a wishlist you can share. It’s free."
      />
      <SignUpForm />
      <p className="mt-4 max-w-[460px] text-sm text-mute">
        We only use your email to run your account.
      </p>
      <p className="mt-2 text-sm text-mute">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-acc underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
