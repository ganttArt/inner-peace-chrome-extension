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
            // Use CSS-based hiding to survive re-renders and race conditions
            try {
                if (visible) {
                    removeHideStyle()
                    window.InnerPeaceUtils?.setDisplay(feed, true)
                } else {
                    ensureHideStyle()
                    window.InnerPeaceUtils?.setDisplay(feed, false)
                }
            } catch (e) {
                console.error('Error toggling feed visibility:', e)
            }
            // Track manual visibility changes from the popup
            try {
                window.LinkedInFeed._manualVisible = !!visible
                // If the user made the feed visible, stop the initial enforcer and remove styles
                if (visible) {
                    if (window.LinkedInFeed._initialEnforcerTimer) {
                        clearInterval(window.LinkedInFeed._initialEnforcerTimer)
                        window.LinkedInFeed._initialEnforcerTimer = null
                    }
                    removeHideStyle()
                    // stopped initial feed enforcer due to manual visibility
                }
            } catch (e) {
                console.error('Error setting manual visibility flag for feed:', e)
            }
        }
    }

    const STYLE_ID = 'innerpeace-linkedin-feed-style'
    const HIDE_SELECTORS = [
        '[data-testid="mainFeed"]',
        '[data-view-name="news-module"]',
        '[data-test-id="feed-container"]',
        '[data-test-id="main-feed"]',
        '[data-test-id="feed"]',
        '[data-id="feed-container"]',
        '.scaffold-finite-scroll'
    ]

    function ensureHideStyle() {
        try {
            if (document.getElementById(STYLE_ID)) return
            const style = document.createElement('style')
            style.id = STYLE_ID
            style.textContent = `${HIDE_SELECTORS.join(', ')} { display: none !important; visibility: hidden !important; opacity: 0 !important; }`
            document.documentElement.appendChild(style)
            // applied feed hide stylesheet
        } catch (e) {
            console.error('Error applying feed hide stylesheet:', e)
        }
    }

    function removeHideStyle() {
        try {
            const s = document.getElementById(STYLE_ID)
            if (s && s.parentNode) s.parentNode.removeChild(s)
        } catch (e) {
            console.error('Error removing feed hide stylesheet:', e)
        }
    }

    // Initial enforcer: every 1s for first 15s try to hide the feed
    function startInitialEnforcer() {
        try {
            // If already running, reset
            if (window.LinkedInFeed._initialEnforcerTimer) {
                clearInterval(window.LinkedInFeed._initialEnforcerTimer)
                window.LinkedInFeed._initialEnforcerTimer = null
            }

            // If user has already manually requested visibility, don't start
            if (window.LinkedInFeed._manualVisible) return

            const MAX_SECONDS = 15
            let seconds = 0

            window.LinkedInFeed._initialEnforcerTimer = setInterval(() => {
                try {
                    seconds += 1
                    // If user manually set visible, stop enforcing
                    if (window.LinkedInFeed._manualVisible) {
                        clearInterval(window.LinkedInFeed._initialEnforcerTimer)
                        window.LinkedInFeed._initialEnforcerTimer = null
                        return
                    }

                    // Apply CSS-based hiding so it persists across re-renders
                    ensureHideStyle()

                    // Also try direct hiding if the element exists
                    const feed = getFeedElement()
                    if (feed) {
                        window.InnerPeaceUtils?.setDisplay(feed, false)
                    }

                    if (seconds >= MAX_SECONDS) {
                        clearInterval(window.LinkedInFeed._initialEnforcerTimer)
                        window.LinkedInFeed._initialEnforcerTimer = null
                        // initial feed enforcer completed
                    }
                } catch (err) {
                    console.error('Error in initial feed enforcer:', err)
                    if (window.LinkedInFeed._initialEnforcerTimer) {
                        clearInterval(window.LinkedInFeed._initialEnforcerTimer)
                        window.LinkedInFeed._initialEnforcerTimer = null
                    }
                }
            }, 1000)
        } catch (err) {
            console.error('Could not start initial feed enforcer:', err)
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
                    // Keep observing to re-apply settings if LinkedIn re-renders content
                    // (do not disconnect immediately)
                }
            })

            observer.observe(document.body, { childList: true, subtree: true })
            // feed observer set up
        } catch (err) {
            console.error('Error setting up LinkedIn feed MutationObserver:', err)
        }
    }

    function immediateFeedCheck() {
        // Run initial check and a few retries to handle slow-loading LinkedIn DOM
        const attempts = [1000, 2000, 3500]
        for (const delay of attempts) {
            setTimeout(() => {
                const feedExists = getFeedElement()
                if (feedExists) {
                    updateFeedVisibility()
                }
            }, delay)
        }
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
        periodicFeedCheck,
        startInitialEnforcer
    }
})()
