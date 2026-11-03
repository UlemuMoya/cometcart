"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ownPhotoPath, PHOTO_BUCKET } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

export type FormState = { error?: string; message?: string };

const NOT_CONNECTED: FormState = {
  error: "Accounts aren’t connected yet. They switch on once Supabase is set up.",
};

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured) return NOT_CONNECTED;
  const name = text(form, "name");
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and a password." };
  if (password.length < 8) return { error: "Please use a password of at least 8 characters." };
  // POPIA: sign-up needs the person's informed consent.
  if (form.get("consent") !== "on") return { error: "Please confirm you’re 18 or older and agree to the privacy policy." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: friendly(error.message) };

  // If email confirmation is switched off in Supabase, they are signed in straight away.
  if (data.session) redirect("/account");
  return { message: `Almost done. We’ve sent a link to ${email}. Open it to confirm your account.` };
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured) return NOT_CONNECTED;
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message) };
  // Back to where they were (e.g. the product they tried to save). Only our own pages.
  const next = text(form, "next");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured) return NOT_CONNECTED;
  const email = text(form, "email");
  if (!email) return { error: "Please enter your email." };
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });
  if (error && /rate limit/i.test(error.message)) return { error: friendly(error.message) };
  // Same answer whether or not the email has an account, so nobody can use this to check.
  return {
    message: `If there’s an account for ${email}, we’ve sent it a link to choose a new password. Open it on this device.`,
  };
}

export async function setNewPassword(_prev: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured) return NOT_CONNECTED;
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Please use a password of at least 8 characters." };
  if (password !== String(form.get("confirm") ?? "")) return { error: "The two passwords don’t match." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "That reset link has expired. Please ask for a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendly(error.message) };
  redirect("/account?password=changed");
}

/** POPIA: deletes the person's account and personal data, then signs them out. */
export async function deleteAccount(_prev: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured) return NOT_CONNECTED;
  if (text(form, "confirm").toUpperCase() !== "DELETE") return { error: "Please type DELETE to confirm." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");
  const me = data.user.id;

  // Photos they uploaded for their private finds. (The database can't delete stored files itself.)
  const { data: finds } = await supabase.from("products").select("image").eq("added_by", me).eq("listed", false);
  const paths = (finds ?? []).map((p) => ownPhotoPath(p.image, me)).filter((p) => p != null);
  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "Couldn’t delete your account. Please try again, or contact us." };
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}

export async function signOut() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function saveProfile(_prev: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured) return NOT_CONNECTED;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const { error } = await supabase
    .from("users")
    .update({
      name: text(form, "name") || null,
      preferences: {
        sizes: text(form, "sizes"),
        budget: text(form, "budget"),
        style: text(form, "style"),
      },
    })
    .eq("id", data.user.id);
  if (error) return { error: "Couldn’t save your profile. Please try again." };
  return { message: "Saved." };
}

// Supabase's messages are in developer English; make the common ones plain.
function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "That email and password don’t match.";
  if (/email not confirmed/i.test(message))
    return "Please confirm your email first. Check your inbox for our link.";
  if (/already registered/i.test(message)) return "There’s already an account with that email.";
  if (/rate limit/i.test(message))
    return "Too many emails sent just now. Please wait a few minutes and try again.";
  return message;
}
