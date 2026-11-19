// Neon Palms Cover Studio — page wiring (Round 2).
// Owns the editor state (3 photo slots, panels, layout, grade, size, captions,
// title position + letter-spacing), renders the live preview, exports real
// PNGs at 1080x1080 / 1080x1350 / 1920x1080, and supports deterministic
// ?shot= scenes for screenshots.
// Photos never leave the machine: uploads are read with object URLs only.
import { drawPoster, defaultPanels, GRADES, LAYOUTS, SIZES, TITLE_POSITIONS } from './cover.js';
import { runShot } from './shots.js';
import { EXTRA_LAYOUTS } from './layouts-extra.js';
import { STICKERS, createSticker, hitSticker, moveSticker, rotateSticker, scaleSticker, bringForward, sendBackward, removeSticker, stickerLabel } from './stickers.js';
import { EFFECT_PRESETS, describeEffect } from './effects.js';
import { batchExportSet, progressText } from './export.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const spacingInput = document.getElementById('title-spacing');
const status = document.getElementById('status');

const SAMPLES = [
  { key: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { key: 'pier', label: 'Pier', file: 'samples/pier.jpg' },
  { key: 'neon-street', label: 'Neon Street', file: 'samples/neon-street.svg' },
  { key: 'palm-dusk', label: 'Palm Dusk', file: 'samples/palm-dusk.svg' },
  { key: 'sunset-strip', label: 'Sunset Strip', file: 'samples/sunset-strip.svg' },
];

const state = {
  photos: [null, null, null],
  photoNames: ['—', '—', '—'],
  panels: defaultPanels('triptych'),
  layout: 'triptych',
  grade: 'sunset',
  size: 'wide',
  title: 'BOULEVARD QUEEN',
  sub: 'VICE CITY SUMMER',
  titlePos: 'band',
  titleSpacing: 2,
  activePanel: 0,
  stickers: [],
  selectedSticker: -1,
  textEffects: { title: 'vice-glow', sub: 'none' },
};

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawPoster(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSampleIntoSlot(slot, sampleKey) {
  const sample = SAMPLES.find((s) => s.key === sampleKey) || SAMPLES[0];
  state.photos[slot] = await loadImage(sample.file);
  state.photoNames[slot] = sample.label;
  syncPhotoSlots();
  redraw();
}

function syncPhotoSlots() {
  for (let slot = 0; slot < 3; slot++) {
    const name = document.getElementById('photo-name-' + slot);
    if (name) name.textContent = state.photoNames[slot];
  }
  syncPanelControls();
}

function syncPanelControls() {
  const count = state.panels.length;
  const tabs = document.getElementById('panel-tabs');
  tabs.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab' + (i === state.activePanel ? ' active' : '');
    b.textContent = 'Panel ' + (i + 1);
    b.addEventListener('click', () => {
      state.activePanel = i;
      syncPanelControls();
      redraw();
    });
    tabs.appendChild(b);
  }
  const panel = state.panels[state.activePanel] || state.panels[0];
  const select = document.getElementById('panel-photo');
  select.innerHTML = '';
  for (let slot = 0; slot < 3; slot++) {
    const o = document.createElement('option');
    o.value = String(slot);
    o.textContent = 'Photo ' + (slot + 1) + ' — ' + state.photoNames[slot];
    if (slot === panel.photo) o.selected = true;
    select.appendChild(o);
  }
  document.getElementById('panel-scale').value = panel.scale;
  document.getElementById('panel-ox').value = panel.ox;
  document.getElementById('panel-oy').value = panel.oy;
  document.getElementById('scale-val').textContent = Math.round(panel.scale * 100) + '%';
  document.getElementById('ox-val').textContent = Math.round(panel.ox * 100);
  document.getElementById('oy-val').textContent = Math.round(panel.oy * 100);
}

function buildButtons(containerId, entries, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  Object.entries(entries).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (key === current ? ' active' : '');
    b.textContent = def.label;
    if (def.stops) {
      b.style.background = `linear-gradient(135deg, ${def.stops[0]}, ${def.stops[1]} 55%, ${def.stops[2]})`;
      b.style.color = '#fff';
      b.style.textShadow = '0 1px 4px rgba(0,0,0,0.6)';
    }
    b.addEventListener('click', () => onPick(key));
    box.appendChild(b);
  });
}

