"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleSave } from "@/lib/wishlist-actions";

/** "♡ Save to wishlist" that saves or unsaves in place. Signed-out people are sent to sign in first. */
export function SaveButton({
  productId,
  saved: initial,
  short = false,
  className,
}: {
  productId: string;
  saved: boolean;
  /** "♡ Save" instead of "♡ Save to wishlist", for narrow product cards. */
  short?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onClick() {
    setError("");
    setSaved(!saved); // show the change straight away
    start(async () => {
      const result = await toggleSave(productId);
      if ("signIn" in result) {
        setSaved(saved);
        router.push(`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`);
      } else if ("error" in result) {
        setSaved(saved);
        setError(result.error);
      } else {
        setSaved(result.saved);
      }
    });
  }

  return (
    <>
      <button type="button" aria-pressed={saved} disabled={pending} onClick={onClick} className={className}>
        {saved ? "♥ Saved" : "♡ Save"}
        <span className={short ? "sr-only" : undefined}> to wishlist</span>
      </button>
      {error && (
        <span role="alert" className="basis-full text-sm text-[#fda4af]">
          {error}
        </span>
      )}
    </>
  );
}
