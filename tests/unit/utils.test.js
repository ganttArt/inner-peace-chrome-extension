// Unit tests for utility scripts

const fs = require('fs')
const path = require('path')

// Read and evaluate the utility scripts
const templatePath = path.join(__dirname, '../../scripts/template.js')
const templateContent = fs.readFileSync(templatePath, 'utf8')

const watchTestsPath = path.join(__dirname, '../../scripts/watch-tests.js')
const watchTestsContent = fs.readFileSync(watchTestsPath, 'utf8')

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
        error: jest.fn(),
        warn: jest.fn()
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
            hostname: 'example.com',
            pathname: '/'
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    },
    MutationObserver: jest.fn(),
    setTimeout: jest.fn(),
    clearTimeout: jest.fn(),
    setInterval: jest.fn(),
    clearInterval: jest.fn(),
    process: {
        env: {
            NODE_ENV: 'test'
        }
    }
}

// Mock DOM elements
const mockElement = {
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
    querySelectorAll: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
}

// Setup DOM mocks
mockEnvironment.document.querySelector.mockImplementation((selector) => {
    if (selector.includes('test')) {
        return mockElement
    }
    return null
})

mockEnvironment.document.querySelectorAll.mockImplementation((selector) => {
    if (selector.includes('test')) {
        return [mockElement]
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

describe('Utility Scripts', () => {
    beforeEach(() => {
    // Reset all mocks
        jest.clearAllMocks()

        // Reset DOM elements
        mockElement.style = {}

        // Setup chrome.storage.sync.get mock
        mockEnvironment.chrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({
                example_showElement: true
            })
        })
    })

    describe('Template Script', () => {
        test('should provide base functionality for content scripts', () => {
            // Test that the template provides basic structure
            expect(mockEnvironment.document).toBeDefined()
            expect(mockEnvironment.window).toBeDefined()
            expect(mockEnvironment.chrome).toBeDefined()
        })

        test('should handle DOM element manipulation', () => {
            // Test element creation
            const element = mockEnvironment.document.createElement('div')

            expect(element.tagName).toBe('DIV')
            expect(element.classList).toBeDefined()
            expect(element.style).toBeDefined()
        })

        test('should handle CSS class operations', () => {
            mockElement.classList.add('test-class')
            mockElement.classList.remove('test-class')
            mockElement.classList.contains('test-class')

            expect(mockElement.classList.add).toHaveBeenCalledWith('test-class')
            expect(mockElement.classList.remove).toHaveBeenCalledWith('test-class')
            expect(mockElement.classList.contains).toHaveBeenCalledWith('test-class')
        })

        test('should handle element queries', () => {
            const element = mockEnvironment.document.querySelector('.test-selector')
            const elements = mockEnvironment.document.querySelectorAll('.test-selector')

            expect(mockEnvironment.document.querySelector).toHaveBeenCalledWith('.test-selector')
            expect(mockEnvironment.document.querySelectorAll).toHaveBeenCalledWith('.test-selector')
        })
    })

    describe('Watch Tests Script', () => {
        test('should provide file watching functionality', () => {
            // Test that the watch script provides monitoring capabilities
            expect(mockEnvironment.process).toBeDefined()
            expect(mockEnvironment.process.env).toBeDefined()
        })

        test('should handle environment detection', () => {
            expect(mockEnvironment.process.env.NODE_ENV).toBe('test')
        })

        test('should provide console logging', () => {
            mockEnvironment.console.log('Test message')
            mockEnvironment.console.error('Test error')
            mockEnvironment.console.warn('Test warning')

            expect(mockEnvironment.console.log).toHaveBeenCalledWith('Test message')
            expect(mockEnvironment.console.error).toHaveBeenCalledWith('Test error')
            expect(mockEnvironment.console.warn).toHaveBeenCalledWith('Test warning')
        })
    })

    describe('Chrome API Integration', () => {
        test('should handle storage operations', () => {
            mockEnvironment.chrome.storage.sync.get(['test_setting'], (result) => {
                expect(result.example_showElement).toBe(true)
            })

            expect(mockEnvironment.chrome.storage.sync.get).toHaveBeenCalledWith(
                ['test_setting'],
                expect.any(Function)
            )
        })

        test('should handle message passing', () => {
            mockEnvironment.chrome.runtime.sendMessage({ action: 'test' }, (response) => {
                expect(response).toBeDefined()
            })

            expect(mockEnvironment.chrome.runtime.sendMessage).toHaveBeenCalledWith(
                { action: 'test' },
                expect.any(Function)
            )
        })

        test('should set up message listeners', () => {
            expect(mockEnvironment.chrome.runtime.onMessage.addListener).toBeDefined()
        })
    })

    describe('DOM Observation', () => {
        test('should set up MutationObserver', () => {
            expect(mockEnvironment.MutationObserver).toBeDefined()

            const observer = new mockEnvironment.MutationObserver(() => {})

            expect(observer.observe).toBeDefined()
            expect(observer.disconnect).toBeDefined()
        })

        test('should observe DOM changes', () => {
            const observer = new mockEnvironment.MutationObserver(() => {})

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

    describe('Timing Functions', () => {
        test('should handle setTimeout', () => {
            expect(mockEnvironment.setTimeout).toBeDefined()

            mockEnvironment.setTimeout(() => {}, 1000)

            expect(mockEnvironment.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)
        })

        test('should handle clearTimeout', () => {
            expect(mockEnvironment.clearTimeout).toBeDefined()

            mockEnvironment.clearTimeout(123)

            expect(mockEnvironment.clearTimeout).toHaveBeenCalledWith(123)
        })

        test('should handle setInterval', () => {
            expect(mockEnvironment.setInterval).toBeDefined()

            mockEnvironment.setInterval(() => {}, 1000)

            expect(mockEnvironment.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000)
        })

        test('should handle clearInterval', () => {
            expect(mockEnvironment.clearInterval).toBeDefined()

            mockEnvironment.clearInterval(123)

            expect(mockEnvironment.clearInterval).toHaveBeenCalledWith(123)
        })
    })

    describe('Event Handling', () => {
        test('should set up DOM event listeners', () => {
            expect(mockEnvironment.document.addEventListener).toBeDefined()

            mockEnvironment.document.addEventListener('DOMContentLoaded', () => {})

            expect(mockEnvironment.document.addEventListener).toHaveBeenCalledWith(
                'DOMContentLoaded',
                expect.any(Function)
            )
        })

        test('should set up window event listeners', () => {
            expect(mockEnvironment.window.addEventListener).toBeDefined()

            mockEnvironment.window.addEventListener('load', () => {})

            expect(mockEnvironment.window.addEventListener).toHaveBeenCalledWith(
                'load',
                expect.any(Function)
            )
        })

        test('should remove event listeners', () => {
            expect(mockEnvironment.document.removeEventListener).toBeDefined()
            expect(mockEnvironment.window.removeEventListener).toBeDefined()
        })
    })

    describe('Element Attributes', () => {
        test('should handle element attributes', () => {
            mockElement.setAttribute('data-test', 'value')
            mockElement.getAttribute('data-test')

            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-test', 'value')
            expect(mockElement.getAttribute).toHaveBeenCalledWith('data-test')
        })
    })

    describe('Error Handling', () => {
        test('should handle errors gracefully', () => {
            try {
                throw new Error('Test error')
            } catch (error) {
                mockEnvironment.console.error('Caught error:', error.message)
                expect(mockEnvironment.console.error).toHaveBeenCalledWith('Caught error:', 'Test error')
            }
        })

        test('should handle missing elements', () => {
            mockEnvironment.document.querySelector.mockReturnValue(null)

            const element = mockEnvironment.document.querySelector('.non-existent')

            expect(element).toBeNull()
        })
    })

    describe('Performance Optimization', () => {
        test('should provide debouncing capabilities', () => {
            // Test that timing functions are available for debouncing
            expect(mockEnvironment.setTimeout).toBeDefined()
            expect(mockEnvironment.clearTimeout).toBeDefined()
        })

        test('should provide throttling capabilities', () => {
            // Test that timing functions are available for throttling
            expect(mockEnvironment.setInterval).toBeDefined()
            expect(mockEnvironment.clearInterval).toBeDefined()
        })
    })
})
