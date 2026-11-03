import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageIntro } from "@/components/PageIntro";
import { ImportFeedForm, ShopifyImportButton } from "@/components/ShopForms";
import { setPhotoPermission, setShopStatus } from "@/lib/shop-actions";
import { createClient, getCurrentUser, isOwner } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Manage shops", robots: { index: false, follow: false } };

// Site owner only: shop applications, feed imports and "Visit shop" clicks per shop.
export default function ManageShopsPage() {
  return (
    <section>
      <PageIntro
        title="Manage shops"
        intro="Owner only. Approve shops that apply, import the product feeds they send, and see how many shoppers you send them."
      />
      <Suspense fallback={<p className="text-mute">Loading…</p>}>
        <ManageShops />
      </Suspense>
    </section>
  );
}

type Shop = {
  id: string;
  name: string;
  website: string;
  contact_name: string;
  contact_email: string;
  phone: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  photo_permission: boolean;
  created_at: string;
};

const small = "rounded-[3px] border border-line px-3 py-1.5 text-sm font-semibold hover:border-mute";
const monthName = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

async function ManageShops() {
  const user = await getCurrentUser();
  if (!user || !(await isOwner(user.id))) notFound();
  const supabase = await createClient();
  const [{ data: shopRows }, { data: clickRows }] = await Promise.all([
    supabase.from("shops").select("*").order("created_at", { ascending: false }),
    supabase.rpc("shop_click_report", { last_months: 3 }),
  ]);
  const shops = (shopRows ?? []) as Shop[];
  const clicks = (clickRows ?? []) as { shop: string; month: string; clicks: number }[];
  const approved = shops.filter((s) => s.status === "approved");
  const months = [...new Set(clicks.map((c) => c.month))].sort().reverse();
  const shopNames = [...new Set(clicks.map((c) => c.shop))].sort();

  return (
    <>
      <p className="mb-2 flex flex-wrap gap-4 text-sm">
        <Link href="/manage" className="text-acc underline">
          ← Manage Discover
        </Link>
        <Link href="/list-your-shop" className="text-acc underline">
          See the “List your shop” page
        </Link>
      </p>

      <h2 className="sec-title !text-2xl">Applications</h2>
      {shops.length === 0 ? (
        <p className="text-mute">No applications yet. Shops apply on the “List your shop” page (linked in the footer).</p>
      ) : (
        <ul className="grid gap-2.5">
          {shops.map((s) => (
            <li key={s.id} className="rounded-[4px] border border-line bg-card p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <strong className="text-base">{s.name}</strong>
                <span className={s.status === "approved" ? "text-warm" : s.status === "rejected" ? "text-[#fda4af]" : "text-acc"}>
                  {s.status === "pending" ? "Waiting for you" : s.status === "approved" ? "Approved" : "Turned down"}
                </span>
              </div>
              <div className="mt-1 text-mute">
                <a href={s.website} target="_blank" rel="noopener nofollow" className="text-acc underline">
                  {s.website}
                </a>{" "}
                · {s.contact_name} ·{" "}
                <a href={`mailto:${s.contact_email}`} className="text-acc underline">
                  {s.contact_email}
                </a>
                {s.phone && ` · ${s.phone}`} · applied {new Date(s.created_at).toLocaleDateString("en-GB")}
              </div>
              {s.message && <p className="mt-1 whitespace-pre-line text-[#dcd6ff]">{s.message}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {s.status !== "approved" && (
                  <form action={setShopStatus}>
                    <input type="hidden" name="shopId" value={s.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className={small}>
                      Approve
                    </button>
                  </form>
                )}
                {s.status !== "rejected" && (
                  <form action={setShopStatus}>
                    <input type="hidden" name="shopId" value={s.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <ConfirmButton message={`Turn down ${s.name}?`} className={small}>
                      Turn down
                    </ConfirmButton>
                  </form>
                )}
                {s.status === "approved" && (
                  <form action={setPhotoPermission} className="flex items-center gap-2">
                    <input type="hidden" name="shopId" value={s.id} />
                    <input type="hidden" name="allow" value={String(!s.photo_permission)} />
                    <span className="text-mute">
                      Photos: {s.photo_permission ? "allowed in writing" : "not allowed yet"}
                    </span>
                    {s.photo_permission ? (
                      <button type="submit" className={small}>
                        Withdraw
                      </button>
                    ) : (
                      <ConfirmButton
                        message={`Only continue if ${s.name} has agreed in writing (e.g. by email) that Cometcart may show its product photos. Keep that email.`}
                        className={small}
                      >
                        They agreed in writing
                      </ConfirmButton>
                    )}
                  </form>
                )}
              </div>
              {s.status === "approved" && (
                <div className="mt-2 border-t border-line pt-2">
                  <ShopifyImportButton shopId={s.id} shopName={s.name} />
                  <p className="mt-1 text-xs text-mute">
                    For shops on Shopify: reads their in-stock products and prices straight from{" "}
                    {new URL(s.website).hostname}. Run it again any time to update prices.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="sec-title !text-2xl">Import a shop’s feed</h2>
      <p className="mb-3 max-w-[640px] text-sm text-mute">
        Shops send their products as a spreadsheet saved as CSV, with columns <strong>name, category, price, url,
        image</strong> (
        <a href="/feed-template.csv" download className="text-acc underline">
          template
        </a>
        ). Prices go straight into Discover, dated today. Links must be on the shop’s own website. Photos are only used
        once the shop has agreed in writing. Send the same file again later to update prices.
      </p>
      {approved.length ? (
        <ImportFeedForm shops={approved.map((s) => ({ id: s.id, name: s.name, photos: s.photo_permission }))} />
      ) : (
        <p className="text-mute">Approve a shop first.</p>
      )}

      <h2 className="sec-title !text-2xl">“Visit shop” clicks</h2>
      <p className="mb-3 text-sm text-mute">
        How many shoppers Cometcart sent to each shop in the last 3 months. Counts only, never who clicked.
      </p>
      {clicks.length === 0 ? (
        <p className="text-mute">No clicks yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-mute">
                <th scope="col" className="border-b border-line py-2 pr-3 font-normal">
                  Shop
                </th>
                {months.map((m) => (
                  <th key={m} scope="col" className="border-b border-line px-3 py-2 text-right font-normal">
                    {monthName(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shopNames.map((name) => (
                <tr key={name}>
                  <td className="border-b border-line py-2 pr-3">{name}</td>
                  {months.map((m) => (
                    <td key={m} className="border-b border-line px-3 py-2 text-right tabular-nums">
                      {clicks.find((c) => c.shop === name && c.month === m)?.clicks ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
