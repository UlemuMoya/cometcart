import "server-only";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

// Version 1 gives each person one wishlist. The tables allow more, for registries later.
export type Wishlist = {
  id: string;
  name: string;
  isPublic: boolean;
  shareCode: string;
  productIds: string[]; // newest saved first
};

type WishlistRow = {
  id: string;
  name: string;
  is_public: boolean;
  share_code: string;
  wishlist_items: { product_id: string; saved_at: string }[];
};

/** The signed-in person's wishlist; null if they have none yet. undefined when signed out. */
export async function getMyWishlist(): Promise<Wishlist | null | undefined> {
  const user = await getCurrentUser();
  if (!user) return undefined;
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id, name, is_public, share_code, wishlist_items (product_id, saved_at)")
    .eq("owner_id", user.id)
    .eq("kind", "wishlist") // gift registries are separate lists
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as WishlistRow;
  return {
    id: row.id,
    name: row.name,
    isPublic: row.is_public,
    shareCode: row.share_code,
    productIds: [...row.wishlist_items]
      .sort((a, b) => b.saved_at.localeCompare(a.saved_at))
      .map((i) => i.product_id),
  };
}

/** Product ids the signed-in person has saved, or null when signed out. */
export async function getSavedIds(): Promise<Set<string> | null> {
  const list = await getMyWishlist();
  if (list === undefined) return null;
  return new Set(list?.productIds ?? []);
}

/** A wishlist opened from its share link. Works for private lists too: having the link is the permission. */
export async function getSharedWishlist(code: string): Promise<{ name: string; productIds: string[] } | null> {
  if (!supabaseConfigured || !/^[0-9a-f]{16}$/.test(code)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_wishlist", { code });
  const rows = (data ?? []) as { wishlist_name: string; product_id: string | null; saved_at: string | null }[];
  if (!rows.length) return null;
  return {
    name: rows[0].wishlist_name,
    productIds: rows
      .filter((r) => r.product_id)
      .sort((a, b) => (b.saved_at ?? "").localeCompare(a.saved_at ?? ""))
      .map((r) => r.product_id!),
  };
}
