# Naila × Cordially — Pixel-Perfect Visual & Motion Design System

> **Source of Truth for Complete Frontend & UI Redesign**
> Replicating `https://www.cordially.io/` pixel-for-pixel across visual identity, typography, layout geometry, atmospheric layering, and scroll-choreographed motion design — rebuilt from scratch for **Naila** (`digital-invitation`) across every customer, guest, client-management, and admin surface.

---

## 1. Reference Inspection & Frame-by-Frame Capture Archive

Every token, curve, timing constant, transform matrix, and layer order in this specification was extracted directly from live browser inspection, DOM/CSSOM auditing, and frame-by-frame video analysis of `https://www.cordially.io/` across desktop (`1536×960`, `1440×900`), mobile (`390×844`), and onboarding (`/start`) views.

### Captured Recordings & Verified States
1. **Full Landing Walkthrough Recording (`1536×960`, 291s MP4)** — Captured initial load, hero photo crossfades, desktop/mobile 3D device preview swap, dual-path scroll-drawn SVG journey ribbon, 3-state `dot → off → on` switch flip + ivory reveal, Templates `Carousel ↔ Grid` view toggle, Save the Dates `4:5` stationery carousel, 380svh Pinned Manifesto word illumination + light-to-dark canvas morph, 6-card Features Bento Grid with spinning globe video, 50/50 Dark/Sand Pricing & Dual-Marquee Reviews split, FAQ accordion open/close transitions, and Monumental Cloud Footer + header handoff.
2. **Fresh First-Visit Intro Curtain Recording (`1440×900`, cleared `localStorage`)** — Verified character-by-character `LetterRevealText` blur/slide entrance on `#29231f` curtain (`0.055s` stagger, `0.24s` duration), `900ms` dwell, and vertical curtain wipe (`translateY(-100%)`) into the 6-group staggered hero unblur cascade.
3. **Mobile Responsive Capture (`390×844`)** — Verified bottom-anchored hero stack, compact top bar (`32px` circular language switcher + currency pill), full-width stacked CTA buttons with recessed trial tab, and mobile-specific dual journey SVG path (`viewBox="0 0 390 3580"`).
4. **Onboarding Studio Capture (`https://www.cordially.io/start`, `1440×900`)** — Verified dual-card floating workspace over blurred warm stationery background + dot grid, segmented 4-step progress bar, live preview browser frame, and prev/pause/next preview controls — adapted directly for Naila's `/create` builder and `/request` custom concierge flow.

---

## 2. Design Philosophy & Aesthetic Direction

- **Editorial Stationery Luxury**: The entire experience reads like heavy cotton letterpress stationery paired with a fashion editorial magazine — never SaaS dashboard chrome.
- **Tactile Light & Dark Rhythm**: Opens in moody, candlelit noir photography (`#120d10`), breaks cleanly into sunlit warm cream (`#fcf7ed`) via a literal mechanical switch flip, plunges back into deep espresso charcoal (`#29231f`) during the pinned manifesto climax, resurfaces onto cream for features/FAQ, and closes inside painterly pastel clouds.
- **Physical Depth Without Clutter**: Depth is achieved through multi-layer progressive backdrop blurs, `mix-blend-mode: multiply` watercolor editorial props peeking from viewport edges, subtle micro-dotted texture grains, inset bevels on recessed CTA tabs, and true 3D CSS `perspective(1400px)` device stacking.
- **Bilingual Native Support (EN ↔ العربية)**: Defaults to English (`LTR`) to render `Libre Caslon Condensed` + `Instrument Sans` at 100% pixel-parity with Cordially, while the persistent floating Language Switcher seamlessly mirrors the entire storefront into natural Egyptian/Modern Arabic (`RTL`) with calligraphic `Amiri` editorial display headlines paired with refined `IBM Plex Sans Arabic` UI/body copy.

---

## 3. Color & Surface Token System

All legacy styles (`#f4ede3`, `#3b2a22`, etc.) are discarded and replaced with the exact Cordially token palette:

| Token Name | Value | Usage |
|---|---|---|
| `--bg-noir` | `#120d10` | Hero wrapper base canvas, dark focus ring offset |
| `--bg-espresso` | `#29231f` | Intro curtain, Manifesto dark morph target, Dark pricing card, Domain preview screen |
| `--bg-cream` | `#fcf7ed` | Primary light page canvas, Manifesto light phase, Footer canvas, Dark-button text |
| `--bg-ivory` | `#fffaf1` | Elevated feature cards, Review cards, Toggle pills, Carousel nav buttons, Form inputs |
| `--bg-sand` | `#f6edd7` | Reviews container card, Feature icon badges, Save-the-Date inner mat, Hover surface |
| `--bg-frame` | `#eee3cf` | Template & Save-the-Date media container base fill |
| `--bg-device` | `#171214` | Desktop browser & phone inner viewport frame |
| `--bg-device-bar` | `#251d21` | macOS browser chrome top bar (`h: 40px`) |
| `--bg-phone-bezel` | `#0c0a0b` | iPhone outer bezel (`padding: 0.42rem`) |
| `--ink-primary` | `#2f241b` | Primary dark headings, body ink, dark primary CTA pill background, footer wordmark |
| `--ink-body` | `#493b30` | Review quote copy, rich paragraph reading text |
| `--ink-secondary` | `#675446` | FAQ lead copy, FAQ answer copy |
| `--ink-muted` | `#76614d` | Italic serif subtitles, template descriptions, feature descriptions, rating caption |
| `--ink-dark-hover` | `#4a3828` | Primary dark CTA hover fill |
| `--accent-bronze` | `#8a5a2b` | Eyebrow labels, switch ON accent text, FAQ numbers, icon strokes, focus rings |
| `--accent-amber` | `#b7793f` | 5-star review icons on light cards |
| `--accent-star-hero` | `#f3d8a7` | 5-star hero social proof badge icons |
| `--accent-champagne` | `#f3e7db` | Hero primary CTA pill fill, hero feature bullets |
| `--accent-peach-gold` | `#f1cfaa` | Dark card eyebrow, badge border/text, step numbers `01/02/03` |
| `--mac-red` / `--mac-yellow` / `--mac-green` | `#ff7c72` / `#f5c451` / `#65c466` | macOS window traffic lights (`10px` circles) |

