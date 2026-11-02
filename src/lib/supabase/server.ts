import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseConfigured, supabaseKey, supabaseUrl } from "./config";

/** Supabase client for server code, acting as the signed-in person (if any). */
export async function createClient() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured. Fill in .env.local.");
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a page render, where cookies are read-only. The proxy
          // refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  });
}

/** Whether this person runs the site (listed in public.admins, set in the Supabase SQL Editor). */
export async function isOwner(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return data != null;
}

/** The signed-in person, or null. Checked with Supabase, not just read from the cookie. */
export async function getCurrentUser() {
  if (!supabaseConfigured) return null;
  // Session checks use the current time, so this must run per request, never at build time.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
