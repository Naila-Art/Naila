# Digital Invitations: web app

Next.js 15 (App Router) + TypeScript. Deployed to Vercel. Files on Cloudflare R2. Database: Postgres on Neon (via the Vercel Marketplace); see `db/schema.sql`.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000 (the storefront). Demo links are at http://localhost:3000/dev (development only).

All settings live in `.env.local` (git-ignored); `.env.example` lists them. On Vercel they go in Project → Settings → Environment Variables.

## Storefront analytics

Set `NEXT_PUBLIC_CLARITY_PROJECT_ID=zix47fxhih` before building to enable Microsoft Clarity for the English and Arabic home, samples listing, and public template previews. Leave it blank to disable Clarity.

In the Clarity project, turn **Cookies** off under **Settings → Setup** before enabling tracking. The site sends denied consent for analytics and advertising storage, so Clarity runs in cookieless mode with limited features. [Microsoft Clarity Consent Mode documentation](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)

The builder, request form, invitations, orders, and admin use a separate root layout. Crossing into those pages loads a new document. Clarity also skips public visits with a same-origin referrer outside the tracked routes, which could contain a private link.

## How it works
1. **Storefront** (`/`): templates by category and packages. Prices are edited in `/admin/{key}/pricing` (defaults: Ziad's PDF). Orders keep the total they were sold with. **No add-ons**: Arabic/English, the location and getting the link on WhatsApp are included in every package.
2. **Samples** (`/samples`, and "شوف مثال" on each package): one live invitation per package at fixed links (`/i/sample-1` … `/i/sample-4/{guest}`), created on first visit. They always use the newest uploaded design of their category and a date 45 days ahead.
3. **Packages 1–3** (`/create`, in steps with a back button; the draft is kept in the browser): the client builds the invitation and gets a **draft** on their private page `/c/{manageToken}` (no password): preview, edit details, wording, approve and pay. Package 3 also gets a brief + photo/video uploads for our team, and named guests.
4. **Package 4** (`/request`): the client leaves a brief. In `/admin/orders` we set the agreed price and press **"اعمل صفحة الدعوة"**, then send the client their page link.
   Packages 3–4: guests are added by hand or from Excel; each guest gets their own link with their name, and optionally **a personal message** shown only on their invitation.
5. **Before payment nothing can be shared**: the public link and every guest link show "not available yet"; copy-all/export are locked; the client previews from `/c/{token}/preview` (and `?guest=`) under a full-screen "معاينة" watermark. Payment (a method from the dashboard, or Paymob, confirmed by us) makes the invitation **active**.
   No RSVP (removed); wishes for packages 2+.
6. **Cancelled** orders (optionally as a refund) close the invitation, every guest link and the client page. "Restore" reopens them.

### What each package unlocks (`packageFeatures` in `src/lib/pricing.ts`)
| | 1 البسيطة | 2 المميزة | 3 على ذوقك | 4 الخاصة |
|---|---|---|---|---|
| Seal animation, names, RSVP, countdown, location | ✓ | ✓ | ✓ | ✓ |
| Wishes, music from our library | | ✓ | ✓ | ✓ |
| Named link per guest + personal message | | | ✓ | ✓ |
| Made by | client (storefront) | client (storefront) | our team | our team |

## Routes
| Route | What it is |
|---|---|
| `/` · `/t/{templateId}` · `/samples` | Storefront · public template preview · one sample invitation per package |
| `/create` · `/request?p=3` | Builder (packages 1–2) · request form (packages 3–4) |
| `/i/{slug}` · `/i/{slug}/{token}` | General invitation · named invitation |
| `/c/{manageToken}` | Client page |
| `/admin/login` | Dashboard sign-in (email + password per team member). The first account is created here with the setup code (`ADMIN_TOKEN`) |
| `/admin` | Dashboard home: to-do, clients, orders |
| `/admin/finance` | Money (this month, total, 6 months, by package, refunds) behind its **own password**, set first with the setup code; unlocked 2 hours per device |
| `/admin/payments` | Payment methods the client chooses from (Instapay, wallets, bank, card): name, account, instructions, on/off, order |
| `/admin/team` | Team accounts; change my password |
| `/admin/orders` | Orders: confirm/reject Instapay, mark paid, packages 3–4 (stage, agreed price, create the client page), change requests, **cancel / refund**, restore |
| `/admin/pricing` | Packages: name, price, points, shown/hidden |
| `/admin/templates` · `/music` | Upload Google Flow templates · music library |
| `POST /api/orders` · `POST /api/requests` | Create a draft · a package 3–4 request |
| `PUT /api/manage/{t}/order` · `/details` · `/texts` | Client edits (switch package 1↔2 only before payment) |
| `POST /api/manage/{t}/uploads` · `/payment` · `/changes` | Upload slot (transfer screenshot) · pay (Paymob / Instapay) · change request |
| `GET/POST/PATCH/DELETE /api/manage/{t}/guests` | Guests (packages 3–4) · PATCH `{ id, message }` sets a guest's personal message |
| `POST /api/invitations/{slug}/open` · `/rsvp` · `/wishes` | Guest actions ("opened" fires on the seal tap, not page load) |
| `POST /api/payments/paymob/webhook` | Paymob callback: HMAC checked, amount must match |
| `GET /api/cron/retention` | Daily (vercel.json): deletes guest data a year after the event. Needs `CRON_SECRET` |
| `PUT /api/uploads/local` · `/media/...` | Development only, without R2: signed local uploads and serving |

### Guest import rules
- Columns are found by header in Arabic or English (اللقب/title, الاسم/name, رقم الموبايل/phone, رسالة خاصة/message). With no header row: 4 columns = title, name, phone, message; 3 = title, name, phone; 2 = name, phone.
- Phones are normalised to `+20…`. Fixes the leading 0 that Excel drops, and Arabic digits.
- A duplicate means the same title + name + phone (two people sharing one number are kept).
- Exports are CSV with a BOM so Excel shows Arabic correctly, with formula injection neutralised.

## Payments
- **Paymob** (Ziad): fill `PAYMOB_*` in `.env.local`/Vercel, and set the transaction-processed callback in the Paymob dashboard to `{SITE_URL}/api/payments/paymob/webhook`. Until then the client page offers Instapay only.
- **Instapay**: set `INSTAPAY_HANDLE`. The client uploads the transfer screenshot; we confirm it in `/admin/{key}/orders` and the invitation goes live.

## Adding a Google Flow template
Open `/admin/templates` and upload:
1. The video: MP4 with **no text** in it (names and wording are drawn on top), portrait 9:16, ideally 1–2 MB, max 20 MB.
2. A poster image (optional). If none is given, the browser captures a frame from the start of the video.
3. Name, category and five colours (background, letter, text, accent, seal) chosen to match the video.

File contents are checked (real MP4 / JPG / PNG / WebP / MP3), not just the extension.
Without a video, the built-in template falls back to a CSS envelope with a wax seal.

## Storage: Cloudflare R2
Keys: `templates/{id}/opening.mp4|poster.jpg`, `music/trk_…-rand.mp3`, `payments/{orderId}/proof-rand.jpg`.
The browser uploads straight to R2 with a 15-minute signed URL, so files never go through Vercel (4.5 MB body limit). Guests load them from the bucket's public domain, which serves Range requests (iPhone needs them for video).

Setup:
1. Create a bucket and connect a custom domain (e.g. `media.<our-domain>`), or turn on the r2.dev URL for testing.
2. Create an R2 API token with **Object Read & Write** on that bucket only.
3. Bucket → Settings → CORS policy: paste `r2-cors.json` with our real domain in it. Without it, browser uploads fail.
4. Fill the `R2_*` values in `.env.local` and in Vercel.

Without R2 settings, development stores files in `data/uploads/`. In production the R2 settings are required.

## Data
Development stores data in `data/store.json` (git-ignored, seeded with demo events on first run). All access goes through `src/lib/store.ts` → `src/lib/db.ts`, which uses Postgres (`DATABASE_URL`) on Vercel. Create the tables with `node --env-file=.env.local scripts/db-setup.mjs`; add `--import-local` to copy local data in. Set `NAILA_DB=postgres` to run locally against the live database.

To check a production build while `npm run dev` is running, build into another folder: `NEXT_DIST_DIR=.next-prod npx next build && NEXT_DIST_DIR=.next-prod npx next start -p 3124`.
(In development, Next.js embeds debug copies of server data in pages; production doesn't.)
