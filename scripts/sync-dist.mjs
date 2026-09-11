// Copies the built SPA from apps/web/dist to a root-level dist/ directory.
//
// Why: Vercel's Vite preset defaults the Output Directory to "dist" and
// dashboard Project Settings take precedence over vercel.json. Emitting the
// build at BOTH locations makes the deploy work regardless of which value
// the project ends up using.
//
// Runs automatically as part of `npm run build`.

import { cp, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const src = join(root, 'apps', 'web', 'dist');
const dest = join(root, 'dist');

try {
  await stat(join(src, 'index.html'));
} catch {
  console.error('apps/web/dist/index.html not found — run the web build first.');
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await cp(src, dest, { recursive: true });
console.log('Synced apps/web/dist -> dist/ (root output directory ready).');
