# sharp-compress-cli

## Overview
`sharp-compress-cli` is a lightweight image compression utility powered by [sharp](https://sharp.pixelplumbing.com/). It resizes and re-encodes images from the command line while guarding against quality loss and unsupported formats.

## Installation
Clone the repository and install dependencies:

```bash
pnpm install
```

## Usage
Run the CLI through the bundled script:

```bash
pnpm compress <inputPath> [--quality 80] [--maxWidth 1280] [--maxHeight 720] [--format webp] [--outDir dist]
```

- `--quality` (1-100) controls encoder quality; omitted values fall back to the format default.
- `--maxWidth` / `--maxHeight` resize with `fit: inside` while preventing upscaling.
- `--format` normalizes aliases (e.g. `jpg` → `jpeg`) and rejects sharp formats that cannot write files.
- `--outDir` defaults to `out/` and will be created if missing.

### Examples

Convert a JPEG to WebP while resizing and preserving detail:

```bash
pnpm compress ./assets/hero.jpg --maxWidth 1600 --quality 75 --format webp
```

Use defaults to transcode an SVG (input-only format) into a JPEG thumbnail:

```bash
pnpm compress ./icons/logo.svg
# Saves to out/logo.jpg with format fallback and no resizing
```

Create a square-friendly PNG with height-only constraint:

```bash
pnpm compress ./photos/avatar.heic --maxHeight 512 --format png --outDir avatars
```

Compressed files adopt the source filename with the chosen extension (`photo.jpg`, `photo.webp`, etc.).
