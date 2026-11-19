// Neon Palms Cover Studio — page wiring.
// Owns the editor state (3 photo slots, panels, layout, grade, size, captions),
// renders the live preview, exports real PNGs at 1080x1080 / 1080x1350 /
// 1920x1080, and supports deterministic ?shot= scenes for screenshots.
// Photos never leave the machine: uploads are read with object URLs only.
import { drawPoster, defaultPanels, GRADES, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const status = document.getElementById('status');

const SAMPLES = [
  { key: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { key: 'pier', label: 'Pier', file: 'samples/pier.jpg' },
  { key: 'neon-street', label: 'Neon Street', file: 'samples/neon-street.svg' },
  { key: 'palm-dusk', label: 'Palm Dusk', file: 'samples/palm-dusk.svg' },
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
  activePanel: 0,
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
  buildButtons('layout-picks', LAYOUTS, state.layout, (key) => {
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

// Drag on the preview pans the active panel's photo.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY, ox: state.panels[state.activePanel].ox, oy: state.panels[state.activePanel].oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[state.activePanel];
  panel.ox = Math.max(-1, Math.min(1, drag.ox - ((e.clientX - drag.x) / rect.width) * 2));
  panel.oy = Math.max(-1, Math.min(1, drag.oy - ((e.clientY - drag.y) / rect.height) * 2));
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
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

async function boot() {
  syncPickers();
  syncPhotoSlots();
  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    await runShot(query, { loadImage, loadSampleIntoSlot, state, redraw, syncPickers, syncPanelControls });
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