### Atmospheric Overlay Gradients
- **Hero Tone Overlay**:
  ```css
  background:
    radial-gradient(circle at top, rgba(217, 172, 156, 0.22), transparent 38%),
    linear-gradient(180deg, rgba(8, 6, 8, 0.28), rgba(8, 6, 8, 0.42) 30%, rgba(8, 6, 8, 0.72) 72%, rgba(8, 6, 8, 0.90));
  ```
- **Hero Contrast Veil**: `background: rgba(0, 0, 0, 0.18); backdrop-filter: blur(2px);`
- **Switch OFF Warm Taupe Veil**:
  ```css
  background: linear-gradient(180deg, rgba(35, 25, 27, 0.18) 0%, rgba(104, 80, 73, 0.66) 52%, rgba(166, 137, 123, 0.74) 100%);
  ```
- **Header Wash (Light tone over dark hero)**: `linear-gradient(to bottom, rgba(18, 13, 16, 0.45) 0%, transparent 100%)`
- **Header Wash (Dark tone over cream page)**: `linear-gradient(to bottom, rgba(252, 247, 237, 0.62) 0%, transparent 100%)`
- **Card Bottom Scrim**: `linear-gradient(180deg, transparent 55%, rgba(41, 35, 31, 0.12))`

### Recessed Trial CTA Tab Surface (`MarketingTrialCta`)
- **Dark Tab (under light/cream primary pill)**:
  - `background-color: #343436`
  - `background-image: radial-gradient(rgba(255,255,255,0.04) 0.5px, transparent 0), linear-gradient(#202022, #3c3c3f)` (`background-size: 3px 3px, 100% 100%`)
  - `border-top: 1px solid rgba(255,255,255,0.19)`
  - `box-shadow: inset 0 5px 9px rgba(0,0,0,0.565), inset 0 -2px 3px rgba(255,255,255,0.125), inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(255,255,255,0.05)`
  - `color: #f5f5f5`
- **Paper Tab (under dark `#2f241b` primary pill)**:
  - `background-color: #f5f0e8`
  - `background-image: radial-gradient(rgba(47,36,27,0.07) 0.5px, transparent 0), linear-gradient(#e6ded2, #f7f2e9)` (`background-size: 3px 3px, 100% 100%`)
  - `border-top: 1px solid rgba(47,36,27,0.19)`
  - `box-shadow: inset 0 5px 9px rgba(47,36,27,0.22), inset 0 -2px 3px rgba(255,255,255,0.69), inset 1px 0 0 rgba(47,36,27,0.07), inset -1px 0 0 rgba(47,36,27,0.07)`
  - `color: #2f241b`

---

## 4. Typography System

### Font Stacks
- **Display Serif (`--font-display`)**: `"Libre Caslon Condensed", "Baskerville", "Times New Roman", serif`
  - Self-hosted `.woff2` files in `/public/fonts/libre-caslon-condensed/` (`Regular` & `Italic`, `Latin` & `LatinExt`, `font-display: block` for italic wordmark, `swap` for regular).
- **UI & Body Sans (`--font-sans`)**: `"Instrument Sans", "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif` (`400`, `500`, `600`, `700`).
- **Arabic Display (`--font-arabic-display`)**: `"Amiri", "Traditional Arabic", Georgia, serif` (activated under `[dir="rtl"]` / `lang="ar"` and on Arabic tier/editorial names).
- **Arabic Body (`--font-arabic`)**: `"IBM Plex Sans Arabic", "Amiri", sans-serif` (weights `300`, `400`, `500`, `600`).

### Complete Type Scale

