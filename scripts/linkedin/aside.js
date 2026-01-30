// LinkedIn Aside Module
(function () {
    function getAsideElement() {
        const selectors = [
            'aside.scaffold-layout__aside[aria-label="LinkedIn News"]',
            '[data-view-name="news-module"]'
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

    function toggleAsideVisibility(visible) {
        const aside = getAsideElement()
        if (aside) {
            try {
                if (visible) {
                    removeAsideHideStyle()
                    aside.style.display = ''
                } else {
                    ensureAsideHideStyle()
                    aside.style.display = 'none'
                }
            } catch (e) {
                console.error('Error toggling aside visibility:', e)
            }
            try {
                window.LinkedInAside._manualVisible = !!visible
                if (visible && window.LinkedInAside._initialEnforcerTimer) {
                    clearInterval(window.LinkedInAside._initialEnforcerTimer)
                    window.LinkedInAside._initialEnforcerTimer = null
                }
                if (visible) removeAsideHideStyle()
            } catch (e) {
                console.error('Error setting manual visibility flag for aside:', e)
            }
        }
    }

    const ASIDE_STYLE_ID = 'innerpeace-linkedin-aside-style'
    const ASIDE_HIDE_SELECTORS = [
        'aside.scaffold-layout__aside[aria-label="LinkedIn News"]',
        '[data-view-name="news-module"]'
    ]

    function ensureAsideHideStyle() {
        try {
            if (document.getElementById(ASIDE_STYLE_ID)) return
            const style = document.createElement('style')
            style.id = ASIDE_STYLE_ID
            style.textContent = `${ASIDE_HIDE_SELECTORS.join(', ')} { display: none !important; visibility: hidden !important; opacity: 0 !important; }`
            document.documentElement.appendChild(style)
            // applied aside hide stylesheet
        } catch (e) {
            console.error('Error applying aside hide stylesheet:', e)
        }
    }

    function removeAsideHideStyle() {
        try {
            const s = document.getElementById(ASIDE_STYLE_ID)
            if (s && s.parentNode) s.parentNode.removeChild(s)
        } catch (e) {
            console.error('Error removing aside hide stylesheet:', e)
        }
    }

    function updateAsideVisibility() {
        try {
            if (!chrome?.runtime?.id) return
        } catch (err) {
            console.error('chrome.runtime unavailable:', err)
            return
        }

        try {
            chrome.storage.sync.get(['linkedin_showAside'], function (result) {
                try {
                    const showAside = typeof result.linkedin_showAside !== 'undefined' ? result.linkedin_showAside : false
                    toggleAsideVisibility(showAside)
                } catch (e) {
                    console.error('Error inside storage callback:', e)
                }
            })
        } catch (error) {
            console.error('Error in updateAsideVisibility:', error)
        }
    }

    function setupAsideObserver() {
        try {
            const observer = new MutationObserver((mutations, obs) => {
                const asideExists = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]')
                if (asideExists) {
                    updateAsideVisibility()
                    // Keep observing so we re-apply settings if LinkedIn re-renders the aside
                }
            })

            observer.observe(document.body, { childList: true, subtree: true })
            // aside observer set up
        } catch (err) {
            console.error('Error setting up LinkedIn aside MutationObserver:', err)
        }
    }

    function immediateAsideCheck() {
        // Run initial check and a few retries to handle slow-loading LinkedIn DOM
        const attempts = [1000, 2000, 3500]
        for (const delay of attempts) {
            setTimeout(() => {
                const asideExists = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]')
                if (asideExists) {
                    updateAsideVisibility()
                }
            }, delay)
        }
    }

    function periodicAsideCheck() {
        const interval = setInterval(() => {
            try {
                if (!chrome?.runtime?.id) {
                    clearInterval(interval)
                    return
                }
                if (window.location.pathname.startsWith('/feed')) {
                    updateAsideVisibility()
                }
            } catch (err) {
                console.error('Error in LinkedIn aside fallback interval:', err)
                clearInterval(interval)
            }
        }, 1500)
    }

    // Initial enforcer: every 1s for first 15s try to hide the aside
    function startInitialEnforcer() {
        try {
            if (window.LinkedInAside._initialEnforcerTimer) {
                clearInterval(window.LinkedInAside._initialEnforcerTimer)
                window.LinkedInAside._initialEnforcerTimer = null
            }

            if (window.LinkedInAside._manualVisible) return

            const MAX_SECONDS = 15
            let seconds = 0

            window.LinkedInAside._initialEnforcerTimer = setInterval(() => {
                try {
                    seconds += 1
                    if (window.LinkedInAside._manualVisible) {
                        clearInterval(window.LinkedInAside._initialEnforcerTimer)
                        window.LinkedInAside._initialEnforcerTimer = null
                        return
                    }

                    // Apply CSS-based hiding so it persists across re-renders
                    ensureAsideHideStyle()
                    const aside = getAsideElement()
                    if (aside) {
                        aside.style.display = 'none'
                    }

                    if (seconds >= MAX_SECONDS) {
                        clearInterval(window.LinkedInAside._initialEnforcerTimer)
                        window.LinkedInAside._initialEnforcerTimer = null
                        // initial aside enforcer completed
                    }
                } catch (err) {
                    console.error('Error in initial aside enforcer:', err)
                    if (window.LinkedInAside._initialEnforcerTimer) {
                        clearInterval(window.LinkedInAside._initialEnforcerTimer)
                        window.LinkedInAside._initialEnforcerTimer = null
                    }
                }
            }, 1000)
        } catch (err) {
            console.error('Could not start initial aside enforcer:', err)
        }
    }

    // Export to global LinkedIn object
    window.LinkedInAside = {
        toggleAsideVisibility,
        updateAsideVisibility,
        setupAsideObserver,
        immediateAsideCheck,
        periodicAsideCheck
        , startInitialEnforcer
    }
})()
