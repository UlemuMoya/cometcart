"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { addProduct, type AddProductState } from "@/lib/product-actions";

const inputClass =
  "rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const labelClass = "grid gap-1 text-sm text-mute";

/** "https://www.takealot.com/..." → "Takealot". Reads only the address, never the page. */
function shopFromLink(raw: string): string {
  try {
    // takealot.com, m.takealot.com and woolworths.co.za all give the brand part.
    const parts = new URL(raw).hostname.split(".");
    const secondLevel = ["co", "com", "org", "net", "ac"].includes(parts.at(-2) ?? "");
    const name = (secondLevel && parts.length >= 3 ? parts.at(-3) : parts.at(-2)) ?? parts[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
  } catch {
    return "";
  }
}

/**
 * Shrinks a photo to at most 1200px and re-saves it as JPEG. This keeps uploads
 * small and drops hidden data such as the GPS location some phones add (POPIA).
 */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function AddProductForm() {
  const [state, action, pending] = useActionState<AddProductState, FormData>(addProduct, {});
  const [shop, setShop] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const shopTouched = useRef(false);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    if (!file) return setPreview(null);
    setPreparing(true);
    try {
      const small = await shrink(file);
      const list = new DataTransfer();
      list.items.add(small);
      input.files = list.files;
      setPreview(URL.createObjectURL(small));
    } catch {
      setPreview(URL.createObjectURL(file)); // couldn't shrink; the server still checks the size
    } finally {
      setPreparing(false);
    }
  }

  return (
    <form action={action} className="grid max-w-[460px] gap-3">
      <label className={labelClass}>
        Product link
        <input
          name="url"
          type="url"
          required
          placeholder="https://"
          className={inputClass}
          onChange={(e) => {
            if (!shopTouched.current) setShop(shopFromLink(e.target.value));
          }}
        />
      </label>
      <label className={labelClass}>
        Name
        <input name="name" required maxLength={120} className={inputClass} />
      </label>
      <label className={labelClass}>
        Shop
        <input
          name="shop"
          required
          maxLength={60}
          value={shop}
          onChange={(e) => {
            shopTouched.current = true;
            setShop(e.target.value);
          }}
          placeholder="e.g. the shop’s name"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Price in rand
        <input name="price" type="number" min={1} step="0.01" inputMode="decimal" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Category
        <select name="category" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Photo (optional)
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPhoto}
          className={`${inputClass} file:mr-3 file:rounded-[3px] file:border-0 file:bg-line file:px-3 file:py-1 file:text-ink`}
        />
      </label>
      {preview && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file */}
          <img src={preview} alt="Preview of your photo" className="max-h-48 w-fit rounded-[4px] object-contain" />
          <label className="flex items-start gap-2 text-sm text-mute">
            <input name="photoRights" type="checkbox" required className="mt-1" />
            I took this photo, or I have the right to use it.
          </label>
        </>
      )}

      {state.error && (
        <p role="alert" className="text-[#fda4af]">
          {state.error}{" "}
          {state.existingHref && (
            <Link href={state.existingHref} className="text-acc underline">
              See that product
            </Link>
          )}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || preparing}
        className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold disabled:opacity-60"
      >
        {pending ? "Adding…" : preparing ? "Preparing photo…" : "Add product"}
      </button>
    </form>
  );
}
