// Captures routes as the surface's demo user (dev mode on) at 390 and 1280 px, light (+ dark for key pages); add --widths=3840 for TV checks.
// Output: docs/screenshots/<CODE>/<width>[-dark][-<label>].jpg and docs/screenshots/routes.json (the route manifest).
// Usage: npm run screenshots [-- --smoke] [-- --only=/dev,/docs] [-- --codes=HUB-01,D-02] [-- --label=before] [-- --quality=72] [-- --dark]
//        [-- --widths=390,1280] [-- --brand=boardgame] [-- --port=4173]
//   --smoke      1280 only, no files, just console errors (exit 1 when anything throws)
//   --only=a,b   routes whose path starts with a prefix (trailing $ = exact)
//   --codes=A,B  routes whose spec code is listed
//   --dark       dark captures for every listed route (default: KEY_PAGES only)
//   --widths     comma list of widths (default 390,1280); --label tags the file name (baseline for D-17)
// Hardened (dev-quality): waits for the preview server to answer instead of sleeping, retries the manifest read,
// fills every known route param (scripts/qa-lib.mjs PARAMS), never captures the same code twice, and prints a summary.
// Chromium is preinstalled at /opt/pw-browsers; PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1; never run `playwright install`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { arg, list, startPreview, launch, fetchManifest, fillParams, routeFilter, NOISE, initScript, brandArg } from './qa-lib.mjs';

const args = process.argv.slice(2);
const SMOKE = args.includes('--smoke');
const ALL_DARK = args.includes('--dark');
const ONLY = list(arg(args, 'only'));
const CODES = list(arg(args, 'codes'));
const LABEL = arg(args, 'label');
const QUALITY = Number(arg(args, 'quality', '72'));
const WIDTHS = SMOKE ? [1280] : list(arg(args, 'widths', '390,1280')).map(Number);
const PORT = Number(arg(args, 'port', process.env.QA_PORT ?? '4173'));
const BRAND = brandArg(args);
const BASE = `http://localhost:${PORT}/#`;
const KEY_PAGES = new Set(['HUB-01', 'D-01', 'D-02', 'D-04', 'D-05', 'D-20', 'P-01', 'C-01', 'F-01', 'L-01', 'GB-01']);
const fileName = (width, theme, label = '') => `${width}${theme === 'dark' ? '-dark' : ''}${label ? `-${label}` : ''}.jpg`;
const safe = (code) => code.replace(/[^\w-]/g, '_');

async function main() {
  const server = await startPreview(PORT);
  const browser = await launch();
  let manifest;
  try { manifest = await fetchManifest(browser, BASE); } catch (e) { console.error(e.message); await browser.close(); server.kill(); process.exit(1); }
  mkdirSync(new URL('../docs/screenshots/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../docs/screenshots/routes.json', import.meta.url), JSON.stringify(manifest, null, 1));
  const list_ = manifest.filter(routeFilter(ONLY, CODES)).filter((r) => !r.path.includes('*'));
  const problems = [];
  console.log(`${list_.length} routes${ONLY.length ? ` · only ${ONLY.join(',')}` : ''}${CODES.length ? ` · codes ${CODES.join(',')}` : ''}${SMOKE ? ' · smoke' : ` · ${WIDTHS.join('/')} px · jpeg q${QUALITY}${LABEL ? ` · label ${LABEL}` : ''}`}`);
  const FRAME_PAGES = new Set(['HUB-01', 'D-21', 'D-22']);
  const seenCode = new Set();
  let captured = 0;
  for (const { path, code } of list_) {
    if (seenCode.has(code)) continue; // parameterised duplicates share a code
    seenCode.add(code);
    const url = fillParams(path);
    for (const width of WIDTHS) {
      const themes = !SMOKE && (ALL_DARK || KEY_PAGES.has(code)) ? ['light', 'dark'] : ['light'];
      for (const theme of themes) {
        const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 800 }, deviceScaleFactor: 1 });
        await ctx.addInitScript(...initScript(theme, path, { devMode: true, brand: BRAND }));
        const page = await ctx.newPage();
        await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push(m.text()); });
        try {
          await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 20000 });
          await page.waitForSelector('#root > *', { timeout: 10000 });
          // pages that host live iframes (hub previews, canvas, simulator) need the frames to boot before a capture
          await page.waitForTimeout(FRAME_PAGES.has(code) ? 3000 : 450);
          if (!SMOKE) {
            const dir = new URL(`../docs/screenshots/${safe(code)}/`, import.meta.url);
            mkdirSync(dir, { recursive: true });
            await page.screenshot({ path: new URL(fileName(width, theme, LABEL), dir).pathname, fullPage: width >= 600, type: 'jpeg', quality: QUALITY });
            captured++;
          }
        } catch (e) { errors.push(String(e.message).split('\n')[0]); }
        if (errors.length) problems.push({ path, width, theme, errors: [...new Set(errors)].slice(0, 3) });
        await ctx.close();
      }
    }
    process.stdout.write(`${code.padEnd(8)} ${path}\n`);
  }
  await browser.close();
  server.kill();
  if (!SMOKE && !ONLY.length && !CODES.length && !LABEL) {
    writeFileSync(new URL('../docs/screenshots/README.md', import.meta.url), `# Screenshots\n\nGenerated by \`npm run screenshots\` on ${new Date().toISOString().slice(0, 10)} (JPEG q${QUALITY}). One folder per page code; file name \`<width>[-dark][-<label>].jpg\`. \`routes.json\` is the route manifest the app published (\`window.__ctl.routes\`). Browse them at \`/#/docs/screenshots\`; compare baselines at \`/#/dev/qa/screenshots\`.\n\n| Code | Route | Status |\n| --- | --- | --- |\n${list_.map((r) => `| \`${r.code}\` | \`#${r.path}\` | ${r.status} |`).join('\n')}\n`);
  }
  if (problems.length) { console.log('\nPROBLEMS:'); for (const p of problems) console.log(`  ${p.path} [${p.width}/${p.theme}]`, p.errors.join(' | ')); }
  else console.log(`\nno console errors${SMOKE ? '' : ` · ${captured} files`}`);
  process.exit(problems.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
