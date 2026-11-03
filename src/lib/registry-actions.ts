"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth-actions";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const OCCASIONS = ["wedding", "baby", "birthday", "new_home", "other"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[0-9a-f]{16}$/;

function text(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

async function signedIn(next = "/registry") {
  if (!supabaseConfigured) redirect("/");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return { supabase, user: data.user };
}

/** Name, occasion, date and message, checked. */
function details(form: FormData): { error: string } | Record<string, string | null> {
  const name = text(form, "name", 80);
  const occasion = text(form, "occasion");
  const date = text(form, "eventDate");
  if (!name) return { error: "Please give the registry a name, for example “Thandi & Sipho’s wedding”." };
  if (!OCCASIONS.includes(occasion)) return { error: "Please choose the occasion." };
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Please choose a valid date." };
  return { name, occasion, event_date: date || null, message: text(form, "message", 500) || null };
}

export async function createRegistry(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await signedIn();
  const d = details(form);
  if ("error" in d) return { error: d.error as string };
  const { data, error } = await supabase
    .from("wishlists")
    .insert({ ...d, owner_id: user.id, kind: "registry" })
    .select("id")
    .single();
  if (error || !data) return { error: "Couldn’t create the registry. Please try again." };
  redirect(`/registry/${data.id}`);
}

export async function updateRegistry(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await signedIn();
  const d = details(form);
  if ("error" in d) return { error: d.error as string };
  const { error } = await supabase
    .from("wishlists")
    .update({ ...d, surprise: form.get("surprise") === "on" })
    .eq("id", text(form, "registryId"))
    .eq("kind", "registry");
  if (error) return { error: "Couldn’t save the changes. Please try again." };
  refresh();
  return { message: "Saved." };
}

export async function deleteRegistry(form: FormData) {
  const { supabase } = await signedIn();
  await supabase.from("wishlists").delete().eq("id", text(form, "registryId")).eq("kind", "registry");
  redirect("/registry");
}

/** Add a product to one of your registries (row-level security checks it's yours). */
export async function addToRegistry(_prev: FormState, form: FormData): Promise<FormState> {
  const productId = text(form, "productId");
  const { supabase } = await signedIn(`/product/${productId}`);
  const registryId = text(form, "registryId");
  if (!UUID.test(productId) || !UUID.test(registryId)) return { error: "Please choose a registry." };
  const { error } = await supabase
    .from("wishlist_items")
    .upsert({ wishlist_id: registryId, product_id: productId }, { ignoreDuplicates: true });
  if (error) return { error: "Couldn’t add it. Please try again." };
  return { message: "Added to your registry." };
}

export async function removeFromRegistry(form: FormData) {
  const { supabase } = await signedIn();
  await supabase
    .from("wishlist_items")
    .delete()
    .eq("wishlist_id", text(form, "registryId"))
    .eq("product_id", text(form, "productId"));
  refresh();
}

/** Owner frees a gift up again, e.g. the guest changed their mind by message. */
export async function clearReservation(form: FormData) {
  const { supabase } = await signedIn();
  await supabase
    .from("gift_reservations")
    .delete()
    .eq("wishlist_id", text(form, "registryId"))
    .eq("product_id", text(form, "productId"));
  refresh();
}

/** Guest: "I'll get this". Returns the token their browser keeps to undo it. */
export async function reserveGift(
  code: string,
  productId: string,
  name: string,
): Promise<{ token: string } | { error: string }> {
  if (!supabaseConfigured || !CODE.test(code) || !UUID.test(productId)) return { error: "This registry link isn’t valid." };
  const guest = name.trim().slice(0, 40);
  if (!guest) return { error: "Please add your first name, so the gift is marked as yours." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_gift", { code, product: productId, name: guest });
  if (error) return { error: "Couldn’t reserve it. Please try again." };
  if (!data) return { error: "Someone has just reserved this gift. Please choose another." };
  return { token: data as string };
}

/** Guest: undo their own reservation, using the token from their browser. */
export async function unreserveGift(code: string, productId: string, token: string): Promise<boolean> {
  if (!supabaseConfigured || !CODE.test(code) || !UUID.test(productId) || !UUID.test(token)) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc("unreserve_gift", { code, product: productId, token });
  return data === true;
}
