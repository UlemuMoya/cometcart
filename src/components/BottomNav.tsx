"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Phone-only tabs along the bottom of the screen, within thumb reach. Wider screens keep the top tabs.
const TABS = [
  { href: "/", label: "Home", icon: <path d="M3 11 12 4l9 7v9H3z" /> },
  {
    href: "/discover",
    label: "Discover",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
  },
  { href: "/wishlist", label: "Wishlist", icon: <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z" /> },
  {
    href: "/registry",
    label: "Registries",
    icon: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="1" />
        <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1" />
      </>
    ),
  },
  { href: "/add", label: "Add link", icon: <path d="M5 12h14M12 5v14" /> },
];

/** `current` is the highlighted tab, or null while the page address isn't known yet. */
export function BottomTabs({ current }: { current: string | null }) {
  return (
    <nav
      aria-label="Main (phone)"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[rgba(8,16,52,.97)] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const on = current === tab.href || (tab.href !== "/" && !!current?.startsWith(`${tab.href}/`));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-xs ${
                  on ? "font-semibold text-warm" : "text-mute"
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  return <BottomTabs current={usePathname()} />;
}
