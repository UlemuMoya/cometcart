"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth-actions";
import { readFeed, type FeedProblem, type FeedRow } from "@/lib/feed-csv";
import { readShopifyStore } from "@/lib/shopify-feed";
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
  return saveFeed(supabase, shop.id, rows, problems);
}

/** Owner imports an approved Shopify shop's products straight from its store. */
export async function importShopify(_prev: ImportState, form: FormData): Promise<ImportState> {
  const supabase = await ownerClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, website, status")
    .eq("id", text(form, "shopId"))
    .maybeSingle();
  if (!shop || shop.status !== "approved") return { error: "Please choose an approved shop." };

  try {
    const { rows, problems } = await readShopifyStore(shop.website);
    if (!rows.length) return { error: "None of this store’s products fit a Cometcart category.", problems };
    return saveFeed(supabase, shop.id, rows, problems);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn’t read this store. Please try again later." };
  }
}

async function saveFeed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string,
  rows: FeedRow[],
  problems: FeedProblem[],
): Promise<ImportState> {
  const { data, error } = await supabase.rpc("import_shop_feed", { shop: shopId, rows });
  if (error) return { error: "Couldn’t import the products. Please try again.", problems };
  const r = (data as { added_products: number; added_prices: number; updated_prices: number; skipped: number }[])[0];
  refresh();
  return {
    message: `Done: ${r.added_products} new products, ${r.added_prices} new prices, ${r.updated_prices} prices updated${
      r.skipped + problems.length ? `, ${r.skipped + problems.length} skipped` : ""
    }.`,
    problems,
  };
}
