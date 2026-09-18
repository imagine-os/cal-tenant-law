import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { docMetaPlugin } from './scripts/lib/docmeta.mjs';
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// base './' keeps assets relative so the build works at https://imagine-os.github.io/cal-tenant-law/ and locally.
// docMetaPlugin serves `*.md?docmeta` (title, header meta, headings, decisions) so the docs viewer indexes the
// repo's markdown at build time while the bodies load on demand as `?raw` chunks (src/docs/docsIndex.ts).
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), docMetaPlugin()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: { chunkSizeWarningLimit: 2500 },
});
