// LinkedIn Feed Module
(function () {
    function getFeedElement() {
        const selectors = [
            '[data-testid="mainFeed"]',
            '[data-view-name="news-module"]',
            '[data-test-id="feed-container"]',
            '[data-test-id="main-feed"]',
            '[data-test-id="feed"]',
            '[data-id="feed-container"]',
            '.scaffold-finite-scroll'
        ]
        function getAncestor(el, levels) {
            let node = el
            for (let i = 0; i < levels && node; i++) {
                node = node.parentElement
            }
            return node || null
        }

        for (const sel of selectors) {
            const el = document.querySelector(sel)
            if (!el) continue

            if (sel === '[data-view-name="news-module"]') {
                const ancestor = getAncestor(el, 4)
                if (ancestor) return ancestor
                return el
            }

            return el
        }

        return null
    }

    function toggleFeedVisibility(visible) {
        const feed = getFeedElement()
        if (feed) {
            window.InnerPeaceUtils?.setDisplay(feed, visible)
        }
    }

    function updateFeedVisibility() {
        try {
            if (!chrome?.runtime?.id) return
        } catch (err) {
            console.error('chrome.runtime unavailable:', err)
            return
        }

        try {
            chrome.storage.sync.get(['linkedin_showFeed'], function (result) {
                try {
                    const showFeed = typeof result.linkedin_showFeed !== 'undefined' ? result.linkedin_showFeed : false
                    toggleFeedVisibility(showFeed)
                    console.log('[InnerPeace] Applied LinkedIn feed setting:', showFeed)
                } catch (e) {
                    console.error('Error inside storage callback:', e)
                }
            })
        } catch (error) {
            console.error('Error in updateFeedVisibility:', error)
        }
    }

    function setupFeedObserver() {
        try {
            const observer = new MutationObserver((mutations, obs) => {
                const feedExists = getFeedElement()
                if (feedExists) {
                    updateFeedVisibility()
                    obs.disconnect()
                    console.log('[InnerPeace] LinkedIn feed observer disconnected after applying settings.')
                }
            })

            observer.observe(document.body, { childList: true, subtree: true })
            console.log('[InnerPeace] LinkedIn feed observer set up.')
        } catch (err) {
            console.error('Error setting up LinkedIn feed MutationObserver:', err)
        }
    }

    function immediateFeedCheck() {
        setTimeout(() => {
            const feedExists = getFeedElement()
            if (feedExists) {
                updateFeedVisibility()
            }
        }, 1000)
    }

    function periodicFeedCheck() {
        const interval = setInterval(() => {
            try {
                if (!chrome?.runtime?.id) {
                    clearInterval(interval)
                    return
                }
                if (window.location.pathname.startsWith('/feed')) {
                    updateFeedVisibility()
                }
            } catch (err) {
                console.error('Error in LinkedIn feed fallback interval:', err)
                clearInterval(interval)
            }
        }, 1500)
    }

    // Export to global LinkedIn object
    window.LinkedInFeed = {
        toggleFeedVisibility,
        updateFeedVisibility,
        setupFeedObserver,
        immediateFeedCheck,
        periodicFeedCheck
    }
})()
