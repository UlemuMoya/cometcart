import type { Metadata, Viewport } from "next";
import { Allura, Cormorant_Garamond, DM_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { AccountLink, AccountLinkFallback } from "@/components/AccountLink";
import { AssistantButton } from "@/components/AssistantButton";
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

export const metadata: Metadata = {
  title: "Cometcart",
  description: "Find anything. Compare every price. Save what you love.",
  applicationName: "Cometcart",
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
          {children}
          <p className="mt-7 text-[13px] text-mute">
            Early preview with made-up sample products, shops and prices. Links don’t go to
            real shops yet. Photos from{" "}
            <a href="https://www.pexels.com" target="_blank" rel="noopener" className="text-acc underline">
              Pexels
            </a>
            .{" "}
            <Link href="/privacy" className="text-acc underline">
              Privacy policy
            </Link>
          </p>
        </main>
        <AssistantButton />
      </body>
    </html>
  );
}