function syncPickers() {
  buildButtons('layout-picks', { ...LAYOUTS, ...EXTRA_LAYOUTS }, state.layout, (key) => {
    state.layout = key;
    state.panels = defaultPanels(key);
    state.activePanel = 0;
    syncPickers();
    syncPanelControls();
    redraw();
  });
  buildButtons('grade-picks', GRADES, state.grade, (key) => {
    state.grade = key;
    syncPickers();
    redraw();
  });
  buildButtons('size-picks', SIZES, state.size, (key) => {
    state.size = key;
    syncPickers();
    redraw();
  });
  buildButtons('titlepos-picks', TITLE_POSITIONS, state.titlePos, (key) => {
    state.titlePos = key;
    syncPickers();
    redraw();
  });
}

// Round 3: sticker picker + selected-sticker controls.
function syncStickerPanel() {
  const grid = document.getElementById('sticker-grid');
  if (!grid) return;
  grid.innerHTML = '';
  STICKERS.forEach((def) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sticker-btn';
    b.textContent = def.label;
    b.title = def.hint;
    b.addEventListener('click', () => {
      const st = createSticker(def.id, state.stickers.length);
      if (!st) return;
      state.stickers.push(st);
      state.selectedSticker = state.stickers.length - 1;
      syncStickerPanel();
      redraw();
    });
    grid.appendChild(b);
  });
  const sel = document.getElementById('sticker-selected');
  const picked = state.stickers[state.selectedSticker];
  if (sel) sel.textContent = picked ? stickerLabel(picked.id) + ` — ${Math.round(picked.size * 100)}% · ${picked.rot}°` : 'None — tap a sticker to add it, or tap one on the poster.';
  document.querySelectorAll('[data-sticker-op]').forEach((b) => {
    b.disabled = !picked;
  });
}

function stickerOp(op) {
  const i = state.selectedSticker;
  const st = state.stickers[i];
  if (!st) return;
  if (op === 'rot-left') rotateSticker(st, -15);
  else if (op === 'rot-right') rotateSticker(st, 15);
  else if (op === 'bigger') scaleSticker(st, 1.2);
  else if (op === 'smaller') scaleSticker(st, 1 / 1.2);
  else if (op === 'flip') st.flip = !st.flip;
  else if (op === 'forward') state.selectedSticker = bringForward(state.stickers, i);
  else if (op === 'backward') state.selectedSticker = sendBackward(state.stickers, i);
  else if (op === 'delete') {
    removeSticker(state.stickers, i);
    state.selectedSticker = -1;
  }
  syncStickerPanel();
  redraw();
}

// Round 3: per-element text-effect pickers (title + sub-caption).
function syncEffectPickers() {
  const titleBox = document.getElementById('title-effect-picks');
  if (titleBox) {
    titleBox.innerHTML = '';
    Object.entries(EFFECT_PRESETS).forEach(([key, def]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick' + (key === state.textEffects.title ? ' active' : '');
      b.textContent = def.label;
      b.addEventListener('click', () => {
        state.textEffects.title = key;
        status.textContent = 'Title effect: ' + describeEffect(key) + '.';
        syncEffectPickers();
        redraw();
      });
      titleBox.appendChild(b);
    });
  }
  const subBox = document.getElementById('sub-effect-picks');
  if (subBox) {
    subBox.innerHTML = '';
    Object.entries(EFFECT_PRESETS).forEach(([key, def]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick' + (key === state.textEffects.sub ? ' active' : '');
      b.textContent = def.label;
      b.addEventListener('click', () => {
        state.textEffects.sub = key;
        status.textContent = 'Sub-caption effect: ' + describeEffect(key) + '.';
        syncEffectPickers();
        redraw();
      });
      subBox.appendChild(b);
    });
  }
}

// Photo slots: file upload + one-click sample scenes.
for (let slot = 0; slot < 3; slot++) {
  const input = document.getElementById('photo-' + slot);
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[slot] = await loadImage(URL.createObjectURL(file));
    state.photoNames[slot] = file.name.length > 22 ? file.name.slice(0, 21) + '…' : file.name;
    syncPhotoSlots();
    redraw();
  });
  const sampleBox = document.getElementById('samples-' + slot);
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = s.label;
    b.addEventListener('click', () => loadSampleIntoSlot(slot, s.key));
    sampleBox.appendChild(b);
  });
}

captionInput.addEventListener('input', () => {
  state.title = captionInput.value;
  redraw();
});
subInput.addEventListener('input', () => {
  state.sub = subInput.value;
  redraw();
});
spacingInput.addEventListener('input', () => {
  state.titleSpacing = Number(spacingInput.value);
  document.getElementById('spacing-val').textContent = spacingInput.value + ' px';
  redraw();
});

