// Neon Palms Cover Studio — gta6-cover-art-01 entry program (Node 22, stdlib only).
// The app is plain static files under app/ (index.html, ES modules, CSS, a vendored
// OFL font and sample images) that run offline in desktop Chrome with no network
// request. This program hands the entry in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes output/dossier.json with
// the vendored make.fun library, so the judge can read the app and its screenshots.
//
// Try it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps: text_max_bytes shapes the dossier text; the other limits
// refuse an entry the scorer would refuse (more than 4 screenshots, one over
// 256 KiB; more than 993 files in app/ or 48 MiB of app files in all, or an app/
// path over 1000 bytes, beside /output's own 1000-entry cap).
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// One line of proof the handoff worked, so a silent partial copy is obvious:
// the dossier's byte size next to the output directory it describes.
console.log(`Neon Palms Cover Studio handed in: ${out} (dossier.json ${statSync(dossierPath).size} bytes)`);
