# Digital Invitations: web app

Next.js 15 (App Router) + TypeScript. Deployed to Vercel. Supabase later; see `supabase/schema.sql`.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000. The home page lists the demo links.

## Routes
| Route | What it is |
|---|---|
| `/i/{slug}` | General invitation (one link for everyone) |
| `/i/{slug}/{token}` | Named invitation: the greeting includes the guest's title + name |
| `POST /api/invitations/{slug}/open` | Records "opened". Fired when the guest taps the seal, not on page load, so WhatsApp's preview bot isn't counted |
| `POST /api/invitations/{slug}/rsvp` | `{ token?, name?, status: "attending" \| "declined" }` |
| `POST /api/invitations/{slug}/wishes` | `{ token?, name?, body }` |
| `/c/{manageToken}` | Client page (password-free private link): wording, add guests, Excel/CSV upload, per-guest links, copy/export, who opened / attending / declined, wishes |
| `GET/POST/DELETE /api/manage/{manageToken}/guests` | List with status · add `{ guests: [{title?, name, phone?}] }` (invalid rows and duplicates are skipped) · delete `?id=` |
| `PUT /api/manage/{manageToken}/texts` | `{ generalText, personalText }`; personalText must contain `{name}` |
| `/admin/{ADMIN_TOKEN}/templates` | Our admin dashboard: upload Google Flow templates, preview, delete, progress toward 6 per category |
| `/admin/{ADMIN_TOKEN}/templates/{id}` | Template preview with sample names (replies here aren't saved) |
| `POST /api/admin/{ADMIN_TOKEN}/templates/uploads` | Upload slot: `{ kind, contentType, size, templateId? }` → signed URL the browser PUTs the file to (R2) |
| `GET/POST/DELETE /api/admin/{ADMIN_TOKEN}/templates` | List · save after upload `{ templateId, name, category, theme, videoKey, posterKey? }` (files are checked first) · delete `?id=` (removes the files too) |
| `PUT /api/admin/{ADMIN_TOKEN}/uploads` | Dev only, without R2: local stand-in for the R2 upload |
| `/media/...` | Dev only: locally stored uploads, with Range support |

Demo client page: `/c/m7q2x9k4t8w3z6p1`.

### Guest import rules
- Columns are found by header in Arabic or English (اللقب/title, الاسم/name, رقم الموبايل/phone…). With no header row: 3 columns = title, name, phone; 2 columns = name, phone.
- Phones are normalised to `+20…`. Fixes the leading 0 that Excel drops, and Arabic digits.
- A duplicate means the same title + name + phone (two people sharing one number are kept).
- Exports are CSV with a BOM so Excel shows Arabic correctly, with formula injection neutralised.

## Adding a Google Flow template
Set `ADMIN_TOKEN` in `.env.local` (see `.env.example`). In development only, it defaults to `admin-dev-k7p3x9`.

Open `/admin/{ADMIN_TOKEN}/templates` and upload:
1. The video: MP4 with **no text** in it (names and wording are drawn on top), portrait 9:16, ideally 1–2 MB, max 20 MB.
2. A poster image (optional). If none is given, the browser captures a frame from the start of the video.
3. Name, category (wedding / engagement / katb kitab) and five colours (background, letter, text, accent, seal) chosen to match the video.

The file contents are checked (real MP4 / JPG / PNG / WebP), not just the extension.

### Storage: Cloudflare R2
Videos and posters live in R2 under `templates/{id}/opening.mp4` and `templates/{id}/poster.jpg`.
The browser uploads straight to R2 with a 15-minute signed URL, so files never go through Vercel (which caps request bodies at 4.5 MB).
Guests load them from the bucket's public domain; R2 serves Range requests, which iPhone needs for video.

Setup:
1. Create a bucket and connect a custom domain (e.g. `media.<our-domain>`), or turn on the r2.dev public URL for testing.
2. Create an R2 API token with **Object Read & Write** on that bucket only.
3. Bucket → Settings → CORS policy: paste `r2-cors.json` with our real domain in it. Without it, browser uploads fail.
4. Fill the `R2_*` values from `.env.example` in `.env.local` and in Vercel.

Without R2 settings, development stores files in `data/uploads/` and serves them from `/media/...`. In production the R2 settings are required.
Use "معاينة" to see the template exactly as a guest would.

Without a video, the built-in template falls back to a CSS envelope with a wax seal.

## Data
Stage 1 stores data in `data/db.json` (and, without R2, uploads in `data/uploads/`) (git-ignored, seeded with demo events on first run). All access goes through `src/lib/store.ts`, which will be swapped for Supabase before deploying; neither persists on Vercel.
