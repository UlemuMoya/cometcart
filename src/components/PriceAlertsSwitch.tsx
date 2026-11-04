"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, type BrowserSubscription } from "@/lib/alert-actions";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Status = "checking" | "iphone" | "unsupported" | "blocked" | "off" | "on";

/** The browser wants the public key as bytes, not the text form. */
function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const buttonClass = "w-fit rounded-[3px] border border-line px-[18px] py-3 font-semibold hover:border-mute disabled:opacity-60";

/** "Allow notifications": a phone notification when something you saved gets cheaper. */
export function PriceAlertsSwitch() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      let next: Status;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        // iPhones and iPads only allow notifications for sites added to the home screen.
        next = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "iphone" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "blocked";
      } else {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        next = (await registration.pushManager.getSubscription()) ? "on" : "off";
      }
      if (live) setStatus(next);
    })().catch(() => live && setStatus("unsupported"));
    return () => {
      live = false;
    };
  }, []);

  if (!VAPID_KEY) return null;

  async function turnOn() {
    setBusy(true);
    setProblem("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_KEY!) });
      const result = await savePushSubscription(sub.toJSON() as BrowserSubscription);
      if ("error" in result) {
        await sub.unsubscribe();
        setProblem(result.error);
        return;
      }
      setStatus("on");
    } catch {
      setProblem("Couldn’t switch notifications on in this browser. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid max-w-[560px] gap-2">
      <p>
        <strong>Price-drop notifications{status === "on" ? ": on" : ""}.</strong>{" "}
        <span className="text-mute">
          {status === "on"
            ? "This device gets a notification when something you saved from Discover gets cheaper."
            : "Get a notification on this device when something you saved from Discover gets cheaper. At most once a day."}
        </span>
      </p>
      {status === "off" && (
        <button type="button" onClick={turnOn} disabled={busy} className={buttonClass}>
          {busy ? "Asking your browser…" : "Allow notifications"}
        </button>
      )}
      {status === "on" && (
        <button type="button" onClick={turnOff} disabled={busy} className={buttonClass}>
          {busy ? "Turning off…" : "Turn off on this device"}
        </button>
      )}
      {status === "iphone" && (
        <p className="text-sm text-warm">
          On iPhone, first add Cometcart to your Home Screen: in Safari tap Share, then Add to Home Screen. Open
          Cometcart from there and come back to this page.
        </p>
      )}
      {status === "unsupported" && (
        <p className="text-sm text-mute">This browser can’t show notifications. Try Chrome, Safari or Firefox.</p>
      )}
      {status === "blocked" && (
        <p className="text-sm text-warm">
          Notifications are blocked for Cometcart. Allow them in your browser or phone settings, then reload this page.
        </p>
      )}
      {problem && (
        <p role="status" className="text-sm text-[#fda4af]">
          {problem}
        </p>
      )}
    </div>
  );
}
