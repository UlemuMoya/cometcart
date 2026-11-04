import { NextResponse, type NextRequest } from "next/server";
import { cleanShopUrl } from "@/lib/link-guess";
import { createClient } from "@/lib/supabase/server";

// Every "Visit shop" button goes through here: count the click, then send the
// shopper to the shop. When affiliate links arrive, this is the one place to
// swap in a tracked link (or read it from the offers table).
export async function GET(request: NextRequest, ctx: RouteContext<"/go/[offerId]">) {
  const { offerId } = await ctx.params;
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("offers")
    .select("id, product_id, url")
    .eq("id", offerId)
    .maybeSingle();

  let target: URL | null = null;
  try {
    target = offer ? new URL(cleanShopUrl(offer.url)) : null;
  } catch {}
  if (!offer || !target || !["https:", "http:"].includes(target.protocol)) {
    return NextResponse.redirect(new URL("/discover", request.url));
  }

  const { data: auth } = await supabase.auth.getUser();
  await supabase
    .from("link_clicks")
    .insert({ product_id: offer.product_id, offer_id: offer.id, user_id: auth.user?.id ?? null });

  return NextResponse.redirect(target);
}
