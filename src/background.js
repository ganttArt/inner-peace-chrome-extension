// Background script for InnerPeace extension
// Handles communication and dynamic script injection

// Website configurations
const WEBSITE_CONFIGS = {
    'linkedin.com': {
        script: 'scripts/linkedin.js',
        settings: ['linkedin_showFeed', 'linkedin_showAside']
    },
    'youtube.com': {
        script: 'scripts/youtube.js',
        settings: ['youtube_showFeed', 'youtube_showRightPanel']
    }
    // Add more websites here as needed
    // 'facebook.com': {
    //     script: 'scripts/facebook.js',
    //     settings: ['facebook_showFeed', 'facebook_showStories']
    // }
}

// Get the current website from a URL
function getWebsiteFromUrl(url) {
    try {
        const hostname = new URL(url).hostname
        console.log('[InnerPeace] Parsed hostname:', hostname)

        const website = Object.keys(WEBSITE_CONFIGS).find(domain =>
            hostname.includes(domain)
        )

        console.log('[InnerPeace] Detected website:', website)
        return website
    } catch (error) {
        console.error('Error parsing URL:', error)
        return null
    }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[InnerPeace] Background received message:', message)

    if (message.action === 'getCurrentWebsite') {
        // Get current active tab to determine website
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                try {
                    console.log('[InnerPeace] Current tab:', tabs[0])

                    if (tabs && tabs[0]) {
                        const website = getWebsiteFromUrl(tabs[0].url)
                        const config = WEBSITE_CONFIGS[website]
                        console.log('[InnerPeace] Sending response:', { website, config })
                        sendResponse({ website, config })
                    } else {
                        console.log('[InnerPeace] No active tab found')
                        sendResponse({ website: null, config: null })
                    }
                } catch (error) {
                    console.error('[InnerPeace] Error in tabs query callback:', error)
                    sendResponse({ website: null, config: null })
                }
            })
        } catch (error) {
            console.error('[InnerPeace] Error querying tabs:', error)
            sendResponse({ website: null, config: null })
        }
        return true // Keep message channel open for async response
    }

    if (message.action === 'getWebsiteSettings') {
        try {
            const website = message.website
            const config = WEBSITE_CONFIGS[website]
            if (config) {
                chrome.storage.sync.get(config.settings, (result) => {
                    try {
                        sendResponse(result || {})
                    } catch (error) {
                        console.error('[InnerPeace] Error sending storage response:', error)
                        sendResponse({})
                    }
                })
            } else {
                sendResponse({})
            }
        } catch (error) {
            console.error('[InnerPeace] Error in getWebsiteSettings:', error)
            sendResponse({})
        }
        return true
    }

    if (message.action === 'updateWebsiteSettings') {
        try {
            const { website, settings } = message
            chrome.storage.sync.set(settings, () => {
                try {
                    // Forward the message to the appropriate content script
                    try {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            try {
                                if (tabs && tabs[0] && website && WEBSITE_CONFIGS[website]) {
                                    // Only send message if we're on a supported website
                                    chrome.tabs.sendMessage(tabs[0].id, {
                                        action: 'updateSettings',
                                        settings
                                    }).catch((error) => {
                                        // Content script might not be loaded, which is normal for unsupported sites
                                        console.log('[InnerPeace] Could not send message to content script:', error.message)
                                    })
                                }
                            } catch (error) {
                                console.error('[InnerPeace] Error in tabs query callback for message sending:', error)
                            }
                        })
                    } catch (error) {
                        console.error('[InnerPeace] Error querying tabs for message sending:', error)
                    }
                    sendResponse({ success: true })
                } catch (error) {
                    console.error('[InnerPeace] Error in storage set callback:', error)
                    sendResponse({ success: false, error: error.message })
                }
            })
        } catch (error) {
            console.error('[InnerPeace] Error in updateWebsiteSettings:', error)
            sendResponse({ success: false, error: error.message })
        }
        return true
    }
})

// Handle tab updates to inject scripts for new websites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const website = getWebsiteFromUrl(tab.url)
        if (website && WEBSITE_CONFIGS[website]) {
            console.log(`[InnerPeace] Detected ${website}, ensuring script is injected`)
            // The manifest will handle the injection, but we can add additional logic here if needed
        }
    }
})

console.log('[InnerPeace] Background script loaded')

// On install, ensure all known website settings default to `false` (hidden)
try {
    chrome.runtime.onInstalled.addListener(() => {
        try {
            // Collect all setting keys from WEBSITE_CONFIGS
            const allSettings = Object.values(WEBSITE_CONFIGS)
                .map(cfg => cfg.settings || [])
                .reduce((acc, arr) => acc.concat(arr), [])
                .filter(Boolean)
            if (allSettings.length === 0) return

            chrome.storage.sync.get(allSettings, (result) => {
                try {
                    const toSet = {}
                    for (const key of allSettings) {
                        if (typeof result[key] === 'undefined') {
                            toSet[key] = false
                        }
                    }
                    if (Object.keys(toSet).length > 0) {
                        chrome.storage.sync.set(toSet, () => {
                            console.log('[InnerPeace] Initialized default settings on install:', toSet)
                        })
                    }
                } catch (err) {
                    console.error('[InnerPeace] Error initializing defaults on install:', err)
                }
            })
        } catch (err) {
            console.error('[InnerPeace] onInstalled handler error:', err)
        }
    })
} catch (err) {
    console.error('[InnerPeace] Error registering onInstalled listener:', err)
}
