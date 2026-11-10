"use client";

import { useSyncExternalStore } from "react";

// Black Friday 2026, South African time. After it, the note disappears.
const BLACK_FRIDAY = Date.parse("2026-11-27T00:00:00+02:00");
const DAY = 24 * 60 * 60 * 1000;

const noChanges = () => () => {};
const daysLeft = () => Math.ceil((BLACK_FRIDAY - Date.now()) / DAY);

/** "Black Friday is on 27 November, in 16 days", worked out on the visitor's own clock (not the server's). */
export function BlackFridayNote() {
  const days = useSyncExternalStore(noChanges, daysLeft, () => null);
  if (days === null || days < 0) return null;
  const when = days > 1 ? `in ${days} days` : days === 1 ? "tomorrow" : "it’s today";
  return <> · Black Friday is on 27 November, {when}</>;
}
