// LinkedIn Main Entry Point (Module Pattern)
// This file should be loaded after feed.js and aside.js

function onLocationChange() {
    // If we are on /feed, wait for feed/aside elements using the observers
    if (window.location.pathname.startsWith('/feed')) {
        window.LinkedInFeed.setupFeedObserver();
        window.LinkedInAside.setupAsideObserver();
        window.LinkedInFeed.immediateFeedCheck();
        window.LinkedInAside.immediateAsideCheck();
        window.LinkedInFeed.periodicFeedCheck();
        window.LinkedInAside.periodicAsideCheck();
    } else {
        // On other pages, simply restore defaults
        window.LinkedInFeed.toggleFeedVisibility(true);
        window.LinkedInAside.toggleAsideVisibility(true);
        console.log('[InnerPeace] Restored default LinkedIn view on non-/feed page.');
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

// Listen for messages from the popup (or elsewhere) to toggle visibility
try {
    chrome.runtime.onMessage.addListener((message) => {
        try {
            if (!window.location.pathname.startsWith('/feed')) return;
            if (message.action === 'linkedin_toggleFeed') {
                window.LinkedInFeed.toggleFeedVisibility(message.value);
            } else if (message.action === 'linkedin_toggleAside') {
                window.LinkedInAside.toggleAsideVisibility(message.value);
            } else if (message.action === 'updateSettings' && message.settings) {
                if (message.settings.linkedin_showFeed !== undefined) {
                    window.LinkedInFeed.toggleFeedVisibility(message.settings.linkedin_showFeed);
                }
                if (message.settings.linkedin_showAside !== undefined) {
                    window.LinkedInAside.toggleAsideVisibility(message.settings.linkedin_showAside);
                }
            }
        } catch (e) {
            console.error("Error in LinkedIn message listener callback:", e);
        }
    });
} catch (err) {
    console.error("Error setting up LinkedIn message listener:", err);
}

console.log('[InnerPeace] LinkedIn content script loaded on:', window.location.pathname); 