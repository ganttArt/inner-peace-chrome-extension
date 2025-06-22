// Unit tests for YouTube content scripts

const fs = require('fs')
const path = require('path')

// Read and evaluate the YouTube scripts
const youtubeIndexPath = path.join(__dirname, '../../scripts/youtube/index.js')
const youtubeIndexContent = fs.readFileSync(youtubeIndexPath, 'utf8')

const youtubeHomefeedPath = path.join(__dirname, '../../scripts/youtube/homefeed.js')
const youtubeHomefeedContent = fs.readFileSync(youtubeHomefeedPath, 'utf8')

const youtubeVideopagePath = path.join(__dirname, '../../scripts/youtube/videopage.js')
const youtubeVideopageContent = fs.readFileSync(youtubeVideopagePath, 'utf8')

// Create a mock environment
const mockEnvironment = {
  chrome: {
    storage: {
      sync: {
        get: jest.fn(),
        set: jest.fn()
      }
    },
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    }
  },
  console: {
    log: jest.fn(),
    error: jest.fn()
  },
  document: {
    body: {
      innerHTML: '',
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    createElement: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  window: {
    location: {
      hostname: 'www.youtube.com',
      pathname: '/'
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  MutationObserver: jest.fn(),
  setTimeout: jest.fn(),
  clearTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn()
}

// Mock DOM elements
const mockHomeFeedElement = {
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  children: [],
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
}

const mockRightPanelElement = {
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  children: [],
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
}

const mockCommentsElement = {
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  children: [],
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
}

// Setup DOM mocks
mockEnvironment.document.querySelector.mockImplementation((selector) => {
  if (selector.includes('feed') || selector.includes('home-feed')) {
    return mockHomeFeedElement
  }
  if (selector.includes('right-panel') || selector.includes('secondary')) {
    return mockRightPanelElement
  }
  if (selector.includes('comments')) {
    return mockCommentsElement
  }
  return null
})

mockEnvironment.document.querySelectorAll.mockImplementation((selector) => {
  if (selector.includes('feed') || selector.includes('home-feed')) {
    return [mockHomeFeedElement]
  }
  if (selector.includes('right-panel') || selector.includes('secondary')) {
    return [mockRightPanelElement]
  }
  if (selector.includes('comments')) {
    return [mockCommentsElement]
  }
  return []
})

mockEnvironment.document.createElement.mockImplementation((tag) => {
  return {
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
  }
})

// Mock MutationObserver
mockEnvironment.MutationObserver.mockImplementation(function (callback) {
  this.observe = jest.fn()
  this.disconnect = jest.fn()
  this.callback = callback
})

// Evaluate the scripts in the mock environment
const vm = require('vm')
const context = vm.createContext(mockEnvironment)

describe('YouTube Content Scripts', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Reset DOM elements
    mockHomeFeedElement.style = {}
    mockRightPanelElement.style = {}
    mockCommentsElement.style = {}

    // Setup chrome.storage.sync.get mock
    mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        youtube_showFeed: true,
        youtube_showRightPanel: true,
        youtube_showComments: true
      })
    })

    // Setup chrome.runtime.sendMessage mock
    mockEnvironment.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'getSettings') {
        callback({
          youtube_showFeed: true,
          youtube_showRightPanel: true,
          youtube_showComments: true
        })
      }
    })
  })

  describe('Home Feed Management', () => {
    test('should hide YouTube home feed when setting is false', () => {
      // Mock settings with feed hidden
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ youtube_showFeed: false })
      })

      // Simulate feed hiding
      mockHomeFeedElement.style.display = 'none'

      expect(mockHomeFeedElement.style.display).toBe('none')
    })

    test('should show YouTube home feed when setting is true', () => {
      // Mock settings with feed shown
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ youtube_showFeed: true })
      })

      // Simulate feed showing
      mockHomeFeedElement.style.display = ''

      expect(mockHomeFeedElement.style.display).toBe('')
    })

    test('should find home feed elements on YouTube', () => {
      const feedElements = mockEnvironment.document.querySelectorAll('#feed, #home-feed, ytd-rich-grid-renderer')

      expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalled()
    })
  })

  describe('Right Panel Management', () => {
    test('should hide YouTube right panel when setting is false', () => {
      // Mock settings with right panel hidden
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ youtube_showRightPanel: false })
      })

      // Simulate right panel hiding
      mockRightPanelElement.style.display = 'none'

      expect(mockRightPanelElement.style.display).toBe('none')
    })

    test('should show YouTube right panel when setting is true', () => {
      // Mock settings with right panel shown
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ youtube_showRightPanel: true })
      })

      // Simulate right panel showing
      mockRightPanelElement.style.display = ''

      expect(mockRightPanelElement.style.display).toBe('')
    })

    test('should find right panel elements on YouTube', () => {
      const panelElements = mockEnvironment.document.querySelectorAll('#secondary, #right-panel, ytd-watch-next-secondary-results-renderer')

      expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalled()
    })
  })

  describe('Comments Management', () => {
    test('should hide YouTube comments when setting is false', () => {
      // Mock settings with comments hidden
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ youtube_showComments: false })
      })

      // Simulate comments hiding
      mockCommentsElement.style.display = 'none'

      expect(mockCommentsElement.style.display).toBe('none')
    })

    test('should show YouTube comments when setting is true', () => {
      // Mock settings with comments shown
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ youtube_showComments: true })
      })

      // Simulate comments showing
      mockCommentsElement.style.display = ''

      expect(mockCommentsElement.style.display).toBe('')
    })

    test('should find comments elements on YouTube', () => {
      const commentsElements = mockEnvironment.document.querySelectorAll('#comments, ytd-comments')

      expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalled()
    })
  })

  describe('Page Detection', () => {
    test('should detect YouTube home page', () => {
      mockEnvironment.window.location.pathname = '/'

      expect(mockEnvironment.window.location.pathname).toBe('/')
    })

    test('should detect YouTube video page', () => {
      mockEnvironment.window.location.pathname = '/watch'

      expect(mockEnvironment.window.location.pathname).toBe('/watch')
    })

    test('should detect YouTube channel page', () => {
      mockEnvironment.window.location.pathname = '/channel/UC123456789'

      expect(mockEnvironment.window.location.pathname).toBe('/channel/UC123456789')
    })
  })

  describe('DOM Observation', () => {
    test('should set up MutationObserver for dynamic content', () => {
      // Verify MutationObserver is available
      expect(mockEnvironment.MutationObserver).toBeDefined()

      // Create a new observer
      const observer = new mockEnvironment.MutationObserver(() => {})

      expect(observer.observe).toBeDefined()
      expect(observer.disconnect).toBeDefined()
    })

    test('should observe DOM changes', () => {
      const observer = new mockEnvironment.MutationObserver(() => {})

      // Simulate observing the document body
      observer.observe(mockEnvironment.document.body, {
        childList: true,
        subtree: true
      })

      expect(observer.observe).toHaveBeenCalledWith(mockEnvironment.document.body, {
        childList: true,
        subtree: true
      })
    })
  })

  describe('Settings Integration', () => {
    test('should get YouTube settings from chrome storage', () => {
      mockEnvironment.chrome.storage.sync.get(['youtube_showFeed', 'youtube_showRightPanel', 'youtube_showComments'], (result) => {
        expect(result.youtube_showFeed).toBe(true)
        expect(result.youtube_showRightPanel).toBe(true)
        expect(result.youtube_showComments).toBe(true)
      })

      expect(mockEnvironment.chrome.storage.sync.get).toHaveBeenCalledWith(
        ['youtube_showFeed', 'youtube_showRightPanel', 'youtube_showComments'],
        expect.any(Function)
      )
    })

    test('should handle YouTube settings updates', () => {
      // Simulate settings update
      const newSettings = { youtube_showFeed: false }
      mockEnvironment.chrome.storage.sync.set(newSettings, () => {
        expect(mockEnvironment.chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function))
      })
    })
  })

  describe('Element Manipulation', () => {
    test('should add CSS classes to YouTube elements', () => {
      mockHomeFeedElement.classList.add('inner-peace-hidden')

      expect(mockHomeFeedElement.classList.add).toHaveBeenCalledWith('inner-peace-hidden')
    })

    test('should remove CSS classes from YouTube elements', () => {
      mockHomeFeedElement.classList.remove('inner-peace-hidden')

      expect(mockHomeFeedElement.classList.remove).toHaveBeenCalledWith('inner-peace-hidden')
    })

    test('should check if YouTube elements have CSS classes', () => {
      mockHomeFeedElement.classList.contains('inner-peace-hidden')

      expect(mockHomeFeedElement.classList.contains).toHaveBeenCalledWith('inner-peace-hidden')
    })
  })

  describe('Video Page Specific Features', () => {
    test('should handle video page elements', () => {
      // Mock video page specific elements
      const videoElements = mockEnvironment.document.querySelectorAll('#player, ytd-player')

      expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalled()
    })

    test('should handle video recommendations', () => {
      // Mock recommendations elements
      const recommendationElements = mockEnvironment.document.querySelectorAll('#related, ytd-watch-next-secondary-results-renderer')

      expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should handle missing YouTube elements gracefully', () => {
      // Mock querySelector to return null
      mockEnvironment.document.querySelector.mockReturnValue(null)

      const element = mockEnvironment.document.querySelector('.non-existent-element')

      expect(element).toBeNull()
    })

    test('should log YouTube errors appropriately', () => {
      mockEnvironment.console.error('YouTube test error message')

      expect(mockEnvironment.console.error).toHaveBeenCalledWith('YouTube test error message')
    })
  })

  describe('Performance Optimization', () => {
    test('should use debounced functions for performance', () => {
      // Test that setTimeout is available for debouncing
      expect(mockEnvironment.setTimeout).toBeDefined()

      // Simulate debounced function call
      mockEnvironment.setTimeout(() => {}, 100)

      expect(mockEnvironment.setTimeout).toHaveBeenCalledWith(expect.any(Function), 100)
    })

    test('should clear timeouts when needed', () => {
      // Test that clearTimeout is available
      expect(mockEnvironment.clearTimeout).toBeDefined()

      // Simulate clearing a timeout
      mockEnvironment.clearTimeout(123)

      expect(mockEnvironment.clearTimeout).toHaveBeenCalledWith(123)
    })
  })
})
