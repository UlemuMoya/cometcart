import type { MetadataRoute } from "next";

// Tells search engines what to look at: products, Discover and the public pages,
// not people's accounts, wishlists, owner pages or "Visit shop" redirects.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/wishlist",
        "/add",
        "/manage",
        "/registry",
        "/w/",
        "/go/",
        "/auth/",
        "/forgot-password",
        "/reset-password",
        "/product/*/edit",
        "/discover?q=",
        "/discover?*q=",
      ],
    },
    sitemap: "https://www.cometcart.co.za/sitemap.xml",
    host: "https://www.cometcart.co.za",
  };
}
