// Neon Palms Cover Studio — sticker / element library (Round 3, new file).
// Placeable SVG-style canvas stickers: palms, suns, badges, stamps and props
// drawn with plain canvas paths (no image assets, no network). A sticker is
// { id, x, y, size, rot, flip } where x/y are fractions of the poster width
// and height, size is a fraction of the poster's short side, and rot is
// degrees clockwise. Stickers render in the live preview AND in the exported
// PNG because drawPoster() calls drawStickers() on every render.

export const STICKERS = [
  { id: 'palm', label: 'Palm tree', hint: 'Leaning palm, pink trunk' },
  { id: 'sun', label: 'Retro sun', hint: 'Striped sunset disc' },
  { id: 'birds', label: 'Bird flock', hint: 'Five gulls in formation' },
  { id: 'starburst', label: 'Starburst badge', hint: '“SUMMER ’26” burst' },
  { id: 'wanted', label: 'WANTED stamp', hint: 'Rotated reward stamp' },
  { id: 'pricetag', label: 'Price tag', hint: '“$9.99” swing tag' },
  { id: 'shadow', label: 'Palm shadow', hint: 'Soft frond silhouette' },
  { id: 'arrow', label: 'Neon arrow', hint: 'Glowing curved arrow' },
  { id: 'sunburst', label: 'Sunburst rays', hint: 'Fan of gold rays' },
  { id: 'cassette', label: 'Cassette', hint: 'Mixtape, side A' },
  { id: 'shades', label: 'Sunglasses', hint: 'Mirrored aviators' },
  { id: 'bolt', label: 'Lightning bolt', hint: 'Hot-pink bolt' },
];

const TAU = Math.PI * 2;

function unit(ctx, s) {
  // Normalise: every painter draws inside a [-1, 1] box, scaled by the
  // sticker's pixel size and rotated by its rot. Callers set the transform.
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate((s.rot || 0) * Math.PI / 180);
  if (s.flip) ctx.scale(-1, 1);
  ctx.scale(s.size, s.size);
}

function palmFrond(ctx, angle, len, bend) {
  ctx.save();
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.55, -len * 0.28 - bend, len, -len * 0.08 - bend);
  ctx.quadraticCurveTo(len * 0.55, len * 0.1 - bend, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawPalm(ctx, s, grade) {
  unit(ctx, s);
  ctx.fillStyle = '#ff5e8a';
  ctx.beginPath();
  ctx.moveTo(-0.07, 1);
  ctx.quadraticCurveTo(0.05, 0.1, 0.22, -0.55);
  ctx.lineTo(0.3, -0.55);
  ctx.quadraticCurveTo(0.18, 0.1, 0.07, 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2fbf71';
  const fronds = [-2.5, -1.9, -1.25, -0.6, 0.05, 0.7, 1.35, 2.0];
  fronds.forEach((a, i) => palmFrond(ctx, a, 0.95 - (i % 3) * 0.12, i % 2 ? 0.12 : -0.05));
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.arc(0.24, -0.5, 0.09, 0, TAU);
  ctx.arc(0.36, -0.44, 0.08, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawSun(ctx, s, grade) {
  unit(ctx, s);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 0.9, 0, TAU);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, -0.9, 0, 0.9);
  grad.addColorStop(0, '#ffe259');
  grad.addColorStop(0.5, grade.stops ? grade.stops[1] : '#ff5e8a');
  grad.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = grad;
  ctx.fillRect(-0.9, -0.9, 1.8, 1.8);
  ctx.fillStyle = '#14061f';
  for (let i = 0; i < 4; i++) ctx.fillRect(-0.9, 0.1 + i * 0.22, 1.8, 0.06);
  ctx.restore();
  ctx.restore();
}

function drawBirds(ctx, s) {
  unit(ctx, s);
  ctx.strokeStyle = '#14061f';
  ctx.lineWidth = 0.09;
  ctx.lineCap = 'round';
  const flock = [[-0.7, -0.35, 0.5], [-0.2, -0.55, 0.62], [0.35, -0.3, 0.5], [0.0, 0.15, 0.42], [0.65, 0.05, 0.55]];
  flock.forEach(([x, y, w]) => {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 0.3, y - w * 0.55, x, y);
    ctx.quadraticCurveTo(x + w * 0.3, y - w * 0.55, x + w, y);
    ctx.stroke();
  });
  ctx.restore();
}

function starburstPath(ctx, points, rOuter, rInner) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (points * 2)) * TAU - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStarburst(ctx, s, grade) {
  unit(ctx, s);
  starburstPath(ctx, 12, 0.95, 0.72);
  ctx.fillStyle = '#ffe259';
  ctx.fill();
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = '#14061f';
  ctx.stroke();
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 0.34px Anton, sans-serif';
  ctx.fillText('SUMMER', 0, -0.2);
  ctx.fillText('’26', 0, 0.22);
  ctx.restore();
}