| Role | Family / Style | Size (`clamp`) | Line-Height | Tracking | Weight |
|---|---|---|---|---|---|
| Footer Monumental Wordmark | Display Italic | `clamp(7rem, 23vw, 22rem)` | `0.70` | `-0.075em` | `400` |
| Switch Narrative Headline | Display Regular | `clamp(2.75rem, 7.2vw, 6.8rem)` | `0.94` | `-0.05em` | `400` |
| Pinned Manifesto Copy | Display Regular + Italic | `clamp(2.5rem, 6.4vw, 6.5rem)` | `0.98` | `-0.045em` | `400` |
| FAQ Display H2 | Display Regular | `clamp(3.25rem, 6vw, 6.25rem)` | `0.88` | `-0.05em` | `400` |
| Showcase Section H2 | Display Regular | `clamp(2.7rem, 6vw, 5.6rem)` | `0.94` | `-0.045em` | `400` |
| Hero H1 (`max-w-[12ch]`) | Display Regular | `clamp(2.75rem, 12vw, 3.5rem)` → `lg: clamp(3.5rem, 5.4vw, 5.4rem)` | `0.94` | `-0.04em` | `400` |
| Pricing Dark Card H2 | Display Regular | `clamp(2.75rem, 5.4vw, 5.25rem)` | `0.90` | `-0.045em` | `400` |
| Features Section H2 | Display Regular | `clamp(2.5rem, 4.6vw, 4.25rem)` | `0.94` | `-0.04em` | `400` |
| Reviews Right Card H3 | Display Regular | `clamp(2.35rem, 4vw, 4rem)` | `0.94` | `-0.04em` | `400` |
| FAQ Question Trigger | Display Regular | `1.65rem` → `sm: 2rem` → `lg: 2.15rem` | `1.02` | `-0.03em` | `400` |
| Pricing Step Title | Display Regular | `1.5rem` → `sm: 1.875rem` | `1.0` | `-0.025em` | `400` |
| Navbar Wordmark | Display Regular | `2rem` (`32px`) | `1.0` | `-0.05em` | `400` |
| Showcase / Feature Card H3 | Display Regular | `1.65rem` (`26.4px`) | `0.95` / `1.2` | `-0.025em` | `400` |
| Showcase Italic Subtitle | Display Italic | `1.25rem` → `sm: 1.5rem` (`24px`) | `2rem` (`32px`) | `0` | `400` |
| Body Lead (Hero / Features) | Instrument Sans | `0.875rem` → `sm: 1rem` → `lg: 1.125rem` | `1.5`–`1.75` | `0` | `400` |
| Review Quote | Instrument Sans | `0.94rem` (`15px`) | `1.5rem` (`24px`) | `0` | `400` |
| Eyebrow Micro-Caps | Instrument Sans Uppercase | `0.75rem` (`12px`) | `1.0` | `0.28em`–`0.34em` | `600` |
| Card Tag / Badge / Number | Instrument Sans Uppercase | `0.625rem` (`10px`) | `1.2` | `0.16em`–`0.28em` | `600` |
| Recessed CTA Tab Copy | Instrument Sans | `0.625rem` (`10px`) | `12px` | `0` | `500` |

---

## 5. Layout Geometry, Radii, Shadows & Progressive Header Blur

### Container Widths & Gutters
- Navigation bar: `max-width: 96rem` (`1536px`), horizontal padding `12px` mobile / `20px` desktop.
- Showcase & Reviews split containers: `max-width: 92rem` (`1472px`), section gutter `20px` → `sm: 32px` → `lg: 40px` → `xl: 48px`.
- Features, FAQ, and Footer inner grids: `max-width: 80rem` (`1280px` / `max-w-7xl`).
- Switch Narrative copy block: `max-width: 64rem` (`1024px`).

### Corner Radii
- Buttons, pills, badges, segmented switch, language FAB: `9999px` (`rounded-full`)
- Recessed CTA sub-tab bottom: `0 0 22px 22px`
- Navigation inner bar: `1.25rem` (`20px`)
- Desktop browser frame: `1.35rem` (`21.6px`)
- Phone outer bezel / inner screen: `1.5rem` / `1.15rem`
- Features Bento Cards: `22px` (inner vignettes: `18px` / `16px`)
- Review Marquee Cards: `1.6rem` (`25.6px`)
- Template & Save-the-Date Cards: `1.8rem` (`28.8px`)
- Pricing & Reviews Split Panels + `/create` Studio Cards: `2rem` (`32px`) → `sm: 2.5rem` (`40px`)

### Elevation / Shadow Scale
- **Toggle pill**: `0 8px 24px rgba(47, 36, 27, 0.06)`
- **Bento card resting / hover**: `0 18px 50px rgba(47, 36, 27, 0.06)` → `0 22px 60px rgba(47, 36, 27, 0.09)`
- **Review card**: `0 16px 42px rgba(47, 36, 27, 0.07)`
- **Template card resting / hover**: `0 18px 48px rgba(47, 36, 27, 0.08)` → `0 24px 60px rgba(47, 36, 27, 0.13)`
- **Reviews sand container**: `0 22px 65px rgba(47, 36, 27, 0.08)`
- **Pricing dark container**: `0 30px 90px rgba(47, 36, 27, 0.15)`
- **Hero browser / phone mockups**: `0 32px 90px rgba(0, 0, 0, 0.48)` / `0 30px 80px rgba(0, 0, 0, 0.58)`
- **Watercolor side props**: `drop-shadow(0 12px 24px rgba(65, 45, 34, 0.12))` with `mix-blend-mode: multiply`

### 4-Layer Progressive Header Blur (`LandingHeaderBlur`)
A `112px` (`h-28`) fixed backdrop behind `<nav>` made of four overlapping `backdrop-filter: blur()` spans with identical soft vertical alpha masks so text passing behind the header dissolves gradually from crystal sharp at `112px` to silky `12px` blur at the top edge:

