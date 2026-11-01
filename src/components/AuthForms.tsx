"use client";

import { useActionState } from "react";
import { saveProfile, signIn, signUp, type FormState } from "@/lib/auth-actions";

const inputClass =
  "rounded-[3px] border border-line bg-card px-3 py-[11px] text-ink placeholder:text-mute";
const labelClass = "grid gap-1 text-sm text-mute";

function Status({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-[#fda4af]">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="text-warm">
        {state.message}
      </p>
    );
  return null;
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="grid max-w-[460px] gap-3">
      <label className={labelClass}>
        Email
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>
      <Status state={state} />
      <button type="submit" disabled={pending} className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, {});
  return (
    <form action={action} className="grid max-w-[460px] gap-3">
      <label className={labelClass}>
        Your name (optional)
        <input name="name" autoComplete="name" className={inputClass} />
      </label>
      <label className={labelClass}>
        Email
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Password (at least 8 characters)
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </label>
      <Status state={state} />
      <button type="submit" disabled={pending} className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold disabled:opacity-60">
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

type Profile = { name: string; sizes: string; budget: string; style: string };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="grid max-w-[460px] gap-3">
      <label className={labelClass}>
        Name
        <input name="name" defaultValue={profile.name} autoComplete="name" className={inputClass} />
      </label>
      <label className={labelClass}>
        Sizes (optional)
        <input
          name="sizes"
          defaultValue={profile.sizes}
          placeholder="e.g. tops M, pants 32, shoes 7"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Usual budget (optional)
        <input
          name="budget"
          defaultValue={profile.budget}
          placeholder="e.g. under R1 000"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Style (optional)
        <input
          name="style"
          defaultValue={profile.style}
          placeholder="e.g. minimal, neutral colours"
          className={inputClass}
        />
      </label>
      <Status state={state} />
      <button type="submit" disabled={pending} className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold disabled:opacity-60">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
