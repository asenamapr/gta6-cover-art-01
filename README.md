# Neon Palms Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/asenamapr/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/asenamapr/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Your photo. Your story. One poster that looks like it ruled the summer.**

Neon Palms Cover Studio turns your own photos and a caption into GTA-style
multi-panel poster art — the Vice City sunset look, in your own original design
(no Rockstar logo, artwork, character or font anywhere in the app).

## What it does

- **Multi-panel posters** — 6 layouts: Hero Split (2 panels), Triptych
  (3 panels), Four-Panel Grid, Duo + Strip, **Center Stage** (one full-bleed
  hero photo) and **Magazine** (editorial cover spread: one tall cover star
  beside two stacked panels). One photo can spread across every panel, or up
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
- **Real PNG export, one click per size** — 1080 × 1080, 1080 × 1350 and
  1920 × 1080, rendered at full size on canvas and downloaded with
  `canvas.toBlob`. The live preview shows exactly what the PNG will look like.
- **Private by design** — photos are read with object URLs on your own machine
  and never uploaded. The app is plain static files and works fully offline.

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
`layout`, `grade`, `size`, `titlepos` and `spacing` parameters to pin a fixed
scene, e.g.
`?shot=cover&photo=boulevard,pier,neon-street&caption=BOULEVARD%20QUEEN&layout=triptych&grade=sunset&size=wide&titlepos=band&spacing=2`.
The four screenshots show the new Round 2 work first: Center Stage in Gold
Rush with a centred title, the Magazine layout in Vice Teal in the editor, a
grid cover with the title on top in Neon Nights, and a square triptych.

## Files

- `app/index.html`, `app/style.css` — editor shell and dark studio styling.
- `app/src/cover.js` — the poster renderer: layouts, grades, lettering, grain.
- `app/src/main.js` — editor state, uploads, crop controls, PNG export.
- `app/src/shots.js` — deterministic `?shot=` scenes.
- `app/samples/` — two model-made photos from the kit (free to use) plus three
  illustrated scenes drawn in-session (`neon-street.svg`, `palm-dusk.svg`,
  `sunset-strip.svg`).
- `app/fonts/Anton-Regular.ttf` — Anton, SIL Open Font License (`OFL.txt`).
- `main.ts` — hands the entry in (copies `app/` + `screenshots/`, writes
  `dossier.json` with the vendored make.fun library).
- `screenshots/` — 4 screenshots: the new Center Stage and Magazine layouts,
  a portrait grid cover, and a square triptych.

## License

MIT — see `LICENSE`.
