import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true
      }
    })
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 4340, strictPort: true },
  build: { target: "es2022", chunkSizeWarningLimit: 900 }
});
