// Neon Palms Cover Studio — text-effects engine (Round 3, new file).
// Per-element text effects for the title, sub-caption and tag line. A preset
// is plain data — outline, shadow, glow, gradient stops, extra tracking and
// an optional arch — so the live preview and the exported PNG share exactly
// the same code path: drawPoster() resolves the preset and hands it to the
// title painter, and drawArchText() bends the same text along a curve.

export const EFFECT_PRESETS = {
  none: {
    label: 'Clean',
    outline: 0.04, outlineColor: '#1a0b2e',
    shadow: 0.06, shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 0.08,
    glow: 0, glowColor: '#ffffff',
    gradient: null, spacing: 0, arch: false,
  },
  'vice-glow': {
    label: 'Vice Glow',
    outline: 0.1, outlineColor: '#1a0b2e',
    shadow: 0.05, shadowColor: 'rgba(0,0,0,0.55)', shadowBlur: 0.16,
    glow: 0.35, glowColor: '#ff2fb3',
    gradient: ['#ffffff', '#ffe259', '#ff5e8a'], spacing: 2, arch: false,
  },
  'sunset-outline': {
    label: 'Sunset Outline',
    outline: 0.16, outlineColor: '#ff9a3d',
    shadow: 0.05, shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 0.1,
    glow: 0, glowColor: '#ffffff',
    gradient: ['#ffffff', '#ffffff', '#ffe259'], spacing: 4, arch: false,
  },
  chrome: {
    label: 'Chrome',
    outline: 0.08, outlineColor: '#0a1030',
    shadow: 0.04, shadowColor: 'rgba(0,0,0,0.6)', shadowBlur: 0.12,
    glow: 0.18, glowColor: '#00e5ff',
    gradient: ['#f8f9ff', '#9fb4d8', '#4a5a8a', '#e8f4ff'], spacing: 1, arch: false,
  },
  'neon-sign': {
    label: 'Neon Sign',
    outline: 0.05, outlineColor: '#14061f',
    shadow: 0, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0,
    glow: 0.55, glowColor: '#00e5ff',
    gradient: ['#e8ffff', '#00e5ff', '#b537f2'], spacing: 6, arch: false,
  },
  'gold-foil': {
    label: 'Gold Foil',
    outline: 0.07, outlineColor: '#2a1503',
    shadow: 0.05, shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 0.1,
    glow: 0.22, glowColor: '#ffe259',
    gradient: ['#fff6c9', '#ffe259', '#c98a12', '#ffe259'], spacing: 2, arch: false,
  },
  'retro-shadow': {
    label: 'Retro Shadow',
    outline: 0.06, outlineColor: '#1a0b2e',
    shadow: 0.09, shadowColor: '#ff2e63', shadowBlur: 0,
    glow: 0, glowColor: '#ffffff',
    gradient: ['#ffffff', '#ffe259', '#ff9a3d'], spacing: 3, arch: false,
  },
  'candy-pop': {
    label: 'Candy Pop',
    outline: 0.12, outlineColor: '#ffffff',
    shadow: 0.06, shadowColor: '#ff2e63', shadowBlur: 0.18,
    glow: 0.3, glowColor: '#ff6b9d',
    gradient: ['#ffffff', '#ff6b9d', '#ff2e63'], spacing: 1, arch: false,
  },
  'arch-vice': {
    label: 'Arch — Vice',
    outline: 0.1, outlineColor: '#1a0b2e',
    shadow: 0.05, shadowColor: 'rgba(0,0,0,0.55)', shadowBlur: 0.16,
    glow: 0.35, glowColor: '#ff2fb3',
    gradient: ['#ffffff', '#ffe259', '#ff5e8a'], spacing: 2, arch: true, archCurve: 0.5,
  },
  'arch-gold': {
    label: 'Arch — Gold',
    outline: 0.08, outlineColor: '#2a1503',
    shadow: 0.05, shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 0.1,
    glow: 0.22, glowColor: '#ffe259',
    gradient: ['#fff6c9', '#ffe259', '#c98a12'], spacing: 3, arch: true, archCurve: 0.62,
  },
};

