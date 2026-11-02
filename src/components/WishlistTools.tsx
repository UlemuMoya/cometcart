"use client";

import { useActionState, useState } from "react";
import { deleteWishlist, renameWishlist } from "@/lib/wishlist-actions";

const inputClass = "min-w-0 flex-1 rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const ghostClass = "rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute disabled:opacity-60";

export function RenameForm({ wishlistId, name }: { wishlistId: string; name: string }) {
  const [state, action, pending] = useActionState(renameWishlist, {});
  return (
    <form action={action} className="grid max-w-[460px] gap-2">
      <input type="hidden" name="wishlistId" value={wishlistId} />
      <label htmlFor="wishlist-name" className="text-sm text-mute">
        Name
      </label>
      <div className="flex gap-2">
        <input id="wishlist-name" name="name" defaultValue={name} required maxLength={60} className={inputClass} />
        <button type="submit" disabled={pending} className={ghostClass}>
          {pending ? "Saving…" : "Rename"}
        </button>
      </div>
      {(state.error || state.message) && (
        <p role="status" className={`text-sm ${state.error ? "text-[#fda4af]" : "text-warm"}`}>
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          prompt("Copy this link:", url);
        }
      }}
      className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold"
    >
      <span aria-live="polite">{copied ? "Copied ✓" : "Copy link"}</span>
    </button>
  );
}

export function DeleteWishlistButton({ wishlistId }: { wishlistId: string }) {
  return (
    <form
      action={deleteWishlist}
      onSubmit={(e) => {
        if (!confirm("Delete this wishlist and everything saved in it? Share links will stop working.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="wishlistId" value={wishlistId} />
      <button type="submit" className="rounded-[3px] border border-[#7f1d3a] px-[18px] py-3 font-semibold text-[#fda4af] hover:border-[#fda4af]">
        Delete wishlist
      </button>
    </form>
  );
}
