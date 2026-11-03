"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import type { FormState } from "@/lib/auth-actions";
import {
  addToRegistry,
  createRegistry,
  reserveGift,
  unreserveGift,
  updateRegistry,
} from "@/lib/registry-actions";

const inputClass = "w-full min-w-0 rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const labelClass = "grid gap-1 text-sm text-mute";
const buttonClass = "btn-grad w-fit rounded-[3px] px-[18px] py-3 font-semibold disabled:opacity-60";
const ghostClass = "rounded-[3px] border border-line px-3.5 py-2 text-sm font-semibold hover:border-mute disabled:opacity-60";

const OCCASION_OPTIONS = [
  ["wedding", "Wedding"],
  ["baby", "Baby"],
  ["birthday", "Birthday"],
  ["new_home", "New home"],
  ["other", "Other occasion"],
] as const;

function Status({ state }: { state: FormState }) {
  if (!state.error && !state.message) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={`text-sm ${state.error ? "text-[#fda4af]" : "text-warm"}`}>
      {state.error ?? state.message}
    </p>
  );
}

type Details = { id: string; name: string; occasion: string | null; eventDate: string | null; message: string | null; surprise: boolean };

/** Create a registry, or (with `registry`) edit one. */
export function RegistryDetailsForm({ registry }: { registry?: Details }) {
  const [state, action, pending] = useActionState(registry ? updateRegistry : createRegistry, {});
  return (
    <form action={action} className="grid max-w-[520px] gap-3">
      {registry && <input type="hidden" name="registryId" value={registry.id} />}
      <label className={labelClass}>
        Registry name
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={registry?.name}
          placeholder="e.g. Thandi & Sipho’s wedding"
          className={inputClass}
        />
      </label>
      <div className="grid gap-3 min-[480px]:grid-cols-2">
        <label className={labelClass}>
          Occasion
          <select name="occasion" required defaultValue={registry?.occasion ?? ""} className={inputClass}>
            <option value="" disabled>
              Choose one
            </option>
            {OCCASION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Date (optional)
          <input name="eventDate" type="date" defaultValue={registry?.eventDate ?? ""} className={inputClass} />
        </label>
      </div>
      <label className={labelClass}>
        A note for your guests (optional)
        <textarea
          name="message"
          rows={3}
          maxLength={500}
          defaultValue={registry?.message ?? ""}
          placeholder="e.g. Thank you for celebrating with us! Gifts are optional; your company is enough."
          className={inputClass}
        />
      </label>
      {registry && (
        <label className="flex items-start gap-2 text-sm text-mute">
          <input name="surprise" type="checkbox" defaultChecked={registry.surprise} className="mt-1" />
          <span>
            <strong className="text-ink">Surprise mode:</strong> I only see how many gifts are taken, not which ones or who
            is getting them.
          </span>
        </label>
      )}
      <Status state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : registry ? "Save changes" : "Create registry"}
      </button>
    </form>
  );
}

/** On a product page: add this product to one of your registries. */
export function AddToRegistryForm({ productId, registries }: { productId: string; registries: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addToRegistry, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 text-sm">
      <input type="hidden" name="productId" value={productId} />
      <label htmlFor={`registry-${productId}`} className="text-mute">
        🎁 Add to registry
      </label>
      <select
        id={`registry-${productId}`}
        name="registryId"
        required
        defaultValue={registries.length === 1 ? registries[0].id : ""}
        className="min-w-0 rounded-[3px] border border-line bg-card px-2.5 py-2 text-ink"
      >
        {registries.length > 1 && (
          <option value="" disabled>
            Choose a registry
          </option>
        )}
        {registries.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className={ghostClass}>
        {pending ? "Adding…" : "Add"}
      </button>
      <Status state={state} />
    </form>
  );
}

const noSubscribe = () => () => {};

/** Reads this browser's storage; null when it's unavailable (private browsing, blocked). */
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Guest view of one gift: "I'll get this" (with their first name), or "Taken".
 * The browser keeps a small token so the same guest can undo it later.
 */
export function GuestGiftButton({ code, productId, taken }: { code: string; productId: string; taken: boolean }) {
  const key = `cometcart-gift-${code}-${productId}`;
  const [isTaken, setTaken] = useState(taken);
  // The undo token saved in this browser (none on the server or in private browsing).
  const stored = useSyncExternalStore(noSubscribe, () => readStorage(key), () => null);
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  const mine = override === undefined ? stored : override;
  const setMine = setOverride;
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (isTaken && mine)
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-warm">✓ You’re getting this</span>
        <button
          type="button"
          disabled={pending}
          className="text-acc underline"
          onClick={() =>
            start(async () => {
              if (await unreserveGift(code, productId, mine)) {
                try {
                  localStorage.removeItem(key);
                } catch {}
                setMine(null);
                setTaken(false);
              }
            })
          }
        >
          Undo
        </button>
      </div>
    );

  if (isTaken) return <span className="text-sm font-semibold text-mute">Taken: someone is getting this</span>;

  if (!asking)
    return (
      <button
        type="button"
        onClick={() => {
          setName(readStorage("cometcart-guest-name") ?? "");
          setAsking(true);
        }}
        className={`${ghostClass} w-full`}
      >
        🎁 I’ll get this
      </button>
    );

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        start(async () => {
          const result = await reserveGift(code, productId, name);
          if ("error" in result) {
            setError(result.error);
            if (result.error.startsWith("Someone")) setTaken(true);
            return;
          }
          try {
            localStorage.setItem(key, result.token);
            localStorage.setItem("cometcart-guest-name", name.trim());
          } catch {}
          setMine(result.token);
          setTaken(true);
        });
      }}
    >
      <label className="grid gap-1 text-xs text-mute">
        Your first name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          autoComplete="given-name"
          className="rounded-[3px] border border-line bg-card px-2.5 py-2 text-sm text-ink"
        />
      </label>
      <p className="text-xs text-mute">Marks the gift as taken so nobody doubles up. Only the registry owner may see your name.</p>
      {error && (
        <p role="alert" className="text-xs text-[#fda4af]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${ghostClass} flex-1`}>
          {pending ? "Saving…" : "Confirm"}
        </button>
        <button type="button" onClick={() => setAsking(false)} className="text-sm text-acc underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
