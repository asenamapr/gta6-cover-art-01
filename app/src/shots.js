// Fixed scenes for screenshots: ?shot=cover shows the poster alone, ?shot=editor
// shows the full studio with a photo loaded. Extra params pin the scene:
//   photo=boulevard,pier,neon-street  (sample keys, one per photo slot)
//   caption=BOULEVARD QUEEN  sub=VICE CITY SUMMER
//   layout=hero|triptych|grid|duo  grade=sunset|neon|dusk|hotpink
//   size=square|portrait|wide
// window.__shotReady is set once the scene is painted.
import { defaultPanels } from './cover.js';

export async function runShot(query, api) {
  const { loadSampleIntoSlot, state, redraw, syncPickers, syncPanelControls } = api;
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const layout = query.get('layout');
  if (layout && ['hero', 'triptych', 'grid', 'duo'].includes(layout)) {
    state.layout = layout;
    state.panels = defaultPanels(layout);
    state.activePanel = 0;
  }
  const grade = query.get('grade');
  if (grade && ['sunset', 'neon', 'dusk', 'hotpink'].includes(grade)) state.grade = grade;
  const size = query.get('size');
  if (size && ['square', 'portrait', 'wide'].includes(size)) state.size = size;

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
