import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getCatalogue } from "@/lib/catalogue";
import { CATEGORIES } from "@/lib/categories";

const SITE = "https://www.cometcart.co.za";

// The pages search engines should know about: home, Discover and each category,
// every product in Discover (dated by its latest price check), and the public info pages.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // built fresh on each request, so new products appear straight away
  const products = await getCatalogue();
  const newest = (dates: (string | undefined)[]) =>
    dates.filter(Boolean).sort().at(-1) ?? new Date().toISOString();

  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/discover`, changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE}/discover?cat=${encodeURIComponent(c)}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE}/product/${p.id}`,
      lastModified: newest(p.offers.map((o) => o.checkedAt)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE}/list-your-shop`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/sign-up`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
