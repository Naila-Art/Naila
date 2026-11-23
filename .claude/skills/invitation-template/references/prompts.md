# Concept and prompts

Each design needs one idea and three prompts. The 176 planned designs live in
`gflow-test/batch/manifest.json` (local, gitignored): `id`, `design_name`, `archetype`,
`vibe`, `palette`, `handoff`, `start_prompt`, `end_prompt`, `motion_prompt`. For those, the
prompts are already written (`out/<id>/*.txt`). For a brand-new design, write them as below.

## The concept (one sentence)

`<threshold>` opens onto `<place>` at `<time of day>`. The threshold is what the guest
taps; the place is where the invitation lives. Good thresholds have a clear before/after
and a symmetrical centre: carved doors, wrought-iron gates, a silk curtain, a garden arch
with a veil of wisteria, shutters, a lacquered screen. Places need a calm area for names:
open sky, a plain wall, a still pool or sea.

Also decide the **palette** (4 hex values, in this order): background (the scene's darkest
dominant tone), accent (metal/light — brass, gold, copper), seal (the threshold's material
tone — wood, lacquer), surface (the paper the letter is printed on — ivory, stucco, linen).

## Start frame prompt (the closed threshold)

Structure, in this order:
1. Format and camera: `Strict 9:16 vertical mobile composition with dead-center architectural symmetry, photographed on a 50mm cinema prime lens at f/2.8.`
2. The threshold, in material detail (wood species, carving, metalwork, frame).
3. Light (source + direction + colour) and the **reserved centre**: `leaving a calm, uncluttered ... centerpiece with clean negative space for a tap-to-open overlay.`
4. Texture/mood words (2–3).
5. The ban line, always verbatim: `Strictly zero text, zero letters, zero numbers, zero initials, zero logos, zero watermarks, zero human hands.`

Alhambra:
> Strict 9:16 vertical mobile composition with dead-center architectural symmetry, photographed on a 50mm cinema prime lens at f/2.8. Monumental closed double doors of aged carved Andalusian cedarwood inlaid with geometric star marquetry and hand-hammered antique brass studs, framed inside a sculpted gypsum horseshoe arch with intricate muqarnas honeycomb carvings. Warm amber light from pierced brass wall lanterns grazes the relief woodwork, leaving a calm, uncluttered shadowed wood centerpiece with clean negative space for a tap-to-open overlay. Ultra-tactile wood grain, subtle patinated bronze sheen, serene golden-hour-to-twilight atmosphere. Strictly zero text, zero letters, zero numbers, zero initials, zero logos, zero watermarks, zero human hands.

## End frame prompt (the opened scene)

1. Lock the camera to the start frame: `Strict 9:16 vertical mobile composition matching the exact 50mm camera axis, <same framing>, and <same lighting>.`
2. The threshold in its open state, still in frame at the edges (this sells the continuity).
3. The revealed place, with depth (foreground → middle → horizon).
4. The **reserved name area**: `leaving the calm central sky and glassy water reflection completely clear and uncluttered for web typography.` Name where the space is (sky, wall, water).
5. The ban line.

Alhambra:
> Strict 9:16 vertical mobile composition matching the exact 50mm camera axis, carved stucco arch framing, and twilight lighting. The cedarwood double doors stand fully swung inward along both edges, revealing a breathtaking Alhambra courtyard in deep blue dusk. A long mirror-still turquoise reflecting pool stretches toward slender marble colonnades and the silhouetted Sierra Nevada peaks under a star-dusted indigo sky. Warm pierced brass lanterns glow softly along the portico, leaving the calm central sky and glassy water reflection completely clear and uncluttered for web typography. Strictly zero text, ...

## Motion prompt (start → end in 6 s)

Timed beats, then audio, then bans. The `handoff` (when the threshold is fully open) is
usually 4.0 s; it sets `revealAtMs` later (handoff − 400 ms).

> Single continuous cinematic take from start frame to end frame. 0.0s to 1.0s: Poised twilight stillness as warm amber candlelight gently flickers ... 1.0s to 4.0s: Without any hands visible, the heavy carved cedar double doors unlatch and swing smoothly inward in perfect symmetry while a slow, silky gimbal dolly glides gently forward through the horseshoe arch, unveiling ... 4.0s to 5.6s: The doors rest flush against the colonnade and the camera settles into serene, breath-like stillness with faint water shimmer. Audio: Soft muted heavy-wood creak, distant gentle courtyard fountain trickle, warm night air; no speech, no music. Strictly no text, no letters, no numbers, no hands, no sudden cuts, no warping or flickering.

Rules that matter:
- Never name the model ("Veo 3.1") in the prompt; say "cinematic".
- The last 1.5 s must be **still** — that still is `end.jpg`, the page background.
- Ask for sound effects only, never music or speech (the couple picks the music).
- No people. Modest imagery: no couples, no bodies, no hands.
