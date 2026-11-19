// Neon Palms Cover Studio — poster renderer (Round 2).
// Draws a multi-panel GTA-style poster onto any 2D canvas: panel photos with
// per-panel crop, a colour grade (gradient + duotone tint + vignette + grain),
// and bold condensed display lettering with outline, gradient fill and shadow.
// Round 2 adds: Center Stage (single-panel hero) and Magazine (editorial
// feature) layouts, Vice Teal and Gold Rush grades, title position presets
// (band / overlay top / overlay centre) and adjustable title letter-spacing.
// Round 3 wiring: extra layouts (Boulevard / Wanted / Back Cover) delegate
// to layouts-extra.js, stickers from stickers.js draw over every poster, and
// the title/sub use the text-effects engine from effects.js.
// Nothing here copies Rockstar art, logos or fonts: the display face is Anton
// (SIL OFL), shipped under app/fonts/.

import { drawExtraCover, isExtraLayout, extraPanelRects, extraDefaultPanels } from './layouts-extra.js';
import { drawStickers } from './stickers.js';
import { effectFor, titleGradient, applyEffectToCtx, drawArchText } from './effects.js';

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    stops: ['#17c8c8', '#ff5e8a', '#ff9a3d'],
    tint: 'rgba(255, 96, 60, 0.12)',
    accent: '#ff5e8a',
    band: ['#1c0b33', '#3a1040'],
  },
  neon: {
    label: 'Neon Nights',
    stops: ['#00e5ff', '#b537f2', '#ff2fb3'],
    tint: 'rgba(255, 47, 179, 0.10)',
    accent: '#00e5ff',
    band: ['#0a1030', '#2b0a4a'],
  },
  dusk: {
    label: 'Palm Dusk',
    stops: ['#7b2ff7', '#c86bfa', '#ffb347'],
    tint: 'rgba(255, 179, 71, 0.10)',
    accent: '#ffb347',
    band: ['#160b2e', '#3d1a4d'],
  },
  hotpink: {
    label: 'Hot Pink Drive',
    stops: ['#ff2e63', '#ff6b9d', '#ff1e3c'],
    tint: 'rgba(255, 30, 60, 0.12)',
    accent: '#ff2e63',
    band: ['#20041f', '#4a0a2e'],
  },
  teal: {
    label: 'Vice Teal',
    stops: ['#00f5d4', '#0096c7', '#ff5e8a'],
    tint: 'rgba(0, 245, 212, 0.10)',
    accent: '#00f5d4',
    band: ['#03252e', '#0a3a4a'],
  },
  gold: {
    label: 'Gold Rush',
    stops: ['#ffe259', '#ff9a3d', '#b537f2'],
    tint: 'rgba(255, 178, 0, 0.12)',
    accent: '#ffe259',
    band: ['#2a1503', '#4a1a3a'],
  },
};

export const LAYOUTS = {
  hero: { label: 'Hero Split', panels: 2 },
  triptych: { label: 'Triptych', panels: 3 },
  grid: { label: 'Four-Panel Grid', panels: 4 },
  duo: { label: 'Duo + Strip', panels: 3 },
  center: { label: 'Center Stage', panels: 1 },
  magazine: { label: 'Magazine', panels: 3 },
};

export const TITLE_POSITIONS = {
  band: { label: 'Title in band' },
  top: { label: 'Title on top' },
  center: { label: 'Title centered' },
};

export const SIZES = {
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080', w: 1920, h: 1080 },
  story: { label: '1080 x 1920', w: 1080, h: 1920 },
};

