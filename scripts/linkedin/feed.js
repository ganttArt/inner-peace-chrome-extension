// LinkedIn Feed Module
(function () {
  function toggleFeedVisibility (visible) {
    const feed =
            document.querySelector('[data-id="feed-container"]') ||
            document.querySelector('.scaffold-finite-scroll')
    if (feed) {
      feed.style.display = visible ? '' : 'none'
    }
  }

  function updateFeedVisibility () {
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

  function setupFeedObserver () {
    try {
      const observer = new MutationObserver((mutations, obs) => {
        const feedExists = document.querySelector('[data-id="feed-container"]') ||
                    document.querySelector('.scaffold-finite-scroll')
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

  function immediateFeedCheck () {
    setTimeout(() => {
      const feedExists = document.querySelector('[data-id="feed-container"]') ||
                document.querySelector('.scaffold-finite-scroll')
      if (feedExists) {
        updateFeedVisibility()
      }
    }, 1000)
  }

  function periodicFeedCheck () {
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
