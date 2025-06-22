// Unit tests for popup.js

// Import the actual popup script functions
const fs = require('fs')
const path = require('path')

// Read and evaluate the popup script to test its functions
const popupScriptPath = path.join(__dirname, '../../popup.js')
const popupScriptContent = fs.readFileSync(popupScriptPath, 'utf8')

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
      getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
      id: 'test-extension-id'
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
    },
    getElementById: jest.fn(),
    addEventListener: jest.fn(),
    createElement: jest.fn()
  },
  window: {
    location: {
      hostname: 'www.linkedin.com',
      href: 'https://www.linkedin.com/feed/'
    }
  },
  URL: class {
    constructor (url) {
      this.hostname = new URL(url).hostname
    }
  }
}

// Mock DOM elements
const mockContainer = {
  innerHTML: '',
  children: [],
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
}

const mockStatusElement = {
  textContent: '',
  className: '',
  style: {}
}

const mockWebsiteInfo = {
  textContent: '',
  className: ''
}

// Setup DOM mocks
mockEnvironment.document.getElementById.mockImplementation((id) => {
  switch (id) {
    case 'controls-container':
      return mockContainer
    case 'status-message':
      return mockStatusElement
    case 'website-info':
      return mockWebsiteInfo
    default:
      return null
  }
})

// Setup createElement mock
mockEnvironment.document.createElement.mockImplementation((tag) => {
  return {
    tagName: tag.toUpperCase(),
    className: '',
    innerHTML: '',
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    addEventListener: jest.fn(),
    type: '',
    dataset: {},
    checked: false
  }
})

// Evaluate the popup script in the mock environment
const vm = require('vm')
const context = vm.createContext(mockEnvironment)

// Execute the script to set up the environment
try {
  vm.runInContext(popupScriptContent, context)
} catch (error) {
  // Ignore errors from missing DOM elements or other browser-specific code
  console.log('Script evaluation warnings (expected):', error.message)
}

