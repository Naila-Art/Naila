# Motion, type and copy (Doors & Arches)

Read this before changing the family's look. Per-design changes go in config, not here.

## The choreography

| t | What happens | Where |
|---|--------------|-------|
| sealed | `start.jpg` fills the screen under a top/bottom veil. Named guests see their greeting (italic display, upper third). The brass **medallion** (khatam star turning once per 60 s behind a disc with the initials) sits in the middle with "Tap to open the doors" breathing (2.8 s). Scroll is locked. | `.threshold`, `Medallion` |
| tap | Audio unlocked inside the tap (iOS), open-tracking POST, video plays **with its sound**. Threshold dissolves: opacity + blur(8px) + scale 1.08 over 700–900 ms. Veil lightens. | `open()` |
| `revealAtMs` | Stage → revealed. Names rise in the sky: each line fades from blur(14px) and 0.35 em lower, 1.4–1.6 s, staggered 0 / 280 / 520 ms; date line at 1100 ms. Reflection fades to 0.42 over 2.6 s after 900 ms, rippling (scaleY −0.8 ↔ −0.84, skew ±1.2°, 5.5 s). Music fades in over 2.4 s (quadratic) to 0.55. Scroll unlocks; the scroll cue appears after 2.2 s. | `reveal()` |
| video ends | The video fades out (500 ms) onto `end.jpg` — the same frame, so nothing visibly changes. | `data-done` |
| scroll | The scene is sticky (100svh); the ivory letter with an arched crown rises over it. The cue hides after 40 px. | `.scene`, `.letter` |
| end | The letter's arched base closes and the courtyard returns with "With love" and the names. | `.farewell` |

Easing: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` for everything that settles; linear only
for the star's rotation. One authored motion moment (the reveal); everything else is quiet.

Reduced motion: no video, straight to revealed; every animation off; transitions 1 ms.

Pitfall: rotating or scaling an SVG `<g>` with `transform-origin: center` alone uses the
**viewBox** as the reference box, so the shape orbits off-centre. Always pair it with
`transform-box: fill-box`.

## Type

| Role | Latin | Arabic |
|------|-------|--------|
| Display (names, headings, big date, italic greeting) | Libre Caslon Condensed (self-hosted, `public/fonts/`, `@font-face` in `globals.css`) | Aref Ruqaa (calligraphic) |
| Body | Instrument Sans | Amiri |
| Small caps labels (date line, units, buttons) | Instrument Sans 600, tracked 0.24–0.28 em, uppercase | Noto Kufi Arabic 500, no tracking, no uppercase |

Google Fonts are loaded in `src/app/layout.tsx` (Amiri, Noto Kufi Arabic, Instrument Sans,
Aref Ruqaa). Arabic switches via `.page[data-lang="ar"]` redefining `--display`/`--body`; any
tracked uppercase label needs an Arabic override (tracking breaks Arabic joining). Numbers in
Arabic use `ar-EG` digits from `Intl` with `TIME_ZONE` (`src/lib/time.ts`).

Names on the scene: `clamp(2.2rem, 10.5vw, 2.85rem)`, line-height 0.98, the "&" in accent
italic. Long names: check "Abdelrahman & Mariam" style pairs at 360 px wide — they must not
overflow `skyWidth`.

## The letter (section order is fixed)

1. Opening: khatam star, greeting (named guests: "We would be honoured by your presence, Mr. Karim"), personal message, names, date block (weekday · big day · month year · "at" time), venue.
2. Countdown + "Add to calendar".
3. The evening (timeline; only if `schedule`).
4. Dress code / Good to know (only if set).
5. RSVP (replies off in previews).
6. Wishes (unless `showWishes` is false).
7. **Location last** (venue, address, "Open in Maps").

Between sections: a brass hairline with a small khatam star (`Rule`). Buttons are little
doorways: `border-radius: 50% 50% 10px 10px / 44% 44% 10px 10px`, min-height 3.6 rem.
Inputs are underlines; the wishes textarea is boxed. Focus rings use the accent.

## Copy

- Arabic is written natively, never translated word for word. Formal, warm, Egyptian-friendly
  MSA ("يسعدنا تشريفكم").
- No emoji, no eyebrow labels above headings, no exclamation marks.
- Every string lives in `src/lib/i18n.ts` in both languages.
