"use client";

import { useEffect, useRef, useState } from "react";

type Message = { from: "bot" | "me"; text: string };

const GREETING =
  "Hi, I’m your Cometcart assistant. Tell me what you’re after and your budget. I only suggest products from the Cometcart catalogue.";
const NOT_YET =
  "I’m not switched on yet. I’ll be able to help once the catalogue is ready. For now, try the search bar.";

// Floating "Ask Cometcart" button and chat panel.
// Step 1: the panel works, but replies are a fixed message. The real
// assistant (Anthropic API, server side only) arrives in step 6.
export function AssistantButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "me", text }, { from: "bot", text: NOT_YET }]);
    setDraft("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        className="btn-grad fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 z-20 rounded-full px-5 py-[13px] font-semibold shadow-[0_6px_20px_rgba(20,10,60,.3)]"
      >
        ✦ Ask Cometcart
      </button>

      <aside
        id="assistant-panel"
        aria-label="Shopping assistant"
        hidden={!open}
        className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] right-4 z-20 max-h-[68vh] w-[min(380px,calc(100%-32px))] flex-col overflow-hidden rounded-[4px] border border-line bg-card shadow-[0_10px_30px_rgba(20,10,60,.3)] [&:not([hidden])]:flex"
      >
        <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
          <strong>Shopping assistant</strong>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="px-1"
          >
            ✕
          </button>
        </div>
        <div ref={logRef} aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[92%] rounded-[14px] px-3 py-[9px] text-[15px] ${
                m.from === "me" ? "self-end bg-acc text-bg" : "self-start bg-bg"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-line p-2.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. a lamp under R700"
            aria-label="Ask the assistant"
            className="min-w-0 flex-1 rounded-[3px] border border-line bg-card px-3 py-[11px] placeholder:text-mute"
          />
          <button type="submit" className="btn-grad rounded-[3px] px-4 font-semibold">
            Send
          </button>
        </form>
      </aside>
    </>
  );
}
