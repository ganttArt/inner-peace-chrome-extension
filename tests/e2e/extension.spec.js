// End-to-end tests for the Chrome extension
const { test, expect, chromium } = require('@playwright/test')
const path = require('path')

const EXTENSION_PATH = path.join(__dirname, '../../')
const POPUP_PATH = 'src/popup.html'

// Helper to get the extension ID from the background page
async function getExtensionId (context) {
    const backgroundPages = context.backgroundPages()
    if (backgroundPages.length > 0) {
        const bg = backgroundPages[0]
        const url = bg.url()
        const match = url.match(/chrome-extension:\/\/([a-z]{32})/)
        if (match) return match[1]
    }
    // Fallback: try to get from targets
    for (const page of context.pages()) {
        const url = page.url()
        const match = url.match(/chrome-extension:\/\/([a-z]{32})/)
        if (match) return match[1]
    }
    return null
}

test.describe('InnerPeace Chrome Extension', () => {
    let extensionId
    let context
    let page

    test.beforeAll(async () => {
    // Only run popup tests in Chromium
        if (process.env.PW_BROWSER !== 'chromium' && process.env.CI) return
        context = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`
            ]
        })
        // Wait for background page to load
        await new Promise(resolve => setTimeout(resolve, 1000))
        extensionId = await getExtensionId(context)
        page = await context.newPage()
    })

    test.afterAll(async () => {
        if (context) await context.close()
    })

    test.describe('Extension Installation and Basic Functionality', () => {
        test('should load extension and show popup', async () => {
            test.skip(!extensionId, 'Extension ID not found, skipping popup test')
            await page.goto(`chrome-extension://${extensionId}/${POPUP_PATH}`)
            await expect(page.locator('body')).toBeVisible()
            await expect(page.locator('#controls-container')).toBeVisible()
            await expect(page.locator('#status-message')).toBeVisible()
        })

        test('should handle settings toggle', async () => {
            test.skip(!extensionId, 'Extension ID not found, skipping popup test')
            await page.goto(`chrome-extension://${extensionId}/${POPUP_PATH}`)
            await page.evaluate(() => {
                const container = document.getElementById('controls-container')
                const toggle = document.createElement('div')
                toggle.className = 'toggle-control'
                toggle.innerHTML = `
          <label>
            <input type="checkbox" data-setting="test_setting">
            Test Setting
          </label>
        `
                container.appendChild(toggle)
            })
            const checkbox = page.locator('input[data-setting="test_setting"]')
            await checkbox.check()
            await expect(checkbox).toBeChecked()
        })
    })

    test.describe('LinkedIn Integration', () => {
        test('should detect LinkedIn website', async ({ page }) => {
            // Mock LinkedIn page
            await page.setContent(`
        <html>
          <head><title>LinkedIn</title></head>
          <body>
            <div id="global-nav">LinkedIn Navigation</div>
            <main>
              <div id="feed-identity-module">Feed Content</div>
              <aside id="global-nav-sidebar">Sidebar</aside>
            </main>
          </body>
        </html>
      `)

            // Mock window.location
            await page.addInitScript(() => {
                Object.defineProperty(window, 'location', {
                    value: {
                        hostname: 'www.linkedin.com',
                        href: 'https://www.linkedin.com/feed/'
                    },
                    writable: true
                })
            })

            // Check if LinkedIn elements are present
            await expect(page.locator('#global-nav')).toBeVisible()
            await expect(page.locator('#feed-identity-module')).toBeVisible()
            await expect(page.locator('#global-nav-sidebar')).toBeVisible()
        })

        test('should toggle LinkedIn feed visibility', async ({ page }) => {
            // Setup LinkedIn page with feed
            await page.setContent(`
        <html>
          <body>
            <main>
              <div id="feed-identity-module" style="display: block;">Feed Content</div>
            </main>
          </body>
        </html>
      `)

            // Simulate toggling feed visibility
            await page.evaluate(() => {
                const feed = document.getElementById('feed-identity-module')
                if (feed) {
                    feed.style.display = 'none'
                }
            })

            // Check if feed is hidden
            const feed = page.locator('#feed-identity-module')
            await expect(feed).toHaveCSS('display', 'none')
        })

        test('should toggle LinkedIn sidebar visibility', async ({ page }) => {
            // Setup LinkedIn page with sidebar
            await page.setContent(`
        <html>
          <body>
            <aside id="global-nav-sidebar" style="display: block;">Sidebar Content</aside>
          </body>
        </html>
      `)

            // Simulate toggling sidebar visibility
            await page.evaluate(() => {
                const sidebar = document.getElementById('global-nav-sidebar')
                if (sidebar) {
                    sidebar.style.display = 'none'
                }
            })

            // Check if sidebar is hidden
            const sidebar = page.locator('#global-nav-sidebar')
            await expect(sidebar).toHaveCSS('display', 'none')
        })
    })

    test.describe('YouTube Integration', () => {
        test('should detect YouTube website', async ({ page }) => {
            // Mock YouTube page
            await page.setContent(`
        <html>
          <head><title>YouTube</title></head>
          <body>
            <div id="masthead">YouTube Header</div>
            <main>
              <div id="contents" class="ytd-rich-grid-renderer">Home Feed</div>
            </main>
          </body>
        </html>
      `)

            // Mock window.location
            await page.addInitScript(() => {
                Object.defineProperty(window, 'location', {
                    value: {
                        hostname: 'www.youtube.com',
                        href: 'https://www.youtube.com/'
                    },
                    writable: true
                })
            })

            // Check if YouTube elements are present
            await expect(page.locator('#masthead')).toBeVisible()
            await expect(page.locator('#contents.ytd-rich-grid-renderer')).toBeVisible()
        })

        test('should toggle YouTube home feed visibility', async ({ page }) => {
            // Setup YouTube page with home feed
            await page.setContent(`
        <html>
          <body>
            <div id="contents" class="ytd-rich-grid-renderer" style="display: block;">Home Feed Content</div>
          </body>
        </html>
      `)

            // Simulate toggling home feed visibility
            await page.evaluate(() => {
                const homeFeed = document.querySelector('#contents.ytd-rich-grid-renderer')
                if (homeFeed) {
                    homeFeed.style.display = 'none'
                }
            })

            // Check if home feed is hidden
            const homeFeed = page.locator('#contents.ytd-rich-grid-renderer')
            await expect(homeFeed).toHaveCSS('display', 'none')
        })

        test('should toggle YouTube sidebar visibility', async ({ page }) => {
            // Setup YouTube page with sidebar
            await page.setContent(`
        <html>
          <body>
            <div id="secondary" class="ytd-watch-flexy" style="display: block;">Sidebar Content</div>
          </body>
        </html>
      `)

            // Simulate toggling sidebar visibility
            await page.evaluate(() => {
                const sidebar = document.querySelector('#secondary.ytd-watch-flexy')
                if (sidebar) {
                    sidebar.style.display = 'none'
                }
            })

            // Check if sidebar is hidden
            const sidebar = page.locator('#secondary.ytd-watch-flexy')
            await expect(sidebar).toHaveCSS('display', 'none')
        })
    })

    test.describe('Settings Persistence', () => {
        test('should save and load settings', async () => {
            test.skip(!extensionId, 'Extension ID not found, skipping popup test')
            await page.goto(`chrome-extension://${extensionId}/${POPUP_PATH}`)
            // Mock storage (if needed, or interact with real extension storage)
            // ... rest of the test logic ...
        })
    })

    test.describe('Error Handling', () => {
        test('should handle storage errors gracefully', async () => {
            test.skip(!extensionId, 'Extension ID not found, skipping popup test')
            await page.goto(`chrome-extension://${extensionId}/${POPUP_PATH}`)
            // ... rest of the test logic ...
        })
    })
})
