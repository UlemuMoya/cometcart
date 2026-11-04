import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { formatRand } from "@/lib/format";
import { supabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/config";

// Sends price-drop notifications. Vercel runs this once a day (vercel.json) and
// signs the request with CRON_SECRET; the database checks the same key.

type Alert = {
  endpoint: string;
  p256dh: string;
  auth: string;
  product_id: string;
  name: string;
  shop: string;
  old_price: number | string;
  new_price: number | string;
};

export async function GET(request: NextRequest) {
  const key = process.env.CRON_SECRET;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!key || !publicKey || !privateKey || !supabaseConfigured)
    return NextResponse.json({ error: "Price alerts aren’t set up yet." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${key}`)
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("take_price_alerts", { key });
  if (error) return NextResponse.json({ error: "Couldn’t read price drops." }, { status: 500 });

  webpush.setVapidDetails("mailto:cometcartonline@gmail.com", publicKey, privateKey);
  let sent = 0;
  let gone = 0;
  for (const a of data as Alert[]) {
    const payload = JSON.stringify({
      title: `Price drop: ${a.name}`,
      body: `Now ${formatRand(Number(a.new_price))} at ${a.shop} (was ${formatRand(Number(a.old_price))}).`,
      url: `/product/${a.product_id}`,
      tag: `drop-${a.product_id}`,
    });
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, payload, {
        TTL: 60 * 60 * 24,
      });
      sent++;
    } catch (e) {
      // 404 or 410: the phone switched notifications off or removed the app, so forget it.
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.rpc("forget_push_subscription", { key, sub_endpoint: a.endpoint });
        gone++;
      }
    }
  }
  return NextResponse.json({ sent, gone, due: (data as Alert[]).length });
}
