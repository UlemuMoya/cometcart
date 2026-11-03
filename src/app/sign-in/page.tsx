import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Cometcart to see your wishlist.",
};

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <section>
      <PageIntro title="Sign in" intro="Welcome back. Your wishlists are waiting." />
      <Suspense fallback={<SignInForm />}>
        <SignIn searchParams={props.searchParams} />
      </Suspense>
      <p className="mt-4 text-sm">
        <Link href="/forgot-password" className="text-acc underline">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-mute">
        New to Cometcart?{" "}
        <Link href="/sign-up" className="text-acc underline">
          Create an account
        </Link>
      </p>
    </section>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const { confirm, next } = await searchParams;
  return (
    <>
      {confirm === "failed" && (
        <p role="alert" className="mb-4 max-w-[460px] text-[#fda4af]">
          That confirmation link didn’t work. It may have expired or already been used. Try signing
          in, or sign up again for a fresh link.
        </p>
      )}
      {typeof next === "string" && next !== "/wishlist" && (
        <p className="mb-4 max-w-[460px] text-mute">Sign in to save to your wishlist. You’ll come straight back.</p>
      )}
      <SignInForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
