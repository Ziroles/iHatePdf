# iHatePdf

A privacy-first PDF editor that runs entirely in the browser - no server, no uploads, no data leaving your machine.

## Features

- **View & edit text** - click any text block on the PDF to edit it in place
- **Add text** - place new text anywhere on the page
- **Security validation** - every file is checked for embedded JS, malicious actions, and invalid signatures before processing
- **Export** - download the modified PDF instantly

> Merge and split features are planned but not yet implemented.

## Tech stack

- [SvelteKit](https://kit.svelte.dev/) + TypeScript
- [PDF.js](https://mozilla.github.io/pdf.js/) for rendering
- [pdf-lib](https://pdf-lib.js.org/) for editing (overlay approach - white rectangle + redrawn text)
- Tailwind CSS v4

## Getting started

```sh
npm install
npm run dev
```

## Docker

```sh
docker build -t ihatepdf .
docker run -p 3000:3000 ihatepdf
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run check` | Type-check with svelte-check |
| `npm run lint` | Lint + format check |
| `npm run format` | Auto-format |
