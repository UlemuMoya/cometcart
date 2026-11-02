import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/config";
import { createClient as createSignedInClient, getCurrentUser } from "@/lib/supabase/server";
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
  listed: boolean;
  offers: OfferRow[];
};

const SELECT =
  "id, name, category, image, description, listed, offers (id, shop_name, price_zar, url, price_checked_at)";

// Discover is public, so it's read without the visitor's sign-in cookie.
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
    listed: row.listed,
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

function withPrices(rows: ProductRow[]) {
  return rows.filter((p) => p.offers.length > 0).map(toProduct);
}

/** Discover: every approved product that has at least one price. Fine while the catalogue is small. */
export async function getCatalogue(): Promise<Product[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await publicClient()
    .from("products")
    .select(SELECT)
    .eq("listed", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load products: ${error.message}`);
  return withPrices(data as ProductRow[]);
}

/** The signed-in person's own finds: products they added that aren't in Discover. */
export async function getMyFinds(): Promise<Product[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createSignedInClient();
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("added_by", user.id)
    .eq("listed", false)
    .order("created_at", { ascending: false });
  return withPrices((data ?? []) as ProductRow[]);
}

/**
 * Products by id, in the order given, leaving out any the visitor can't see
 * (someone else's private finds). Used for wishlists.
 */
export async function getProducts(ids: string[]): Promise<Product[]> {
  if (!supabaseConfigured || !ids.length) return [];
  const supabase = await createSignedInClient();
  const { data } = await supabase.from("products").select(SELECT).in("id", ids);
  const found = withPrices((data ?? []) as ProductRow[]);
  return ids.map((id) => found.find((p) => p.id === id)).filter((p) => p != null);
}

/** One product, if the visitor may see it: a Discover product, or their own find. */
export async function getProduct(id: string): Promise<Product | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createSignedInClient();
  const { data, error } = await supabase.from("products").select(SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return toProduct(data as ProductRow);
}
