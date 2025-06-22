// YouTube script for InnerPeace extension
// Hides the main feed on YouTube's home page

(function () {
    // YouTube-specific toggle function
    function toggleHomeFeed(visible) {
        // Try multiple selectors to find the feed
        const selectors = [
            '#contents.ytd-rich-grid-renderer',
            '#contents',
            '[id="contents"]',
            'ytd-rich-grid-renderer',
            '#page-manager ytd-rich-grid-renderer'
        ];
        
        let feed = null;
        for (const selector of selectors) {
            feed = document.querySelector(selector);
            if (feed) {
                break;
            }
        }
        
        if (feed) {
            feed.style.display = visible ? '' : 'none';
        } else {
            console.error('[InnerPeace] Feed element not found with any selector');
        }
    }

    // Reads stored settings and applies them
    function updateVisibility() {
        try {
            if (!chrome?.runtime?.id) {
                console.error('[InnerPeace] Chrome runtime not available');
                return;
            }
        } catch (err) {
            console.error("[InnerPeace] Chrome runtime unavailable:", err);
            return;
        }

        try {
            // Only apply settings on YouTube home page
            if (window.location.pathname === '/') {
                chrome.storage.sync.get(['youtube_showFeed'], function (result) {
                    try {
                        const showFeed = typeof result.youtube_showFeed !== 'undefined' ? result.youtube_showFeed : false;
                        toggleHomeFeed(showFeed);
                    } catch (e) {
                        console.error("[InnerPeace] Error inside storage callback:", e);
                    }
                });
            } else {
                // Restore defaults on other pages
                toggleHomeFeed(true);
            }
        } catch (error) {
            console.error("[InnerPeace] Error in updateVisibility:", error);
        }
    }

    // Mutation Observer: watch for the feed element to load
    let observer;
    function setupObserver() {
        try {
            observer = new MutationObserver((mutations, obs) => {
                const feedExists = document.querySelector('#contents.ytd-rich-grid-renderer') ||
                                 document.querySelector('#contents') ||
                                 document.querySelector('ytd-rich-grid-renderer');
                if (feedExists) {
                    updateVisibility();
                    obs.disconnect();
                    observer = null;
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        } catch (err) {
            console.error("[InnerPeace] Error setting up MutationObserver:", err);
        }
    }

    // Handler for URL changes
    function onLocationChange() {
        if (window.location.pathname === '/') {
            setupObserver();
        } else {
            updateVisibility();
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }
    }

    // Monkey-patch history methods for SPA navigation
    (function (history) {
        try {
            const pushState = history.pushState;
            const replaceState = history.replaceState;
            history.pushState = function () {
                const ret = pushState.apply(history, arguments);
                window.dispatchEvent(new Event('locationchange'));
                return ret;
            };
            history.replaceState = function () {
                const ret = replaceState.apply(history, arguments);
                window.dispatchEvent(new Event('locationchange'));
                return ret;
            };
        } catch (e) {
            console.error("[InnerPeace] Error patching history:", e);
        }
    })(window.history);

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });

    window.addEventListener('locationchange', onLocationChange);

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onLocationChange);
    } else {
        onLocationChange();
    }

    // Immediate check for feed element
    setTimeout(() => {
        const feed = document.querySelector('#contents.ytd-rich-grid-renderer') ||
                    document.querySelector('#contents') ||
                    document.querySelector('ytd-rich-grid-renderer');
        if (feed) {
            updateVisibility();
        }
    }, 1000);

    // Periodic fallback check
    const fallbackInterval = setInterval(() => {
        try {
            if (!chrome?.runtime?.id) {
                clearInterval(fallbackInterval);
                return;
            }
            if (window.location.pathname === '/') {
                updateVisibility();
            }
        } catch (err) {
            console.error("[InnerPeace] Error in fallback interval:", err);
            clearInterval(fallbackInterval);
        }
    }, 2000);

    // Listen for messages from popup
    try {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                if (window.location.pathname !== '/') {
                    return;
                }
                
                if (message.action === 'youtube_toggleFeed') {
                    toggleHomeFeed(message.value);
                    sendResponse({ success: true });
                } else if (message.action === 'updateSettings') {
                    // Handle the new message format from popup
                    if (message.settings && message.settings.youtube_showFeed !== undefined) {
                        toggleHomeFeed(message.settings.youtube_showFeed);
                        sendResponse({ success: true });
                    }
                }
            } catch (e) {
                console.error("[InnerPeace] Error in message listener callback:", e);
                sendResponse({ success: false, error: e.message });
            }
        });
    } catch (err) {
        console.error("[InnerPeace] Error setting up message listener:", err);
    }
})(); 