import type { Metadata, Viewport } from "next";
import { Allura, Cormorant_Garamond, DM_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { AccountLink, AccountLinkFallback } from "@/components/AccountLink";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: "400",
});

const DESCRIPTION =
  "Compare prices at different shops, see the cheapest at a glance, and save what you love to a wishlist you can share.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cometcart.co.za"),
  // Pages set their own title; it's shown as "Their title · Cometcart".
  title: { default: "Cometcart: find anything, compare every price", template: "%s · Cometcart" },
  description: DESCRIPTION,
  applicationName: "Cometcart",
  // The preview WhatsApp, Facebook and others show when a link is shared.
  openGraph: {
    siteName: "Cometcart",
    type: "website",
    locale: "en_ZA",
    title: "Cometcart: find anything, compare every price",
    description: DESCRIPTION,
    images: [{ url: "/app-icon/512", width: 512, height: 512, alt: "Cometcart" }],
  },
  twitter: { card: "summary" },
  // iPhones need a PNG for the home-screen icon.
  icons: { icon: "/icon.svg", apple: { url: "/app-icon/180", sizes: "180x180", type: "image/png" } },
  appleWebApp: { capable: true, title: "Cometcart", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#050b24",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className={`${dmSans.variable} ${cormorant.variable} ${allura.variable}`}>
      {/* Some browser extensions (e.g. TotalAV) add a class to <body> before the page loads. */}
      <body suppressHydrationWarning>
        <main className="mx-auto max-w-[980px] px-4 pb-24 pt-5">
          <SiteHeader
            account={
              <Suspense fallback={<AccountLinkFallback />}>
                <AccountLink />
              </Suspense>
            }
          />
          {/* The "Ask Cometcart" assistant (AssistantButton) comes back once it works (step 6). */}
          {children}
          <p className="mt-7 text-[13px] text-mute">
            Prices are checked on the date shown and can change, so always confirm on the shop’s
            site. Category photos from{" "}
            <a href="https://www.pexels.com" target="_blank" rel="noopener" className="text-acc underline">
              Pexels
            </a>
            .{" "}
            <Link href="/privacy" className="text-acc underline">
              Privacy policy
            </Link>
            {" · "}
            <Link href="/list-your-shop" className="text-acc underline">
              List your shop
            </Link>
            {" · "}
            <a
              href="mailto:cometcartonline@gmail.com?subject=Cometcart%20feedback"
              className="text-acc underline"
            >
              Send feedback
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
