// Lists products in the database with how many times each name appears.
// Run: node scripts/list-products.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const { data, error } = await sb.from("products").select("id, name, category, created_at, offers (shop_name, price_zar)");
if (error) throw error;
const counts = {};
for (const p of data) counts[p.name] = (counts[p.name] ?? 0) + 1;
console.log(`${data.length} products`);
for (const [name, n] of Object.entries(counts).sort()) console.log(`${n > 1 ? `x${n}` : "  "}  ${name}`);
