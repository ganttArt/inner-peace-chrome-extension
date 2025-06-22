(function () {
    // LinkedIn-specific toggle functions
    function toggleFeedVisibility(visible) {
        const feed =
            document.querySelector('[data-id="feed-container"]') ||
            document.querySelector('.scaffold-finite-scroll');
        if (feed) {
            feed.style.display = visible ? '' : 'none';
        }
    }

    function toggleAsideVisibility(visible) {
        const aside = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]');
        if (aside) {
            aside.style.display = visible ? '' : 'none';
        }
    }

    // Reads stored settings and applies them only on /feed
    function updateVisibility() {
        try {
            if (!chrome?.runtime?.id) return; // Check extension context.
        } catch (err) {
            console.error("chrome.runtime unavailable:", err);
            return;
        }

        try {
            if (window.location.pathname.startsWith('/feed')) {
                chrome.storage.sync.get(['linkedin_showFeed', 'linkedin_showAside'], function (result) {
                    try {
                        const showFeed = typeof result.linkedin_showFeed !== 'undefined' ? result.linkedin_showFeed : false;
                        const showAside = typeof result.linkedin_showAside !== 'undefined' ? result.linkedin_showAside : false;
                        toggleFeedVisibility(showFeed);
                        toggleAsideVisibility(showAside);
                        console.log('[InnerPeace] Applied LinkedIn settings on /feed:', { showFeed, showAside });
                    } catch (e) {
                        console.error("Error inside storage callback:", e);
                    }
                });
            } else {
                // Restore defaults on non-/feed pages.
                toggleFeedVisibility(true);
                toggleAsideVisibility(true);
                console.log('[InnerPeace] Restored default LinkedIn view on non-/feed page.');
            }
        } catch (error) {
            console.error("Error in updateVisibility:", error);
        }
    }

    // Mutation Observer: watch the document body for the feed or aside elements
    let observer;
    function setupObserver() {
        try {
            observer = new MutationObserver((mutations, obs) => {
                const feedExists = document.querySelector('[data-id="feed-container"]') ||
                    document.querySelector('.scaffold-finite-scroll');
                const asideExists = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]');
                if (feedExists || asideExists) {
                    // Found one of the target elements—apply settings and disconnect observer.
                    updateVisibility();
                    // We can disconnect the observer until the next location change.
                    obs.disconnect();
                    observer = null;
                    console.log('[InnerPeace] LinkedIn observer disconnected after applying settings.');
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            console.log('[InnerPeace] LinkedIn observer set up to watch for feed/aside elements.');
        } catch (err) {
            console.error("Error setting up LinkedIn MutationObserver:", err);
        }
    }

    // Handler to try applying settings when URL changes
    function onLocationChange() {
        // If we are on /feed, wait for feed/aside elements using the MutationObserver.
        if (window.location.pathname.startsWith('/feed')) {
            setupObserver();
        } else {
            // On other pages, simply restore defaults.
            updateVisibility();
            // Disconnect any existing observer.
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
            console.error("Error patching LinkedIn history:", e);
        }
    })(window.history);

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });

    // Listen for custom location change events
    window.addEventListener('locationchange', onLocationChange);

    // On initial load, wait for DOM readiness
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onLocationChange);
    } else {
        onLocationChange();
    }

    // Periodic fallback: check every 1500 ms if on /feed, in case the observer misses an update
    const fallbackInterval = setInterval(() => {
        try {
            if (!chrome?.runtime?.id) {
                clearInterval(fallbackInterval);
                return;
            }
            if (window.location.pathname.startsWith('/feed')) {
                updateVisibility();
            }
        } catch (err) {
            console.error("Error in LinkedIn fallback interval:", err);
            clearInterval(fallbackInterval);
        }
    }, 1500);

    // Listen for messages from the popup (or elsewhere) to toggle visibility
    try {
        chrome.runtime.onMessage.addListener((message) => {
            try {
                if (!window.location.pathname.startsWith('/feed')) return;
                if (message.action === 'linkedin_toggleFeed') {
                    toggleFeedVisibility(message.value);
                } else if (message.action === 'linkedin_toggleAside') {
                    toggleAsideVisibility(message.value);
                }
            } catch (e) {
                console.error("Error in LinkedIn message listener callback:", e);
            }
        });
    } catch (err) {
        console.error("Error setting up LinkedIn message listener:", err);
    }

    console.log('[InnerPeace] LinkedIn content script loaded on:', window.location.pathname);
})(); 