# Digital Invitations: web app

Next.js 15 (App Router) + TypeScript. Deployed to Vercel. Files on Cloudflare R2. Database: Supabase later; see `supabase/schema.sql`.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000 (the storefront). Demo links are at http://localhost:3000/dev (development only).

All settings live in `.env.local` (git-ignored); `.env.example` lists them. On Vercel they go in Project → Settings → Environment Variables.

## How it works
1. **Storefront** (`/`): templates by category, packages and add-ons from `src/lib/pricing.ts` (Ziad's PDF).
2. **Builder** (`/create`): template → details → package 1/2 + add-ons → name + WhatsApp. Creates a **draft** and sends the client to their private page.
   Packages 3–4 go to `/request` instead (a brief; we follow up on WhatsApp).
3. **Client page** (`/c/{manageToken}`, no password): preview, change package/add-ons, edit details, own song upload, wording, guests (named-link add-on, capped by tier), approve and pay, ask us for a change.
4. **Draft** invitations carry a "preview" ribbon and refuse replies. Payment (Paymob, or Instapay confirmed by us) makes them **active**.
5. **Cancelled** orders (from our dashboard, optionally marked as refunded) close the invitation, every guest link and the client page. "Restore" reopens them.

### What each package unlocks (`featuresOf` in `src/lib/pricing.ts`)
| | Package 1 | Package 2 | 3–4 |
|---|---|---|---|
| Seal animation, names, RSVP, countdown | ✓ | ✓ | ✓ |
| Wishes | | ✓ | ✓ |
| Music | own song add-on | library or own song | ✓ |
| Google Maps button | add-on | add-on | ✓ |
| Named link per guest | add-on, by tier | add-on, by tier | 4 includes it |

Arabic invitations carry the Arabic add-on automatically. The 300-guest and unlimited tier prices are placeholders until Ziad confirms them.

## Routes
| Route | What it is |
|---|---|
| `/` · `/t/{templateId}` | Storefront · public template preview |
| `/create` · `/request?p=3` | Builder (packages 1–2) · request form (packages 3–4) |
| `/i/{slug}` · `/i/{slug}/{token}` | General invitation · named invitation |
| `/c/{manageToken}` | Client page |
| `/admin/{ADMIN_TOKEN}` | Our dashboard: clients, this month's revenue, last 6 months, by package, to-do |
| `/admin/{ADMIN_TOKEN}/orders` | Orders: confirm/reject Instapay, mark paid, custom stages, change requests, **cancel / refund**, restore |
| `/admin/{ADMIN_TOKEN}/templates` · `/music` | Upload Google Flow templates · music library |
| `POST /api/orders` · `POST /api/requests` | Create a draft · a package 3–4 request |
| `PUT /api/manage/{t}/order` · `/details` · `/texts` · `/music` | Client edits (package/add-ons only before payment) |
| `POST /api/manage/{t}/uploads` · `/payment` · `/changes` | Upload slot (song, transfer screenshot) · pay (Paymob / Instapay) · change request |
| `GET/POST/DELETE /api/manage/{t}/guests` | Guests (cap = tier limit) |
| `POST /api/invitations/{slug}/open` · `/rsvp` · `/wishes` | Guest actions ("opened" fires on the seal tap, not page load) |
| `POST /api/payments/paymob/webhook` | Paymob callback: HMAC checked, amount must match |
| `GET /api/cron/retention` | Daily (vercel.json): deletes guest data a year after the event. Needs `CRON_SECRET` |
| `PUT /api/uploads/local` · `/media/...` | Development only, without R2: signed local uploads and serving |

### Guest import rules
- Columns are found by header in Arabic or English (اللقب/title, الاسم/name, رقم الموبايل/phone…). With no header row: 3 columns = title, name, phone; 2 columns = name, phone.
- Phones are normalised to `+20…`. Fixes the leading 0 that Excel drops, and Arabic digits.
- A duplicate means the same title + name + phone (two people sharing one number are kept).
- Exports are CSV with a BOM so Excel shows Arabic correctly, with formula injection neutralised.

## Payments
- **Paymob** (Ziad): fill `PAYMOB_*` in `.env.local`/Vercel, and set the transaction-processed callback in the Paymob dashboard to `{SITE_URL}/api/payments/paymob/webhook`. Until then the client page offers Instapay only.
- **Instapay**: set `INSTAPAY_HANDLE`. The client uploads the transfer screenshot; we confirm it in `/admin/{key}/orders` and the invitation goes live.

## Adding a Google Flow template
Open `/admin/{ADMIN_TOKEN}/templates` and upload:
1. The video: MP4 with **no text** in it (names and wording are drawn on top), portrait 9:16, ideally 1–2 MB, max 20 MB.
2. A poster image (optional). If none is given, the browser captures a frame from the start of the video.
3. Name, category and five colours (background, letter, text, accent, seal) chosen to match the video.

File contents are checked (real MP4 / JPG / PNG / WebP / MP3), not just the extension.
Without a video, the built-in template falls back to a CSS envelope with a wax seal.

## Storage: Cloudflare R2
Keys: `templates/{id}/opening.mp4|poster.jpg`, `music/trk_…-rand.mp3`, `events/{id}/music-rand.mp3`, `payments/{orderId}/proof-rand.jpg`.
The browser uploads straight to R2 with a 15-minute signed URL, so files never go through Vercel (4.5 MB body limit). Guests load them from the bucket's public domain, which serves Range requests (iPhone needs them for video).

Setup:
1. Create a bucket and connect a custom domain (e.g. `media.<our-domain>`), or turn on the r2.dev URL for testing.
2. Create an R2 API token with **Object Read & Write** on that bucket only.
3. Bucket → Settings → CORS policy: paste `r2-cors.json` with our real domain in it. Without it, browser uploads fail.
4. Fill the `R2_*` values in `.env.local` and in Vercel.

Without R2 settings, development stores files in `data/uploads/`. In production the R2 settings are required.

## Data
Development stores data in `data/db.json` (git-ignored, seeded with demo events on first run). All access goes through `src/lib/store.ts`, which is swapped for Supabase before deploying; the JSON file does not persist on Vercel.
