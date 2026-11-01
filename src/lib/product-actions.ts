"use server";

import { redirect } from "next/navigation";
import { getCatalogue, getProduct } from "@/lib/catalogue";
import { CATEGORIES } from "@/lib/categories";
import { formatRand, lowestOffer } from "@/lib/format";
import { guessFromLink, resolveShopLink } from "@/lib/link-guess";
import { searchProducts } from "@/lib/search";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export type AddProductState = {
  error?: string;
  /** Set when the link was already added, so we can point to that product. */
  existingHref?: string;
};

export type ProductMatch = {
  id: string;
  name: string;
  image: string | null;
  summary: string; // "from R1 299 · 3 shops"
};

const PHOTO_BUCKET = "product-photos";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

/**
 * Products already in Cometcart that a pasted link might be, so its price joins
 * that product's comparison instead of becoming a separate product.
 */
export async function findMatches(rawLink: string): Promise<{ sameLink: ProductMatch | null; matches: ProductMatch[] }> {
  const link = resolveShopLink(rawLink);
  const guess = guessFromLink(rawLink);
  if (!link?.ok || !guess) return { sameLink: null, matches: [] };
  const catalogue = await getCatalogue();

  // This exact link is already here: nothing to add, just point to it.
  const same = catalogue.find((p) => p.offers.some((o) => o.url === link.url));
  if (same) return { sameLink: toMatch(same), matches: [] };
  if (!guess.name) return { sameLink: null, matches: [] };

  const { results } = searchProducts(catalogue, guess.name, null);
  // Needs at least half the name's words to match, so "black bag" doesn't offer every bag.
  const words = guess.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const matches = results
    .filter((p) => {
      const hay = p.name.toLowerCase();
      return words.filter((w) => hay.includes(w.replace(/s$/, ""))).length >= Math.max(1, Math.ceil(words.length / 2));
    })
    .slice(0, 4)
    .map(toMatch);
  return { sameLink: null, matches };
}

function toMatch(p: Product): ProductMatch {
  const shops = p.offers.length;
  return {
    id: p.id,
    name: p.name,
    image: p.image ?? null,
    summary: `from ${formatRand(lowestOffer(p.offers).priceZar)} · ${shops} shop${shops > 1 ? "s" : ""}`,
  };
}

/** Adds a shop's price: to an existing product (`productId`), or as a new product. */
export async function addProduct(_prev: AddProductState, form: FormData): Promise<AddProductState> {
  if (!supabaseConfigured) return { error: "Adding products isn’t connected yet." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/sign-in");

  const link = resolveShopLink(text(form, "url"));
  if (!link) return { error: "Please paste the full product link, starting with https://" };
  if (!link.ok) return { error: link.problem };
  const url = link.url;
  const shop = text(form, "shop");
  const price = Number(text(form, "price").replace(/[^\d.]/g, ""));
  const productId = text(form, "productId");

  if (!shop || shop.length > 60) return { error: "Please enter the shop’s name." };
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000)
    return { error: "Please enter the price in rand, for example 1299." };

  // Same link already added? Send them to that product instead of making a copy.
  const { data: existing } = await supabase.from("offers").select("product_id").eq("url", url).limit(1);
  if (existing?.length)
    return {
      error: "This link is already on Cometcart.",
      existingHref: `/product/${existing[0].product_id}`,
    };

  // Adding this shop's price to a product that's already here: that's a comparison.
  if (productId) {
    if (!(await getProduct(productId))) return { error: "That product no longer exists. Please choose another." };
    const { error } = await supabase
      .from("offers")
      .insert({ product_id: productId, shop_name: shop, price_zar: price, url, added_by: auth.user.id });
    if (error) return { error: "Couldn’t save the price. Please try again." };
    redirect(`/product/${productId}`);
  }

  // A new product.
  const name = text(form, "name");
  const category = text(form, "category");
  const photo = form.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;
  if (!name || name.length > 120) return { error: "Please give the product a name (up to 120 characters)." };
  if (!(CATEGORIES as readonly string[]).includes(category)) return { error: "Please choose a category." };
  if (hasPhoto) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type))
      return { error: "Photos must be JPG, PNG or WebP." };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "That photo is too large. Please try a smaller one." };
    if (form.get("photoRights") !== "on")
      return { error: "Please confirm you took the photo or have the right to use it." };
  }

  let image: string | null = null;
  if (hasPhoto) {
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
    const upload = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo, { contentType: photo.type });
    if (upload.error) return { error: "Couldn’t upload the photo. Please try again, or add the product without it." };
    image = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ name, category, image, added_by: auth.user.id })
    .select("id")
    .single();
  if (productError || !product) return { error: "Couldn’t save the product. Please try again." };

  const { error: offerError } = await supabase
    .from("offers")
    .insert({ product_id: product.id, shop_name: shop, price_zar: price, url, added_by: auth.user.id });
  if (offerError) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: "Couldn’t save the price. Please try again." };
  }

  redirect(`/product/${product.id}`);
}
