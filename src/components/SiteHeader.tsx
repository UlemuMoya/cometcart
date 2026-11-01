"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/add", label: "Add a product" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-[32px] font-bold tracking-[.01em]"
      >
        <span className="orbit" aria-hidden="true" />
        Cometcart
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => {
            const current = pathname === tab.href;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={current ? "page" : undefined}
                  className={`block rounded-[3px] border px-3.5 py-[7px] ${
                    current
                      ? "btn-grad border-transparent"
                      : "border-line bg-card hover:border-mute"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
