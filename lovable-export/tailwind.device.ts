/**
 * Device UI token bridge for Tailwind. Merge into tailwind.config.ts:
 *
 *   import { deviceTheme } from "./tailwind.device";
 *   export default { ..., theme: { extend: { ...deviceTheme } } }
 *
 * Every color points at a CSS variable from src/styles/device.css, so
 * light/dark follow [data-theme] and prefers-color-scheme automatically.
 */
export const deviceTheme = {
  colors: {
    body: "var(--body)",
    ink: { DEFAULT: "var(--ink)", 2: "var(--ink-2)" },
    rule: { DEFAULT: "var(--rule)", strong: "var(--rule-strong)" },
    well: { DEFAULT: "var(--well)", ink: "var(--well-ink)", "ink-2": "var(--well-ink-2)" },
    key: { DEFAULT: "var(--key)", line: "var(--key-line)", edge: "var(--key-edge)", ink: "var(--key-ink)" },
    signal: { DEFAULT: "var(--signal)", ink: "var(--signal-ink)", edge: "var(--signal-edge)" },
    ok: "var(--ok)",
  },
  fontFamily: {
    label: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    text: ["Inter", "Helvetica Now Text", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
  },
  letterSpacing: { silk: "0.06em" },
  borderRadius: { key: "6px" },
  transitionDuration: { press: "90ms", slide: "120ms" },
  transitionTimingFunction: { device: "cubic-bezier(0, 0, .2, 1)" },
};
