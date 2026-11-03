"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth-actions";
import { readFeed, type FeedProblem } from "@/lib/feed-csv";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient, isOwner } from "@/lib/supabase/server";

function text(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

/** "List your shop": anyone can apply. The owner reviews it in Manage shops. */
export async function applyShop(_prev: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured) return { error: "Applications aren’t connected yet." };
  if (text(form, "company")) return { message: "Thanks! We’ll be in touch." }; // hidden field only bots fill in

  const name = text(form, "name", 80);
  const contactName = text(form, "contactName", 120);
  const contactEmail = text(form, "contactEmail");
  let website = text(form, "website");
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (!name || !contactName) return { error: "Please fill in the shop’s name and your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) return { error: "Please enter a valid email address." };
  try {
    new URL(website);
  } catch {
    return { error: "Please enter the shop’s website, for example www.yourshop.co.za." };
  }
  if (form.get("consent") !== "on")
    return { error: "Please agree to Cometcart keeping these details, as set out in the privacy policy." };

  const supabase = await createClient();
  const { error } = await supabase.from("shops").insert({
    name,
    website,
    contact_name: contactName,
    contact_email: contactEmail,
    phone: text(form, "phone", 40) || null,
    message: text(form, "message", 2000) || null,
  });
  if (error) return { error: "Couldn’t send your application. Please try again, or email us." };
  return { message: "Thanks! We’ve received your application and will be in touch by email." };
}

async function ownerClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isOwner(data.user.id))) redirect("/");
  return supabase;
}

export async function setShopStatus(form: FormData) {
  const supabase = await ownerClient();
  const status = text(form, "status");
  if (!["pending", "approved", "rejected"].includes(status)) return;
  await supabase.from("shops").update({ status }).eq("id", text(form, "shopId"));
  refresh();
}

export async function setPhotoPermission(form: FormData) {
  const supabase = await ownerClient();
  await supabase
    .from("shops")
    .update({ photo_permission: form.get("allow") === "true" })
    .eq("id", text(form, "shopId"));
  refresh();
}

export type ImportState = FormState & { problems?: FeedProblem[] };

/** Owner uploads a shop's feed (CSV). Prices are added or updated in Discover. */
export async function importFeed(_prev: ImportState, form: FormData): Promise<ImportState> {
  const supabase = await ownerClient();
  const file = form.get("feed");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose the shop’s feed file (.csv)." };
  if (file.size > 2 * 1024 * 1024) return { error: "That file is over 2 MB. Please split it into smaller files." };

  const { data: shop } = await supabase
    .from("shops")
    .select("id, website, status")
    .eq("id", text(form, "shopId"))
    .maybeSingle();
  if (!shop || shop.status !== "approved") return { error: "Please choose an approved shop." };

  const { rows, problems } = readFeed(await file.text(), shop.website);
  if (!rows.length) return { error: "No products could be read from that file.", problems };

  const { data, error } = await supabase.rpc("import_shop_feed", { shop: shop.id, rows });
  if (error) return { error: "Couldn’t import the feed. Please check the file and try again.", problems };
  const r = (data as { added_products: number; added_prices: number; updated_prices: number; skipped: number }[])[0];
  refresh();
  return {
    message: `Done: ${r.added_products} new products, ${r.added_prices} new prices, ${r.updated_prices} prices updated${
      r.skipped + problems.length ? `, ${r.skipped + problems.length} rows skipped` : ""
    }.`,
    problems,
  };
}