```css
.headerBlurLayer {
  position: absolute;
  inset-inline: 0;
  top: 0;
  background: rgba(255, 255, 255, 0);
  backdrop-filter: blur(var(--blur-radius));
  -webkit-backdrop-filter: blur(var(--blur-radius));
  mask-image: linear-gradient(black 0px, rgba(0,0,0,0.52) 38%, rgba(0,0,0,0.08) 82%, transparent);
}
.blurSoft   { --blur-radius: 1.5px; bottom: 0%;  }
.blurMedium { --blur-radius: 3.5px; bottom: 18%; }
.blurStrong { --blur-radius: 7px;   bottom: 45%; }
.blurEdge   { --blur-radius: 12px;  bottom: 70%; }
```

---

## 6. Complete Motion Choreography & Section-by-Section Spec

Smooth momentum scrolling is driven by **Lenis** (`lerp: 0.1`, smooth wheel enabled, disabled under `prefers-reduced-motion: reduce`). Every scroll animation runs purely on GPU-composited `transform`, `opacity`, `filter`, and SVG `stroke-dashoffset`.

### Layer 0 — First-Visit Intro Curtain (`IntroCurtain`)
- **Surface**: Fullscreen fixed `z-[100]` `#29231f` espresso curtain locking body scroll during playback.
- **Wordmark**: Centered italic `Libre Caslon Condensed` brand mark (`Naila`) in `#fcf7ed`.
- **Character Reveal (`LetterRevealText`)**:
  - Per-character keyframe: `0% { opacity: 0; filter: blur(16px); transform: translateX(40px); } → 100% { opacity: 1; filter: blur(0); transform: translateX(0); }`
  - Duration: `240ms`, Easing: `cubic-bezier(0.22, 1, 0.36, 1)`, Stagger: `55ms × charIndex`.
- **Curtain Lift**: Starts at `t = 900ms`, slides straight up `transform: translateY(-100%)` over `700ms cubic-bezier(0.76, 0, 0.24, 1)`. Completes and unmounts at `t = 1600ms`.
- **Reduced Motion**: `exitStartMs: 100ms`, `totalMs: 250ms`, no blur/translate, simple opacity fade.
- **Session Behavior**: Plays once on fresh page load (skipped on client soft-navigations back to `/`).

### Layer 1 — Adaptive Header & Recessed Trial CTA (`LandingHeader`)
- **Structure**: Left brand (`Naila` + sub-label `DIGITAL INVITATIONS` that collapses smoothly `max-h-0 -translate-y-1 opacity-0` once `scrollY > 40px`); center-right nav links (`Templates`, `Features`, `Pricing`, `Reviews`, `FAQ`); right controls (`Explore Templates` glass pill + `Currency` pill `EGP / USD` + primary double-pill CTA `Start your invite — 1,500 EGP` with recessed tab `Preview free before you pay.`).
- **Dynamic Tone Detection (`data-tone="light" | "dark"`)**:
  - Uses scroll intersection against sections marked `data-header-tone="light"` (Hero, Switch OFF, Manifesto dark phase) vs `"dark"` (Switch ON, Showcases, Manifesto light phase, Features, Reviews, FAQ).
  - Transitions text, pill borders, backdrop glass tint, and primary CTA button smoothly over `300ms`.
- **Footer Handoff**: As `<footer>` enters the lower viewport, header opacity smoothly interpolates `1 → 0` and sets `pointer-events: none`, handing visual focus to the footer's centered CTA pair and monumental wordmark.
- **Trial CTA Micro-Motion**:
  - Recessed tab emerges `translateY(-16px) → 0` (`850ms cubic-bezier(0.22, 1, 0.36, 1)`, delay `450ms`).
  - Diagonal specular shimmer (`110deg`, `rgba(255,255,255,0.125)`) sweeps left-to-right across the tab on a `6s` infinite loop (`0%–65%` rest, `65%–90%` sweep).

### Layer 2 — Floating Language Switcher (`LanguageFab`)
- **Desktop**: Fixed `bottom-4 right-4 z-[80]`, `44×44px` glass circular button with Lucide `Languages` icon (`20px`), switching tone with page surface (`bg-black/10 border-white/18 text-white` on dark vs `bg-[#fffaf1]/72 border-[#2f241b]/12 text-[#2f241b]` on light). Switches live between `English` and `العربية` (`dir="ltr" | "rtl"`).
- **Mobile**: Collapses into a `32×32px` circle inside the top-right header next to the currency pill.

### Layer 3 — Full-Bleed Atmospheric Hero & Singular Borderless Couture Invitation (`HeroSection`)
- **Backdrop (`sticky top-0 h-[100svh]`)**:
  - Crossfading editorial wedding photography slideshow (`800ms ease-in-out` opacity swap every `5500ms`).
  - Tone gradient overlay + `bg-black/18 backdrop-blur-[2px]`.
  - **Interactive Dot-Field Canvas (`desktop lg+`)**: Crisp grid of subtle `1.2px` cream dots spaced `28px` apart with gentle ambient luminance ripple + subtle cursor proximity halo, vertically masked (`linear-gradient(180deg, transparent 6%, rgba(0,0,0,0.35) 30%, #000 72%)`).