function drawWanted(ctx, s) {
  unit(ctx, s);
  ctx.strokeStyle = '#e8b23a';
  ctx.lineWidth = 0.09;
  ctx.strokeRect(-0.95, -0.55, 1.9, 1.1);
  ctx.lineWidth = 0.045;
  ctx.strokeRect(-0.83, -0.43, 1.66, 0.86);
  ctx.fillStyle = '#e8b23a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 0.42px Anton, sans-serif';
  ctx.fillText('WANTED', 0, -0.14);
  ctx.font = '700 0.2px system-ui, sans-serif';
  ctx.fillText('★ DEAD OR ALIVE ★', 0, 0.26);
  ctx.restore();
}

function drawPriceTag(ctx, s) {
  unit(ctx, s);
  ctx.rotate(0.5);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-0.9, -0.45);
  ctx.lineTo(0.45, -0.45);
  ctx.lineTo(0.95, 0);
  ctx.lineTo(0.45, 0.45);
  ctx.lineTo(-0.9, 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#14061f';
  ctx.beginPath();
  ctx.arc(-0.62, 0, 0.09, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff2e63';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 0.4px Anton, sans-serif';
  ctx.fillText('$9.99', 0.08, 0.02);
  ctx.restore();
}

function drawShadow(ctx, s) {
  unit(ctx, s);
  ctx.fillStyle = 'rgba(20, 6, 31, 0.5)';
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(-2.4 + i * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, 0.9);
    ctx.quadraticCurveTo(0.3, -0.2, 0.95, -0.75);
    ctx.quadraticCurveTo(0.25, -0.05, 0, 0.9);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawArrow(ctx, s, grade) {
  unit(ctx, s);
  ctx.strokeStyle = grade.accent || '#00e5ff';
  ctx.lineWidth = 0.14;
  ctx.lineCap = 'round';
  ctx.shadowColor = grade.accent || '#00e5ff';
  ctx.shadowBlur = 0.25;
  ctx.beginPath();
  ctx.moveTo(-0.85, 0.55);
  ctx.quadraticCurveTo(0.1, 0.85, 0.7, -0.15);
  ctx.stroke();
  ctx.fillStyle = grade.accent || '#00e5ff';
  ctx.beginPath();
  ctx.moveTo(0.95, -0.35);
  ctx.lineTo(0.55, -0.45);
  ctx.lineTo(0.72, 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSunburst(ctx, s) {
  unit(ctx, s);
  ctx.fillStyle = '#ffe259';
  for (let i = 0; i < 12; i++) {
    ctx.save();
    ctx.rotate((i / 12) * TAU);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0.22, -0.18);
    ctx.lineTo(1, 0);
    ctx.lineTo(0.22, 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ff5e8a';
  ctx.beginPath();
  ctx.arc(0, 0, 0.32, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCassette(ctx, s) {
  unit(ctx, s);
  ctx.fillStyle = '#241640';
  ctx.strokeStyle = '#ffe259';
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.roundRect(-0.95, -0.6, 1.9, 1.2, 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe259';
  ctx.fillRect(-0.75, -0.42, 1.5, 0.3);
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 0.2px Anton, sans-serif';
  ctx.fillText('SIDE A', 0, -0.27);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-0.55, 0.05, 1.1, 0.34, 0.06);
  ctx.fill();
  ctx.fillStyle = '#14061f';
  [-0.32, 0.32].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 0.22, 0.09, 0, TAU);
    ctx.fill();
  });
  ctx.fillRect(-0.18, 0.19, 0.36, 0.06);
  ctx.restore();
}

function drawShades(ctx, s) {
  unit(ctx, s);
  const grad = ctx.createLinearGradient(0, -0.4, 0, 0.4);
  grad.addColorStop(0, '#00e5ff');
  grad.addColorStop(1, '#ff2fb3');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(-0.95, -0.35, 0.85, 0.6, 0.28);
  ctx.roundRect(0.1, -0.35, 0.85, 0.6, 0.28);
  ctx.fill();
  ctx.strokeStyle = '#14061f';
  ctx.lineWidth = 0.07;
  ctx.beginPath();
  ctx.moveTo(-0.1, -0.1);
  ctx.lineTo(0.1, -0.1);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(-0.8, -0.3);
  ctx.lineTo(-0.45, -0.3);
  ctx.lineTo(-0.75, 0.2);
  ctx.lineTo(-0.9, 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBolt(ctx, s) {
  unit(ctx, s);
  ctx.fillStyle = '#ffe259';
  ctx.strokeStyle = '#ff2e63';
  ctx.lineWidth = 0.06;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0.25, -1);
  ctx.lineTo(-0.55, 0.15);
  ctx.lineTo(-0.05, 0.15);
  ctx.lineTo(-0.25, 1);
  ctx.lineTo(0.55, -0.15);
  ctx.lineTo(0.05, -0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const PAINTERS = {
  palm: drawPalm,
  sun: drawSun,
  birds: drawBirds,
  starburst: drawStarburst,
  wanted: drawWanted,
  pricetag: drawPriceTag,
  shadow: drawShadow,
  arrow: drawArrow,
  sunburst: drawSunburst,
  cassette: drawCassette,
  shades: drawShades,
  bolt: drawBolt,
};

/** A fresh sticker of `id`, centred with a small deterministic offset. */
export function createSticker(id, index = 0) {
  const def = STICKERS.find((d) => d.id === id);
  if (!def) return null;
  const offsets = [[0.5, 0.3], [0.72, 0.62], [0.28, 0.55], [0.5, 0.72], [0.8, 0.3]];
  const [ox, oy] = offsets[index % offsets.length];
  return {
    id,
    x: ox,
    y: oy,
    size: 0.16,
    rot: id === 'wanted' ? -8 : 0,
    flip: false,
    uid: `${id}-${Date.now().toString(36)}-${index}`,
  };
}

export function stickerLabel(id) {
  const def = STICKERS.find((d) => d.id === id);
  return def ? def.label : id;
}

/** Draws every sticker in layer order (array order = back to front). */
export function drawStickers(ctx, stickers, w, h, grade) {
  if (!stickers || !stickers.length) return;
  const base = Math.min(w, h);
  stickers.forEach((st) => {
    const paint = PAINTERS[st.id];
    if (!paint) return;
    const px = st.x * w;
    const py = st.y * h;
    const size = (st.size || 0.16) * base;
    ctx.save();
    paint(ctx, { x: px, y: py, size, rot: st.rot || 0, flip: !!st.flip }, grade || {});
    ctx.restore();
  });
}

/** Topmost sticker whose box contains the point (fractions of w/h). */
export function hitSticker(stickers, fx, fy, w, h) {
  if (!stickers) return -1;
  const base = Math.min(w, h);
  for (let i = stickers.length - 1; i >= 0; i--) {
    const st = stickers[i];
    const r = (st.size || 0.16) * base;
    const dx = (fx - st.x) * w;
    const dy = (fy - st.y) * h;
    if (Math.abs(dx) <= r && Math.abs(dy) <= r) return i;
  }
  return -1;
}

export function moveSticker(st, dx, dy) {
  st.x = Math.max(0.02, Math.min(0.98, st.x + dx));
  st.y = Math.max(0.02, Math.min(0.98, st.y + dy));
  return st;
}

export function rotateSticker(st, deg) {
  st.rot = ((st.rot || 0) + deg + 360) % 360;
  return st;
}

export function scaleSticker(st, factor) {
  st.size = Math.max(0.05, Math.min(0.5, (st.size || 0.16) * factor));
  return st;
}

export function bringForward(stickers, index) {
  if (index < 0 || index >= stickers.length - 1) return index;
  const [st] = stickers.splice(index, 1);
  stickers.splice(index + 1, 0, st);
  return index + 1;
}

export function sendBackward(stickers, index) {
  if (index <= 0 || index >= stickers.length) return index;
  const [st] = stickers.splice(index, 1);
  stickers.splice(index - 1, 0, st);
  return index - 1;
}

export function removeSticker(stickers, index) {
  if (index < 0 || index >= stickers.length) return stickers;
  stickers.splice(index, 1);
  return stickers;
}
