/*
 * Hide watched Youtube videos — content script (v1.3)
 *
 * Detects YouTube's watch-progress bar on channel pages and adds a CSS class
 * to hide video cards whose progress meets or exceeds the configured threshold.
 *
 * Supports both the old and new YouTube progress-bar DOM:
 *   old: ytd-thumbnail-overlay-resume-playback-renderer  →  #progress (inline width %)
 *   new: yt-thumbnail-overlay-progress-bar-view-model    →  .ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment
 *
 * Design constraints (v1.2+):
 *   - MutationObserver watches childList only — NO attribute observation.
 *     Watching style/class attributes on the entire document interfered with
 *     YouTube's WebGL renderer.
 *   - Observer is connected only on channel pages and disconnected elsewhere.
 *   - No getBoundingClientRect() calls (forced synchronous layout).
 */
(() => {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;
  const HIDDEN_CLASS = 'uof-hidden';
  const LOG = '[Hide watched Youtube videos]';

  // Selectors for the video card wrapper elements
  const VIDEO_SELECTORS = [
    'ytd-rich-item-renderer',
    'ytd-grid-video-renderer',
    'ytd-video-renderer',
    'ytd-rich-grid-media',
    'ytd-compact-video-renderer',
  ].join(',');

  // Selectors for the progress bar element — covers old and new YouTube DOM
  const PROGRESS_SELECTORS = [
    // New DOM (YouTube ~2024+):
    '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment',
    '[class*="WatchedProgressBarSegment"]',
    // Old DOM:
    'ytd-thumbnail-overlay-resume-playback-renderer #progress',
    '#progress.ytd-thumbnail-overlay-resume-playback-renderer',
  ].join(',');

  // ── Settings ────────────────────────────────────────────────────────────────

  let settings = { enabled: true, threshold: 90, debug: false };

  async function loadSettings() {
    try {
      const s = await api.storage.local.get(['enabled', 'threshold', 'debug']);
      if (typeof s.enabled === 'boolean') settings.enabled = s.enabled;
      if (typeof s.threshold === 'number') settings.threshold = s.threshold;
      if (typeof s.debug === 'boolean') settings.debug = s.debug;
    } catch (_) {
      // Fall back to defaults
    }
  }

  // Sync settings changes from the popup in real time
  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if ('enabled' in changes) settings.enabled = changes.enabled.newValue;
    if ('threshold' in changes) settings.threshold = changes.threshold.newValue;
    if ('debug' in changes) settings.debug = changes.debug.newValue;
    processItems();
  });

  // ── URL helpers ─────────────────────────────────────────────────────────────

  function isChannelPage() {
    const p = location.pathname;
    return (
      p.startsWith('/@') ||
      p.startsWith('/channel/') ||
      p.startsWith('/c/') ||
      p.startsWith('/user/')
    );
  }

  // ── Progress detection ──────────────────────────────────────────────────────

  /** Parse an inline `style.width` value like "75%" → 75, or return null. */
  function readPercentWidth(el) {
    const w = el.style.width;
    if (w && w.endsWith('%')) {
      const v = parseFloat(w);
      return Number.isNaN(v) ? null : v;
    }
    return null;
  }

  /**
   * Return the watch progress (0–100) for a video card element.
   * Returns 0 if no progress information is found.
   */
  function getWatchProgress(item) {
    // 1. Progress bar (inline style width) — handles both DOM versions
    const bar = item.querySelector(PROGRESS_SELECTORS);
    if (bar) {
      const v = readPercentWidth(bar);
      if (v !== null && v > 0) return v;
    }

    // 2. "Watched" status label (fully watched videos may show a badge instead)
    const status = item.querySelector('ytd-thumbnail-overlay-playback-status-renderer');
    if (status) {
      const t = (status.textContent || '').toLowerCase();
      if (t.includes('watched') || t.includes('obejrz')) return 100;
    }

    return 0;
  }

  // ── DOM processing ──────────────────────────────────────────────────────────

  function showAll() {
    document.querySelectorAll('.' + HIDDEN_CLASS).forEach(el => {
      el.classList.remove(HIDDEN_CLASS);
    });
  }

  function processItems() {
    if (!settings.enabled || !isChannelPage()) {
      showAll();
      return;
    }

    const items = document.querySelectorAll(VIDEO_SELECTORS);
    let hiddenCount = 0;
    let withProgressCount = 0;

    items.forEach(item => {
      const progress = getWatchProgress(item);
      if (progress > 0) withProgressCount++;
      if (progress >= settings.threshold) {
        item.classList.add(HIDDEN_CLASS);
        hiddenCount++;
      } else {
        item.classList.remove(HIDDEN_CLASS);
      }
    });

    if (settings.debug) {
      console.log(
        LOG,
        `channel page | total: ${items.length} | with progress: ${withProgressCount}` +
        ` | hidden: ${hiddenCount} (threshold ${settings.threshold}%)`
      );
    }
  }

  // ── Scheduling ──────────────────────────────────────────────────────────────

  let scheduleTimer = null;

  function schedule(delay = 300) {
    clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(processItems, delay);
  }

  // ── MutationObserver — childList only, channel pages only ───────────────────
  //
  // IMPORTANT: Do NOT add `attributes: true` here.
  // Observing style/class attribute changes on the entire document triggers
  // on every WebGL frame YouTube renders, breaking the video player.

  const observer = new MutationObserver(() => schedule());

  function connectObserver() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      // Intentionally omitted: attributes, attributeFilter, characterData
    });
  }

  function disconnectObserver() {
    observer.disconnect();
  }

  // ── SPA navigation detection ────────────────────────────────────────────────

  let prevUrl = location.href;
  let prevIsChannel = false;

  function onPollTick() {
    if (location.href === prevUrl) return;
    prevUrl = location.href;

    const channel = isChannelPage();
    if (channel && !prevIsChannel) {
      connectObserver();
    } else if (!channel && prevIsChannel) {
      disconnectObserver();
      showAll();
    }
    prevIsChannel = channel;
    schedule(500);
  }

  setInterval(onPollTick, 700);

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  loadSettings().then(() => {
    if (settings.debug) console.log(LOG, 'init', settings);
    prevIsChannel = isChannelPage();
    if (prevIsChannel) connectObserver();
    processItems();
    // Delayed retries — YouTube injects progress bars asynchronously
    setTimeout(processItems, 1500);
    setTimeout(processItems, 4000);
  });
})();
