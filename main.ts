// Neon Palms Cover Studio — submission entrypoint.
//
// The app itself lives in app/ next to this file: plain static files a
// desktop browser loads offline (index.html plus its ES modules, no library
// and no network request). All this file does is hand that app in: it stages
// a copy of app/ and screenshots/ under the output directory and writes the
// dossier.json summary the judge reads, using the vendored make.fun library.
//
// Run it with `node main.ts`. Outside the grader's container the output
// directory comes from MAKEFUN_OUTPUT_DIR (it stands in for /output):
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's caps for this bounty (from the kit's gate): the text cap is
// the only one that shapes the dossier bytes. The rest make this program
// refuse exactly where the scorer would — too many screenshots, one too
// large, too many app entries or bytes, or an app path too long — so a
// dossier written here is one the scorer accepts.
const SCORER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
} as const;

function stage(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
}

function handIn(): void {
  const repoRoot = fileURLToPath(new URL('.', import.meta.url));
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  mkdirSync(outputDir, { recursive: true });

  // The app: every static file, copied whole.
  stage(join(repoRoot, 'app'), join(outputDir, 'app'));

  // The screenshots: up to four PNG/JPEG renders, the first by name the
  // cover. Round 5: reuse the stage() helper when the folder exists, so
  // the output still always has the screenshots dir either way.
  const shotsOut = join(outputDir, 'screenshots');
  const shotsIn = join(repoRoot, 'screenshots');
  if (existsSync(shotsIn)) {
    stage(shotsIn, shotsOut);
  } else {
    mkdirSync(shotsOut, { recursive: true });
  }

  const dossier = buildDossier(outputDir, SCORER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
