"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { guessCategory, guessFromLink } from "@/lib/link-guess";
import { addProduct, type AddProductState } from "@/lib/product-actions";

const inputClass =
  "rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const labelClass = "grid gap-1 text-sm text-mute";
const fileClass = `${inputClass} file:mr-3 file:rounded-[3px] file:border-0 file:bg-line file:px-3 file:py-1 file:text-ink`;

type Mode = "link" | "photo";

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
  const [mode, setMode] = useState<Mode>("link");
  const [hasLink, setHasLink] = useState(false);
  const [shop, setShop] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  // Once someone edits a field themselves, a new guess no longer overwrites it.
  const edited = useRef({ shop: false, name: false, category: false });
  const priceRef = useRef<HTMLInputElement>(null);

  function choose(next: Mode) {
    if (next === mode) return;
    setMode(next);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setHasLink(false);
  }

  function onLink(value: string) {
    const guess = guessFromLink(value);
    const firstTime = !hasLink && guess != null;
    setHasLink(guess != null);
    if (!guess) return;
    if (!edited.current.shop) setShop(guess.shop);
    if (!edited.current.name) setName(guess.name);
    if (!edited.current.category) setCategory(guess.category);
    // Price is the one thing a link can't tell us, so go straight there.
    if (firstTime) setTimeout(() => priceRef.current?.focus(), 0);
  }

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
      if (mode === "photo") setTimeout(() => priceRef.current?.focus(), 0);
    }
  }

  const ready = mode === "link" ? hasLink : preview != null;

  const photoInput = (
    <input
      name="photo"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      capture={mode === "photo" ? "environment" : undefined}
      required={mode === "photo"}
      onChange={onPhoto}
      className={fileClass}
    />
  );
  const photoPreview = preview && (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file */}
      <img src={preview} alt="Preview of your photo" className="max-h-48 w-fit rounded-[4px] object-contain" />
      <label className="flex items-start gap-2 text-sm text-mute">
        <input name="photoRights" type="checkbox" required className="mt-1" />
        I took this photo, or I have the right to use it.
      </label>
    </>
  );

  return (
    <form action={action} className="grid max-w-[460px] gap-3">
      <input type="hidden" name="mode" value={mode} />

      <div role="radiogroup" aria-label="How do you want to add it?" className="grid grid-cols-2 gap-2">
        {(
          [
            ["link", "🔗 Paste a link", "From a shop’s website"],
            ["photo", "📷 Add a photo", "Seen it in a shop"],
          ] as const
        ).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => choose(value)}
            className={`rounded-[3px] border px-3 py-3 text-left ${
              mode === value ? "btn-grad border-transparent" : "border-line bg-card hover:border-mute"
            }`}
          >
            <span className="block font-semibold">{label}</span>
            <span className={`block text-xs ${mode === value ? "text-white/80" : "text-mute"}`}>{hint}</span>
          </button>
        ))}
      </div>

      {mode === "link" ? (
        <>
          <label className={labelClass}>
            <span className="text-base text-ink">Paste the product link</span>
            <input
              key="url"
              name="url"
              type="url"
              required
              autoFocus
              placeholder="https://"
              onChange={(e) => onLink(e.target.value)}
              className={`${inputClass} py-[13px] text-base`}
            />
          </label>
          {!hasLink && (
            <p className="text-sm text-mute">
              Copy the link from the shop’s product page and paste it here. We’ll fill in what we can from it.
            </p>
          )}
        </>
      ) : (
        <>
          <label className={labelClass}>
            <span className="text-base text-ink">Take or choose a photo</span>
            {photoInput}
          </label>
          {photoPreview}
          {!preview && (
            <>
              <p className="text-sm text-mute">
                Snap the product, or the shelf label with its price. No link needed.
              </p>
              <p className="rounded-[4px] border border-line p-3 text-sm text-mute">
                <strong className="text-ink">Tip:</strong> want the online shop link instead? Open{" "}
                <strong className="text-ink">Google Lens</strong> (in the Google app or your phone’s camera), point
                it at the product, open the shop’s page it finds, copy the link, then choose{" "}
                <button type="button" onClick={() => choose("link")} className="text-acc underline">
                  Paste a link
                </button>
                .
              </p>
            </>
          )}
        </>
      )}

      <div hidden={!ready} className="grid gap-3">
        <label className={labelClass}>
          <span className="text-base text-ink">Price in rand</span>
          <input
            ref={priceRef}
            name="price"
            type="number"
            min={1}
            step="0.01"
            inputMode="decimal"
            required
            placeholder="e.g. 1299"
            className={`${inputClass} py-[13px] text-base`}
          />
        </label>

        <fieldset className="grid gap-3 rounded-[4px] border border-line p-3">
          <legend className="px-1 text-sm text-mute">
            {mode === "link"
              ? "Filled in from the link. Change anything that’s wrong."
              : "What is it, and where did you see it?"}
          </legend>
          <label className={labelClass}>
            Name
            <input
              name="name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => {
                edited.current.name = true;
                setName(e.target.value);
                if (!edited.current.category) setCategory(guessCategory(e.target.value));
              }}
              placeholder="What is it?"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Shop
            <input
              name="shop"
              required
              maxLength={60}
              value={shop}
              onChange={(e) => {
                edited.current.shop = true;
                setShop(e.target.value);
              }}
              placeholder={mode === "photo" ? "Which shop? e.g. Woolworths Sandton" : "Shop name"}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Category
            <select
              name="category"
              required
              value={category}
              onChange={(e) => {
                edited.current.category = true;
                setCategory(e.target.value);
              }}
              className={inputClass}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </fieldset>

        {mode === "link" && (
          <>
            <label className={labelClass}>
              Photo (optional)
              {photoInput}
            </label>
            {photoPreview}
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
      </div>
    </form>
  );
}
