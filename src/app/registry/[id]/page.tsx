import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageIntro } from "@/components/PageIntro";
import { RegistryDetailsForm } from "@/components/RegistryForms";
import { ShareButtons } from "@/components/ShareButtons";
import { getProducts } from "@/lib/catalogue";
import { formatRand } from "@/lib/format";
import { clearReservation, deleteRegistry, removeFromRegistry } from "@/lib/registry-actions";
import { formatEventDate, getMyRegistry, OCCASIONS } from "@/lib/registry";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your registry", robots: { index: false, follow: false } };

export default function RegistryPage(props: PageProps<"/registry/[id]">) {
  return (
    <Suspense fallback={<p className="mt-[26px] text-mute">Loading registry…</p>}>
      <Registry params={props.params} />
    </Suspense>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Registry({ params }: Pick<PageProps<"/registry/[id]">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=/registry/${id}`);
  const registry = UUID.test(id) ? await getMyRegistry(id) : null;
  if (!registry) notFound();

  const gifts = await getProducts(registry.productIds);
  const takenBy = new Map(registry.reservations.map((r) => [r.productId, r.guestName]));
  const h = await headers();
  const shareUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/w/${registry.shareCode}`;
  const shareText = `${registry.name}: our gift registry on Cometcart.`;

  return (
    <section>
      <PageIntro
        title={`🎁 ${registry.name}`}
        intro={[
          registry.occasion ? OCCASIONS[registry.occasion] : "Gift registry",
          registry.eventDate ? formatEventDate(registry.eventDate) : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <p className="mb-4 text-sm">
        <Link href="/registry" className="text-acc underline">
          ← All registries
        </Link>
      </p>

      {/* Sharing at the top, where people look for it. */}
      <div className="mb-2 grid gap-2 rounded-[4px] border border-line bg-card p-3">
        <p className="text-sm text-mute">
          <strong className="text-ink">Share with guests.</strong> They don’t need an account: they see the gifts and
          prices, and tap “I’ll get this” so nobody doubles up.
        </p>
        <ShareButtons url={shareUrl} title={registry.name} text={shareText} primary />
        <a href={`/w/${registry.shareCode}`} target="_blank" rel="noopener" className="w-fit text-sm text-acc underline">
          See it as a guest<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      <h2 className="sec-title !mt-6 !text-2xl">Gifts</h2>
      <p className="mb-3 text-sm text-mute">
        {registry.giftCount} gift{registry.giftCount === 1 ? "" : "s"} · {registry.takenCount} taken by guests
        {registry.surprise ? " (surprise mode: you can’t see which)" : ""}. To add gifts, open any product in{" "}
        <Link href="/discover" className="text-acc underline">
          Discover
        </Link>{" "}
        or in your{" "}
        <Link href="/wishlist" className="text-acc underline">
          wishlist
        </Link>{" "}
        and use <strong>🎁 Add to registry</strong>.{" "}
        <Link href="/add" className="text-acc underline">
          Paste a link
        </Link>{" "}
        first for gifts from other shops.
      </p>
      {gifts.length === 0 ? (
        <p className="mb-6 text-mute">No gifts yet.</p>
      ) : (
        <ul className="mb-6 grid gap-2">
          {gifts.map((g) => {
            const low = g.offers[0].priceZar;
            const high = g.offers.at(-1)!.priceZar;
            const guest = takenBy.get(g.id);
            return (
              <li
                key={g.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[4px] border border-line bg-card px-3 py-2.5 text-sm"
              >
                <Link href={g.href ?? "#"} className="min-w-0 flex-1 basis-[200px] font-semibold hover:underline">
                  {g.name}
                </Link>
                <span className="tabular-nums">
                  {formatRand(low)}
                  {high > low ? ` – ${formatRand(high)}` : ""}
                </span>
                {guest && (
                  <form action={clearReservation} className="flex items-center gap-2">
                    <input type="hidden" name="registryId" value={registry.id} />
                    <input type="hidden" name="productId" value={g.id} />
                    <span className="text-warm">Taken by {guest}</span>
                    <ConfirmButton message={`Free up “${g.name}” so another guest can get it?`} className="text-acc underline">
                      Free up
                    </ConfirmButton>
                  </form>
                )}
                <form action={removeFromRegistry}>
                  <input type="hidden" name="registryId" value={registry.id} />
                  <input type="hidden" name="productId" value={g.id} />
                  <ConfirmButton message={`Remove “${g.name}” from this registry?`} className="text-acc underline">
                    Remove
                  </ConfirmButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="sec-title !text-2xl">Details</h2>
      <RegistryDetailsForm
        registry={{
          id: registry.id,
          name: registry.name,
          occasion: registry.occasion,
          eventDate: registry.eventDate,
          message: registry.message,
          surprise: registry.surprise,
        }}
      />

      <form action={deleteRegistry} className="mt-8">
        <input type="hidden" name="registryId" value={registry.id} />
        <ConfirmButton
          message="Delete this registry? Its link stops working and guests’ reservations are deleted."
          className="rounded-[3px] border border-[#7f1d3a] px-[18px] py-3 font-semibold text-[#fda4af] hover:border-[#fda4af]"
        >
          Delete registry
        </ConfirmButton>
      </form>
    </section>
  );
}
