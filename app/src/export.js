// Neon Palms Cover Studio — batch export pipeline (Round 3, new file).
// One click exports the poster at every size, plus social presets, in a
// sequence with live progress. Each render is a fresh offscreen canvas at
// the preset's exact pixel size through the same drawPoster() the preview
// uses, so the file you download is exactly the poster you see.

export const EXPORT_PRESETS = {
  square: { label: 'Post 1080 × 1080', w: 1080, h: 1080, kind: 'post' },
  portrait: { label: 'Portrait 1080 × 1350', w: 1080, h: 1350, kind: 'post' },
  wide: { label: 'Wide 1920 × 1080', w: 1920, h: 1080, kind: 'post' },
  story: { label: 'Story 1080 × 1920', w: 1080, h: 1920, kind: 'story' },
};

export const BATCH_SETS = {
  all: { label: 'All sizes', presets: ['square', 'portrait', 'wide', 'story'] },
  social: { label: 'Social pack', presets: ['story', 'square', 'wide'] },
  print: { label: 'Print pack', presets: ['portrait', 'wide'] },
};

export function exportFileName(state, presetKey) {
  const preset = EXPORT_PRESETS[presetKey] || EXPORT_PRESETS.square;
  const layout = (state && state.layout) || 'poster';
  const slug = (state && state.title ? state.title : 'poster')
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'poster';
  return `neon-palms-${layout}-${slug}-${preset.w}x${preset.h}.png`;
}

/** Renders the poster at a preset's exact size and resolves its PNG blob. */
export function renderExportBlob(state, drawPoster, presetKey) {
  const preset = EXPORT_PRESETS[presetKey];
  if (!preset) return Promise.reject(new Error('Unknown export preset: ' + presetKey));
  const off = document.createElement('canvas');
  off.width = preset.w;
  off.height = preset.h;
  drawPoster(off, state);
  return new Promise((resolve, reject) => {
    off.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas export produced no blob'));
      resolve({ blob, w: preset.w, h: preset.h, preset: presetKey });
    }, 'image/png');
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exports every preset in `presetKeys`, one after another, calling
 * onProgress({ done, total, current, fileName, bytes }) after each file.
 * Sequential (not parallel) so the browser's download shelf stays in order
 * and a slow render never overlaps the next one. Resolves with the list of
 * finished files; a single failure is recorded and the rest still run.
 */
export async function batchExport(state, drawPoster, presetKeys, onProgress) {
  const keys = (presetKeys || []).filter((k) => EXPORT_PRESETS[k]);
  const total = keys.length;
  const results = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const fileName = exportFileName(state, key);
    try {
      const { blob, w, h } = await renderExportBlob(state, drawPoster, key);
      downloadBlob(blob, fileName);
      const done = { key, fileName, w, h, bytes: blob.size, ok: true };
      results.push(done);
      if (onProgress) onProgress({ done: i + 1, total, current: key, fileName, bytes: blob.size, ok: true });
    } catch (err) {
      const failed = { key, fileName, w: 0, h: 0, bytes: 0, ok: false, error: String(err && err.message || err) };
      results.push(failed);
      if (onProgress) onProgress({ done: i + 1, total, current: key, fileName, bytes: 0, ok: false, error: failed.error });
    }
    // Small breather between downloads so the browser can start each one.
    if (i < keys.length - 1) await sleep(350);
  }
  window.__lastBatchExport = results;
  return results;
}

/** One-click export of a named batch set ('all', 'social' or 'print'). */
export function batchExportSet(state, drawPoster, setKey, onProgress) {
  const set = BATCH_SETS[setKey] || BATCH_SETS.all;
  return batchExport(state, drawPoster, set.presets, onProgress);
}

/** Human progress line for the status element, e.g. "2/4 — Story saved". */
export function progressText(progress) {
  if (!progress) return '';
  if (!progress.ok) return `Export ${progress.done}/${progress.total} failed: ${progress.fileName}`;
  const preset = EXPORT_PRESETS[progress.current];
  const label = preset ? preset.label : progress.current;
  const kb = Math.round(progress.bytes / 1024);
  return `Export ${progress.done}/${progress.total} — ${label} saved (${kb} KiB).`;
}

/** Verifies a rendered canvas really is the preset's exact pixel size. */
export function verifyExportSize(canvas, presetKey) {
  const preset = EXPORT_PRESETS[presetKey];
  if (!preset) return { ok: false, reason: 'unknown preset ' + presetKey };
  if (canvas.width !== preset.w || canvas.height !== preset.h) {
    return { ok: false, reason: `expected ${preset.w}x${preset.h}, got ${canvas.width}x${canvas.height}` };
  }
  return { ok: true, w: preset.w, h: preset.h };
}