// Panel rectangles for a layout, inside the photo zone (top 80% of the poster).
export function panelRects(layout, w, h) {
  const extra = extraPanelRects(layout, w, h);
  if (extra) return extra;
  const ph = h * 0.8;
  const g = Math.max(4, Math.round(w * 0.008));
  if (layout === 'hero') {
    const split = Math.round(w * 0.62);
    return [
      { x: 0, y: 0, w: split, h: ph },
      { x: split + g, y: 0, w: w - split - g, h: ph },
    ];
  }
  if (layout === 'triptych') {
    const pw = (w - 2 * g) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (pw + g), y: 0, w: pw, h: ph }));
  }
  if (layout === 'grid') {
    const pw = (w - g) / 2;
    const phh = (ph - g) / 2;
    return [
      { x: 0, y: 0, w: pw, h: phh },
      { x: pw + g, y: 0, w: pw, h: phh },
      { x: 0, y: phh + g, w: pw, h: phh },
      { x: pw + g, y: phh + g, w: pw, h: phh },
    ];
  }
  if (layout === 'center') {
    // One full-bleed hero panel: the photo is the whole poster.
    return [{ x: 0, y: 0, w, h: ph }];
  }
  if (layout === 'magazine') {
    // Editorial feature: one tall cover star on the left, two stacked
    // supporting panels on the right, like a magazine cover spread.
    const left = Math.round(w * 0.56);
    const right = w - left - g;
    const top = Math.round(ph * 0.52);
    return [
      { x: 0, y: 0, w: left, h: ph },
      { x: left + g, y: 0, w: right, h: top },
      { x: left + g, y: top + g, w: right, h: ph - top - g },
    ];
  }
  // duo: two panels on top, one wide strip below.
  const pw = (w - g) / 2;
  const top = ph * 0.55;
  return [
    { x: 0, y: 0, w: pw, h: top },
    { x: pw + g, y: 0, w: pw, h: top },
    { x: 0, y: top + g, w: w, h: ph - top - g },
  ];
}

// Default panel assignments: which photo slot each panel shows.
export function defaultPanels(layout) {
  const extra = extraDefaultPanels(layout);
  if (extra) return extra;
  const picks = {
    hero: [0, 1],
    triptych: [0, 1, 2],
    grid: [0, 1, 2, 1],
    duo: [0, 1, 2],
    center: [0],
    magazine: [0, 1, 2],
  }[layout] || [0, 1, 2];
  return picks.map((photo) => ({ photo, scale: 1, ox: 0, oy: 0 }));
}

