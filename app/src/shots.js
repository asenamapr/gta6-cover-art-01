// Fixed scenes for screenshots: ?shot=cover shows the poster alone, ?shot=editor
// shows the full studio with a photo loaded. Extra params pin the scene:
//   photo=boulevard,pier,neon-street  (sample keys, one per photo slot)
//   caption=BOULEVARD QUEEN  sub=VICE CITY SUMMER
//   layout=hero|triptych|grid|duo|center|magazine|boulevard|wanted|backcover
//   grade=sunset|neon|dusk|hotpink|teal|gold
//   size=square|portrait|wide|story  titlepos=band|top|center  spacing=0..12
//   effect=none|vice-glow|sunset-outline|chrome|neon-sign|gold-foil|retro-shadow|candy-pop|arch-vice|arch-gold
//   subeffect=<same list>  stickers=palm,sunburst,wanted  (Round 3 sticker ids)
// window.__shotReady is set once the scene is painted.
import { defaultPanels } from './cover.js';
import { createSticker } from './stickers.js';
import { EFFECT_PRESETS } from './effects.js';

const LAYOUT_KEYS = ['hero', 'triptych', 'grid', 'duo', 'center', 'magazine', 'boulevard', 'wanted', 'backcover'];
const GRADE_KEYS = ['sunset', 'neon', 'dusk', 'hotpink', 'teal', 'gold'];
const SIZE_KEYS = ['square', 'portrait', 'wide', 'story'];
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

  // Round 3: deterministic text effects and stickers for the new screenshots.
  const effect = query.get('effect');
  if (effect && EFFECT_PRESETS[effect]) state.textEffects.title = effect;
  const subEffect = query.get('subeffect');
  if (subEffect && EFFECT_PRESETS[subEffect]) state.textEffects.sub = subEffect;
  const stickers = query.get('stickers');
  if (stickers) {
    state.stickers = [];
    stickers.split(',').forEach((token, i) => {
      // Each token is `id` or `id:x:y` with x/y as fractions of the poster,
      // so a shot can park a sticker clear of the poster's text.
      const [id, xs, ys] = token.trim().split(':');
      const st = createSticker(id, i);
      if (!st) return;
      const px = Number(xs);
      const py = Number(ys);
      if (Number.isFinite(px)) st.x = Math.max(0.02, Math.min(0.98, px));
      if (Number.isFinite(py)) st.y = Math.max(0.02, Math.min(0.98, py));
      state.stickers.push(st);
    });
    state.selectedSticker = state.stickers.length ? 0 : -1;
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
  if (api.syncStickerPanel) api.syncStickerPanel();
  if (api.syncEffectPickers) api.syncEffectPickers();
  // Editor shots can pin the controls column on a panel group, e.g.
  // scrollto=group-effects shows the new Round 3 panels.
  const scrollto = query.get('scrollto');
  if (scrollto) {
    const el = document.getElementById(scrollto);
    if (el) el.scrollIntoView({ block: 'start' });
  }
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
