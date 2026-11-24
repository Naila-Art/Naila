// Record a phone-size walkthrough of an invitation: threshold → tap → opening → slow scroll
// to the farewell. The opening video's sound is laid back in at the tap (browser recordings
// are silent). Needs the dev server running and playwright-core (gflow-test/batch has it).
//
//   node scripts/record-invitation.mjs <url> <out.mp4> [--audio public/templates/<id>/opening.mp4] [--lang en|ar]
//
// --lang sets the site language (storefront previews /t/<id> follow it; live invitations
// /i/... use the event's own language).
//
// Output: 780x1688 H.264 MP4. Also writes <out>-sheet.jpg, a contact sheet (one frame / 6s).
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
let chromium;
for (const base of [root, path.join(root, "gflow-test/batch")]) {
  try {
    ({ chromium } = createRequire(path.join(base, "package.json"))("playwright-core"));
    break;
  } catch {}
}
if (!chromium) {
  console.error("playwright-core not found: npm i -D playwright-core && npx playwright-core install chromium");
  process.exit(1);
}

const [url, outArg, ...rest] = process.argv.slice(2);
if (!url || !outArg) {
  console.error("usage: node scripts/record-invitation.mjs <url> <out.mp4> [--audio file]");
  process.exit(1);
}
const out = path.resolve(outArg);
const flag = (k) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : null);
const audio = flag("--audio") ? path.resolve(flag("--audio")) : null;
const lang = flag("--lang");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rec-"));

// Record at the phone's own CSS size: Playwright pads, it does not upscale, so a larger
// `size` leaves the page in the top-left quarter of the frame. Upscale afterwards instead.
const W = 390, H = 844;
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  recordVideo: { dir: tmp, size: { width: W, height: H } },
});
if (lang) await ctx.addCookies([{ name: "naila_lang", value: lang, url: new URL(url).origin }]);
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const tapMs = Date.now() - t0;
await page.locator("main button").first().tap();
await page.waitForTimeout(9000);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 6) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(16);
}
await page.waitForTimeout(3500);
await ctx.close();
await browser.close();

const webm = path.join(tmp, fs.readdirSync(tmp).find((f) => f.endsWith(".webm")));
const v = ["-filter_complex", `[0:v]scale=${W * 2}:${H * 2}:flags=lanczos,setsar=1[v]` + (audio ? `;[1:a]adelay=${tapMs}|${tapMs}[a]` : "")];
execFileSync("ffmpeg", [
  "-loglevel", "error", "-y", "-i", webm, ...(audio ? ["-i", audio] : []), ...v,
  "-map", "[v]", ...(audio ? ["-map", "[a]", "-c:a", "aac", "-b:a", "128k"] : []),
  "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", out,
]);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", out, "-vf", "fps=1/6,scale=130:-1,tile=8x2", "-frames:v", "1", out.replace(/\.mp4$/, "-sheet.jpg")]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({ out, tapMs }));
