// Checks the Supabase connection and that security rules block visitors.
// Run: node scripts/check-supabase.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

for (const t of ["products", "offers", "users", "wishlists", "wishlist_items"]) {
  const { data, error } = await sb.from(t).select("*").limit(1);
  console.log(t.padEnd(15), error ? `ERROR ${error.message}` : `ok, rows a visitor can see: ${data.length}`);
}

const insert = await sb
  .from("users")
  .insert({ id: "00000000-0000-0000-0000-000000000000", email: "nobody@example.com" });
console.log("visitor writing to users:", insert.error ? "blocked (good)" : "ALLOWED (bad!)");

const shared = await sb.rpc("get_shared_wishlist", { code: "no-such-code" });
console.log("shared wishlist lookup:", shared.error ? `ERROR ${shared.error.message}` : `ok, rows: ${shared.data.length}`);
