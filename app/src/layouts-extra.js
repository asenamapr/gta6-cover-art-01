// Neon Palms Cover Studio — extra layouts (Round 3, new file).
// Three entirely new layouts, written fresh: "Boulevard" (widescreen
// cinematic single image with a bottom title band and credit strip),
// "Wanted" (vertical poster: big portrait, stamp frame, reward block) and
// "Back Cover" (magazine back cover: barcode block, blurb columns, small
// thumbnail grid). Each one works with the existing photo slots, grades,
// stickers and text effects. This file is self-contained: it draws its own
// photos, grade wash, vignette and titles, and imports only the effects
// engine (no import of cover.js, so there is no import cycle — cover.js
// calls drawExtraCover() and then draws stickers and the frame itself).

import { getEffect, titleGradient, drawArchText, applyEffectToCtx } from './effects.js';

export const EXTRA_LAYOUTS = {
  boulevard: { label: 'Boulevard', panels: 1 },
  wanted: { label: 'Wanted', panels: 1 },
  backcover: { label: 'Back Cover', panels: 3 },
};

export function isExtraLayout(layout) {
  return Object.prototype.hasOwnProperty.call(EXTRA_LAYOUTS, layout);
}

/** Panel rectangles for the extra layouts (null for the classic six). */
export function extraPanelRects(layout, w, h) {
  if (layout === 'boulevard') {
    return [{ x: 0, y: 0, w, h: h * 0.78 }];
  }
  if (layout === 'wanted') {
    return [{ x: w * 0.07, y: h * 0.15, w: w * 0.86, h: h * 0.51 }];
  }
  if (layout === 'backcover') {
    const tw = w * 0.28;
    const th = h * 0.24;
    const y = h * 0.55;
    return [
      { x: w * 0.05, y, w: tw, h: th },
      { x: w * 0.36, y, w: tw, h: th },
      { x: w * 0.67, y, w: tw, h: th },
    ];
  }
  return null;
}

export function extraDefaultPanels(layout) {
  if (layout === 'boulevard') return [{ photo: 0, scale: 1, ox: 0, oy: 0 }];
  if (layout === 'wanted') return [{ photo: 0, scale: 1, ox: 0, oy: 0 }];
  if (layout === 'backcover') {
    return [0, 1, 2].map((photo) => ({ photo, scale: 1, ox: 0, oy: 0 }));
  }
  return null;
}

// --- shared drawing helpers (own implementations for this file) ---