export function getEffect(name) {
  return EFFECT_PRESETS[name] || EFFECT_PRESETS['vice-glow'];
}

export function effectNames() {
  return Object.keys(EFFECT_PRESETS);
}

/** Resolves the effect a text element should use from state.textEffects. */
export function effectFor(state, element) {
  const map = (state && state.textEffects) || {};
  const name = map[element] || (element === 'title' ? 'vice-glow' : 'none');
  return getEffect(name);
}

/**
 * Applies a preset's stroke/shadow/glow to the context before fillText.
 * All sizes are fractions of the font size, so the look scales with the
 * poster instead of staying fixed in pixels.
 */
export function applyEffectToCtx(ctx, fx, size) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = fx.outlineColor;
  ctx.lineWidth = Math.max(1, size * (fx.outline || 0.05));
  ctx.shadowColor = fx.glow > 0 ? fx.glowColor : fx.shadowColor;
  ctx.shadowBlur = size * Math.max(fx.glow || 0, fx.shadowBlur || 0);
  ctx.shadowOffsetY = size * (fx.shadow || 0);
  ctx.shadowOffsetX = 0;
}

/** Builds the preset's fill gradient for a title line at (x, y, size). */
export function titleGradient(ctx, fx, grade, x, y, size) {
  const stops = fx.gradient || ['#ffffff', '#ffe259', grade.stops ? grade.stops[1] : '#ff5e8a'];
  const grad = ctx.createLinearGradient(x, y - size, x, y + size * 0.2);
  stops.forEach((color, i) => grad.addColorStop(i / Math.max(1, stops.length - 1), color));
  return grad;
}

/** Measures text with a preset's extra tracking applied. */
export function measureEffectText(ctx, text, size, fx) {
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  try { ctx.letterSpacing = `${Math.max(0, fx.spacing || 0)}px`; } catch { /* older canvas */ }
  return ctx.measureText(text).width;
}

/**
 * Draws one line of text bent along an upward arc (like a vintage poster
 * masthead). Each glyph is placed by angle so the curve stays smooth at any
 * size; the same preset stroke/fill is applied per glyph.
 */
export function drawArchText(ctx, text, cx, cy, radius, size, grade, fx, align = 'center') {
  const clean = (text || '').trim().toUpperCase() || 'YOUR STORY';
  const curve = fx.archCurve || 0.5;
  ctx.save();
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  try { ctx.letterSpacing = `${Math.max(0, fx.spacing || 0)}px`; } catch { /* older canvas */ }
  const widths = [...clean].map((ch) => ctx.measureText(ch).width + (fx.spacing || 0));
  const total = widths.reduce((a, b) => a + b, 0);
  const totalAngle = (total / radius) * (0.5 + curve);
  let angle = -Math.PI / 2 - totalAngle / 2;
  if (align === 'left') angle = -Math.PI / 2;
  if (align === 'right') angle = -Math.PI / 2 - totalAngle;
  applyEffectToCtx(ctx, fx, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fill = titleGradient(ctx, fx, grade, cx - radius, cy - size, size);
  [...clean].forEach((ch, i) => {
    const charAngle = angle + (widths[i] / 2) / radius;
    const x = cx + Math.cos(charAngle) * radius;
    const y = cy + Math.sin(charAngle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.strokeText(ch, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += widths[i] / radius;
  });
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  return { width: total, height: size * 1.4 };
}

/** One-line summary of a preset for the editor's status line. */
export function describeEffect(name) {
  const fx = getEffect(name);
  const bits = [];
  if (fx.arch) bits.push('arched');
  if (fx.glow > 0.3) bits.push('strong glow');
  else if (fx.glow > 0) bits.push('glow');
  if (fx.outline >= 0.12) bits.push('heavy outline');
  if ((fx.spacing || 0) >= 4) bits.push('wide tracking');
  return `${fx.label}${bits.length ? ' — ' + bits.join(', ') : ''}`;
}
