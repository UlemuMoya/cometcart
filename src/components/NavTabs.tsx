"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/registry", label: "Registries" },
  { href: "/add", label: "Paste a link" },
];

/** The main tabs. `current` is the highlighted tab, or null while it's unknown. */
export function Tabs({ current }: { current: string | null }) {
  return TABS.map((tab) => {
    // Also highlight the tab on its inner pages, e.g. Registries on /registry/123.
    const isCurrent = current === tab.href || (tab.href !== "/" && !!current?.startsWith(`${tab.href}/`));
    return (
      <li key={tab.href}>
        <Link
          href={tab.href}
          aria-current={isCurrent ? "page" : undefined}
          className={`block rounded-[3px] border px-3.5 py-[7px] ${
            isCurrent ? "btn-grad border-transparent" : "border-line bg-card hover:border-mute"
          }`}
        >
          {tab.label}
        </Link>
      </li>
    );
  });
}

export function ActiveTabs() {
  return <Tabs current={usePathname()} />;
}
