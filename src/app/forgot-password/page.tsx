import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";

export default function ForgotPasswordPage(props: PageProps<"/forgot-password">) {
  return (
    <section>
      <PageIntro
        title="Forgot your password?"
        intro="Enter your email and we’ll send you a link to choose a new one."
      />
      <Suspense>
        <LinkFailed searchParams={props.searchParams} />
      </Suspense>
      <ForgotPasswordForm />
      <p className="mt-4 text-sm text-mute">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-acc underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}

async function LinkFailed({ searchParams }: Pick<PageProps<"/forgot-password">, "searchParams">) {
  const { link } = await searchParams;
  if (link !== "failed") return null;
  return (
    <p role="alert" className="mb-4 max-w-[460px] text-[#fda4af]">
      That reset link didn’t work. It may have expired, already been used, or been opened on a
      different device. Please ask for a new one.
    </p>
  );
}