function drawPhotoCover(ctx, img, rect, panel) {
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

function drawEmptyThumb(ctx, rect, grade, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, grade.stops[0]);
  grad.addColorStop(0.55, grade.stops[1]);
  grad.addColorStop(1, grade.stops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `700 ${Math.max(12, rect.w * 0.07)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD PHOTO ' + (index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function gradeWash(ctx, w, h, grade, zoneH) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, zoneH);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, 0, 0, zoneH);
  wash.addColorStop(0, grade.stops[0]);
  wash.addColorStop(0.5, grade.stops[1]);
  wash.addColorStop(1, grade.stops[2]);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, zoneH);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, zoneH);
  const vig = ctx.createRadialGradient(
    w / 2, zoneH / 2, Math.min(w, zoneH) * 0.35,
    w / 2, zoneH / 2, Math.max(w, zoneH) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,2,20,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, zoneH);
  ctx.restore();
}

function wrapLines(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

/** Big display title honouring the active text effect (incl. arch). */
function drawExtraTitle(ctx, text, w, h, grade, fx, cx, cy, maxW, sizeFrac = 0.085) {
  const clean = (text || '').trim().toUpperCase() || 'YOUR STORY';
  let size = h * sizeFrac;
  ctx.save();
  const setFont = () => {
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    try { ctx.letterSpacing = `${Math.max(0, fx.spacing || 0)}px`; } catch { /* older */ }
  };
  setFont();
  while (ctx.measureText(clean).width > maxW && size > h * 0.02) {
    size -= 2;
    setFont();
  }
  if (fx.arch) {
    // The arch's centre sits one radius below the arc's top, so the text
    // lands on `cy` instead of a radius above the canvas.
    drawArchText(ctx, clean, cx, cy + w * 0.75, w * 0.75, size, grade, fx);
    ctx.restore();
    return size;
  }
  applyEffectToCtx(ctx, fx, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(clean, cx, cy);
  ctx.fillStyle = titleGradient(ctx, fx, grade, cx - maxW / 2, cy - size, size);
  ctx.fillText(clean, cx, cy);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older */ }
  return size;
}

function drawSubLine(ctx, text, w, grade, fx, cx, y, size) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return;
  ctx.save();
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  try { ctx.letterSpacing = `${Math.max(2, size * 0.22)}px`; } catch { /* older */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = fx.glow > 0 ? fx.glowColor : grade.accent;
  ctx.shadowBlur = size * 0.6;
  ctx.fillText(clean, cx, y);
  ctx.restore();
}

function drawTagPill(ctx, w, h, grade, label) {
  const fs = Math.max(11, h * 0.016);
  ctx.save();
  ctx.font = `800 ${fs}px system-ui, sans-serif`;
  const pad = fs * 0.9;
  const tw = ctx.measureText(label).width + pad * 2;
  const th = fs * 2.1;
  ctx.fillStyle = 'rgba(10, 4, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(w * 0.025, h * 0.025, tw, th, th / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w * 0.025 + pad, h * 0.025 + th / 2 + 1);
  ctx.restore();
}

// --- Boulevard: widescreen cinematic, bottom title band + credit strip ---

function drawBoulevard(ctx, state, grade, fxTitle, fxSub, w, h) {
  const bandTop = h * 0.78;
  const rects = extraPanelRects('boulevard', w, h);
  const panels = state.panels || extraDefaultPanels('boulevard');
  const img = state.photos ? state.photos[(panels[0] || {}).photo || 0] : null;
  if (img) drawPhotoCover(ctx, img, rects[0], panels[0] || { photo: 0, scale: 1, ox: 0, oy: 0 });
  else drawEmptyThumb(ctx, rects[0], grade, 0);
  gradeWash(ctx, w, h, grade, bandTop);
  // Cinematic letterbox sliver above the band.
  ctx.fillStyle = 'rgba(10,4,24,0.85)';
  ctx.fillRect(0, bandTop - h * 0.012, w, h * 0.012);
  // Title band.
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, grade.band[0]);
  band.addColorStop(1, grade.band[1]);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);
  const accent = ctx.createLinearGradient(0, 0, w, 0);
  accent.addColorStop(0, grade.stops[0]);
  accent.addColorStop(0.5, grade.stops[1]);
  accent.addColorStop(1, grade.stops[2]);
  ctx.fillStyle = accent;
  ctx.fillRect(0, bandTop, w, Math.max(3, h * 0.004));
  drawExtraTitle(ctx, state.title, w, h, grade, fxTitle, w / 2, bandTop + (h - bandTop) * 0.38, w * 0.9);
  drawSubLine(ctx, state.sub, w, grade, fxSub, w / 2, bandTop + (h - bandTop) * 0.72, h * 0.024);
  // Credit strip: tiny billing block along the very bottom edge.
  ctx.save();
  ctx.font = `600 ${Math.max(9, h * 0.011)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    'NEON PALMS PICTURES  •  A SUMMER ’26 PRODUCTION  •  STARRING YOU  •  IN VICE CITY',
    w / 2, h - h * 0.012,
  );
  ctx.restore();
  drawTagPill(ctx, w, h, grade, 'NEON PALMS  ★  COVER STUDIO');
}

// --- Wanted: vertical poster, stamp frame, reward block ---

function drawWanted(ctx, state, grade, fxTitle, fxSub, w, h) {
  const rects = extraPanelRects('wanted', w, h);
  const panels = state.panels || extraDefaultPanels('wanted');
  const img = state.photos ? state.photos[(panels[0] || {}).photo || 0] : null;
  // Aged-paper background: warm cream with a plum border.
  ctx.fillStyle = '#f2e3c6';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#14061f';
  ctx.lineWidth = Math.max(4, w * 0.01);
  ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
  drawExtraTitle(ctx, state.title, w, h, grade, fxTitle, w / 2, h * 0.075, w * 0.86, 0.055);
  if (img) drawPhotoCover(ctx, img, rects[0], panels[0] || { photo: 0, scale: 1, ox: 0, oy: 0 });
  else drawEmptyThumb(ctx, rects[0], grade, 0);
  gradeWash(ctx, w, h, grade, rects[0].y + rects[0].h);
  // Double stamp frame around the portrait.
  ctx.save();
  ctx.strokeStyle = '#14061f';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.strokeRect(rects[0].x - w * 0.012, rects[0].y - h * 0.008, rects[0].w + w * 0.024, rects[0].h + h * 0.016);
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeRect(rects[0].x - w * 0.02, rects[0].y - h * 0.014, rects[0].w + w * 0.04, rects[0].h + h * 0.028);
  ctx.restore();
  // Rotated WANTED stamp overlapping the portrait's bottom-right corner.
  ctx.save();
  ctx.translate(w * 0.74, h * 0.6);
  ctx.rotate(-0.14);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = Math.max(3, w * 0.005);
  ctx.strokeRect(-w * 0.16, -h * 0.035, w * 0.32, h * 0.07);
  ctx.lineWidth = Math.max(1, w * 0.0015);
  ctx.strokeRect(-w * 0.148, -h * 0.028, w * 0.296, h * 0.056);
  ctx.fillStyle = '#c0392b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.max(16, w * 0.055)}px Anton, sans-serif`;
  ctx.fillText('WANTED', 0, -h * 0.006);
  ctx.font = `700 ${Math.max(9, w * 0.016)}px system-ui, sans-serif`;
  ctx.fillText('★ DEAD OR ALIVE ★', 0, h * 0.02);
  ctx.restore();
  // Reward block under the portrait.
  const ry = h * 0.7;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#14061f';
  ctx.font = `900 ${Math.max(20, h * 0.042)}px Anton, sans-serif`;
  ctx.fillText('REWARD  $10,000', w / 2, ry + h * 0.03);
  ctx.font = `700 ${Math.max(11, h * 0.02)}px system-ui, sans-serif`;
  ctx.fillText('LAST SEEN CRUISING THE BOULEVARD AT DUSK', w / 2, ry + h * 0.075);
  ctx.restore();
  drawSubLine(ctx, state.sub, w, grade, fxSub, w / 2, h * 0.85, h * 0.024);
  ctx.save();
  ctx.font = `600 ${Math.max(9, h * 0.013)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(20,6,31,0.6)';
  ctx.textAlign = 'center';
  ctx.fillText('NEON PALMS  •  SUMMER ’26  •  APPROACH WITH ADMIRATION', w / 2, h - h * 0.02);
  ctx.restore();
}

// --- Back Cover: magazine back, blurb columns, thumbnail grid, barcode ---

function drawBarcode(ctx, x, y, bw, bh, seedText) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - bw * 0.06, y - bh * 0.18, bw * 1.12, bh * 1.36);
  let seed = 0;
  for (const ch of String(seedText || 'NEONPALMS')) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  ctx.fillStyle = '#14061f';
  let bx = x;
  while (bx < x + bw) {
    const barW = (1 + Math.floor(rnd() * 4)) * (bw / 95);
    if (rnd() > 0.45) ctx.fillRect(bx, y, barW, bh);
    bx += barW + bw / 95;
  }
  ctx.font = `600 ${Math.max(9, bh * 0.16)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('0  12345  67890  1', x + bw / 2, y + bh * 1.28);
  ctx.restore();
}

function drawBackCover(ctx, state, grade, fxTitle, fxSub, w, h) {
  // Magazine-back paper: deep plum with a cream masthead strip.
  ctx.fillStyle = grade.band[0];
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f2e3c6';
  ctx.fillRect(0, 0, w, h * 0.09);
  ctx.save();
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.max(14, h * 0.03)}px Anton, sans-serif`;
  ctx.fillText('NEON PALMS', w * 0.05, h * 0.045);
  ctx.textAlign = 'right';
  ctx.font = `700 ${Math.max(10, h * 0.016)}px system-ui, sans-serif`;
  ctx.fillText('BACK COVER  •  SUMMER ’26', w * 0.95, h * 0.045);
  ctx.restore();
  // Blurb columns: the sub-caption as the pull quote, plus standfirst copy.
  // Alignment is set explicitly here: the canvas carries whatever alignment
  // the previous render left behind, and a centred quote would clip.
  const quote = (state.sub || 'VICE CITY SUMMER').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.max(13, h * 0.021)}px system-ui, sans-serif`;
  ctx.fillStyle = grade.accent;
  const colW = w * 0.42;
  const qLines = wrapLines(ctx, '“' + quote + '”', colW);
  qLines.forEach((line, i) => {
    ctx.fillText(line, w * 0.05, h * 0.13 + i * h * 0.026);
  });
  ctx.font = `${Math.max(11, h * 0.016)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const standfirst = 'Inside: the boulevard at golden hour, the pier at last light, and the crew that ruled the summer — every frame shot on your own camera, graded in Vice Sunset, printed to last.';
  const sLines = wrapLines(ctx, standfirst, colW);
  sLines.forEach((line, i) => {
    ctx.fillText(line, w * 0.53, h * 0.13 + i * h * 0.024);
  });
  ctx.restore();
  // Issue title across the middle, above the thumbnails.
  drawExtraTitle(ctx, state.title, w, h, grade, fxTitle, w / 2, h * 0.42, w * 0.9);
  drawSubLine(ctx, 'INSIDE THIS ISSUE', w, grade, fxSub, w / 2, h * 0.485, h * 0.02);
  // Thumbnail grid.
  const rects = extraPanelRects('backcover', w, h);
  const panels = state.panels || extraDefaultPanels('backcover');
  rects.forEach((rect, i) => {
    const panel = panels[i] || { photo: i, scale: 1, ox: 0, oy: 0 };
    const img = state.photos ? state.photos[panel.photo] : null;
    if (img) drawPhotoCover(ctx, img, rect, panel);
    else drawEmptyThumb(ctx, rect, grade, i);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(10,4,24,0.8)';
    ctx.font = `700 ${Math.max(10, h * 0.014)}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('0' + (i + 1), rect.x + w * 0.012, rect.y + rect.h - h * 0.012);
    ctx.restore();
  });
  // Barcode block + price, bottom right; credits bottom left.
  drawBarcode(ctx, w * 0.72, h * 0.85, w * 0.2, h * 0.06, state.title || 'NEONPALMS');
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.font = `800 ${Math.max(11, h * 0.018)}px system-ui, sans-serif`;
  ctx.fillText('US $9.99  •  CAN $12.99', w * 0.95, h * 0.825);
  ctx.textAlign = 'left';
  ctx.font = `${Math.max(10, h * 0.014)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('Printed in Vice City. Photos by you.', w * 0.05, h * 0.86);
  ctx.fillText('neonpalms.example  •  @neonpalms', w * 0.05, h * 0.885);
  ctx.restore();
}

/**
 * Renders a whole extra-layout poster (background, panels, grade, chrome,
 * title, sub). Stickers and the outer frame are drawn by drawPoster() after
 * this returns, exactly like the classic layouts.
 */
export function drawExtraCover(ctx, state, grade, w, h, fxTitle, fxSub) {
  const fxT = fxTitle || getEffect('vice-glow');
  const fxS = fxSub || getEffect('none');
  ctx.fillStyle = '#14061f';
  ctx.fillRect(0, 0, w, h);
  if (state.layout === 'boulevard') drawBoulevard(ctx, state, grade, fxT, fxS, w, h);
  else if (state.layout === 'wanted') drawWanted(ctx, state, grade, fxT, fxS, w, h);
  else if (state.layout === 'backcover') drawBackCover(ctx, state, grade, fxT, fxS, w, h);
}
