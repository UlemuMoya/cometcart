"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/categories";
import { guessCategory, guessFromLink, resolveShopLink } from "@/lib/link-guess";
import { addProduct, findMatches, type AddProductState, type ProductMatch } from "@/lib/product-actions";

const inputClass =
  "rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const labelClass = "grid gap-1 text-sm text-mute";
const fileClass = `${inputClass} file:mr-3 file:rounded-[3px] file:border-0 file:bg-line file:px-3 file:py-1 file:text-ink`;

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

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- tiny thumbnail in a list
    <img src={src} alt={alt} className="h-12 w-12 flex-none rounded-[3px] object-cover" />
  ) : (
    <span className="h-12 w-12 flex-none rounded-[3px] bg-[linear-gradient(135deg,#0b5f4a,#2f2480_60%,#6b2470)]" />
  );
}

/** `forProduct`: opened from a product page to add another shop's price to it. */
export function AddProductForm({ forProduct }: { forProduct?: ProductMatch }) {
  const [state, action, pending] = useActionState<AddProductState, FormData>(addProduct, {});
  const [checking, startCheck] = useTransition();
  const [, startSave] = useTransition();
  // Kept in state so a guess from the link can fill them in.
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [shop, setShop] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [hasLink, setHasLink] = useState(false);
  const [linkNote, setLinkNote] = useState<{ problem: boolean; text: string } | null>(null);
  const [matches, setMatches] = useState<ProductMatch[] | null>(null);
  const [sameLink, setSameLink] = useState<ProductMatch | null>(null);
  // Which product this price is for: a match's id, "new", or "" (not chosen yet).
  const [choice, setChoice] = useState(forProduct?.id ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  // Once someone edits a field themselves, a new guess no longer overwrites it.
  const edited = useRef({ shop: false, name: false, category: false });
  const lastLookup = useRef("");
  const priceRef = useRef<HTMLInputElement>(null);

  function onLink(value: string) {
    const link = resolveShopLink(value);
    if (link?.ok && link.unwrapped) {
      // A Google or social link with the shop's link inside: use the shop's.
      setUrl(link.url);
      setLinkNote({ problem: false, text: "We’ve swapped in the shop’s own link from the one you pasted." });
    } else {
      setUrl(value);
      setLinkNote(link && !link.ok ? { problem: true, text: link.problem } : null);
    }

    const guess = guessFromLink(value);
    setHasLink(guess != null);
    if (!guess) return;
    if (!edited.current.shop) setShop(guess.shop);
    if (!edited.current.name) setName(guess.name);
    if (!edited.current.category) setCategory(guess.category);

    if (forProduct) {
      setTimeout(() => priceRef.current?.focus(), 0);
      return;
    }
    // Look for this product on Cometcart, so the price joins its comparison.
    const shopLink = link?.ok ? link.url : value;
    if (shopLink === lastLookup.current) return;
    lastLookup.current = shopLink;
    startCheck(async () => {
      const found = await findMatches(shopLink);
      setSameLink(found.sameLink);
      setMatches(found.matches);
      setChoice(found.sameLink ? "" : found.matches.length ? "" : "new");
      if (!found.sameLink && !found.matches.length) setTimeout(() => priceRef.current?.focus(), 0);
    });
  }

  function pick(next: string) {
    setChoice(next);
    setTimeout(() => priceRef.current?.focus(), 0);
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
    }
  }

  const isNew = choice === "new";
  const ready = hasLink && !checking && choice !== "";
  const cardClass = (on: boolean) =>
    `flex w-full items-center gap-3 rounded-[3px] border p-2.5 text-left ${
      on ? "border-warm bg-[rgba(94,234,212,.08)]" : "border-line bg-card hover:border-mute"
    }`;

  return (
    <form
      // Submitted by hand rather than with `action`, because React clears a form after each
      // `action` submit: the category list would quietly jump back to its first choice.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startSave(() => action(data));
      }}
      className="grid max-w-[460px] gap-3"
    >
      {!isNew && choice && <input type="hidden" name="productId" value={choice} />}

      {forProduct && (
        <div className="flex items-center gap-3 rounded-[4px] border border-line bg-card p-3">
          <Thumb src={forProduct.image} alt="" />
          <div className="min-w-0">
            <div className="text-sm text-mute">Adding a shop’s price for</div>
            <div className="font-semibold">{forProduct.name}</div>
            <div className="text-sm text-mute">{forProduct.summary}</div>
          </div>
        </div>
      )}

      <label className={labelClass}>
        <span className="text-base text-ink">Paste the product link</span>
        <input
          name="url"
          type="url"
          required
          autoFocus
          placeholder="https://"
          value={url}
          onChange={(e) => onLink(e.target.value)}
          aria-describedby="link-note"
          className={`${inputClass} py-[13px] text-base`}
        />
      </label>
      {linkNote && (
        <p
          id="link-note"
          role={linkNote.problem ? "alert" : "status"}
          className={`text-sm ${linkNote.problem ? "text-[#fda4af]" : "text-warm"}`}
        >
          {linkNote.text}
        </p>
      )}
      {!hasLink && !linkNote && (
        <p className="text-sm text-mute">
          Copy the link from the shop’s product page and paste it here. We’ll fill in what we can from it.
        </p>
      )}

      {hasLink && !forProduct && (
        <div aria-live="polite">
          {checking ? (
            <p className="text-sm text-mute">Checking whether this product is already on Cometcart…</p>
          ) : sameLink ? (
            <div className="grid gap-2">
              <p className="text-base">This exact link is already on Cometcart:</p>
              <Link href={`/product/${sameLink.id}`} className={cardClass(false)}>
                <Thumb src={sameLink.image} alt="" />
                <span className="min-w-0">
                  <span className="block font-semibold">{sameLink.name}</span>
                  <span className="block text-sm text-mute">{sameLink.summary} · see it</span>
                </span>
              </Link>
              <p className="text-sm text-mute">To compare, paste the same product’s link from a different shop.</p>
            </div>
          ) : matches?.length ? (
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-base">Is it one of these products in Discover?</legend>
              <p className="mb-1 text-sm text-mute">
                If so, tap it and this shop’s price is added next to the other shops’ prices, so everyone can compare.
              </p>
              {matches.map((m) => (
                <button key={m.id} type="button" aria-pressed={choice === m.id} onClick={() => pick(m.id)} className={cardClass(choice === m.id)}>
                  <Thumb src={m.image} alt="" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{m.name}</span>
                    <span className="block text-sm text-mute">{m.summary}</span>
                  </span>
                </button>
              ))}
              <button type="button" aria-pressed={isNew} onClick={() => pick("new")} className={cardClass(isNew)}>
                <span className="font-semibold">No, just save it to my wishlist</span>
              </button>
            </fieldset>
          ) : matches ? (
            <p className="text-sm text-mute">Not in Discover, so it’ll be saved to your wishlist, where only you can see it.</p>
          ) : null}
        </div>
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={`${inputClass} py-[13px] text-base`}
          />
        </label>

        <fieldset className="grid gap-3 rounded-[4px] border border-line p-3">
          <legend className="px-1 text-sm text-mute">Filled in from the link. Change anything that’s wrong.</legend>
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
              className={inputClass}
            />
          </label>
          {isNew && (
            <>
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
            </>
          )}
        </fieldset>

        {isNew && (
          <>
            <label className={labelClass}>
              Photo (optional)
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className={fileClass} />
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
          {pending ? "Saving…" : preparing ? "Preparing photo…" : isNew ? "Save to my wishlist" : "Add this price"}
        </button>
      </div>
    </form>
  );
}
