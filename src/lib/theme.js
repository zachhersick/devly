// Appearance: light/dark/system and the accent. Saved with the settings and
// mirrored in localStorage, so public/theme-init.js can apply it before the
// first paint. Blue (whiteboard marker) is the default; each swatch is the
// accent's mid shade, and styles.css holds the light and dark variants.
export const TINTS = [
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "teal", label: "Teal", color: "#14b8a6" },
  { id: "green", label: "Green", color: "#22c55e" },
  { id: "orange", label: "Orange", color: "#f97316" },
  { id: "pink", label: "Pink", color: "#ec4899" },
  { id: "violet", label: "Violet", color: "#8b5cf6" }
];

const KEY = "devly-appearance";
const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

export function isDark(theme) {
  return theme === "dark" || (theme !== "light" && Boolean(media?.matches));
}

export function applyAppearance({ theme = "system", tint = "blue" } = {}) {
  const root = document.documentElement;
  const dark = isDark(theme);
  root.classList.toggle("dark", dark);
  root.dataset.tint = TINTS.some((item) => item.id === tint) ? tint : "blue";
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.setAttribute("content", dark ? "#141415" : "#fafafa");
  try {
    localStorage.setItem(KEY, JSON.stringify({ theme, tint }));
  } catch {}
}

media?.addEventListener?.("change", () => {
  try {
    applyAppearance(JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch {}
});
