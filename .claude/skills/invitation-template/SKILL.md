---
name: invitation-template
description: Create a complete, sellable Naila invitation template from scratch — concept, AI start/end frames and opening video (Google Flow), web assets, the guest-facing page (Doors & Arches family or a new family), motion, fonts, bilingual AR/EN, and QA recordings. Use when asked to make a new invitation template/design, roll the Alhambra pilot out to other designs, add a template family, or regenerate a template's video or assets.
---

# Making an invitation template

A template is one **cinematic opening** (a 6-second 9:16 video that goes from a closed
"before" frame to an opened "after" frame) plus a **guest page** that plays it on tap and
then lays the invitation over the opened scene. The reference implementation is
**Alhambra** (`/t/alhambra`): carved cedar doors open onto a lantern-lit reflecting pool,
the couple's names appear in the sky and mirror in the water, and an ivory arched letter
rises over the courtyard.

A template is **data, not code**: assets in `public/templates/<id>/` plus one entry in
`src/lib/templates.ts`. Code is only written when a design needs a new **family**
(a different composition), and families are reused by many designs.

## Pipeline (do the steps in order; each has a reference)

| # | Step | Output | Read |
|---|------|--------|------|
| 1 | Concept + three prompts (start, end, motion) | `out/<design>/{start_prompt,end_prompt,motion}.txt` | [references/prompts.md](references/prompts.md) |
| 2 | Generate frames + video in Google Flow, by hand | `gflow-test/batch/out/<design>/video.mp4` | [references/generation.md](references/generation.md) |
| 3 | Web assets + config entry | `public/templates/<id>/*`, entry in `templates.ts` | [references/build.md](references/build.md) |
| 4 | Tune placement + reveal timing by eye | `scene`, `revealAtMs` | [references/build.md](references/build.md#tune) |
| 5 | Motion, type and copy rules (only when touching the family) | — | [references/motion-and-type.md](references/motion-and-type.md) |
| 6 | QA: browser check, both languages, recording for review | `recordings/<id>-{en,ar}.mp4` | [references/qa.md](references/qa.md) |

For the 50 designs that already have videos (`gflow-test/batch/out/design-*/video.mp4`,
local only, gitignored), start at step 3.

## Fast path for an existing video (doors family)

```bash
python3 scripts/template-assets.py design-007 seville --category wedding
```
Paste the printed entry into `src/lib/templates.ts`, then open `public/templates/seville/end.jpg`
and set `scene` (where the names go) and `revealAtMs`. Check `/t/seville` and a named-guest
invitation in both languages, then record:
```bash
node scripts/record-invitation.mjs http://localhost:3010/t/seville recordings/seville-en.mp4 --audio public/templates/seville/opening.mp4
```

## Choosing the family

Look at the **end frame** and ask what the guest is standing in front of.

- **doors** (`src/components/families/DoorsInvitation.tsx`): any threshold that opens onto a
  scene with a calm open area for names — doors, gates, curtains, arches, windows, a veil.
  Covers most designs. Still water in the end frame → set `reflectionTop`; otherwise `null`.
- **envelope** (default, `Invitation.tsx`): the classic card; used when the video is an
  object (envelope, box, letter) rather than a place.
- **A new family** only when the end frame has no room for the names over the scene, or the
  opening is a different idea entirely (a book that turns pages, a scroll unrolling). Build it
  by copying the doors family — see [references/build.md](references/build.md#new-family).
  Aim for 3–4 families total; never one component per design.

## Non-negotiables

- **The frames carry no text.** Every prompt ends with the zero-text/zero-hands line. Names,
  dates and initials are always live HTML so they can be personalised and translated.
- **Negative space is designed in the prompt**: the start frame keeps a calm centre for the
  tap medallion; the end frame keeps a calm area (sky, wall, still water) for the names.
- **The end frame is the page background.** The video's last frame, `end.jpg`, sits under the
  video; when the video ends it fades out and the handoff is invisible. Never crop or re-grade
  one without the other.
- **Sound comes from the video.** Flow renders the doors' own foley; the motion prompt asks for
  it ("Audio: ... no speech, no music"). The couple's music fades in at the reveal.
- **Bilingual.** Every string goes through `src/lib/i18n.ts` (ar + en). Arabic gets its own
  fonts and right-to-left layout; check both, every time.
- **Google Flow is driven by hand** (a person or browser-tool workers), never by scripts.
  "Unusual activity" means stop and wait; never work around it.
- **Location is the last section** of the letter; RSVP and wishes come before it.
- Don't touch other templates' entries when adding one; don't rename existing template ids
  (events reference them).