- **Foreground Grid**: `lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center gap-7`.
- **Uncluttered Left Column**: Pure display H1, editorial lead paragraph, primary recessed double-pill CTA + `Explore Templates` secondary button, and quiet `/samples` link — zero proof pills, zero eyebrow badges, zero bottom bullet clutter.
- **Staggered Hero Unblur Cascade**: Reveal groups (`0..2`) animate from `opacity: 0; filter: blur(12px); transform: translateY(14px)` to crisp rest at `delay = index × 70ms` once the intro curtain lifts.
- **Singular Borderless Floating Invitation (`soloInviteCard`)**:
  - Replaces dual browser/phone mockups with ONE standalone couture portrait invitation (`aspect-[3/4.2]`, `rounded-[1.5rem]`, `border: 0`, zero bezels/chrome).
  - Deep ambient museum shadow (`0 42px 96px -18px rgba(0,0,0,0.74)`), breath-like ambient levitation (`7.6s ease-in-out infinite`), subtle pointer-driven 3D tilt (`±4.5°` / `±5.5°`), live looping opening video, soft bottom vignette veil, and whispered couple monogram + date footer.

### Layer 4 — Dual-Path Scroll-Drawn Journey Ribbon (`JourneyRibbon`)
- Positioned `absolute inset-x-0 top-0 z-[30] pointer-events-none h-[348svh] lg:h-[312svh]`.
- Two paired cubic-Bezier SVG paths (`pathLength="1"`, `vector-effect="non-scaling-stroke"`, `stroke="#fcf7ed"`, `stroke-linecap="round"`):
  - **Lead path**: `stroke-width: 1.5`, `opacity: 0.78`
  - **Companion echo path**: `stroke-width: 0.8`, `opacity: 0.38`
  - **Desktop `viewBox="0 0 1440 3200"`**:
    - Lead: `M900 -80 C 810 45 680 135 570 290 C 455 450 480 600 680 650 C 880 700 1030 585 1065 370 C 1095 180 990 90 885 190 C 760 305 760 530 805 745 C 850 940 790 1110 738 1245 C 724 1280 720 1306 720 1326`
    - Companion: `M925 -80 C 830 55 695 150 590 305 C 480 460 510 585 695 630 C 875 675 1005 565 1040 365 C 1070 195 985 115 900 205 C 785 320 785 525 830 730 C 875 925 810 1100 750 1235 C 728 1275 720 1306 720 1326`
  - **Mobile `viewBox="0 0 390 3580"`**: Sweeps gracefully down center to `(195, 2273)`.
- Scroll-scrubbed `stroke-dashoffset` interpolates from `0.80` (partial tease visible in hero at `scrollY = 0`) down to `0.00` as the user arrives at the Switch Narrative anchor, then gently translates up and fades to `opacity: 0` when the switch snaps ON.

### Layer 5 — 3-State Scroll-Linked Switch Narrative (`SwitchNarrative`)
- Outer section `relative isolate -mt-[100svh] min-h-[150svh]` with sticky inner `100svh` panel.
- Three scroll-driven states:
  1. **`"dot"`** (progress `< 0.25`): Switch pill collapsed around center knob (`translateX(0)`), `"MAKE IT YOURS"` label hidden (`opacity: 0`), taupe veil `opacity: 0`, ivory layer `opacity: 0`, header tone `"light"`.
  2. **`"off"`** (progress `0.25..0.52`): Warm taupe veil fades in (`opacity: 1`), switch pill widens (`w-12 h-7`) and shifts right (`+74px`), knob glides left (`-11px`), `"MAKE IT YOURS"` slides left (`-30px`, `opacity: 1`). Cream `#fcf7ed` headline visible: *"If only planning a celebration were as simple as flipping a switch."*
  3. **`"on"`** (progress `>= 0.52`): Knob springs right (`+11px`), `#fcf7ed` ivory layer snaps smoothly to `opacity: 1`, text color flips `#fcf7ed → #2f241b`, header flips `light → dark`, OFF copy lifts out (`translateY(-8px), opacity: 0`), ON copy settles in: *"There may not be a single switch—but there is [bronze `#8a5a2b`]one beautiful place for everything.[/bronze]"*
- **Living Watercolor Side Objects** (`z-10`, 3-layer choreography: staggered off-edge elastic blur-to-crisp entrance `cubic-bezier(0.16, 1, 0.3, 1)` + continuous scroll/damped-pointer parallax plane + material-authentic living idle physics):
  - Top-left: **Gold Wax Seal** (`waxSealBreathe` — embossed warm-gleam float & axial twist, `7.4s`, `0.02s` entrance delay)
  - Bottom-left: **Burgundy Satin Bow** (`silkRibbonBreeze` — knot-pivoted satin ribbon breeze oscillation with subtle skew & tail breathe, `6.4s`, `0.14s` entrance delay)
  - Right: **White Gardenia Botanical Sprig** (`gardeniaSprigSway` — stem-base pivoted gentle breeze sway, `6.8s`, `0.22s` entrance delay)

