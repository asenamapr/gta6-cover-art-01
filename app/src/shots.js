// Fixed scenes for screenshots: ?shot=cover shows the poster alone, ?shot=editor
// shows the full studio with a photo loaded. Extra params pin the scene:
//   photo=boulevard,pier,neon-street  (sample keys, one per photo slot)
//   caption=BOULEVARD QUEEN  sub=VICE CITY SUMMER
//   layout=hero|triptych|grid|duo|center|magazine
//   grade=sunset|neon|dusk|hotpink|teal|gold
//   size=square|portrait|wide  titlepos=band|top|center  spacing=0..12
// window.__shotReady is set once the scene is painted.
import { defaultPanels } from './cover.js';

const LAYOUT_KEYS = ['hero', 'triptych', 'grid', 'duo', 'center', 'magazine'];
const GRADE_KEYS = ['sunset', 'neon', 'dusk', 'hotpink', 'teal', 'gold'];
const SIZE_KEYS = ['square', 'portrait', 'wide'];
const TITLEPOS_KEYS = ['band', 'top', 'center'];

export async function runShot(query, api) {
  const { loadSampleIntoSlot, state, redraw, syncPickers, syncPanelControls } = api;
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const layout = query.get('layout');
  if (layout && LAYOUT_KEYS.includes(layout)) {
    state.layout = layout;
    state.panels = defaultPanels(layout);
    state.activePanel = 0;
  }
  const grade = query.get('grade');
  if (grade && GRADE_KEYS.includes(grade)) state.grade = grade;
  const size = query.get('size');
  if (size && SIZE_KEYS.includes(size)) state.size = size;
  const titlePos = query.get('titlepos');
  if (titlePos && TITLEPOS_KEYS.includes(titlePos)) {
    state.titlePos = titlePos;
    const input = document.getElementById('titlepos-picks');
    if (input) input.dataset.value = titlePos;
  }
  const spacing = Number(query.get('spacing'));
  if (Number.isFinite(spacing)) {
    state.titleSpacing = Math.max(0, Math.min(12, spacing));
    const slider = document.getElementById('title-spacing');
    if (slider) slider.value = String(state.titleSpacing);
    const val = document.getElementById('spacing-val');
    if (val) val.textContent = state.titleSpacing + ' px';
  }

  const caption = query.get('caption');
  if (caption !== null) {
    state.title = caption;
    const input = document.getElementById('caption');
    if (input) input.value = caption;
  }
  const sub = query.get('sub');
  if (sub !== null) {
    state.sub = sub;
    const input = document.getElementById('subcaption');
    if (input) input.value = sub;
  }

  const photos = (query.get('photo') || 'boulevard,pier,neon-street').split(',');
  for (let slot = 0; slot < Math.min(3, photos.length); slot++) {
    const key = photos[slot].trim();
    if (key) await loadSampleIntoSlot(slot, key);
  }
  // Panel crops pinned per shot so the composition is deterministic.
  const crops = query.get('crops');
  if (crops) {
    crops.split(';').forEach((c, i) => {
      const [scale, ox, oy] = c.split(',').map(Number);
      if (!state.panels[i]) return;
      if (Number.isFinite(scale)) state.panels[i].scale = scale;
      if (Number.isFinite(ox)) state.panels[i].ox = ox;
      if (Number.isFinite(oy)) state.panels[i].oy = oy;
    });
  }

  syncPickers();
  syncPanelControls();
  if (document.fonts && document.fonts.load) {
    try {
      await document.fonts.load('16px Anton');
      await document.fonts.ready;
    } catch {
      // Fallback lettering still renders.
    }
  }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
