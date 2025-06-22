// YouTube Home Feed Module
(function () {
  const HOME_FEED_SELECTORS = [
    '#contents.ytd-rich-grid-renderer',
    '#contents',
    '[id="contents"]',
    'ytd-rich-grid-renderer',
    '#page-manager ytd-rich-grid-renderer'
  ]

  function findHomeFeedElements () {
    const elements = []
    for (const selector of HOME_FEED_SELECTORS) {
      document.querySelectorAll(selector).forEach(el => elements.push(el))
    }
    return elements
  }

  function toggleHomeFeed (visible) {
    const elements = findHomeFeedElements()
    if (elements.length > 0) {
      elements.forEach(element => {
        element.style.display = visible ? '' : 'none'
      })
    } else {
      console.error('[InnerPeace] Home feed element not found with any selector')
    }
  }

  function updateHomeFeedVisibility () {
    try {
      if (!chrome?.runtime?.id) {
        console.error('[InnerPeace] Chrome runtime not available')
        return
      }
    } catch (err) {
      console.error('[InnerPeace] Chrome runtime unavailable:', err)
      return
    }
    try {
      chrome.storage.sync.get(['youtube_showFeed'], function (result) {
        try {
          const showFeed = typeof result.youtube_showFeed !== 'undefined' ? result.youtube_showFeed : false
          toggleHomeFeed(showFeed)
        } catch (e) {
          console.error('[InnerPeace] Error inside storage callback:', e)
        }
      })
    } catch (error) {
      console.error('[InnerPeace] Error in updateHomeFeedVisibility:', error)
    }
  }

  function setupHomeFeedObserver () {
    const observer = new MutationObserver((mutations, obs) => {
      const found = findHomeFeedElements().length > 0
      if (found) {
        updateHomeFeedVisibility()
        obs.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  function immediateHomeFeedCheck () {
    setTimeout(() => {
      if (findHomeFeedElements().length > 0) {
        updateHomeFeedVisibility()
      }
    }, 1000)
  }

  function periodicHomeFeedCheck () {
    const interval = setInterval(() => {
      try {
        if (!chrome?.runtime?.id) {
          clearInterval(interval)
          return
        }
        updateHomeFeedVisibility()
      } catch (err) {
        clearInterval(interval)
      }
    }, 2000)
  }

  // Export to global YouTube object
  window.YouTubeHomeFeed = {
    toggleHomeFeed,
    updateHomeFeedVisibility,
    setupHomeFeedObserver,
    immediateHomeFeedCheck,
    periodicHomeFeedCheck
  }
})()