### Layers 6 & 7 — Editorial Showcases: Invitation Themes (`#templates`) & Sample Suites (`#save-the-dates`)
- Both share the exact Showcase component architecture on `#fcf7ed`:
  - **Header Row**: Giant `Libre Caslon Condensed` H2 + italic `#76614d` serif subtitle on left; pill segmented toggle (`Carousel` / `Grid`, `bg-[#fffaf1] border-[#2f241b]/10 p-1`, active dark pill `bg-[#2f241b] text-[#fcf7ed]`) on right.
  - **Carousel Mode**: Horizontal scroll-snap track (`gap-5 pr-[14vw] sm:pr-[8vw]`, hidden scrollbar) with card widths `min-w-[86%] sm:min-w-[48%] lg:min-w-[31%] xl:min-w-[24%]`, plus bottom-right `48×48px` circular Previous / Next arrows.
  - **Grid Mode**: Smooth transition into responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`.
  - **Card Anatomy**:
    - `#templates`: `aspect-[4/3]` (`rounded-[1.8rem]`) clean media frame with zero top-left badge clutter, bottom-right `40×40px` frosted circular chevron button (`group-hover:bg-white`), below: `10px` bronze eyebrow (`WEDDING INVITATION` / `ENGAGEMENT` / `KATB KITAB`), `1.65rem` serif title, muted description. Links directly to live preview `/t/{id}`.
    - `#save-the-dates`: `aspect-[4/5]` portrait framed stationery cards showing Naila's curated live packages & sample invitations (`/i/sample-1` .. `/i/sample-4`) with colored mats and clean unbadged artwork.

### Layer 8 — 380svh Pinned Kinetic Manifesto (`EditorialManifesto`)
- Container `min-h-[380svh]` with `sticky top-0 min-h-[100svh]` centered flex stage.
- **Typography + Inline Media**: `max-w-[22ch] text-center text-[clamp(2.5rem,6.4vw,6.5rem)] leading-[0.98] tracking-[-0.045em]` with 3 inline rounded photo pills (`h-[0.72em] w-[1.48em] sm:w-[1.62em] translate-y-[0.06em] rounded-[0.06em]`).
- **Scroll-Linked Choreography (`progress ∈ [0, 1]`)**:
  - `0.00 → 0.58`: Words and inline photo pills illuminate sequentially from `opacity: 0.16 → 1.0` across overlapping smooth windows.
  - `0.58 → 0.78`: Dramatic palette inversion — background interpolates smoothly from `#fcf7ed` → `#29231f`, foreground from `#2f241b` → `#fcf7ed`, header dynamically flips back to `data-tone="light"`, and the 3 inline photo pills crossfade to secondary celebratory photographs!
  - `0.78 → 1.00`: Holds in deep espresso climax while the next section (`#features`, `motion-safe:-mt-[100svh] z-20`) glides upward over it like a cream curtain.
- **Peeking Watercolor Side Props**: Silver Heart Balloons bottom-left (`opacity-75`), White Cotton Envelope top-right (`opacity-80`), smoothly dimming/blending as the canvas darkens.

### Layer 9 — 6-Card Features Bento Grid (`#features`)
- Slides over the Manifesto (`relative z-20 motion-safe:-mt-[100svh] bg-[#fcf7ed]`).
- Eyebrow `MADE FOR THE WHOLE CELEBRATION`, H2 *"Everything your celebration needs, beautifully connected."*, muted lead.
- **Bespoke Editorial Copperplate Iconography (`EditorialIcons.tsx`)**: All 6 cards use custom fine-line (`1.15px` stroke + soft bronze wash) SVG crests (`GlobalMeridianCrest`, `GuestLedgerCrest`, `CelestialChoreographyCrest`, `WaxSealedNoteCrest`, `InterlockedLinkCrest`, `AtelierKeyCrest`) set inside double-rimmed antique parchment medallions (`.bentoMedallion`).
- **Continuous Scroll-Choreographed Vignettes**: Scroll progress `scrollP ∈ [0, 1]` animates internal components smoothly across the grid:
  1. **Bilingual Arabic & English (`bg-white min-h-72`)** — Real looping spinning 3D globe video (`/videos/globe-spinning.mp4`) anchored bottom `top-1/3 h-[125%]`.
  2. **Named Guest Lists & RSVPs (`bg-[#fffaf1]`)** — 3 stacked guest rows gliding into place sequentially with scroll (`translate3d` + opacity stagger).
  3. **Wax Seal & Music Opening (`bg-[#fffaf1]`)** — Vertical bronze timeline with scroll-drawn glowing progress stem and illuminating checkpoint nodes.
  4. **Personal Notes per Guest (`bg-[#fffaf1]`)** — Framed `#f6edd7` stationery vignette with a scroll-lifted & gently blooming `#fffaf1` miniature card.
  5. **One WhatsApp Link, Live Tracking (`bg-[#fffaf1]`)** — Dark `#29231f` rounded viewport vignette where scrolling drives an ambient golden halo bloom, gliding frosted URL bar (`naila.inv/ahmed-and-sara`) with live pulsing dot, blinking editorial caret & diagonal champagne specular sweep, plus rising, rotating, scaling heirloom gold wedding rings.
  6. **Zero Passwords, Instant Management (`bg-[#fffaf1]`)** — Overlapping circular monogram avatars (`A`, `S`, `N`) fanning cleanly together on scroll.

