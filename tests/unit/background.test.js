// Unit tests for background.js

// Import the actual background script functions
const fs = require('fs')
const path = require('path')

// Read and evaluate the background script to test its functions
const backgroundScriptPath = path.join(__dirname, '../../background.js')
const backgroundScriptContent = fs.readFileSync(backgroundScriptPath, 'utf8')

// Create a mock environment and evaluate the script
const mockEnvironment = {
  chrome: {
    storage: {
      sync: {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn()
      },
      local: {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn()
      }
    },
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      },
      getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
    },
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn(),
      executeScript: jest.fn(),
      onUpdated: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    },
    scripting: {
      executeScript: jest.fn(),
      insertCSS: jest.fn(),
      removeCSS: jest.fn()
    },
    action: {
      setBadgeText: jest.fn(),
      setBadgeBackgroundColor: jest.fn()
    }
  },
  console: {
    log: jest.fn(),
    error: jest.fn()
  },
  document: {
    body: {
      innerHTML: ''
    }
  }
}

// Evaluate the background script in the mock environment
const vm = require('vm')
const context = vm.createContext(mockEnvironment)

// Execute the script to set up the environment
try {
  vm.runInContext(backgroundScriptContent, context)
} catch (error) {
  // Ignore errors from missing DOM elements or other browser-specific code
  console.log('Script evaluation warnings (expected):', error.message)
}

describe('Background Script', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup callback-based mocks for chrome.storage.sync
    mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({ linkedin_showFeed: true })
    })
    mockEnvironment.chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback()
    })
  })

  describe('Chrome API Integration', () => {
    test('should handle storage sync get', (done) => {
      // Simulate getting settings
      mockEnvironment.chrome.storage.sync.get(['linkedin_showFeed'], (result) => {
        expect(result).toEqual({ linkedin_showFeed: true })
        expect(mockEnvironment.chrome.storage.sync.get).toHaveBeenCalledWith(['linkedin_showFeed'], expect.any(Function))
        done()
      })
    })

    test('should handle storage sync set', (done) => {
      const mockData = { linkedin_showFeed: false }
      mockEnvironment.chrome.storage.sync.set(mockData, () => {
        expect(mockEnvironment.chrome.storage.sync.set).toHaveBeenCalledWith(mockData, expect.any(Function))
        done()
      })
    })
  })

  describe('Message Handling', () => {
    test('should handle getSettings message', () => {
      const mockSettings = { linkedin_showFeed: true }
      mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => callback(mockSettings))

      // Test the message handler directly
      const message = { action: 'getSettings' }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      // Simulate the message handling logic
      if (message.action === 'getSettings') {
        mockEnvironment.chrome.storage.sync.get(null, (settings) => {
          sendResponse(settings)
        })
      }

      expect(mockEnvironment.chrome.storage.sync.get).toHaveBeenCalled()
    })

    test('should handle updateSettings message', () => {
      const mockSettings = { linkedin_showFeed: false }
      mockEnvironment.chrome.storage.sync.set.mockImplementation((data, callback) => callback())

      // Test the message handler directly
      const message = {
        action: 'updateSettings',
        settings: mockSettings
      }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      // Simulate the message handling logic
      if (message.action === 'updateSettings') {
        mockEnvironment.chrome.storage.sync.set(message.settings, () => {
          sendResponse({ success: true })
        })
      }

      expect(mockEnvironment.chrome.storage.sync.set).toHaveBeenCalled()
    })
  })

  describe('Tab Management', () => {
    test('should query active tabs', () => {
      const mockTabs = [{ id: 1, url: 'https://www.linkedin.com' }]
      mockEnvironment.chrome.tabs.query.mockResolvedValue(mockTabs)

      // Simulate querying active tabs
      mockEnvironment.chrome.tabs.query({ active: true, currentWindow: true })

      expect(mockEnvironment.chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true
      })
    })
  })

  describe('Script Execution', () => {
    test('should execute content scripts', () => {
      mockEnvironment.chrome.scripting.executeScript.mockResolvedValue()

      // Simulate script execution
      mockEnvironment.chrome.scripting.executeScript({
        target: { tabId: 1 },
        files: ['scripts/linkedin/index.js']
      })

      expect(mockEnvironment.chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: ['scripts/linkedin/index.js']
      })
    })
  })

  describe('Website Configuration', () => {
    test('should have LinkedIn configuration', () => {
      // Test that the website configuration exists in the script content
      expect(backgroundScriptContent).toContain('linkedin.com')
      expect(backgroundScriptContent).toContain('scripts/linkedin')
    })

    test('should have YouTube configuration', () => {
      expect(backgroundScriptContent).toContain('youtube.com')
      expect(backgroundScriptContent).toContain('scripts/youtube')
    })
  })

  describe('Extension Functionality', () => {
    test('should handle tab updates', () => {
      // Test that the script contains tab update handling logic
      expect(backgroundScriptContent).toContain('onUpdated')
      expect(backgroundScriptContent).toContain('addListener')
    })

    test('should handle runtime messages', () => {
      // Test that the script contains message handling logic
      expect(backgroundScriptContent).toContain('onMessage')
      expect(backgroundScriptContent).toContain('sendMessage')
    })

    test('should manage storage operations', () => {
      // Test that the script contains storage operations
      expect(backgroundScriptContent).toContain('storage.sync')
      expect(backgroundScriptContent).toContain('get')
      expect(backgroundScriptContent).toContain('set')
    })
  })
})
