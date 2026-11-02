"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/auth-actions";

async function signedIn() {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saves a product, or removes it if it's already saved. Makes the wishlist on first save. */
export async function toggleSave(productId: string): Promise<{ saved: boolean } | { signIn: true } | { error: string }> {
  const auth = await signedIn();
  if (!auth) return { signIn: true };
  if (!UUID.test(productId)) return { error: "That product can’t be saved." };
  const { supabase, user } = auth;

  let { data: list } = await supabase
    .from("wishlists")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!list) {
    const made = await supabase.from("wishlists").insert({ owner_id: user.id }).select("id").single();
    if (made.error) return { error: "Couldn’t save. Please try again." };
    list = made.data;
  }

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("wishlist_id", list.id)
    .eq("product_id", productId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("wishlist_items").delete().eq("wishlist_id", list.id).eq("product_id", productId)
    : await supabase.from("wishlist_items").insert({ wishlist_id: list.id, product_id: productId });
  if (error) return { error: "Couldn’t save. Please try again." };
  return { saved: !existing };
}

// The forms on the Wishlist page. Row-level security also makes sure people only change their own list.

export async function renameWishlist(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await signedIn();
  if (!auth) redirect("/sign-in?next=/wishlist");
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 60) return { error: "Please use a name of up to 60 characters." };
  const { error } = await auth.supabase.from("wishlists").update({ name }).eq("id", String(form.get("wishlistId")));
  if (error) return { error: "Couldn’t rename it. Please try again." };
  refresh();
  return { message: "Renamed." };
}

export async function setPublic(form: FormData) {
  const auth = await signedIn();
  if (!auth) redirect("/sign-in?next=/wishlist");
  await auth.supabase
    .from("wishlists")
    .update({ is_public: form.get("public") === "true" })
    .eq("id", String(form.get("wishlistId")));
  refresh();
}

/** A fresh share code, so links sent before stop working. */
export async function newShareLink(form: FormData) {
  const auth = await signedIn();
  if (!auth) redirect("/sign-in?next=/wishlist");
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await auth.supabase.from("wishlists").update({ share_code: code }).eq("id", String(form.get("wishlistId")));
  refresh();
}

export async function deleteWishlist(form: FormData) {
  const auth = await signedIn();
  if (!auth) redirect("/sign-in?next=/wishlist");
  await auth.supabase.from("wishlists").delete().eq("id", String(form.get("wishlistId")));
  refresh();
}