### Layer 10 — 50/50 Split Pricing & Dual-Marquee Reviews (`#reviews`)
- `max-w-[92rem] grid gap-4 lg:grid-cols-2`:
  - **Left Panel (`bg-[#29231f] text-[#fcf7ed] rounded-[2rem] sm:rounded-[2.5rem]`)**:
    - Eyebrow `NAILA STUDIO` + pill `ONE-TIME PURCHASE` (`#f1cfaa`).
    - H2 *"Everything you need, without another subscription."*
    - **Architectural Hairline Editorial Suite Ledger (`.tierLedger`)**: Replaces rounded pill buttons with an editorial hairline ledger featuring italic Roman numerals (`I`–`IV`), thin vertical cell rules, sliding champagne-gold underline bar, English suite names (`Essential`, `Signature`, `Tailored`, `Bespoke`) in English mode and `Amiri` calligraphic names in Arabic mode — synced live with `getPricing()`.
    - 3 editorial numbered steps (`01 Choose a starting design`, `02 Make every detail yours`, `03 Publish and share on WhatsApp`).
    - **Centered Bottom Recessed CTA**: Horizontally centered inside `.pricingCtaSlot` (`Start your invite — {price} ↗` + `Preview free before you pay.`).
  - **Right Panel (`bg-[#f6edd7] border-[#2f241b]/10 rounded-[2rem] sm:rounded-[2.5rem]`)**:
    - Header: Eyebrow `NOTES FROM OUR COUPLES`, H3 *"The kind of invitation guests keep talking about."*, italic `4.9` + `AVERAGE RATING`.
    - **Dual Counter-Scrolling Infinite Marquee**:
      - Horizontal fade mask: `mask-image: linear-gradient(90deg, transparent, black 7%, black 93%, transparent)`.
      - Row 1 drifts continuously forward (`translateX(0 → -50%)`, `46s linear infinite`); Row 2 (`lg:block`) drifts continuously in reverse (`translateX(-50% → 0)`, `52s linear infinite`). Pauses gently on hover; degrades to horizontal scroll-snap on `prefers-reduced-motion: reduce`.

### Layer 11 — Sticky Editorial FAQ Accordion (`#faq`)
- `max-w-7xl grid lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] gap-14 xl:gap-24`.
- Left sticky sidebar (`lg:sticky lg:top-28`): Clean eyebrow-free `Questions, answered.` H2 aligned flush with the accordion rule + muted intro.
- Right `<ol>` (`divide-y divide-[#2f241b]/16 border-y border-[#2f241b]/16`): 9 numbered items (`01`–`09`) answering practical Naila questions (free preview before paying, one-time payment / Instapay & Paymob, wax seal + video customization, named guest links & personal messages, Excel guest import, Arabic/English support, WhatsApp sharing, RSVP & wishes tracking, custom bespoke packages).
- Smooth CSS grid-row height animation (`grid-template-rows: 0fr → 1fr`, `340ms cubic-bezier(0.22, 1, 0.36, 1)`), answer text fade/slide (`translateY(-6px) → 0`), circular `+` vertical bar scaling `scaleY(1) → scaleY(0)`.

### Layer 12 — Monumental Layered Cloud Footer (`LandingFooter`)
- `relative min-h-[46rem] sm:min-h-[52rem] lg:min-h-[58rem] overflow-hidden bg-[#fcf7ed]`.
- **Shared-Element FLIP Header → Footer Handoff**: As `<footer>` enters the viewport (`78vh → 10vh`), middle header links (`Features`, `Reviews`, `FAQ`), currency pill, and progressive blur dissolve smoothly (`0 → 0.45`), while the fixed header's `Naila` brand wordmark and `Explore Templates` + `Start your invite` CTA pair physically glide along `easeInOutCubic` trajectories into the exact footer brand slot (top-left, italicizing mid-flight) and centered CTA slot (`bottom-[58%]`), docking seamlessly at `0px` offset.
- **3-Beat Triggered Spring Choreography (`cubic-bezier(0.16, 1, 0.3, 1)`, replays cleanly on re-entry)**:
  - **Beat 1 (`0ms` / `100ms` / `170ms` staggered)**: 3 painterly pastel cloud banks swell upward FIRST — rear center lavender/peach cloud (`z-10`, `translateY(34%) scale(0.94) → 0`), foreground left peach/rose cloud (`z-30`, `translate3d(-8%, 36%, 0) scale(0.93) → 0`), foreground right mint/gold cloud (`z-30`, `translate3d(8%, 36%, 0) scale(0.93) → 0`).
  - **Beat 2 (`280ms` delay — sunrise after clouds settle)**: Giant italic `Naila` wordmark (`z-20`, `clamp(7.5rem, 24vw, 23rem)`, `leading-[0.7] tracking-[-0.075em]`) surges up from behind the foreground clouds (`translateY(48%) scale(0.95) blur(10px) opacity(0) → crisp rest`, `1250ms`).
  - **Beat 3 (`450ms` delay) + Living Atmospheric Sky**: Bottom-left copyright settles in, while all 3 cloud planes breathe continuously with slow opposing sinusoidal drift (`20s` / `24s` / `26s`) plus damped 3-plane pointer & scroll depth parallax (`0.25×` rear cloud, `0.45×` wordmark, `0.9×–1.05×` foreground clouds).

---

## 7. Full Digital-Invitation Frontend Redesign Map

Every route in `src/app/` is redesigned from scratch on this single unified design system while keeping **100% of existing API routes, Supabase/JSON storage, Paymob/Instapay payment flows, Excel guest import, and R2 media uploads untouched and working**:

