// Responsive + a11y QA (P-01, P-03): every manifest route at 360/390/768/1280/1920/2560/3840 in light and dark.
// A cell fails on horizontal scroll, a console error, visible text under 12 px (under 16 px at >= 1920: body text must be
// legible from 10 feet), a fixed element covering a sticky one, or a blank page. Also records redirects and the a11y checks
// from src/dev/a11yScan.ts (compiled on the fly with esbuild) into docs/qa/responsive-report.{md,json}.
// Usage: npm run build && npm run qa:responsive [-- --only=/dev,/desk] [-- --codes=D-08,D-09] [-- --widths=360,1280] [-- --themes=light] [-- --port=4174]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { arg, list, startPreview, launch, fetchManifest, fillParams, routeFilter, NOISE, initScript } from './qa-lib.mjs';

const args = process.argv.slice(2);
const PORT = Number(arg(args, 'port', process.env.QA_PORT ?? '4174'));
const WIDTHS = list(arg(args, 'widths', '360,390,768,1280,1920,2560,3840')).map(Number);
const MIN_FONT = (w) => (w >= 1920 ? 16 : 12);
const THEMES = list(arg(args, 'themes', 'light,dark'));
const ONLY = list(arg(args, 'only')); const CODES = list(arg(args, 'codes'));
const BASE = `http://localhost:${PORT}/#`;
const OUT = new URL('../docs/qa/', import.meta.url);

