# Hey Alex Device UI: Lovable export

```
PROMPT.md                         paste into Lovable chat (attach screenshots/*)
tailwind.device.ts                Tailwind theme extension (tokens → CSS vars)
src/styles/device.css             tokens + all component styles (source of truth)
src/styles/device-shadcn.css      maps shadcn HSL tokens to this palette
src/components/device/Device.tsx  React + TS components
src/pages/Components.tsx          /components demo sheet (light | dark | split)
screenshots/                      the target render (1440px, light + dark)
reference/                        the original static HTML sheet. Open reference/components/index.html
```

Verified in a stock Vite + React 18 + TypeScript (strict) + Tailwind 3 app with the `@/` alias, the same stack Lovable generates. `tsc` passes, the build passes, there are no console errors, and all 24 contrast checks pass.

## Getting it into Lovable

**A. GitHub sync (exact).** If the Lovable project is connected to GitHub, copy `src/` and `tailwind.device.ts` into that repo and push. Then paste `PROMPT.md` and ask Lovable to wire the imports, fonts and route.

**B. Chat only.** Paste `PROMPT.md` and attach the 5 screenshots. Then send each file as its own follow-up message ("Create `src/styles/device.css` with exactly this content:" followed by the file). Do it in this order: `device.css`, `device-shadcn.css`, `tailwind.device.ts`, `Device.tsx`, `Components.tsx`. Sending the files keeps the result exact; Lovable re-deriving them from screenshots will drift.
