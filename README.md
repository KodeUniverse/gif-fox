<p align="center">
  <img src="icons/fox.svg" width="64" height="64" alt="GIF Fox logo">
</p>

# GIF Fox

Firefox extension for searching and copying GIFs via the Klipy API. Click any GIF to copy its URL — paste straight into Discord, forums, or chat.

## Features

- **Search & trending** — browse trending GIFs or search by keyword
- **Click to copy** — left-click any GIF, URL goes to your clipboard
- **Settings** — save your Klipy API key, choose theme (system / light / dark)
- **Infinite scroll** — keep scrolling, more GIFs load automatically
- **Masonry grid** — GIFs flow naturally, no awkward cropping
- **Dark mode** — follows your system preference by default, overridable in settings

## Setup

1. Get a free API key at [klipy.com](https://docs.klipy.com/)
2. Install the extension (see [Building](#building))
3. Click the gear icon and paste your key

## Building

```sh
npm install
npm run build
```

Output goes to `dist/`. Load the extension in Firefox via `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `manifest.json`.

## Submit to AMO

```sh
npm run build
zip -r gif-fox.zip manifest.json icons/ dist/
```

Upload the zip to [addons.mozilla.org](https://addons.mozilla.org).
