import "server-only";
import { formatCheckedDate } from "@/lib/format";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import type { Category, Product } from "@/lib/types";

export const OCCASIONS = {
  wedding: "Wedding",
  baby: "Baby",
  birthday: "Birthday",
  new_home: "New home",
  other: "Other occasion",
} as const;
export type Occasion = keyof typeof OCCASIONS;

export type RegistrySummary = {
  id: string;
  name: string;
  occasion: Occasion | null;
  eventDate: string | null;
  giftCount: number;
};

export type MyRegistry = RegistrySummary & {
  message: string | null;
  surprise: boolean;
  shareCode: string;
  productIds: string[];
  takenCount: number;
  /** Who reserved what; only filled when surprise mode is off. */
  reservations: { productId: string; guestName: string }[];
};

type RegistryRow = {
  id: string;
  name: string;
  occasion: Occasion | null;
  event_date: string | null;
  message: string | null;
  surprise: boolean;
  share_code: string;
  wishlist_items: { product_id: string; saved_at: string }[];
};

/** The signed-in person's registries, newest first. Empty when signed out. */
export async function getMyRegistries(): Promise<RegistrySummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id, name, occasion, event_date, wishlist_items (product_id)")
    .eq("owner_id", user.id)
    .eq("kind", "registry")
    .order("created_at", { ascending: false });
  return ((data ?? []) as (Omit<RegistryRow, "message" | "surprise" | "share_code" | "wishlist_items"> & {
    wishlist_items: { product_id: string }[];
  })[]).map((r) => ({
    id: r.id,
    name: r.name,
    occasion: r.occasion,
    eventDate: r.event_date,
    giftCount: r.wishlist_items.length,
  }));
}

/** One of the signed-in person's registries, or null. */
export async function getMyRegistry(id: string): Promise<MyRegistry | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id, name, occasion, event_date, message, surprise, share_code, wishlist_items (product_id, saved_at)")
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("kind", "registry")
    .maybeSingle();
  if (!data) return null;
  const r = data as RegistryRow;
  const [{ data: taken }, { data: reservations }] = await Promise.all([
    supabase.rpc("registry_taken_count", { registry: r.id }),
    r.surprise
      ? Promise.resolve({ data: [] })
      : supabase.from("gift_reservations").select("product_id, guest_name").eq("wishlist_id", r.id),
  ]);
  return {
    id: r.id,
    name: r.name,
    occasion: r.occasion,
    eventDate: r.event_date,
    message: r.message,
    surprise: r.surprise,
    shareCode: r.share_code,
    giftCount: r.wishlist_items.length,
    productIds: [...r.wishlist_items].sort((a, b) => b.saved_at.localeCompare(a.saved_at)).map((i) => i.product_id),
    takenCount: Number(taken ?? 0),
    reservations: ((reservations ?? []) as { product_id: string; guest_name: string }[]).map((x) => ({
      productId: x.product_id,
      guestName: x.guest_name,
    })),
  };
}

export type RegistryGift = Product & { taken: boolean };
export type SharedRegistry = {
  name: string;
  occasion: Occasion | null;
  eventDate: string | null;
  message: string | null;
  gifts: RegistryGift[];
};

type RpcGift = {
  product_id: string;
  name: string;
  category: Category;
  image: string | null;
  listed: boolean;
  taken: boolean;
  offers: { id: string; shop: string; price: number | string; url: string | null; checked_at: string }[];
};

/** A registry opened from its share link (anyone with the link). Never says who reserved a gift. */
export async function getRegistryByCode(code: string): Promise<SharedRegistry | null> {
  if (!supabaseConfigured || !/^[0-9a-f]{16}$/.test(code)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_registry", { code });
  if (error || !data) return null;
  const r = data as {
    name: string;
    occasion: Occasion | null;
    event_date: string | null;
    message: string | null;
    gifts: RpcGift[];
  };
  return {
    name: r.name,
    occasion: r.occasion,
    eventDate: r.event_date,
    message: r.message,
    gifts: r.gifts
      .filter((g) => g.offers.length > 0)
      .map((g) => ({
        id: g.product_id,
        name: g.name,
        category: g.category,
        image: g.image,
        listed: g.listed,
        taken: g.taken,
        href: g.listed ? `/product/${g.product_id}` : undefined,
        offers: g.offers.map((o) => ({
          id: o.id,
          shop: o.shop,
          priceZar: Number(o.price),
          checkedOn: formatCheckedDate(o.checked_at),
          checkedAt: o.checked_at,
          url: o.url ?? undefined,
        })),
      })),
  };
}

/** "Saturday 12 December 2026" */
export function formatEventDate(iso: string | null) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}