const a11ySrc = transformSync(readFileSync(new URL('../src/dev/a11yScan.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'iife', globalName: 'PetrockA11y' }).code;

async function main() {
  const server = await startPreview(PORT);
  const browser = await launch();
  let manifest;
  try { manifest = await fetchManifest(browser, BASE); } catch (e) { console.error(e.message); await browser.close(); server.kill(); process.exit(1); }
  const routes = manifest.filter(routeFilter(ONLY, CODES)).filter((r) => !r.path.includes('*'));
  console.log(`${routes.length} routes x ${WIDTHS.join('/')} x ${THEMES.join('+')}`);
  const report = { generatedAt: new Date().toISOString(), widths: WIDTHS, themes: THEMES, routes: [] };
  for (const r of routes) {
    const entry = { code: r.code, path: r.path, name: r.spec?.name ?? r.code, surface: r.surface, status: r.status, cells: {} };
    const url = fillParams(r.path);
    for (const width of WIDTHS) for (const theme of THEMES) {
      const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : width >= 2560 ? Math.round(width * 9 / 16) : 900 }, deviceScaleFactor: 1 });
      await ctx.addInitScript(...initScript(theme, r.path));
      const page = await ctx.newPage();
      await page.route(/^https?:\/\/(?!localhost)/, (x) => x.abort());
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push(m.text()); });
      const t0 = Date.now();
      let cell = { hscroll: false, scrollWidth: 0, offenders: [], smallText: 0, smallTextSamples: [], overlaps: [], blank: false, redirectedTo: null, a11y: [], errors: [], ms: 0 };
      try {
        await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 20000 });
        await page.waitForSelector('#root > *', { timeout: 10000 });
        await page.waitForTimeout(500);
        await page.addScriptTag({ content: a11ySrc });
        const res = await page.evaluate((w) => { const o = PetrockA11y.overflowScan(document, w); const l = PetrockA11y.layoutScan(document); const a = PetrockA11y.scanA11y(document); return { ...o, ...l, a11y: a, hash: location.hash }; }, width);
        const landed = res.hash.replace(/^#/, '').split('?')[0].replace(/\/$/, '') || '/';
        const redirectedTo = landed !== url ? landed : null;
        delete res.hash;
        cell = { ...res, redirectedTo, errors: [...new Set(errors)].slice(0, 5), ms: Date.now() - t0 };
      } catch (e) { cell.errors = [String(e.message).split('\n')[0]]; cell.ms = Date.now() - t0; }
      entry.cells[`${width}-${theme}`] = cell;
      await ctx.close();
    }
    const isFail = (c) => c.hscroll || c.errors.length || c.smallText > 0 || c.overlaps.length > 0 || c.blank;
    const fails = Object.values(entry.cells).filter(isFail).length;
    const redirected = Object.values(entry.cells).find((c) => c.redirectedTo)?.redirectedTo;
    process.stdout.write(`${r.code.padEnd(8)} ${r.path.padEnd(32)} ${fails ? `FAIL x${fails}` : 'ok'}${redirected ? ` (renders ${redirected})` : ''}\n`);
    report.routes.push(entry);
  }
  await browser.close(); server.kill();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(new URL('responsive-report.json', OUT), JSON.stringify(report));
  const cells = report.routes.flatMap((r) => Object.entries(r.cells));
  const isFailCell = (c) => c.hscroll || c.errors.length || c.smallText > 0 || (c.overlaps?.length ?? 0) > 0 || c.blank;
  const failing = cells.filter(([, c]) => isFailCell(c));
  const redirects = report.routes.filter((r) => Object.values(r.cells).some((c) => c.redirectedTo));
  const a11yTotal = cells.reduce((s, [, c]) => s + c.a11y.length, 0);
  let md = `# Responsive QA report\n\ngenerated: ${report.generatedAt}\nroutes: ${report.routes.length}\nwidths: ${WIDTHS.join(', ')}\nthemes: ${THEMES.join(', ')}\ncells: ${cells.length}\nfailing_cells: ${failing.length}\na11y_findings: ${a11yTotal}\n\n_Written by \`npm run qa:responsive\` (scripts/qa-responsive.mjs). Fail = horizontal scroll (documentElement.scrollWidth > viewport), a console error, visible text under 12 px (under 16 px at >= 1920, P-01), a fixed element covering a sticky one, or a blank page. Client routes run as the client demo user, public routes as the visitor, staff routes as the super admin with dev mode off. A11y findings come from src/dev/a11yScan.ts._\n\n## Matrix (${THEMES.join(' / ')})\n\n| Code | Route | ${WIDTHS.join(' | ')} |\n| --- | --- | ${WIDTHS.map(() => '---').join(' | ')} |\n`;
  const mark = (c) => (!c ? '·' : isFailCell(c) ? `FAIL${c.hscroll ? ` ${c.scrollWidth}px` : ''}${c.errors.length ? ' err' : ''}${c.smallText ? ` small${c.smallText}` : ''}${c.overlaps?.length ? ' overlap' : ''}${c.blank ? ' blank' : ''}` : c.a11y.some((a) => a.severity === 'error') ? `warn ${c.a11y.filter((a) => a.severity === 'error').length}` : 'ok');
  for (const r of report.routes) md += `| \`${r.code}\` | \`${r.path}\` | ${WIDTHS.map((w) => THEMES.map((t) => mark(r.cells[`${w}-${t}`])).join(' / ')).join(' | ')} |\n`;
  if (failing.length) { md += `\n## Failing cells\n\n`; for (const r of report.routes) for (const [k, c] of Object.entries(r.cells)) if (isFailCell(c)) md += `- \`${r.code}\` ${r.path} @ ${k}: ${c.hscroll ? `scrollWidth ${c.scrollWidth}; offenders: ${c.offenders.map((o) => `${o.selector} (${o.right}px)`).join(', ') || 'none found'}` : ''}${c.errors.length ? ` errors: ${c.errors.join(' | ')}` : ''}${c.smallText ? ` small text x${c.smallText}: ${c.smallTextSamples.join('; ')}` : ''}${c.overlaps?.length ? ` overlaps: ${c.overlaps.map((o) => `${o.fixed} over ${o.over} (${o.area}px²)`).join(', ')}` : ''}${c.blank ? ' blank page' : ''}\n`; }
  if (redirects.length) { md += `\n## Routes that rendered another page\n\n`; for (const r of redirects) md += `- \`${r.code}\` ${r.path} -> ${Object.values(r.cells).find((c) => c.redirectedTo).redirectedTo}\n`; }
  const byRule = {}; for (const [, c] of cells) for (const a of c.a11y) byRule[a.rule] = (byRule[a.rule] ?? 0) + 1;
  md += `\n## A11y findings by rule\n\n| Rule | Findings |\n| --- | --- |\n${Object.entries(byRule).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n') || '| — | 0 |'}\n`;
  const uniq = new Map(); for (const r of report.routes) for (const [k, c] of Object.entries(r.cells)) for (const a of c.a11y) { const key = `${r.code}|${a.rule}|${a.text}`; if (!uniq.has(key)) uniq.set(key, { code: r.code, path: r.path, ...a, at: [k] }); else uniq.get(key).at.push(k); }
  if (uniq.size) { md += `\n## A11y findings (unique per route)\n\n| Code | Rule | Sev | Finding | Element | Cells |\n| --- | --- | --- | --- | --- | --- |\n`; for (const f of [...uniq.values()].slice(0, 400)) md += `| \`${f.code}\` | ${f.rule} | ${f.severity} | ${f.text.replace(/\|/g, '/')} | \`${f.selector.replace(/\|/g, '/')}\` | ${f.at.length} |\n`; }
  writeFileSync(new URL('responsive-report.md', OUT), md);
  console.log(`\nwrote docs/qa/responsive-report.{md,json}: ${cells.length} cells, ${failing.length} failing, ${a11yTotal} a11y findings`);
  process.exit(failing.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
