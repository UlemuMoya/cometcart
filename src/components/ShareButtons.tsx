"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
// The phone's own share menu (WhatsApp, Instagram, SMS…) exists on most phones, not on most computers.
const canShareNatively = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

const ghost =
  "inline-flex items-center gap-1.5 rounded-[3px] border border-line px-3.5 py-2 text-sm font-semibold hover:border-mute";

/** Share a link: the phone's share menu (where available), WhatsApp, copy link and email. */
export function ShareButtons({
  url,
  title,
  text,
  primary = false,
}: {
  url: string;
  title: string;
  /** The message to send with the link, e.g. "My wishlist on Cometcart". */
  text: string;
  /** Show "Copy link" as the main (gradient) button. */
  primary?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const native = useSyncExternalStore(noSubscribe, canShareNatively, () => false);
  const message = `${text} ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {native && (
        <button
          type="button"
          className={ghost}
          onClick={() => navigator.share({ title, text, url }).catch(() => {})}
        >
          <span aria-hidden="true">📤</span> Share…
        </button>
      )}
      <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener" className={ghost}>
        <span aria-hidden="true">💬</span> WhatsApp<span className="sr-only"> (opens in a new tab)</span>
      </a>
      <button
        type="button"
        onClick={copy}
        className={primary ? "btn-grad rounded-[3px] px-3.5 py-2 text-sm font-semibold" : ghost}
      >
        <span aria-hidden="true">🔗</span> <span aria-live="polite">{copied ? "Copied ✓" : "Copy link"}</span>
      </button>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`} className={ghost}>
        <span aria-hidden="true">✉️</span> Email
      </a>
    </div>
  );
}
