// Template for adding new website scripts
// Copy this file and modify it for your specific website

(function () {
    // Website-specific toggle functions
    function toggleElement1 (visible) {
        const element = document.querySelector('YOUR_SELECTOR_HERE')
        if (element) {
            element.style.display = visible ? '' : 'none'
        }
    }

    function toggleElement2 (visible) {
        const element = document.querySelector('YOUR_SELECTOR_HERE')
        if (element) {
            element.style.display = visible ? '' : 'none'
        }
    }

    // Reads stored settings and applies them
    function updateVisibility () {
        try {
            if (!chrome?.runtime?.id) return // Check extension context.
        } catch (err) {
            console.error('chrome.runtime unavailable:', err)
            return
        }

        try {
            // Check if we're on the relevant page for this website
            if (window.location.pathname.startsWith('/relevant-path')) {
                chrome.storage.sync.get(['website_element1', 'website_element2'], function (result) {
                    try {
                        const showElement1 = typeof result.website_element1 !== 'undefined' ? result.website_element1 : false
                        const showElement2 = typeof result.website_element2 !== 'undefined' ? result.website_element2 : false
                        toggleElement1(showElement1)
                        toggleElement2(showElement2)
                        console.log('[InnerPeace] Applied website settings:', { showElement1, showElement2 })
                    } catch (e) {
                        console.error('Error inside storage callback:', e)
                    }
                })
            } else {
                // Restore defaults on other pages
                toggleElement1(true)
                toggleElement2(true)
                console.log('[InnerPeace] Restored default website view.')
            }
        } catch (error) {
            console.error('Error in updateVisibility:', error)
        }
    }

    // Mutation Observer: watch for dynamic content
    let observer
    function setupObserver () {
        try {
            observer = new MutationObserver((mutations, obs) => {
                const element1Exists = document.querySelector('YOUR_SELECTOR_HERE')
                const element2Exists = document.querySelector('YOUR_SELECTOR_HERE')
                if (element1Exists || element2Exists) {
                    updateVisibility()
                    obs.disconnect()
                    observer = null
                    console.log('[InnerPeace] Website observer disconnected after applying settings.')
                }
            })

            observer.observe(document.body, { childList: true, subtree: true })
            console.log('[InnerPeace] Website observer set up.')
        } catch (err) {
            console.error('Error setting up website MutationObserver:', err)
        }
    }

    // Handler for URL changes
    function onLocationChange () {
        if (window.location.pathname.startsWith('/relevant-path')) {
            setupObserver()
        } else {
            updateVisibility()
            if (observer) {
                observer.disconnect()
                observer = null
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
            console.error('Error patching website history:', e)
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

    // Periodic fallback check
    const fallbackInterval = setInterval(() => {
        try {
            if (!chrome?.runtime?.id) {
                clearInterval(fallbackInterval)
                return
            }
            if (window.location.pathname.startsWith('/relevant-path')) {
                updateVisibility()
            }
        } catch (err) {
            console.error('Error in website fallback interval:', err)
            clearInterval(fallbackInterval)
        }
    }, 1500)

    // Listen for messages from popup
    try {
        chrome.runtime.onMessage.addListener((message) => {
            try {
                if (!window.location.pathname.startsWith('/relevant-path')) return
                if (message.action === 'website_toggleElement1') {
                    toggleElement1(message.value)
                } else if (message.action === 'website_toggleElement2') {
                    toggleElement2(message.value)
                }
            } catch (e) {
                console.error('Error in website message listener callback:', e)
            }
        })
    } catch (err) {
        console.error('Error setting up website message listener:', err)
    }

    console.log('[InnerPeace] Website content script loaded on:', window.location.pathname)
})()
