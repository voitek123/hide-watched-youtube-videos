(() => {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;

  // ── i18n ─────────────────────────────────────────────────────────────────────
  // We manage translations manually (fetching _locales/*.json) instead of relying
  // on browser.i18n.getMessage(), because that API always uses the browser locale
  // and cannot be overridden at runtime.

  const SUPPORTED_LANGS = ['en', 'pl'];
  let messages = {};  // { key: { message: "…" } }

  /** Fetch and return the messages object for a given locale code. */
  async function fetchMessages(lang) {
    const url = api.runtime.getURL(`_locales/${lang}/messages.json`);
    const resp = await fetch(url);
    return resp.json();
  }

  /** Look up a translation key; fall back to the key itself if missing. */
  function t(key) {
    return (messages[key] && messages[key].message) || key;
  }

  /** Fill all [data-i18n] elements with the current locale strings. */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.title = t('popupTitle');
  }

  // ── Language switcher ─────────────────────────────────────────────────────────

  /** Detect a sensible default locale:
   *  1. Check browser UI language (e.g. "pl", "pl-PL", "en-US").
   *  2. Map to a supported code; default to "en". */
  function detectBrowserLang() {
    const raw = (api.i18n.getUILanguage() || 'en').toLowerCase();
    return SUPPORTED_LANGS.find(l => raw.startsWith(l)) || 'en';
  }

  /** Switch the UI to `lang`, persist the choice, and update the toggle. */
  async function setLanguage(lang) {
    messages = await fetchMessages(lang);
    applyTranslations();

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });

    await api.storage.local.set({ lang });
  }

  // ── Controls ──────────────────────────────────────────────────────────────────

  const enabledEl      = document.getElementById('enabled');
  const thresholdEl    = document.getElementById('threshold');
  const thresholdValEl = document.getElementById('threshold-value');
  const debugEl        = document.getElementById('debug');

  // Language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  enabledEl.addEventListener('change', () =>
    api.storage.local.set({ enabled: enabledEl.checked }));

  thresholdEl.addEventListener('input', () =>
    (thresholdValEl.textContent = thresholdEl.value));

  thresholdEl.addEventListener('change', () =>
    api.storage.local.set({ threshold: parseInt(thresholdEl.value, 10) }));

  debugEl.addEventListener('change', () =>
    api.storage.local.set({ debug: debugEl.checked }));

  // ── Init ──────────────────────────────────────────────────────────────────────

  async function init() {
    // Load all persisted settings in one call
    const s = await api.storage.local.get(['enabled', 'threshold', 'debug', 'lang']);

    // Language: use saved preference → browser locale → 'en'
    const lang = SUPPORTED_LANGS.includes(s.lang) ? s.lang : detectBrowserLang();
    await setLanguage(lang);   // also applies translations

    // Restore control states
    enabledEl.checked          = s.enabled !== false;
    const threshold            = typeof s.threshold === 'number' ? s.threshold : 90;
    thresholdEl.value          = threshold;
    thresholdValEl.textContent = threshold;
    debugEl.checked            = s.debug === true;
  }

  init().catch(err => console.error('[Hide watched Youtube videos] popup init failed:', err));
})();
