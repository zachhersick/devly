// Keeps the screen on while you're in a practice step, so it doesn't lock
// between sets. Re-requested when the app returns to the foreground, since
// the browser drops the lock whenever the page is hidden.
import { useEffect } from "react";
import { settings } from "./store.js";

export function useWakeLock() {
  useEffect(() => {
    if (!settings.value.keepAwake || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let stopped = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (stopped) sentinel.release();
          else lock = sentinel;
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", request);
      lock?.release().catch(() => {});
    };
  }, []);
}
