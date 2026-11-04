"use client";

import { useActionState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { removePrice, updateDetails, updatePrice, type AddProductState } from "@/lib/product-actions";

const inputClass = "min-w-0 rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const labelClass = "grid gap-1 text-sm text-mute";
const ghostClass = "rounded-[3px] border border-line px-[18px] py-2.5 font-semibold hover:border-mute disabled:opacity-60";

function Status({ state }: { state: AddProductState }) {
  if (!state.error && !state.message) return null;
  return (
    <p role="status" className={`text-sm ${state.error ? "text-[#fda4af]" : "text-warm"}`}>
      {state.error ?? state.message}
    </p>
  );
}

export function DetailsForm({
  productId,
  name,
  category,
  similarItems,
}: {
  productId: string;
  name: string;
  category: string;
  similarItems: boolean;
}) {
  const [state, action, pending] = useActionState(updateDetails, {});
  return (
    <form action={action} className="grid max-w-[460px] gap-3">
      <input type="hidden" name="productId" value={productId} />
      <label className={labelClass}>
        Name
        <input name="name" defaultValue={name} required maxLength={120} className={inputClass} />
      </label>
      <label className={labelClass}>
        Category
        <select name="category" defaultValue={category} required className={inputClass}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="similarItems" defaultChecked={similarItems} className="mt-1 h-4 w-4 accent-[#5eead4]" />
        <span>
          Similar items
          <span className="block text-mute">
            Tick when the shops sell different versions (for example three different black bags), not the identical product.
          </span>
        </span>
      </label>
      <Status state={state} />
      <button type="submit" disabled={pending} className={`${ghostClass} w-fit`}>
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

export function PriceForm({
  productId,
  offerId,
  shop,
  priceZar,
  checkedOn,
  canRemove,
}: {
  productId: string;
  offerId: string;
  shop: string;
  priceZar: number;
  checkedOn: string;
  canRemove: boolean;
}) {
  const [state, action, pending] = useActionState(updatePrice, {});
  return (
    <div className="grid gap-2 rounded-[4px] border border-line bg-card p-3">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="offerId" value={offerId} />
        <label className={`${labelClass} flex-1 basis-[160px]`}>
          Shop
          <input name="shop" defaultValue={shop} required maxLength={60} className={inputClass} />
        </label>
        <label className={`${labelClass} basis-[120px]`}>
          Price in rand
          <input
            name="price"
            type="number"
            min={1}
            step="0.01"
            inputMode="decimal"
            defaultValue={priceZar}
            required
            className={inputClass}
          />
        </label>
        <button type="submit" disabled={pending} className={ghostClass}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-xs text-mute">
        <span>checked {checkedOn}</span>
        {canRemove && (
          <form
            action={removePrice}
            onSubmit={(e) => {
              if (!confirm(`Remove ${shop}’s price?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="offerId" value={offerId} />
            <button type="submit" className="text-acc underline">
              Remove this price
            </button>
          </form>
        )}
      </div>
      <Status state={state} />
    </div>
  );
}
