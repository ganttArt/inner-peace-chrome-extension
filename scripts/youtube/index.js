// YouTube Main Entry Point (Module Pattern)
// This file should be loaded after homefeed.js and videopage.js

function onLocationChange () {
    if (window.location.pathname === '/') {
        window.YouTubeHomeFeed.setupHomeFeedObserver()
        window.YouTubeHomeFeed.immediateHomeFeedCheck()
        window.YouTubeHomeFeed.periodicHomeFeedCheck()
    } else if (window.location.pathname === '/watch') {
        window.YouTubeVideoPage.setupVideoPageObserver()
        window.YouTubeVideoPage.immediateVideoPageCheck()
        window.YouTubeVideoPage.periodicVideoPageCheck()
        window.YouTubeVideoPage.aggressiveVideoPageCheck()
        window.YouTubeVideoPage.setupVideoPageResizeListener()
    } else {
    // Restore defaults if needed
        window.YouTubeHomeFeed.toggleHomeFeed(true)
        window.YouTubeVideoPage.toggleVideoPageContent(true)
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
        console.error('[InnerPeace] Error patching history:', e)
    }
})(window.history)

window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'))
})
window.addEventListener('locationchange', onLocationChange)

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLocationChange)
} else {
    onLocationChange()
}

// Listen for messages from popup
try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            if (window.location.pathname === '/') {
                if (message.action === 'youtube_toggleFeed') {
                    window.YouTubeHomeFeed.toggleHomeFeed(message.value)
                    sendResponse({ success: true })
                } else if (message.action === 'updateSettings' && message.settings && message.settings.youtube_showFeed !== undefined) {
                    window.YouTubeHomeFeed.toggleHomeFeed(message.settings.youtube_showFeed)
                    sendResponse({ success: true })
                }
            } else if (window.location.pathname === '/watch') {
                if (message.action === 'youtube_toggleRightPanel') {
                    window.YouTubeVideoPage.toggleVideoPageContent(message.value)
                    sendResponse({ success: true })
                } else if (message.action === 'updateSettings' && message.settings && message.settings.youtube_showRightPanel !== undefined) {
                    window.YouTubeVideoPage.toggleVideoPageContent(message.settings.youtube_showRightPanel)
                    sendResponse({ success: true })
                }
            }
        } catch (e) {
            console.error('[InnerPeace] Error in message listener callback:', e)
            sendResponse({ success: false, error: e.message })
        }
    })
} catch (err) {
    console.error('[InnerPeace] Error setting up message listener:', err)
}
