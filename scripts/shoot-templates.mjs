// Phone-size stills of templates for review: threshold + revealed scene, per language.
// One browser, one page at a time (memory-safe).
//
//   node scripts/shoot-templates.mjs <outDir> <id> [<id> ...] [--lang en|ar] [--base http://localhost:3010]
//
// Writes <outDir>/<id>-<lang>-{threshold,revealed}.jpg. The revealed shot uses reduced motion,
// which the family treats as "skip the video, show the opened scene with the names".
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
let chromium;
for (const base of [root, path.join(root, "gflow-test/batch")]) {
  try {
    ({ chromium } = createRequire(path.join(base, "package.json"))("playwright-core"));
    break;
  } catch {}
}
if (!chromium) throw new Error("playwright-core not found");

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args.splice(args.indexOf(k), 2)[1] : d);
const LANG_KEY = "naila_lang";
const lang = opt("--lang", "en");
const base = opt("--base", "http://localhost:3010");
const [outDir, ...ids] = args;
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: LANG_KEY, value: lang, url: base }]);
await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch {} }, [LANG_KEY, lang]);
const page = await ctx.newPage();
for (const id of ids) {
  const url = `${base}/t/${id}`;
  try {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, `${id}-${lang}-threshold.jpg`), type: "jpeg", quality: 72 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("main button").first().tap();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, `${id}-${lang}-revealed.jpg`), type: "jpeg", quality: 72 });
    console.log("ok", id);
  } catch (e) {
    console.log("FAIL", id, String(e).slice(0, 160));
  }
}
await browser.close();