// Deterministic film grain: a small seeded noise tile, reused for every render.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  let seed = 20261119;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// Draws one photo cover-fitting a rect, with per-panel zoom and pan.
function drawPanelPhoto(ctx, img, rect, panel) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (panel.scale || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const slackX = Math.max(0, dw - rect.w) / 2;
  const slackY = Math.max(0, dh - rect.h) / 2;
  const dx = rect.x + (rect.w - dw) / 2 - (panel.ox || 0) * slackX;
  const dy = rect.y + (rect.h - dh) / 2 - (panel.oy || 0) * slackY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Placeholder panel when no photo is loaded yet: sunset gradient + prompt.
function drawEmptyPanel(ctx, rect, grade, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, grade.stops[0]);
  grad.addColorStop(0.55, grade.stops[1]);
  grad.addColorStop(1, grade.stops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `700 ${Math.max(14, rect.w * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD PHOTO ' + (index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
}

// Retro striped sun, drawn in the caption band.
function drawRetroSun(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  grad.addColorStop(0, '#ffe259');
  grad.addColorStop(0.5, grade.stops[1]);
  grad.addColorStop(1, grade.stops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.band[0];
  for (let i = 0; i < 4; i++) {
    const y = cy + r * (0.05 + i * 0.22);
    ctx.fillRect(cx - r, y, r * 2, r * 0.07);
  }
  ctx.restore();
}

// Big display title: Anton, uppercase, gradient fill, dark outline, drop
// shadow. `at` picks where it sits: 'band' (in the caption band, default),
// 'top' (over the photo zone, under the studio tag) or 'center' (centred
// over the photo zone on a soft dark scrim). `spacing` is extra tracking in px.
function drawTitle(ctx, text, w, h, grade, at = 'band', spacing = 0, bandTop = h * 0.8, fx = null) {
  const clean = (text || '').trim().toUpperCase() || 'YOUR STORY';
  let size = h * 0.088;
  if (at !== 'band') size = h * 0.105;
  const setFont = () => {
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    try { ctx.letterSpacing = `${Math.max(0, spacing)}px`; } catch { /* older canvas */ }
  };
  setFont();
  const maxW = w * (at === 'center' ? 0.9 : 0.86);
  while (ctx.measureText(clean).width > maxW && size > h * 0.02) {
    size -= 2;
    setFont();
  }
  let x = w * 0.045;
  let y = bandTop + h * 0.115;
  let align = 'left';
  if (at === 'top') {
    // Below the studio tag pill (which ends ~6% down the poster).
    y = h * 0.2;
  } else if (at === 'center') {
    // Soft scrim so white lettering reads over any photo.
    const scrim = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.62);
    scrim.addColorStop(0, 'rgba(10,4,24,0)');
    scrim.addColorStop(0.5, 'rgba(10,4,24,0.55)');
    scrim.addColorStop(1, 'rgba(10,4,24,0)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, h * 0.3, w, h * 0.32);
    align = 'center';
    x = w / 2;
    y = h * 0.5;
  }
  // Round 3: an arch preset bends the title along a curve instead of a
  // straight baseline; the arch painter applies the same preset itself.
  if (fx && fx.arch) {
    const cy = at === 'top' ? h * 0.3 : at === 'center' ? h * 0.52 : bandTop + (h - bandTop) * 0.55;
    // The arch centre sits one radius below the arc's top, so the title
    // lands on `cy` instead of a radius above the poster.
    drawArchText(ctx, clean, w / 2, cy + w * 0.75, w * 0.75, size, grade, fx);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    return { size, y };
  }
  const grad = fx
    ? titleGradient(ctx, fx, grade, x, y, size)
    : (() => {
      const g = ctx.createLinearGradient(x, y - size, x, y + size * 0.2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.55, '#ffe259');
      g.addColorStop(1, grade.stops[1]);
      return g;
    })();
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  if (fx) applyEffectToCtx(ctx, fx, size);
  else {
    ctx.strokeStyle = '#1a0b2e';
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
  }
  ctx.strokeText(clean, x, y);
  ctx.fillStyle = grad;
  ctx.fillText(clean, x, y);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  return { size, y };
}

function drawSubCaption(ctx, text, w, h, grade, titleSize, titleY, at = 'band', bandTop = h * 0.8, fxSub = null) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return;
  let size = h * 0.026;
  ctx.save();
  ctx.textAlign = at === 'center' ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';
  const setFont = () => {
    ctx.font = `700 ${size}px system-ui, sans-serif`;
  };
  setFont();
  try {
    ctx.letterSpacing = `${Math.max(2, size * 0.22)}px`;
  } catch {
    // Older browsers ignore letterSpacing; spacing still reads fine.
  }
  while (ctx.measureText(clean).width > w * 0.8 && size > h * 0.012) {
    size -= 1;
    setFont();
  }
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = fxSub && fxSub.glow > 0 ? fxSub.glowColor : grade.accent;
  ctx.shadowBlur = size * 0.6;
  const x = at === 'center' ? w / 2 : w * 0.045;
  const y = at === 'band'
    ? bandTop + h * 0.115 + titleSize * 0.62
    : titleY + titleSize * 0.62;
  ctx.fillText(clean, x, y);
  ctx.restore();
}

// Small studio tag pill, top-left of the photo zone; season badge top-right.
function drawTag(ctx, w, h, grade) {
  const fs = Math.max(11, h * 0.016);
  ctx.save();
  ctx.font = `800 ${fs}px system-ui, sans-serif`;
  const label = 'NEON PALMS  ★  COVER STUDIO';
  const pad = fs * 0.9;
  const tw = ctx.measureText(label).width + pad * 2;
  const th = fs * 2.1;
  const x = w * 0.025;
  const y = h * 0.025;
  ctx.fillStyle = 'rgba(10, 4, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, tw, th, th / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + pad, y + th / 2 + 1);
  const badge = "SUMMER '26";
  ctx.font = `800 ${fs}px system-ui, sans-serif`;
  const bw = ctx.measureText(badge).width + pad * 2;
  ctx.fillStyle = grade.accent;
  ctx.beginPath();
  ctx.roundRect(w - w * 0.025 - bw, y, bw, th, th / 2);
  ctx.fill();
  ctx.fillStyle = '#14061f';
  ctx.fillText(badge, w - w * 0.025 - bw + pad, y + th / 2 + 1);
  ctx.restore();
}

/** Renders the whole poster. `state` holds photos, panels, layout, grade, title, sub. */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const fxTitle = effectFor(state, 'title');
  const fxSub = effectFor(state, 'sub');
  // Round 3: extra layouts render through layouts-extra.js, then get the
  // same stickers and frame as the classic layouts.
  if (isExtraLayout(state.layout)) {
    drawExtraCover(ctx, state, grade, w, h, fxTitle, fxSub);
    drawStickers(ctx, state.stickers, w, h, grade);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    return;
  }
  const rects = panelRects(state.layout, w, h);
  const panels = state.panels || defaultPanels(state.layout);
  const titlePos = TITLE_POSITIONS[state.titlePos] ? state.titlePos : 'band';
  const spacing = Number(state.titleSpacing) || 0;

  // Base: dark plum so gutters read as poster borders.
  ctx.fillStyle = '#14061f';
  ctx.fillRect(0, 0, w, h);

  // Panels.
  rects.forEach((rect, i) => {
    const panel = panels[i] || { photo: 0, scale: 1, ox: 0, oy: 0 };
    const img = state.photos ? state.photos[panel.photo] : null;
    if (img) drawPanelPhoto(ctx, img, rect, panel);
    else drawEmptyPanel(ctx, rect, grade, i);
  });

  // Colour grade over the photo zone only.
  const ph = h * 0.8;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, ph);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, 0, 0, ph);
  wash.addColorStop(0, grade.stops[0]);
  wash.addColorStop(0.5, grade.stops[1]);
  wash.addColorStop(1, grade.stops[2]);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, ph);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, ph);
  // Vignette on the photo zone.
  const vig = ctx.createRadialGradient(
    w / 2, ph / 2, Math.min(w, ph) * 0.35,
    w / 2, ph / 2, Math.max(w, ph) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,2,20,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, ph);
  ctx.restore();

  // Caption band.
  const band = ctx.createLinearGradient(0, ph, 0, h);
  band.addColorStop(0, grade.band[0]);
  band.addColorStop(1, grade.band[1]);
  ctx.fillStyle = band;
  ctx.fillRect(0, ph, w, h - ph);
  const accent = ctx.createLinearGradient(0, 0, w, 0);
  accent.addColorStop(0, grade.stops[0]);
  accent.addColorStop(0.5, grade.stops[1]);
  accent.addColorStop(1, grade.stops[2]);
  ctx.fillStyle = accent;
  ctx.fillRect(0, ph, w, Math.max(3, h * 0.004));

  // Overlay title positions sit above the photo zone; the band title keeps
  // the retro sun beside it, overlay titles leave the band to the sub-caption.
  if (titlePos === 'band') drawRetroSun(ctx, w * 0.93, ph + (h - ph) * 0.52, (h - ph) * 0.34, grade);
  const { size: titleSize, y: titleY } = drawTitle(ctx, state.title, w, h, grade, titlePos, spacing, ph, fxTitle);
  drawSubCaption(ctx, state.sub, w, h, grade, titleSize, titleY, titlePos, ph, fxSub);
  drawTag(ctx, w, h, grade);
  // Round 3: stickers draw over the finished poster, in preview and export.
  drawStickers(ctx, state.stickers, w, h, grade);

  // Film grain over the whole poster, then a thin white frame.
  const tile = getGrainTile();
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
