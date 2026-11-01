import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <section>
      <PageIntro title="Sign in" intro="Welcome back. Your wishlists are waiting." />
      <Suspense>
        <ConfirmFailed searchParams={props.searchParams} />
      </Suspense>
      <SignInForm />
      <p className="mt-4 text-sm text-mute">
        New to Cometcart?{" "}
        <Link href="/sign-up" className="text-acc underline">
          Create an account
        </Link>
      </p>
    </section>
  );
}

async function ConfirmFailed({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const { confirm } = await searchParams;
  if (confirm !== "failed") return null;
  return (
    <p role="alert" className="mb-4 max-w-[460px] text-[#fda4af]">
      That confirmation link didn’t work. It may have expired or already been used. Try signing
      in, or sign up again for a fresh link.
    </p>
  );
}
