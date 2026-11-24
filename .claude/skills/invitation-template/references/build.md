# Building the template in the app

## 1. Web assets

```bash
python3 scripts/template-assets.py <design-id> <template-id> [--name "Seville"] [--category wedding|engagement|katb_kitab] [--video path.mp4]
```

Many designs: put rows in a TSV (`design<TAB>slug<TAB>category<TAB>[end-frame]`) and run
`python3 scripts/template-assets.py --batch rows.tsv --json-dir <dir>` — it encodes **one at a
time**. Never parallelise encodes with shell `&` loops: in the non-interactive zsh the tools
use, `jobs -r` reports 0, so a "max N jobs" throttle launches everything at once (50 parallel
x264 encodes crashed a 24 GB Mac). The script also takes an exclusive lock, so stray parallel
calls queue rather than pile up.

`--end-frame N` keeps frames `[0, N)`: some Flow renders cross-fade back to the start frame in
their last ~0.5 s (020, 074, 100, 125 did). Check every video: if the last frame looks like the
first (mean abs diff of tiny grayscale frames ≈ 1 against the start, versus 20–80 for a real
opening), cut at the last frame before the fade.

From `gflow-test/batch/out/<design>/video.mp4` it writes `public/templates/<id>/`:

| File | What | Used as |
|------|------|---------|
| `opening.mp4` | H.264 High, yuv420p, CRF 23, ≤3 Mbps, AAC 96k, `+faststart` (~1.5–2 MB) | the opening, with its sound |
| `start.jpg` | first frame, 720×1280 | video poster = the threshold the guest taps |
| `end.jpg` | true last frame (`-sseof -0.3 -update 1`) | the scene behind the letter after the video fades |
| `end-blur.jpg` | 360×640, gaussian blur σ24 | desktop backdrop around the phone-width column |

It prints two snippets for `src/lib/templates.ts`: the `builtInTemplates` entry (palette from
the manifest: `[background, accent, seal, surface]`; `text` = seal mixed 62% toward black;
`revealAtMs` = handoff − 400 ms) and the `TEMPLATE_EDITORIAL_META` storefront entry (write
`nameAr` and `taglineAr` natively, in Egyptian-friendly MSA, not a literal translation).

Videos are committed under `public/` for now (the R2 move is pending); keep each under ~2.5 MB.

## 2. The config entry

```ts
{
  id: "alhambra",                 // url slug: /t/alhambra. Never rename once events use it.
  name: "Alhambra",
  category: "katb_kitab",
  family: "doors",
  videoUrl: "/templates/alhambra/opening.mp4",
  posterUrl: "/templates/alhambra/start.jpg",
  endPosterUrl: "/templates/alhambra/end.jpg",
  ambientUrl: "/templates/alhambra/end-blur.jpg",
  revealAtMs: 3600,               // names appear when the doors are open enough
  scene: { skyTop: 19, skyWidth: 58, reflectionTop: 58.5 },
  theme: { background: "#1e2d3b", surface: "#f2e6d0", text: "#2a1d12", accent: "#c89b54", seal: "#8c583a" },
}
```

Types: `Template` and `SceneLayout` in `src/lib/types.ts`. The same fields exist as columns in
`supabase/schema.sql` (`family`, `end_poster_url`, `ambient_url`, `reveal_at_ms`, `scene jsonb`).

Theme roles in the doors family: `background` = page and desktop room; `surface` = the letter's
paper; `text` = ink on the paper; `accent` = brass (rules, stars, buttons, medallion disc);
`seal` = the medallion's star and darker metal. Check `text` on `surface` and `accent` on
`surface` for contrast (≥ 4.5:1 for body text, ≥ 3:1 for the large names).

## Categories, styles and folders

Every template has a `category` (Katb Kitab, Wedding, Engagement — `CATEGORY_ORDER`) and a
`style` sub-category (`STYLE_LABELS` in `src/lib/types.ts`: Arches & Arabesque, Night & Lanterns,
Palaces & Ballrooms, Gardens & Blooms, Coast & Sea, Storybook & Travel, Paper & Seals). The
storefront (home carousel and the /create picker) filters by both through
`src/components/TemplateFilterBar.tsx`. Assets live in the same tree:
`public/templates/<katb-kitab|wedding|engagement>/<style>/<id>/` — pass `--folder wedding/coastal`
to `template-assets.py`. The `TAXONOMY` table in `catalog_a.py` is the single source for both;
add a new design there under its category and style. Keep each category balanced and each style
inside a category at 3+ designs where possible.

## The catalog (where the 50 live)

