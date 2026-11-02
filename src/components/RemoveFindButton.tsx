"use client";

import { removeFind } from "@/lib/product-actions";

/** For products you added from a link: removing one from your wishlist deletes it. */
export function RemoveFindButton({
  productId,
  thenGoToWishlist = false,
  className,
}: {
  productId: string;
  thenGoToWishlist?: boolean;
  className?: string;
}) {
  return (
    <form
      action={removeFind}
      onSubmit={(e) => {
        if (!confirm("Remove this from your wishlist? You added it from a shop link, so it will be deleted.")) e.preventDefault();
      }}
      className="contents"
    >
      <input type="hidden" name="productId" value={productId} />
      {thenGoToWishlist && <input type="hidden" name="then" value="wishlist" />}
      <button type="submit" className={className}>
        Remove<span className={thenGoToWishlist ? undefined : "sr-only"}> from wishlist</span>
      </button>
    </form>
  );
}
