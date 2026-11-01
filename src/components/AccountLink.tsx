import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";

const linkClass =
  "block rounded-[3px] border border-line bg-card px-3.5 py-[7px] hover:border-mute";

/** "Sign in" for visitors, "Account" for signed-in people. */
export async function AccountLink() {
  const user = await getCurrentUser();
  return (
    <Link href={user ? "/account" : "/sign-in"} className={linkClass}>
      {user ? "Account" : "Sign in"}
    </Link>
  );
}

export function AccountLinkFallback() {
  return (
    <Link href="/sign-in" className={linkClass}>
      Sign in
    </Link>
  );
}
