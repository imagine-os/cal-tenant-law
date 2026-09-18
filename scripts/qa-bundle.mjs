// Bundle report (R-X85): sizes of dist/assets (raw + gzip) and the markdown the docs viewer bundles, into docs/qa/bundle-report.{md,json}.
// Usage: npm run build && npm run qa:bundle. D-16 compares the numbers against perf_budgets.
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const dist = join(root, 'dist', 'assets');
if (!existsSync(dist)) { console.error('dist/assets missing - run npm run build first'); process.exit(1); }
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const kindOf = (f) => (f.endsWith('.js') ? 'js' : f.endsWith('.css') ? 'css' : 'other');
const assets = readdirSync(dist).map((f) => { const buf = readFileSync(join(dist, f)); const kind = kindOf(f); return { file: f, bytes: buf.length, gzip: kind === 'other' ? buf.length : gzipSync(buf).length, kind }; }).sort((a, b) => b.gzip - a.gzip);
const sum = (k, pred) => assets.filter(pred).reduce((s, a) => s + a[k], 0);
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [statSync(join(dir, e.name)).size] : []));
const docsBytes = walk(join(root, 'docs')).reduce((s, n) => s + n, 0);
const js = assets.filter((a) => a.kind === 'js');
const report = { generatedAt: new Date().toISOString(), version: pkg.version, assets, totals: { js: sum('bytes', (a) => a.kind === 'js'), css: sum('bytes', (a) => a.kind === 'css'), other: sum('bytes', (a) => a.kind === 'other'), jsGzip: sum('gzip', (a) => a.kind === 'js'), cssGzip: sum('gzip', (a) => a.kind === 'css'), files: assets.length }, largest: js[0] ? { file: js[0].file, gzip: js[0].gzip } : null, docsBytes };
const out = join(root, 'docs', 'qa'); mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'bundle-report.json'), JSON.stringify(report, null, 1));
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
writeFileSync(join(out, 'bundle-report.md'), `# Bundle report\n\ngenerated: ${report.generatedAt}\nversion: ${pkg.version}\njs_gzip: ${kb(report.totals.jsGzip)}\ncss_gzip: ${kb(report.totals.cssGzip)}\nfiles: ${report.totals.files}\ndocs_bundled: ${kb(docsBytes)}\n\n_Written by \`npm run qa:bundle\`. Budgets live in the \`perf_budgets\` table; \`/#/dev/qa/perf\` compares._\n\n| File | Kind | Raw | Gzip |\n| --- | --- | --- | --- |\n${assets.map((a) => `| \`${a.file}\` | ${a.kind} | ${kb(a.bytes)} | ${kb(a.gzip)} |`).join('\n')}\n`);
console.log(`wrote docs/qa/bundle-report.{md,json}: js ${kb(report.totals.jsGzip)} gzip, css ${kb(report.totals.cssGzip)} gzip, ${assets.length} files, docs ${kb(docsBytes)}`);
