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

Demo client page: `/c/m7q2x9k4t8w3z6p1`.

### Guest import rules
- Columns are found by header in Arabic or English (اللقب/title, الاسم/name, رقم الموبايل/phone…). With no header row: 3 columns = title, name, phone; 2 columns = name, phone.
- Phones are normalised to `+20…`. Fixes the leading 0 that Excel drops, and Arabic digits.
- A duplicate means the same title + name + phone (two people sharing one number are kept).
- Exports are CSV with a BOM so Excel shows Arabic correctly, with formula injection neutralised.

## Adding a Google Flow video as a template
1. The video must contain **no text**. Names and wording are drawn on top.
2. Export it as MP4 (H.264), about 720×1280 and 1–2 MB, plus a first-frame image (`poster.jpg`).
3. Put both files in `public/templates/<id>/`.
4. Add an entry to `src/lib/templates.ts` with `videoUrl`, `posterUrl` and the theme colours.

Without a video, the template falls back to a CSS envelope with a wax seal.

## Data
Stage 1 stores data in `data/db.json` (git-ignored, seeded with demo events on first run). All access goes through `src/lib/store.ts`, which will be swapped for Supabase before deploying; the JSON file does not persist on Vercel.
