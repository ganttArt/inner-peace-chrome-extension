// YouTube Video Page Module
(function () {
    const VIDEO_RIGHT_PANEL_SELECTORS = [
        '#secondary.ytd-watch-flexy',
        '#secondary',
        '[id="secondary"]',
        'ytd-watch-flexy #secondary',
        '#secondary-inner',
        'ytd-watch-flexy #secondary-inner',
        '#related',
        'ytd-related-chips-renderer',
        'ytd-watch-next-secondary-results-renderer'
    ]

    const VIDEO_CONTENTS_SECTION_SELECTORS = [
        '#contents.ytd-item-section-renderer',
        '#contents',
        '[id="contents"]',
        'ytd-item-section-renderer #contents',
        'ytd-watch-next-secondary-results-renderer',
        'ytd-related-chips-renderer',
        '#related',
        '#secondary-inner',
        'ytd-watch-flexy #secondary-inner',
        'ytd-watch-flexy ytd-watch-next-secondary-results-renderer',
        'ytd-watch-flexy ytd-related-chips-renderer',
        'ytd-watch-flexy #related',
        'ytd-watch-flexy[theater] #secondary',
        'ytd-watch-flexy[fullscreen] #secondary',
        'ytd-watch-flexy[theater] #secondary-inner',
        'ytd-watch-flexy[fullscreen] #secondary-inner'
    ]

    const CLASS_BASED_SELECTORS = [
        '.ytd-watch-next-secondary-results-renderer',
        '.ytd-related-chips-renderer',
        '.ytd-watch-flexy #secondary',
        '.ytd-watch-flexy #secondary-inner',
        '.ytd-watch-flexy #related',
        '.ytd-watch-flexy #contents'
    ]

    function findVideoPageElements (selectors) {
        const elements = []
        for (const selector of selectors) {
            document.querySelectorAll(selector).forEach(el => elements.push(el))
        }
        return elements
    }

    function toggleVideoPageContent (visible) {
        // Hide/show right panel elements
        const rightPanelElements = findVideoPageElements(VIDEO_RIGHT_PANEL_SELECTORS)
        window.InnerPeaceUtils?.setDisplayMultiple(rightPanelElements, visible)

        // Hide/show contents section elements
        const contentsElements = findVideoPageElements(VIDEO_CONTENTS_SECTION_SELECTORS)
        window.InnerPeaceUtils?.setDisplayMultiple(contentsElements, visible)

        // Hide/show class-based elements
        const classElements = findVideoPageElements(CLASS_BASED_SELECTORS)
        window.InnerPeaceUtils?.setDisplayMultiple(classElements, visible)
    }

    function updateVideoPageVisibility () {
        try {
            if (!chrome?.runtime?.id) {
                return
            }
            chrome.storage.sync.get(['youtube_showRightPanel'], function (result) {
                try {
                    const showRightPanel = typeof result.youtube_showRightPanel !== 'undefined' ? result.youtube_showRightPanel : false
                    toggleVideoPageContent(showRightPanel)
                } catch (e) {
                    console.error('[InnerPeace] Error inside storage callback:', e)
                }
            })
        } catch (error) {
            console.error('[InnerPeace] Error in updateVideoPageVisibility:', error)
        }
    }

    function setupVideoPageObserver () {
        const observer = new MutationObserver((mutations, obs) => {
            const found = findVideoPageElements(VIDEO_RIGHT_PANEL_SELECTORS).length > 0 ||
                findVideoPageElements(VIDEO_CONTENTS_SECTION_SELECTORS).length > 0
            if (found) {
                updateVideoPageVisibility()
                obs.disconnect()
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })
    }

    function immediateVideoPageCheck () {
        setTimeout(() => {
            const found = findVideoPageElements(VIDEO_RIGHT_PANEL_SELECTORS).length > 0 ||
                findVideoPageElements(VIDEO_CONTENTS_SECTION_SELECTORS).length > 0
            if (found) {
                updateVideoPageVisibility()
            }
        }, 1000)
    }

    function periodicVideoPageCheck () {
        const interval = setInterval(() => {
            try {
                if (!chrome?.runtime?.id) {
                    clearInterval(interval)
                    return
                }
                updateVideoPageVisibility()
            } catch (err) {
                clearInterval(interval)
            }
        }, 2000)
    }

    function aggressiveVideoPageCheck () {
        const interval = setInterval(() => {
            try {
                if (!chrome?.runtime?.id) {
                    clearInterval(interval)
                    return
                }
                chrome.storage.sync.get(['youtube_showRightPanel'], function (result) {
                    try {
                        const showRightPanel = typeof result.youtube_showRightPanel !== 'undefined' ? result.youtube_showRightPanel : false
                        if (!showRightPanel) {
                            toggleVideoPageContent(false)
                        }
                    } catch (e) {
                        // ignore
                    }
                })
            } catch (err) {
                clearInterval(interval)
            }
        }, 3000)
    }

    function setupVideoPageResizeListener () {
        let resizeTimeout
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => {
                updateVideoPageVisibility()
            }, 250)
        })
    }

    // Export to global YouTube object
    window.YouTubeVideoPage = {
        toggleVideoPageContent,
        updateVideoPageVisibility,
        setupVideoPageObserver,
        immediateVideoPageCheck,
        periodicVideoPageCheck,
        aggressiveVideoPageCheck,
        setupVideoPageResizeListener
    }
})()
