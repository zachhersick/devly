import { effect } from "@preact/signals-core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { load, settings } from "./lib/store.js";
import { applyAppearance } from "./lib/theme.js";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

load().then(() => {
  effect(() => applyAppearance({ theme: settings.value.theme, tint: settings.value.tint }));
});

// Locally the service worker would keep serving the previous build, so it
// only runs there with ?sw in the URL (for testing offline mode).
const local = ["localhost", "127.0.0.1"].includes(location.hostname) && !new URLSearchParams(location.search).has("sw");

if ("serviceWorker" in navigator) {
  if (local) navigator.serviceWorker.getRegistrations().then((list) => list.forEach((r) => r.unregister())).catch(() => {});
  else import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {});
}
