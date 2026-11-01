import Link from "next/link";
import { Suspense } from "react";
import { ActiveTabs, Tabs } from "@/components/NavTabs";

export function SiteHeader({ account }: { account: React.ReactNode }) {
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
          {/* The highlighted tab depends on the page address, known only per visit. */}
          <Suspense fallback={<Tabs current={null} />}>
            <ActiveTabs />
          </Suspense>
          <li>{account}</li>
        </ul>
      </nav>
    </header>
  );
}
