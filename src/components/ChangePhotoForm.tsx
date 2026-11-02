"use client";

import { useActionState, useState } from "react";
import { changePhoto, type AddProductState } from "@/lib/product-actions";
import { shrinkInputPhoto } from "@/lib/shrink-photo";

const fileClass =
  "rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink file:mr-3 file:rounded-[3px] file:border-0 file:bg-line file:px-3 file:py-1 file:text-ink";

/** "Change photo", folded away until opened. */
export function ChangePhotoForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<AddProductState, FormData>(changePhoto, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-acc underline">Change photo</summary>
      <form action={action} className="mt-3 grid max-w-[420px] gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          aria-label="New photo"
          onChange={async (e) => {
            if (preview) URL.revokeObjectURL(preview);
            setPreparing(true);
            setPreview(await shrinkInputPhoto(e.currentTarget));
            setPreparing(false);
          }}
          className={fileClass}
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
          <img src={preview} alt="Preview of the new photo" className="max-h-40 w-fit rounded-[4px] object-contain" />
        )}
        <label className="flex items-start gap-2 text-mute">
          <input name="photoRights" type="checkbox" required className="mt-1" />
          I took this photo, or I have the right to use it.
        </label>
        {state.error && (
          <p role="alert" className="text-[#fda4af]">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || preparing}
          className="w-fit rounded-[3px] border border-line px-[18px] py-2.5 font-semibold hover:border-mute disabled:opacity-60"
        >
          {pending ? "Saving…" : preparing ? "Preparing photo…" : "Save photo"}
        </button>
      </form>
    </details>
  );
}
