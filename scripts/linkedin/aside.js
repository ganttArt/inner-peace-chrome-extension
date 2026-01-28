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
            aside.style.display = visible ? '' : 'none'
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
                    console.log('[InnerPeace] Applied LinkedIn aside setting:', showAside)
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
            console.log('[InnerPeace] LinkedIn aside observer set up.')
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

    // Export to global LinkedIn object
    window.LinkedInAside = {
        toggleAsideVisibility,
        updateAsideVisibility,
        setupAsideObserver,
        immediateAsideCheck,
        periodicAsideCheck
    }
})()
