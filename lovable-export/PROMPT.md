Build the **Hey Alex Device UI** component layer and a `/components` review page. Attach the 5 images in `screenshots/`: they show the target, light and dark side by side.

## Direction
A physical device interface. Teenage Engineering hardware (OP-1, TP-7) with Braun-level contrast and restraint (Rams, ET66, T3). Light source is top-left, so every shadow falls right and down. No neumorphism (white-on-white emboss), no gradients beyond subtle key-top shading, no bouncy springs.

## Files (I'm providing these. Use them verbatim, don't restyle them.)
- `src/styles/device.css`: all tokens and component styles. Import it first in `src/index.css`.
- `src/styles/device-shadcn.css`: points shadcn's HSL tokens at this palette. Import it after shadcn's `:root` block.
- `tailwind.device.ts`: spread `deviceTheme` into `theme.extend` in `tailwind.config.ts`.
- `src/components/device/Device.tsx`: the React components: `Key`, `KeyGroup`, `Toggle`, `Rocker`, `Led`, `Display` (+ `DisplayReadout`, `DisplayDim`, `DisplayCursor`), `DeviceCard` (+ `CardRow`), `Field`, `TextInput`, `Silk`, `useClickSound`, `playClick`.
- `src/pages/Components.tsx`: the demo sheet. Add a route at `/components`.

Add these fonts to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Palette
| Token | Light | Dark | Use |
|---|---|---|---|
| `--body` | #EDEBE6 | #1C1C1C | housing |
| `--ink` | #111111 | #EDEBE6 | all labels + content text |
| `--ink-2` | #4A4741 | #A9A59D | secondary labels (still AA) |
| `--well` | #D8D5CD | #111111 | display window, inputs |
| `--signal` | #FF5A1F | #FF5A1F | the single primary action + active LED |
| `--ok` | #2E7D5B | #2E7D5B | lit "done/on" LEDs only, never text |

Theme: light by default. It follows `prefers-color-scheme`, and `data-theme="light|dark"` on any element forces a theme for that subtree.

## Type
- Labels: JetBrains Mono, uppercase, 600, 11px, tracked +0.06em. Use `<Silk>` or the `.silk` class. They read like silkscreened hardware legends.
- Content and display text: Inter, high contrast `--ink`.

## Rules (please enforce these on every future screen)
1. **Orange marks only the single most important action per screen.** That's one `<Key variant="signal">`. Toggles, focus rings and errors never use orange.
2. **Text on orange is #111, never white.** White on #FF5A1F is 3.1:1 and fails AA.
3. **Contrast first:** every text pair passes WCAG AA, and outlines and lit LEDs pass 3:1. The 00 section of `/components` measures this live, so keep it all green.
4. **Errors are bold ink, not red:** a 2px ink border, a lit orange LED, and an "ERR ·" prefix in the hint.
5. **Green is LED-only.**
6. **Motion:** key press 90ms, toggle slide 120ms, `cubic-bezier(0,0,.2,1)`. Respect `prefers-reduced-motion` (already in the CSS).
7. **Click sound** is off by default. The user turns it on with the CLICK toggle, and the choice is stored in localStorage.
8. **Layout:** grid-aligned, sections separated by thin rules, small reference numbers on panels (01, 02…).
9. Use these components instead of stock shadcn `Button` / `Switch` / `Input` / `Card`. Any other shadcn primitives you need (Dialog, Popover…) pick up the palette through `device-shadcn.css`.

## Scope
Only set up the files and the `/components` route for now. Don't redesign any other pages yet; I'll review the component sheet first.
