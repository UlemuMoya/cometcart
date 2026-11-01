"use client";

import { useState } from "react";

// Placeholder until photo search arrives in step 7.
export function PhotoButton() {
  const [note, setNote] = useState("");
  return (
    <>
      <button
        type="button"
        onClick={() => setNote("Photo search comes soon. For now, describe what you want.")}
        className="rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute"
      >
        Photo
      </button>
      <p role="status" className="basis-full text-sm text-mute empty:hidden">
        {note}
      </p>
    </>
  );
}
