# Neon Palms Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/asenamapr/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/asenamapr/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Your photo. Your story. One poster that looks like it ruled the summer.**

Neon Palms Cover Studio turns your own photos and a caption into GTA-style
multi-panel poster art — the Vice City sunset look, in your own original design
(no Rockstar logo, artwork, character or font anywhere in the app).

## What it does

- **Multi-panel posters** — 9 layouts: Hero Split (2 panels), Triptych
  (3 panels), Four-Panel Grid, Duo + Strip, **Center Stage** (one full-bleed
  hero photo), **Magazine** (editorial cover spread: one tall cover star
  beside two stacked panels), and the Round 3 layouts **Boulevard**
  (cinematic widescreen), **Wanted** (vertical poster with stamp and reward
  block) and **Back Cover** (magazine back: blurb columns, thumbnail grid,
  barcode). One photo can spread across every panel, or up
  to 3 different photos can fill the panels.
- **Your photos, your crop** — upload up to 3 photos from your machine, or try
  the built-in sample scenes (2 photos + 3 illustrated scenes). Each panel gets
  its own photo, zoom slider, and X/Y position sliders — or just drag the
  poster to pan the selected panel.
- **Bold poster lettering** — title and sub-caption, edited live, set in Anton
  (SIL Open Font License, vendored under `app/fonts/`), with outline, sunset
  gradient fill and drop shadow, plus a retro striped sun and studio tag.
  **New in Round 2:** title position presets (in the caption band, over the
  photo at the top, or centred over the photo on a soft scrim) and a
  letter-spacing slider (0–12 px) for billboard-wide or masthead-tight type.
- **6 colour grades** — Vice Sunset (teal → pink → orange), Neon Nights
  (magenta/cyan), Palm Dusk (purple/gold), Hot Pink Drive (pink/red),
  **Vice Teal** (aqua → deep blue → pink) and **Gold Rush** (gold → orange →
  violet). Each grade is a live canvas treatment: gradient wash, duotone tint,
  vignette and film grain.
- **Real PNG export, one click per size** — 1080 × 1080, 1080 × 1350,
  1920 × 1080 and the new 1080 × 1920 story size, rendered at full size on
  canvas and downloaded with `canvas.toBlob`; or one **batch export** that
  saves all four in sequence with progress. The live preview shows exactly
  what the PNG will look like.
- **Private by design** — photos are read with object URLs on your own machine
  and never uploaded. The app is plain static files and works fully offline.

## Round 3 — what's new

- **Stickers** — a library of 12 placeable elements drawn in code (palm tree,
  retro sun, bird flock, starburst badge, WANTED stamp, price tag, palm
  shadow, neon arrow, sunburst rays, cassette, sunglasses, lightning bolt).
  Tap one in the Stickers panel to drop it on the poster, then drag it on the
  canvas to move it; rotate ±15°, grow/shrink, flip, bring forward / send
  back, or delete it. Stickers render in the live preview and in every
  exported PNG, at any poster size.
- **Text effects** — a per-line effects engine (`app/src/effects.js`) with 10
  presets: Clean, Vice Glow, Sunset Outline, Chrome, Neon Sign, Gold Foil,
  Retro Shadow, Candy Pop, and two arched mastheads (Arch — Vice, Arch —
  Gold) that bend the title along a curve. Set the title and the sub-caption
  independently; each preset controls outline weight and colour, drop shadow,
  glow colour and strength, gradient fill and extra tracking.
- **Three new layouts** (`app/src/layouts-extra.js`) — **Boulevard**, a
  widescreen cinematic single image with a bottom title band and a credit
  strip ("A SUMMER ’26 PRODUCTION"); **Wanted**, a vertical poster with a big
  framed portrait, a rotated red WANTED stamp and a "$10,000 REWARD" block;
  and **Back Cover**, a magazine back cover with blurb columns, a three-photo
  thumbnail grid, a generated barcode and a price block. All three use the
  same photo slots, colour grades, stickers and text effects as the classic
  layouts, and all three export at every size.
- **Batch export** (`app/src/export.js`) — one click exports all four sizes
  in sequence (1080 × 1080, 1080 × 1350, 1920 × 1080, plus the new
  **1080 × 1920 story** preset) with a live progress line in the status bar,
  filenames per layout and title. The story size is also available as a
  preview size in the Poster size picker.
- **Nine layouts, six grades, four sizes** — the layout picker now lists all
  nine layouts; the size picker lists all four sizes including story.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

1. Pick photos (upload your own, or tap a sample scene).
2. Choose a layout and a colour grade.
3. Type your title and sub-caption, place the title, set the tracking, crop each panel.
4. Hit an Export button — your poster downloads as a PNG.

## Deterministic screenshots

The app supports `?shot=cover|editor` with `photo`, `caption`, `sub`,
`layout`, `grade`, `size`, `titlepos`, `spacing`, `effect`, `subeffect` and
`stickers` parameters to pin a fixed scene, e.g.
`?shot=cover&photo=boulevard,pier,neon-street&caption=BOULEVARD%20QUEEN&layout=triptych&grade=sunset&size=wide&titlepos=band&spacing=2`.
The four screenshots show the new Round 3 work first: the Boulevard layout
with stickers and a Vice Glow title, the editor with the new sticker and
text-effect panels open on the Wanted layout, the Back Cover layout in Gold
Rush, and a square Wanted poster with an arched gold title.

## Files

- `app/index.html`, `app/style.css` — editor shell and dark studio styling.
- `app/src/cover.js` — the poster renderer: layouts, grades, lettering, grain.
- `app/src/stickers.js` — Round 3 sticker library: 12 placeable elements,
  drag / rotate / scale / layer / delete, drawn in preview and export.
- `app/src/effects.js` — Round 3 text-effects engine: 10 presets (outline,
  shadow, glow, gradient, tracking, arch text) per text element.
- `app/src/layouts-extra.js` — Round 3 layouts: Boulevard, Wanted, Back Cover.
- `app/src/export.js` — Round 3 batch export: all sizes + 1080 × 1920 story,
  sequential download with progress.
- `app/src/main.js` — editor state, uploads, crop controls, PNG export.
- `app/src/shots.js` — deterministic `?shot=` scenes.
- `app/samples/` — two model-made photos from the kit (free to use) plus three
  illustrated scenes drawn in-session (`neon-street.svg`, `palm-dusk.svg`,
  `sunset-strip.svg`).
- `app/fonts/Anton-Regular.ttf` — Anton, SIL Open Font License (`OFL.txt`).
- `main.ts` — hands the entry in (copies `app/` + `screenshots/`, writes
  `dossier.json` with the vendored make.fun library).
- `screenshots/` — 4 screenshots: the new Boulevard, Wanted and Back Cover
  layouts, and the editor with the Round 3 sticker and effects panels.

## License

MIT — see `LICENSE`.
