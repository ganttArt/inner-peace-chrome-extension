// Simple browser API polyfill for cross-browser compatibility
// Makes Chrome extensions work with Firefox's browser.* API

// Ensure a `browser` global exists (Firefox) or alias to `chrome` (Chromium)
if (typeof globalThis.browser === 'undefined') {
    globalThis.browser = typeof chrome !== 'undefined' ? chrome : undefined;
}

// Export for environments that support CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = globalThis.browser;
}
