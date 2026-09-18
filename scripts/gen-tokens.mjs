// Writes src/styles/tokens.css from src/design/tokens.ts. Run: npm run tokens (Node 22 type stripping).
import { writeFileSync, mkdirSync } from 'node:fs';
const mod = await import('../src/design/tokens.ts');
mkdirSync(new URL('../src/styles/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/styles/tokens.css', import.meta.url), mod.buildTokensCss());
console.log('wrote src/styles/tokens.css');