document.getElementById('panel-photo').addEventListener('change', (e) => {
  state.panels[state.activePanel].photo = Number(e.target.value);
  redraw();
});
document.getElementById('panel-scale').addEventListener('input', (e) => {
  state.panels[state.activePanel].scale = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('panel-ox').addEventListener('input', (e) => {
  state.panels[state.activePanel].ox = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('panel-oy').addEventListener('input', (e) => {
  state.panels[state.activePanel].oy = Number(e.target.value);
  syncPanelControls();
  redraw();
});

// Drag on the preview: a sticker under the pointer moves; otherwise the
// active panel's photo pans.
let drag = null;
let dragSticker = -1;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const fx = (e.clientX - rect.left) / rect.width;
  const fy = (e.clientY - rect.top) / rect.height;
  dragSticker = hitSticker(state.stickers, fx, fy, canvas.width, canvas.height);
  if (dragSticker >= 0) {
    state.selectedSticker = dragSticker;
    syncStickerPanel();
    const st = state.stickers[dragSticker];
    drag = { sticker: true, x: e.clientX, y: e.clientY, sx: st.x, sy: st.y };
  } else {
    drag = { sticker: false, x: e.clientX, y: e.clientY, ox: state.panels[state.activePanel].ox, oy: state.panels[state.activePanel].oy };
  }
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  if (drag.sticker) {
    const st = state.stickers[dragSticker];
    if (!st) return;
    moveSticker(st, (e.clientX - drag.x) / rect.width, (e.clientY - drag.y) / rect.height);
    syncStickerPanel();
    redraw();
    return;
  }
  const panel = state.panels[state.activePanel];
  panel.ox = Math.max(-1, Math.min(1, drag.ox - ((e.clientX - drag.x) / rect.width) * 2));
  panel.oy = Math.max(-1, Math.min(1, drag.oy - ((e.clientY - drag.y) / rect.height) * 2));
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
  dragSticker = -1;
});

document.querySelectorAll('[data-sticker-op]').forEach((b) => {
  b.addEventListener('click', () => stickerOp(b.dataset.stickerOp));
});

// One click per size: render the poster at full export size and download it.
function exportPng(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawPoster(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-palms-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved neon-palms-${size.w}x${size.h}.png — ${Math.round(blob.size / 1024)} KiB, yours to post.`;
    window.__lastExport = { w: size.w, h: size.h, bytes: blob.size };
  }, 'image/png');
}

document.querySelectorAll('[data-export]').forEach((b) => {
  b.addEventListener('click', () => exportPng(b.dataset.export));
});

// Round 3: batch export — all sizes + story preset, sequential, with progress.
const batchBtn = document.getElementById('export-batch');
if (batchBtn) {
  batchBtn.addEventListener('click', async () => {
    batchBtn.disabled = true;
    status.textContent = 'Batch export started — 4 files…';
    const results = await batchExportSet(state, drawPoster, 'all', (p) => {
      status.textContent = progressText(p);
    });
    const ok = results.filter((r) => r.ok).length;
    status.textContent = ok === results.length
      ? `Batch done — ${ok} PNGs saved (1080×1080, 1080×1350, 1920×1080, 1080×1920 story).`
      : `Batch finished with ${results.length - ok} failure(s) — ${ok} PNGs saved.`;
    batchBtn.disabled = false;
  });
}

async function boot() {
  syncPickers();
  syncPhotoSlots();
  syncStickerPanel();
  syncEffectPickers();
  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    await runShot(query, { loadImage, loadSampleIntoSlot, state, redraw, syncPickers, syncPanelControls, syncStickerPanel, syncEffectPickers });
  } else {
    // First visit: fill the three slots with the sample scenes so the poster
    // is alive before any upload.
    try {
      state.photos[0] = await loadImage('samples/boulevard.jpg');
      state.photoNames[0] = 'Boulevard';
      state.photos[1] = await loadImage('samples/pier.jpg');
      state.photoNames[1] = 'Pier';
      state.photos[2] = await loadImage('samples/neon-street.svg');
      state.photoNames[2] = 'Neon Street';
    } catch {
      // Offline without samples: empty panels still render with a prompt.
    }
    syncPhotoSlots();
  }
  if (document.fonts && document.fonts.load) {
    try {
      await document.fonts.load('16px Anton');
    } catch {
      // System sans-serif fallback keeps the lettering bold.
    }
  }
  redraw();
  window.__shotReady = true;
}

boot();
