"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/auth-actions";
import { applyShop, importFeed, importShopify, type ImportState } from "@/lib/shop-actions";

const inputClass = "rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const labelClass = "grid gap-1 text-sm text-mute";
const buttonClass = "btn-grad w-fit rounded-[3px] px-[18px] py-3 font-semibold disabled:opacity-60";

function Status({ state }: { state: FormState }) {
  if (!state.error && !state.message) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={state.error ? "text-[#fda4af]" : "text-warm"}>
      {state.error ?? state.message}
    </p>
  );
}

export function ShopApplyForm() {
  const [state, action, pending] = useActionState(applyShop, {});
  if (state.message) return <Status state={state} />;
  return (
    <form action={action} className="grid max-w-[520px] gap-3">
      <label className={labelClass}>
        Shop name
        <input name="name" required maxLength={80} autoComplete="organization" className={inputClass} />
      </label>
      <label className={labelClass}>
        Shop website
        <input name="website" required maxLength={200} placeholder="www.yourshop.co.za" className={inputClass} />
      </label>
      <label className={labelClass}>
        Your name
        <input name="contactName" required maxLength={120} autoComplete="name" className={inputClass} />
      </label>
      <label className={labelClass}>
        Work email
        <input name="contactEmail" type="email" required maxLength={200} autoComplete="email" className={inputClass} />
      </label>
      <label className={labelClass}>
        Phone (optional)
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
      </label>
      <label className={labelClass}>
        Anything we should know? (optional)
        <textarea
          name="message"
          rows={3}
          maxLength={2000}
          placeholder="For example: what you sell, how many products, whether you already have a product feed"
          className={inputClass}
        />
      </label>
      {/* Hidden from people; bots tend to fill it in. */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-sm text-mute">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>
          I agree to Cometcart keeping these contact details to review and manage our listing, as set out in the{" "}
          <Link href="/privacy" target="_blank" className="text-acc underline">
            privacy policy
          </Link>
          .
        </span>
      </label>
      <Status state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Sending…" : "Apply to list my shop"}
      </button>
    </form>
  );
}

export function ImportFeedForm({ shops }: { shops: { id: string; name: string; photos: boolean }[] }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importFeed, {});
  return (
    <form action={action} className="grid max-w-[560px] gap-3">
      <label className={labelClass}>
        Shop
        <select name="shopId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose an approved shop
          </option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.photos ? "" : " (no photo permission: photos left out)"}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Feed file (.csv, up to 2 MB)
        <input
          name="feed"
          type="file"
          accept=".csv,text/csv"
          required
          className={`${inputClass} file:mr-3 file:rounded-[3px] file:border-0 file:bg-line file:px-3 file:py-1 file:text-ink`}
        />
      </label>
      <Status state={state} />
      {state.problems && state.problems.length > 0 && (
        <details className="text-sm text-mute">
          <summary className="cursor-pointer text-acc underline">
            {state.problems.length} row{state.problems.length > 1 ? "s" : ""} not imported
          </summary>
          <ul className="mt-2 list-disc pl-5">
            {state.problems.slice(0, 50).map((p) => (
              <li key={`${p.line}-${p.reason}`}>
                Line {p.line}: {p.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      <button type="submit" disabled={pending || shops.length === 0} className={buttonClass}>
        {pending ? "Importing…" : "Import feed"}
      </button>
    </form>
  );
}

/** For an approved shop on Shopify: reads its product list straight from its store. */
export function ShopifyImportButton({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importShopify, {});
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="shopId" value={shopId} />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-[3px] border border-line px-3 py-1.5 text-sm font-semibold hover:border-mute disabled:opacity-60"
      >
        {pending ? `Reading ${shopName}’s store…` : "Import from Shopify"}
      </button>
      <Status state={state} />
      {state.problems && state.problems.length > 0 && (
        <details className="text-sm text-mute">
          <summary className="cursor-pointer text-acc underline">
            {state.problems.length} product{state.problems.length > 1 ? "s" : ""} left out
          </summary>
          <ul className="mt-2 list-disc pl-5">
            {state.problems.slice(0, 50).map((p) => (
              <li key={`${p.line}-${p.reason}`}>{p.reason}</li>
            ))}
          </ul>
        </details>
      )}
    </form>
  );
}
