import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/config";
import { formatCheckedDate } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

type OfferRow = {
  id: string;
  shop_name: string;
  price_zar: number | string;
  url: string | null; // null when added from a photo, without a link
  price_checked_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: Category;
  image: string | null;
  description: string | null;
  offers: OfferRow[];
};

const SELECT = "id, name, category, image, description, offers (id, shop_name, price_zar, url, price_checked_at)";

// The catalogue is public, so it's read without the visitor's sign-in cookie.
function publicClient() {
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image,
    description: row.description,
    href: `/product/${row.id}`,
    offers: row.offers
      .map((o) => ({
        id: o.id,
        shop: o.shop_name,
        priceZar: Number(o.price_zar),
        checkedOn: formatCheckedDate(o.price_checked_at),
        url: o.url ?? undefined,
      }))
      .sort((a, b) => a.priceZar - b.priceZar),
  };
}

/** Every product that has at least one price. Fine while the catalogue is small. */
export async function getCatalogue(): Promise<Product[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await publicClient()
    .from("products")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load products: ${error.message}`);
  return (data as ProductRow[]).filter((p) => p.offers.length > 0).map(toProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await publicClient().from("products").select(SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return toProduct(data as ProductRow);
}