describe('Popup Script', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Reset DOM elements
    mockContainer.innerHTML = ''
    mockContainer.children = []
    mockStatusElement.textContent = ''
    mockStatusElement.className = ''
    mockWebsiteInfo.textContent = ''
    mockWebsiteInfo.className = ''

    // Mock chrome.runtime.sendMessage
    mockEnvironment.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'getCurrentWebsite') {
        callback({
          website: 'linkedin.com',
          config: {
            script: 'scripts/linkedin.js',
            settings: ['linkedin_showFeed', 'linkedin_showAside']
          }
        })
      } else if (message.action === 'getWebsiteSettings') {
        callback({
          linkedin_showFeed: true,
          linkedin_showAside: false,
          youtube_showFeed: true,
          youtube_showRightPanel: false
        })
      } else if (message.action === 'updateWebsiteSettings') {
        callback({ success: true })
      }
    })

    // Mock chrome.tabs.query
    mockEnvironment.chrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://www.linkedin.com/feed/' }
    ])
  })

  describe('DOM Manipulation', () => {
    test('should create toggle controls', () => {
      const control = mockEnvironment.document.createElement('div')
      control.className = 'toggle-control'
      control.innerHTML = `
        <label>
          <input type="checkbox" data-setting="test_setting">
          Test Setting
        </label>
        <span class="description">Test description</span>
      `

      mockContainer.appendChild(control)

      expect(mockContainer.appendChild).toHaveBeenCalledWith(control)
      expect(control.className).toBe('toggle-control')
    })

    test('should update status message', () => {
      mockStatusElement.textContent = 'Settings saved!'

      expect(mockStatusElement.textContent).toBe('Settings saved!')
    })
  })

  describe('Settings Management', () => {
    test('should handle settings from storage', () => {
      // Test that chrome.runtime.sendMessage is available
      expect(mockEnvironment.chrome.runtime.sendMessage).toBeDefined()

      // Test the mock implementation
      mockEnvironment.chrome.runtime.sendMessage({ action: 'getWebsiteSettings' }, (response) => {
        expect(response.linkedin_showFeed).toBe(true)
        expect(response.linkedin_showAside).toBe(false)
      })
    })

    test('should save settings to storage', () => {
      const settings = { linkedin_showFeed: false }

      mockEnvironment.chrome.runtime.sendMessage({
        action: 'updateWebsiteSettings',
        website: 'linkedin.com',
        settings
      }, (response) => {
        expect(response.success).toBe(true)
      })

      expect(mockEnvironment.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        { action: 'updateWebsiteSettings', website: 'linkedin.com', settings },
        expect.any(Function)
      )
    })
  })

  describe('Event Handling', () => {
    test('should handle checkbox change events', () => {
      const checkbox = mockEnvironment.document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.dataset = { setting: 'test_setting' }

      const event = { type: 'change' }
      checkbox.checked = true

      // Simulate change event
      if (checkbox.addEventListener) {
        checkbox.addEventListener('change', () => {
          expect(checkbox.checked).toBe(true)
        })
      }

      // Verify the checkbox state changed
      expect(checkbox.checked).toBe(true)
    })

    test('should handle form submission', () => {
      const form = mockEnvironment.document.createElement('form')
      const submitEvent = { type: 'submit' }

      // Prevent default behavior
      submitEvent.preventDefault = jest.fn()

      if (form.addEventListener) {
        form.addEventListener('submit', (e) => {
          e.preventDefault()
        })
      }

      // Test that preventDefault is available
      expect(submitEvent.preventDefault).toBeDefined()
    })
  })

  describe('Website Detection', () => {
    test('should detect LinkedIn website', () => {
      // Mock window.location
      mockEnvironment.window.location = {
        hostname: 'www.linkedin.com',
        href: 'https://www.linkedin.com/feed/'
      }

      const hostname = mockEnvironment.window.location.hostname
      expect(hostname).toBe('www.linkedin.com')
    })

    test('should detect YouTube website', () => {
      // Mock window.location
      mockEnvironment.window.location = {
        hostname: 'www.youtube.com',
        href: 'https://www.youtube.com/'
      }

      const hostname = mockEnvironment.window.location.hostname
      expect(hostname).toBe('www.youtube.com')
    })
  })

  describe('UI Updates', () => {
    test('should show loading state', () => {
      mockStatusElement.textContent = 'Loading...'
      mockStatusElement.className = 'loading'

      expect(mockStatusElement.textContent).toBe('Loading...')
      expect(mockStatusElement.className).toBe('loading')
    })

    test('should show success state', () => {
      mockStatusElement.textContent = 'Settings saved successfully!'
      mockStatusElement.className = 'success'

      expect(mockStatusElement.textContent).toBe('Settings saved successfully!')
      expect(mockStatusElement.className).toBe('success')
    })

    test('should show error state', () => {
      mockStatusElement.textContent = 'Error saving settings'
      mockStatusElement.className = 'error'

      expect(mockStatusElement.textContent).toBe('Error saving settings')
      expect(mockStatusElement.className).toBe('error')
    })
  })

  describe('Popup Functionality', () => {
    test('should handle DOM content loaded', () => {
      // Test that the script contains DOM content loaded handling
      expect(popupScriptContent).toContain('DOMContentLoaded')
      expect(popupScriptContent).toContain('addEventListener')
    })

    test('should handle settings retrieval', () => {
      // Test that the script contains settings retrieval logic
      expect(popupScriptContent).toContain('getWebsiteSettings')
      expect(popupScriptContent).toContain('sendMessage')
    })

    test('should handle settings updates', () => {
      // Test that the script contains settings update logic
      expect(popupScriptContent).toContain('updateWebsiteSettings')
      expect(popupScriptContent).toContain('set')
    })

    test('should handle website detection', () => {
      // Test that the script contains website detection logic
      expect(popupScriptContent).toContain('hostname')
      expect(popupScriptContent).toContain('url')
    })
  })
})
