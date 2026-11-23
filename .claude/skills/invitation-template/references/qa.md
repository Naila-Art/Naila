# QA before a template ships

Dev server: `.claude/launch.json` → "naila-dev" (`npm run dev -- -p 3010`); start it with the
browser pane's `preview_start`, not Bash.

## URLs

- `/t/<id>` — storefront preview, bilingual sample data, replies off.
- `/i/<slug>/<guest token>` — a live named-guest invitation. Local demo data lives in
  `data/db.json` (untracked): point a demo event's `templateId` at the new template to test
  live RSVP and wishes, then put it back.

## Checklist (both `ar` and `en`, at 390×844 and at desktop width)

1. Threshold: medallion centred and **stays centred while the star turns** (compare the
   bounding-box centres of the star `<g>` and the disc over a few seconds); greeting readable;
   nothing important under the medallion.
2. Tap: doors sound plays; threshold dissolves; no flash between poster and video.
3. Reveal: names land in the calm area, never over lanterns or the horizon; reflection (if
   any) starts at the waterline; no seam when the video hands off to `end.jpg`.
4. Letter: every section present and in order; long names don't overflow; Arabic is RTL with
   Arabic digits; buttons and inputs work; RSVP saves on a live invitation.
5. Farewell shows over the scene; the scroll cue is gone by then.
6. Desktop: phone-width column over the blurred `end-blur.jpg` room.
7. Reduced motion (emulate `prefers-reduced-motion: reduce`): opens straight to revealed.
8. Other templates still render (`/t/amalfi` for the envelope family).
9. `npx tsc --noEmit -p .` and `npx eslint src` clean; no errors in the dev server log.

## Recording for review (the owner reviews on a phone)

```bash
node scripts/record-invitation.mjs "http://localhost:3010/i/demo-en/<token>" recordings/<id>-en.mp4 --audio public/templates/<id>/opening.mp4
node scripts/record-invitation.mjs "http://localhost:3010/i/demo/<token>"    recordings/<id>-ar.mp4 --audio public/templates/<id>/opening.mp4
```

It records at the phone's CSS size (390×844) and upscales to 780×1688 — Playwright pads
rather than scales a larger `recordVideo.size`, which leaves the page in a corner. The
door sound is laid back in at the tap time (recordings are silent). Read the generated
`*-sheet.jpg` contact sheet before sending, then send the MP4s with `SendUserFile`.
`recordings/` is local output; don't commit it.
