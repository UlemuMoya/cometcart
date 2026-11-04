"use server";

import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type BrowserSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Remembers this phone or browser so price-drop notifications can reach it. */
export async function savePushSubscription(sub: BrowserSubscription): Promise<{ ok: true } | { error: string }> {
  if (!supabaseConfigured) return { error: "Notifications aren’t connected yet." };
  if (!/^https:\/\//.test(sub?.endpoint ?? "") || !sub.keys?.p256dh || !sub.keys?.auth)
    return { error: "This browser didn’t give a notification address. Please try again." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in first." };
  const { error } = await supabase.rpc("save_push_subscription", {
    sub_endpoint: sub.endpoint,
    sub_p256dh: sub.keys.p256dh,
    sub_auth: sub.keys.auth,
  });
  return error ? { error: "Couldn’t switch notifications on. Please try again." } : { ok: true };
}

/** Forgets this phone or browser: no more notifications to it. */
export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!supabaseConfigured) return;
  const supabase = await createClient();
  // Row-level security only lets people remove their own.
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
