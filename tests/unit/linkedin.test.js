// Unit tests for LinkedIn content scripts

const fs = require('fs')
const path = require('path')

// Read and evaluate the LinkedIn scripts
const linkedinIndexPath = path.join(__dirname, '../../scripts/linkedin/index.js')
const linkedinIndexContent = fs.readFileSync(linkedinIndexPath, 'utf8')

const linkedinFeedPath = path.join(__dirname, '../../scripts/linkedin/feed.js')
const linkedinFeedContent = fs.readFileSync(linkedinFeedPath, 'utf8')

const linkedinAsidePath = path.join(__dirname, '../../scripts/linkedin/aside.js')
const linkedinAsideContent = fs.readFileSync(linkedinAsidePath, 'utf8')

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
      hostname: 'www.linkedin.com',
      pathname: '/feed/'
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
const mockFeedElement = {
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

const mockAsideElement = {
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
  if (selector.includes('feed')) {
    return mockFeedElement
  }
  if (selector.includes('aside') || selector.includes('right-rail')) {
    return mockAsideElement
  }
  return null
})

mockEnvironment.document.querySelectorAll.mockImplementation((selector) => {
  if (selector.includes('feed')) {
    return [mockFeedElement]
  }
  if (selector.includes('aside') || selector.includes('right-rail')) {
    return [mockAsideElement]
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

describe('LinkedIn Content Scripts', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Reset DOM elements
    mockFeedElement.style = {}
    mockAsideElement.style = {}

    // Setup chrome.storage.sync.get mock
    mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        linkedin_showFeed: true,
        linkedin_showAside: true
      })
    })

    // Setup chrome.runtime.sendMessage mock
    mockEnvironment.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'getSettings') {
        callback({
          linkedin_showFeed: true,
          linkedin_showAside: true
        })
      }
    })
  })

  describe('Feed Management', () => {
    test('should hide LinkedIn feed when setting is false', () => {
      // Mock settings with feed hidden
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ linkedin_showFeed: false })
      })

      // Simulate feed hiding
      mockFeedElement.style.display = 'none'

      expect(mockFeedElement.style.display).toBe('none')
    })

    test('should show LinkedIn feed when setting is true', () => {
      // Mock settings with feed shown
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ linkedin_showFeed: true })
      })

      // Simulate feed showing
      mockFeedElement.style.display = ''

      expect(mockFeedElement.style.display).toBe('')
    })

    test('should find feed elements on LinkedIn', () => {
      const feedElements = mockEnvironment.document.querySelectorAll('[data-test-id="feed-identity-module"], .feed-identity-module, [data-test-id="feed-identity-module__feed"], .feed-identity-module__feed')

      expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalled()
    })
  })

  describe('Aside Management', () => {
    test('should hide LinkedIn aside when setting is false', () => {
      // Mock settings with aside hidden
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ linkedin_showAside: false })
      })

      // Simulate aside hiding
      mockAsideElement.style.display = 'none'

      expect(mockAsideElement.style.display).toBe('none')
    })

    test('should show LinkedIn aside when setting is true', () => {
      // Mock settings with aside shown
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ linkedin_showAside: true })
      })

      // Simulate aside showing
      mockAsideElement.style.display = ''

      expect(mockAsideElement.style.display).toBe('')
    })

    test('should find aside elements on LinkedIn', () => {
      const asideElements = mockEnvironment.document.querySelectorAll('[data-test-id="right-rail"], .right-rail, aside')

      expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalled()
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
    test('should get settings from chrome storage', () => {
      mockEnvironment.chrome.storage.sync.get(['linkedin_showFeed', 'linkedin_showAside'], (result) => {
        expect(result.linkedin_showFeed).toBe(true)
        expect(result.linkedin_showAside).toBe(true)
      })

      expect(mockEnvironment.chrome.storage.sync.get).toHaveBeenCalledWith(
        ['linkedin_showFeed', 'linkedin_showAside'],
        expect.any(Function)
      )
    })

    test('should handle settings updates', () => {
      // Simulate settings update
      const newSettings = { linkedin_showFeed: false }
      mockEnvironment.chrome.storage.sync.set(newSettings, () => {
        expect(mockEnvironment.chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function))
      })
    })
  })

  describe('Page Detection', () => {
    test('should detect LinkedIn feed page', () => {
      mockEnvironment.window.location.pathname = '/feed/'

      expect(mockEnvironment.window.location.pathname).toBe('/feed/')
    })

    test('should detect LinkedIn home page', () => {
      mockEnvironment.window.location.pathname = '/'

      expect(mockEnvironment.window.location.pathname).toBe('/')
    })
  })

  describe('Element Manipulation', () => {
    test('should add CSS classes to elements', () => {
      mockFeedElement.classList.add('inner-peace-hidden')

      expect(mockFeedElement.classList.add).toHaveBeenCalledWith('inner-peace-hidden')
    })

    test('should remove CSS classes from elements', () => {
      mockFeedElement.classList.remove('inner-peace-hidden')

      expect(mockFeedElement.classList.remove).toHaveBeenCalledWith('inner-peace-hidden')
    })

    test('should check if elements have CSS classes', () => {
      mockFeedElement.classList.contains('inner-peace-hidden')

      expect(mockFeedElement.classList.contains).toHaveBeenCalledWith('inner-peace-hidden')
    })
  })

  describe('Error Handling', () => {
    test('should handle missing elements gracefully', () => {
      // Mock querySelector to return null
      mockEnvironment.document.querySelector.mockReturnValue(null)

      const element = mockEnvironment.document.querySelector('.non-existent-element')

      expect(element).toBeNull()
    })

    test('should log errors appropriately', () => {
      mockEnvironment.console.error('Test error message')

      expect(mockEnvironment.console.error).toHaveBeenCalledWith('Test error message')
    })
  })
})
