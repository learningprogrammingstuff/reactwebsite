# Liquid Glass · ASAR Extractor

A single-page React app that parses and extracts Electron `.asar` archives
entirely client-side. Designed in the "iOS 26 Liquid Glass" aesthetic with
a real SVG refraction filter, cursor-following specular highlights, and a
backdrop-blur surface.

The build output drops directly into Cloudflare Pages — there is no server.

## Architecture

- **Main thread (60–120 fps UI only):** React + Tailwind. Maintains app
  state, drives the liquid glass surface and the specular highlight.
- **Web Worker (`src/workers/asar.worker.js`):** parses the ASAR header
  with `DataView`, streams file payloads via `Blob.slice()` (so 2 GB
  archives never have to fit in memory), and zips on demand with JSZip.
- **Promise bridge (`src/lib/workerBridge.js`):** thin wrapper around
  `postMessage` keyed by request id, with progress callbacks.

## Visual engine

- **Refraction:** hidden `<svg>` defs declare `#liquid-refraction`
  (feTurbulence → feGaussianBlur → feDisplacementMap). Applied to the
  top bar through `backdrop-filter: url(#liquid-refraction)`, so the
  background visibly bends as it scrolls underneath.
- **Specular glint:** a `radial-gradient` whose centre is driven by
  CSS custom properties `--mx` / `--my` (set in JS via `useSpecular`,
  throttled to one update per animation frame).
- **Theming:** `.dark` class on `<html>` swaps a small token palette;
  `backdrop-filter: blur(50px) saturate(180%)` is reused across surfaces.

## Develop

```bash
npm install
npm run dev      # vite dev server
npm run build    # outputs to ./dist — deploy this folder
```

## Cloudflare Pages

1. Build command: `npm run build`
2. Output directory: `dist`
3. No environment variables required.