Built-in doors/paper templates are generated, not hand-edited: the source of truth is
`gflow-test/batch/templates/catalog_a.py` (theme, scene, Arabic name and storefront copy per
design; `PAPER_ENABLED` gates paper designs). Run it to write `src/lib/template-catalog.ts`; it
refuses to write when a theme fails contrast (text/surface ≥ 7, seal/surface ≥ 4.5, accent vs the
button's dark label ≥ 4.5). `templates.ts` spreads `doorsCatalog` / `doorsCatalogMeta` in.
Note the manifest palettes are NOT in a fixed order — choose every theme role by hand.

Scene fields beyond placement: `light` / `lightStart` (bright last / first frame → ink text with a
pale halo and a pale veil; measure mean luminance of the greeting band 8–30% and the label band
42–62% of start.jpg — above ~140 is light), `opens` ("doors" | "curtains" | "other": the
threshold label), `ownSeal` / `ownSealSize` (the first frame already shows a wax seal, knot or
emblem: give its centre height and diameter in % and the guest taps it, ringed by a pulse,
instead of a medallion drawn over it), and for paper `skyCenter`, `scale`, `plate`. Names never
wrap their date; cards with `scale` < 0.95 drop the weekday. Paper defaults `light` to true;
set `light: false` plus `ink` for dark paper (Minuit).

Review stills for many designs at once: `node scripts/shoot-templates.mjs <dir> <id...> --lang en|ar`
(threshold + revealed, one browser, sequential). The local dev server keeps `data/db.json` in
memory: editing the file under a running server does nothing (and can be overwritten), so record
`/t/<id>` with `--lang` instead of re-pointing demo events.

<a id="tune"></a>
## 3. Tune by eye (the step that makes it look made-for-this-design)

Open `public/templates/<id>/end.jpg` (Read it). All values are % of the 9:16 screen.

- `skyTop` / `skyWidth`: the names block (two names + "&" + the date line, about 22% of the
  height) must sit fully inside the calmest open area — sky inside an arch, a plain wall, open
  sea — and never over a bright lantern, a busy carving or the horizon line. Narrow it with
  `skyWidth` when the opening is narrow (an arch, a doorway).
- `reflectionTop`: only when the frame has still water; put it just below the waterline, so
  the mirrored names start where the reflection of the sky starts. `null` otherwise.
- `ink`: text colour on the scene. Leave it (ivory) for dusk/night scenes. For a bright day
  scene use a deep tone from the palette (often `theme.text`) — check the threshold greeting and
  "Tap to open" label too, they use it.
- `revealAtMs`: scrub the video (`ffmpeg -ss 3.4 -i opening.mp4 -frames:v 1 /tmp/f.jpg`, try a
  few times) and pick the moment the threshold is ~85% open. The names take 1.4–1.6 s to
  settle, so they land as the motion stops.

To check placement without a browser: overlay rectangles on `end.jpg` with Python (PIL) at the
chosen percentages and Read the result; then confirm in the browser (see qa.md).

## 4. How it renders (file map)

- `src/components/Invitation.tsx` — routes by `template.family` (`"doors"` → `DoorsInvitation`,
  otherwise the envelope). `InvitationProps` is the contract every family receives: names,
  date, venue, greeting (named guests), personal message, schedule, dress code, notes,
  calendar/maps links, RSVP/wish wiring, music URL, strings, lang.
- `src/components/families/DoorsInvitation.tsx` + `doors.module.css` — the doors family.
- `src/components/InvitationPage.tsx` — live invitations `/i/<slug>[/<guest token>]`.
- `src/components/TemplatePreview.tsx` — storefront preview `/t/<id>` with bilingual sample data
  (replies off).
- `src/components/{RsvpForm,WishForm,Countdown}.tsx` — shared, restyled per family through the
  `ui` class map (`formUi` at the bottom of the family component).
- `src/lib/i18n.ts` — all strings, ar + en.
- `src/app/layout.tsx` + `src/app/globals.css` — fonts (see motion-and-type.md).

<a id="new-family"></a>
## 5. A new family (only when the doors composition can't hold the design)

1. Copy `DoorsInvitation.tsx` / `doors.module.css` to `families/<Name>Invitation.tsx` /
   `<name>.module.css`. Keep the stage machine (`sealed → opening → revealed`), the iOS audio
   unlock inside the tap, the open-tracking POST, the `VIDEO_MAX_MS` fallback, the
   reduced-motion skip, the scroll lock until revealed, and every section of the letter.
2. Change the composition, not the contract: where names land, what the letter's paper and
   ornaments look like (the doors family uses an arched crown, a khatam star and brass rules —
   a new family needs its own ornament language drawn from its designs).
3. Add the value to `TemplateFamily` in `types.ts`, the check constraint in `schema.sql`, and
   the route in `Invitation.tsx`.
4. New strings → `i18n.ts`, both languages.
5. Run the QA in qa.md on two designs of the family, not one.