| Route | Redesign Architecture |
|---|---|
| `/` | Full 12-layer Cordially editorial landing experience + Naila live templates, live pricing packages, live samples, bilingual EN/AR toggle, EGP/USD currency toggle. |
| `/create` | Rebuilt after `cordially.io/start` — full-bleed blurred stationery + dot-field backdrop, dual floating `#fffaf1` `rounded-[2rem]` studio cards: left 3-step guided builder (`01 Design & Package`, `02 Couple & Event Details`, `03 Contact & Music`) with slim top progress bar; right live interactive mobile/desktop invitation preview updating in real time as you type names, venue, date, and template. |
| `/request` | Rebuilt after `cordially.io/start` — floating two-card bespoke concierge studio (left brief form wired to `POST /api/requests`; right package showcase card + WhatsApp direct concierge pill). |
| `/samples` | Rebuilt in Cordially's `#fcf7ed` editorial showcase layout — `Libre Caslon Condensed` header, 4 portrait `4:5` stationery sample cards with `LIVE DEMO` pill, package price badges, feature highlights, and direct sample links (`/i/sample-1`..`4`). |
| `/t/[id]` | Full guest-view template preview paired with a Cordially dark-pill floating bottom bar (`Back to templates` + `Customize this design ↗`). |
| `/i/[slug]` & `/i/[slug]/[token]` | Redesigned editorial guest invitation experience (`Invitation`, `Countdown`, `RsvpForm`, `WishForm`, `ClosedInvitation`) using `Libre Caslon Condensed` / `Amiri`, `#fcf7ed` / `#fffaf1` stationery surfaces, tactile wax-seal / Google Flow video opening, refined frosted sound toggle, luxury countdown grid, personal guest note card, and seamless RSVP & wishes sheets. |
| `/c/[manageToken]` | Rebuilt private Couple Management Studio (`ManageEvent`, `OrderPanels`, `GuestImport`) in warm `#fcf7ed` / `#fffaf1` / `#29231f` Cordially studio cards — editorial KPI bar, payment checkout panel (Paymob + Instapay proof upload), live invitation link copy, Excel/CSV guest manager with personal notes, RSVP filter pills, and wishes book. |
| `/admin/[key]/*` | Restyled internal Admin Dashboard (`AdminNav`, `AdminOrders`, `PricingAdmin`, `TemplatesAdmin`, `MusicAdmin`, KPI overview) onto the exact `#fcf7ed` / `#fffaf1` / `#2f241b` / `#8a5a2b` token system for complete visual cohesion across the entire app. |

---

## 8. Visual Asset Plan

| Asset | Source / Location | Usage |
|---|---|---|
| `Libre Caslon Condensed` (Regular + Italic) | `public/fonts/libre-caslon-condensed/*.woff2` (local) | All display headlines, wordmarks, subtitles |
| Spinning 3D Globe Video | `public/videos/globe-spinning.mp4` (optimized from local reference) | Features Bento Card 1 |
| Hero Mobile & Desktop Demo Videos | `public/videos/hero-mobile.mp4`, `public/videos/hero-desktop.mp4` (built from Naila's generated videos & `public/hero/desktop-start.jpg`) | Hero 3D swappable device previews |
| Curated Naila Showcase Frames | `public/showcase/*.jpg` & `*.mp4` (from local `gflow-test` generated designs + `public/hero/desktop-start.jpg`) | Templates Carousel & Save the Dates previews |
| Editorial Wedding Photography (`hero-1..4.jpg`) | Modest, alcohol-free 16:9 luxury wedding photography in `public/assets/hero/` (golden crystal-chandelier palace wedding courtyard, outdoor white-rose wedding ceremony aisle & floral arch, diamond wedding rings nestled in white roses, candlelit white-rose reception table centerpiece) — paired with the `arabian-veil` golden palace wedding opening video in the Hero card | Hero crossfade slideshow & Manifesto inline photo pills |
| Watercolor Editorial Props | Transparent & white-ground watercolor PNG/JPG props in `public/assets/props/` (`gold-wax-seal.png`, `burgundy-bow.png`, `gardenia-sprig.png`, `silver-balloons.png`, `white-envelope.png`, `gold-rings.jpg`) | Switch Narrative, Pinned Manifesto, and Domain Feature card |
| Painterly Pastel Cloud Bank | Generated dreamy peach/lavender/mint watercolor cloud banks in `public/assets/clouds/` (`cloud-left.png`, `cloud-right.png`, `cloud-center.png`) | Monumental Footer layered behind & in front of `Naila` |

---

## 9. Accessibility & Performance Standards

- Every scroll-driven and ambient animation honors `@media (prefers-reduced-motion: reduce)` — disabling Lenis, showing final readable typography immediately, collapsing the infinite marquee to accessible horizontal scroll-snap, and shortening the intro curtain to a gentle `250ms` fade.
- All interactive controls maintain `min-h-11` (`44px`) touch targets, explicit `aria-expanded` / `aria-pressed` / `aria-label` states, screen-reader-only unified headings for split visual states, and `2px` `#8a5a2b` / `#f3e7db` focus rings.
- Zero external runtime font build failures (Google Fonts `<link>` + local `.woff2` preload); zero layout shift (`aspect-ratio` locked on all media frames).
