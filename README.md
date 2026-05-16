# Hide watched Youtube videos

A Firefox extension that automatically hides already-watched videos on YouTube creator channel pages.

> **[Polski opis / Polish README →](README_pl.md)**

---

## Features

- **Auto-hides watched videos** using YouTube's built-in watch-progress bar — no separate tracking needed.
- **Configurable threshold** (1–100%): hide videos watched ≥ 90% (default), or any video you've started (set to 1%).
- **Toggle on/off** with one click from the toolbar popup.
- **Channel pages only** — does not touch the homepage, search results, or the video player itself.
- **Non-invasive** — uses only `display: none` via a CSS class; no data collection or external requests.
- **Bilingual** — automatically uses English or Polish based on your browser locale.

## Installation

### Load temporarily (no signing required)

The extension is not yet published on [addons.mozilla.org](https://addons.mozilla.org). You can load it temporarily — it will work until Firefox is restarted.

1. Download the latest [release `.zip`](../../releases/latest) and extract it, **or** clone this repository.
2. In Firefox, navigate to `about:debugging`.
3. Click **This Firefox** in the left sidebar.
4. Click **Load Temporary Add-on…** and select `manifest.json` from the extracted/cloned folder.
5. The extension icon appears in the toolbar immediately.

### Build a `.xpi` package yourself

```bash
git clone https://github.com/YOUR_USERNAME/hide-watched-videos.git
cd hide-watched-videos
bash build.sh
```

This creates `hide-watched-videos.zip` in the project root, loadable via `about:debugging`.

## How it works

When you watch a YouTube video while logged in with watch history enabled, YouTube renders a thin red progress bar under the video thumbnail. This extension reads the `width` inline style of that element and hides the parent video card if the progress meets or exceeds your configured threshold.

### Supported YouTube DOM structures

YouTube has migrated its progress bar to a new component. The extension detects both:

| Era | Element | Progress indicator |
|-----|---------|-------------------|
| Old | `ytd-thumbnail-overlay-resume-playback-renderer` | `#progress` — inline `width` % |
| New (2024+) | `yt-thumbnail-overlay-progress-bar-view-model` | `.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment` — inline `width` % |

### Why only channel pages?

The extension deliberately does nothing outside channel URLs (`/@handle`, `/channel/…`, `/c/…`, `/user/…`). Limiting scope avoids side-effects on the homepage feed, search, and the video player.

### A note on WebGL

The `MutationObserver` watches `childList` only — it does **not** observe attribute changes. Earlier versions observed `style` and `class` attribute mutations across the entire document, which fired on every WebGL frame YouTube renders and broke the video player. This is fixed in v1.2+.

## Requirements

- Firefox 109 or later
- A YouTube account with **watch history enabled**
  *(YouTube Settings → Your data in YouTube → YouTube history)*

## Troubleshooting

**Videos are not being hidden:**
1. Make sure you are on a channel's *Videos* tab.
2. Confirm watch history is enabled in your YouTube account settings.
3. Enable **Diagnostic mode** in the popup, reload the channel page, and open the browser console (F12 → Console). You should see a line like:
   ```
   [Hide watched Youtube videos] channel page | total: 24 | with progress: 6 | hidden: 6 (threshold 90%)
   ```
   If `with progress` is 0, YouTube may have changed its DOM — please open an issue.

**The extension disappears after restarting Firefox:**
This is expected for temporarily-loaded add-ons. To make it permanent the extension would need to be signed by Mozilla via [addons.mozilla.org](https://addons.mozilla.org).

## Contributing

Issues and pull requests are welcome!

When reporting a bug, please include:
- Firefox version (find it at `about:support`)
- Console output from diagnostic mode (see Troubleshooting above)
- The channel URL where the issue occurs (optional, but helpful)

## Project structure

```
hide-watched-videos/
├── _locales/
│   ├── en/messages.json   # English strings (default)
│   └── pl/messages.json   # Polish strings
├── icons/
│   ├── icon-48.png
│   ├── icon-96.png
│   └── icon-128.png
├── content.js             # Injected into YouTube pages
├── styles.css             # CSS rule that hides video cards
├── popup.html             # Toolbar popup
├── popup.css
├── popup.js
├── manifest.json
├── build.sh               # Packages the extension into a .zip
├── .gitignore
├── LICENSE
└── README.md
```

## License

[MIT](LICENSE)
