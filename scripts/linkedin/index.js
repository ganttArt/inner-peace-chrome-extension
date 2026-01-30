// LinkedIn Main Entry Point (Module Pattern)
// This file should be loaded after feed.js and aside.js

// (debug detectors removed)

function onLocationChange() {
    // If we are on /feed, wait for feed/aside elements using the observers
    if (window.location.pathname.startsWith('/feed')) {
        window.LinkedInFeed.setupFeedObserver()
        window.LinkedInAside.setupAsideObserver()
        window.LinkedInFeed.immediateFeedCheck()
        window.LinkedInAside.immediateAsideCheck()
        window.LinkedInFeed.periodicFeedCheck()
        window.LinkedInAside.periodicAsideCheck()
        // Start the aggressive initial enforcers that run every 1s for 15s
        try {
            if (typeof window.LinkedInFeed.startInitialEnforcer === 'function') {
                window.LinkedInFeed.startInitialEnforcer()
            }
            if (typeof window.LinkedInAside.startInitialEnforcer === 'function') {
                window.LinkedInAside.startInitialEnforcer()
            }
        } catch (e) {
            console.error('[InnerPeace] Error starting LinkedIn initial enforcers:', e)
        }

        // Attempt a single reload on first visit to /feed to handle cases where
        // LinkedIn renders before our scripts have had effect. We use sessionStorage
        // to ensure we only request one reload per tab, and allow the user to cancel
        // the reload by toggling visibility within a short window.
        try {
            const RELOAD_FLAG = 'innerpeace_reloaded'
            if (!sessionStorage.getItem(RELOAD_FLAG)) {
                // small delay to let initial settings apply and allow manual toggle
                const RELOAD_DELAY_MS = 700
                setTimeout(() => {
                    try {
                        // If user manually made content visible, do not reload
                        if (window.LinkedInFeed && window.LinkedInFeed._manualVisible) return
                        // Send request to background to reload the current active tab
                        try {
                            chrome.runtime.sendMessage({ action: 'requestReload' })
                        } catch (e) {
                            console.warn('[InnerPeace] Could not send reload request:', e)
                        }
                        // mark as attempted so we don't reload repeatedly
                        try { sessionStorage.setItem(RELOAD_FLAG, '1') } catch (e) { }
                    } catch (e) { }
                }, RELOAD_DELAY_MS)
            }
        } catch (e) {
            console.error('[InnerPeace] Error scheduling reload request:', e)
        }
    } else {
        // On other pages, apply stored settings instead of forcing content visible
        try {
            if (window.LinkedInFeed && typeof window.LinkedInFeed.updateFeedVisibility === 'function') {
                window.LinkedInFeed.updateFeedVisibility()
            }
            if (window.LinkedInAside && typeof window.LinkedInAside.updateAsideVisibility === 'function') {
                window.LinkedInAside.updateAsideVisibility()
            }
        } catch (e) {
            console.error('[InnerPeace] Error applying LinkedIn settings on non-/feed page:', e)
        }
    }
}

// Monkey-patch history methods for SPA navigation
(function (history) {
    try {
        const pushState = history.pushState
        const replaceState = history.replaceState
        history.pushState = function () {
            const ret = pushState.apply(history, arguments)
            window.dispatchEvent(new Event('locationchange'))
            return ret
        }
        history.replaceState = function () {
            const ret = replaceState.apply(history, arguments)
            window.dispatchEvent(new Event('locationchange'))
            return ret
        }
    } catch (e) {
        console.error('Error patching LinkedIn history:', e)
    }
})(window.history)

window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'))
})

// Listen for custom location change events
window.addEventListener('locationchange', onLocationChange)

// On initial load, wait for DOM readiness
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLocationChange)
} else {
    onLocationChange()
}

// Listen for messages from the popup (or elsewhere) to toggle visibility
try {
    chrome.runtime.onMessage.addListener((message) => {
        try {
            if (!window.location.pathname.startsWith('/feed')) return
            if (message.action === 'linkedin_toggleFeed') {
                window.LinkedInFeed.toggleFeedVisibility(message.value)
            } else if (message.action === 'linkedin_toggleAside') {
                window.LinkedInAside.toggleAsideVisibility(message.value)
            } else if (message.action === 'updateSettings' && message.settings) {
                if (message.settings.linkedin_showFeed !== undefined) {
                    window.LinkedInFeed.toggleFeedVisibility(message.settings.linkedin_showFeed)
                }
                if (message.settings.linkedin_showAside !== undefined) {
                    window.LinkedInAside.toggleAsideVisibility(message.settings.linkedin_showAside)
                }
            }
        } catch (e) {
            console.error('Error in LinkedIn message listener callback:', e)
        }
    })
} catch (err) {
    console.error('Error setting up LinkedIn message listener:', err)
}

// LinkedIn content script loaded
