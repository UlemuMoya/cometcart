"use server";

import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { resolveShopLink } from "@/lib/link-guess";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AddProductState = {
  error?: string;
  /** Set when the link was already added, so we can point to that product. */
  existingHref?: string;
};

const PHOTO_BUCKET = "product-photos";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}


export async function addProduct(_prev: AddProductState, form: FormData): Promise<AddProductState> {
  if (!supabaseConfigured) return { error: "Adding products isn’t connected yet." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/sign-in");

  // Two independent ways to add: from a product link, or from a photo (no link needed).
  const mode = text(form, "mode") === "photo" ? "photo" : "link";
  const link = mode === "link" ? resolveShopLink(text(form, "url")) : null;
  if (link && !link.ok) return { error: link.problem };
  const url = link?.ok ? link.url : null;
  const name = text(form, "name");
  const shop = text(form, "shop");
  const price = Number(text(form, "price").replace(/[^\d.]/g, ""));
  const category = text(form, "category");
  const photo = form.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;

  if (mode === "link" && !url) return { error: "Please paste the full product link, starting with https://" };
  if (mode === "photo" && !hasPhoto) return { error: "Please add a photo of the product." };
  if (!name || name.length > 120) return { error: "Please give the product a name (up to 120 characters)." };
  if (!shop || shop.length > 60) return { error: "Please enter the shop’s name." };
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000)
    return { error: "Please enter the price in rand, for example 1299." };
  if (!(CATEGORIES as readonly string[]).includes(category)) return { error: "Please choose a category." };
  if (hasPhoto) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type))
      return { error: "Photos must be JPG, PNG or WebP." };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "That photo is too large. Please try a smaller one." };
    if (form.get("photoRights") !== "on")
      return { error: "Please confirm you took the photo or have the right to use it." };
  }

  // Same link already added? Send them to that product instead of making a copy.
  if (url) {
    const { data: existing } = await supabase.from("offers").select("product_id").eq("url", url).limit(1);
    if (existing?.length)
      return {
        error: "Someone has already added this link.",
        existingHref: `/product/${existing[0].product_id}`,
      };
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
    .insert({ product_id: product.id, shop_name: shop, price_zar: price, url });
  if (offerError) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: "Couldn’t save the price. Please try again." };
  }

  redirect(`/product/${product.id}`);
}
