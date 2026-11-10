"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

// The tiles take turns, always in this order, so no two neighbours share a colour:
// green, violet, teal, pink, then green again.
const COLOURS = [
  ["#0b5f4a", "#16a679"],
  ["#2f2480", "#7c4de0"],
  ["#0a4f63", "#1aa7bd"],
  ["#6b2470", "#c04fc2"],
];

const discover = (cat: string, max?: number) =>
  `/discover?cat=${encodeURIComponent(cat)}${max ? `&max=${max}` : ""}`;

const optionClass = "flex h-[38px] items-center justify-center rounded-[3px] border border-line bg-bg text-sm hover:border-mute";

/** "Shop by category": tap a tile to flip it and pick a budget, or see the whole category. */
export function CategoryFlipTiles() {
  const [flipped, setFlipped] = useState<string | null>(null);
  const back = useRef<HTMLButtonElement>(null);
  const fronts = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastFlipped = useRef<string | null>(null);

  // Keyboard and screen-reader users stay on the tile they flipped, front or back.
  useEffect(() => {
    if (flipped) back.current?.focus();
    else if (lastFlipped.current) fronts.current[lastFlipped.current]?.focus();
    lastFlipped.current = flipped;
  }, [flipped]);

  return (
    <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-8 md:overflow-visible md:px-0">
      {CATEGORIES.map((c, i) => {
        const [from, to] = COLOURS[i % COLOURS.length];
        return (
          <li key={c} className="relative h-44 w-[148px] flex-none md:h-40 md:w-auto">
            {flipped === c ? (
              <div className="flip-in absolute inset-0 flex flex-col gap-1 rounded-[4px] border border-[#2a3f8f] bg-card p-2">
                <button
                  ref={back}
                  type="button"
                  onClick={() => setFlipped(null)}
                  aria-label={`Back to the ${c} tile`}
                  className="flex h-10 items-center gap-1.5 px-1 text-left font-display text-[21px] font-semibold"
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  {c}
                </button>
                <Link href={discover(c, 500)} className={optionClass}>
                  Under R500
                </Link>
                <Link href={discover(c, 1000)} className={optionClass}>
                  Under R1 000
                </Link>
                <Link href={discover(c)} className="btn-grad flex h-[38px] items-center justify-center rounded-[3px] text-sm font-medium">
                  See all<span className="sr-only"> {c}</span>
                </Link>
              </div>
            ) : (
              <button
                ref={(el) => {
                  fronts.current[c] = el;
                }}
                type="button"
                onClick={() => setFlipped(c)}
                aria-label={`${c}: show budget options`}
                style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
                className="flip-in absolute inset-0 flex items-end rounded-[4px] p-3.5 text-left text-white md:p-3"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-3 opacity-80">
                  <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                <span className="font-display text-[25px] font-semibold [text-shadow:0_1px_6px_rgba(0,0,0,.35)] md:text-[19px] lg:text-[21px]">{c}</span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
