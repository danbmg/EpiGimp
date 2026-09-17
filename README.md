# EpiGimp

A raster image editor inspired by GIMP, built as a desktop app with Electron and TypeScript.

## Requirements

- [Node.js](https://nodejs.org/) 20 or later (developed with Node.js 22)
- npm 10 or later
- Git

## Install

```bash
git clone git@github.com:danbmg/EpiGimp.git
cd EpiGimp
npm install
```

The first `npm start` downloads the Electron binary if it is not already cached, so it can take a little longer.

## Run

```bash
npm start
```

This starts the Vite dev server and opens the EpiGimp window. Renderer changes reload automatically; type `rs` in the terminal to restart the main process.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Launch the app in development mode |
| `npm run lint` | Lint the code with ESLint |
| `npm run typecheck` | Check types with the TypeScript compiler (`tsc --noEmit`) |
| `npm test` | Run the unit tests with Vitest |
| `npm run check` | Run typecheck, lint and tests in a row (stops at the first failure) |
| `npm run package` | Package the app for the current platform into `out/` |
| `npm run make` | Build distributable installers into `out/make/` |

## Project structure

```
src/
├── main/        # Electron main process (window creation)
├── preload.ts   # Bridge between the main process and the renderer
└── renderer/    # Editor UI running in the window
tests/           # Vitest unit tests
```

## Tech stack

- Electron + Electron Forge (Vite plugin)
- TypeScript
- HTML5 Canvas 2D
- ESLint, Vitest
