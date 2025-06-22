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
        settings: ['youtube_showFeed']
    }
    // Add more websites here as needed
    // 'facebook.com': {
    //     script: 'scripts/facebook.js',
    //     settings: ['facebook_showFeed', 'facebook_showStories']
    // }
};

// Get the current website from a URL
function getWebsiteFromUrl(url) {
    try {
        const hostname = new URL(url).hostname;
        console.log('[InnerPeace] Parsed hostname:', hostname);
        
        const website = Object.keys(WEBSITE_CONFIGS).find(domain => 
            hostname.includes(domain)
        );
        
        console.log('[InnerPeace] Detected website:', website);
        return website;
    } catch (error) {
        console.error('Error parsing URL:', error);
        return null;
    }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[InnerPeace] Background received message:', message);
    
    if (message.action === 'getCurrentWebsite') {
        // Get current active tab to determine website
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log('[InnerPeace] Current tab:', tabs[0]);
            
            if (tabs[0]) {
                const website = getWebsiteFromUrl(tabs[0].url);
                const config = WEBSITE_CONFIGS[website];
                console.log('[InnerPeace] Sending response:', { website, config });
                sendResponse({ website, config });
            } else {
                console.log('[InnerPeace] No active tab found');
                sendResponse({ website: null, config: null });
            }
        });
        return true; // Keep message channel open for async response
    }
    
    if (message.action === 'getWebsiteSettings') {
        const website = message.website;
        const config = WEBSITE_CONFIGS[website];
        if (config) {
            chrome.storage.sync.get(config.settings, (result) => {
                sendResponse(result);
            });
        } else {
            sendResponse({});
        }
        return true;
    }
    
    if (message.action === 'updateWebsiteSettings') {
        const { website, settings } = message;
        chrome.storage.sync.set(settings, () => {
            // Forward the message to the appropriate content script
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateSettings',
                        settings: settings
                    });
                }
            });
            sendResponse({ success: true });
        });
        return true;
    }
});

// Handle tab updates to inject scripts for new websites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const website = getWebsiteFromUrl(tab.url);
        if (website && WEBSITE_CONFIGS[website]) {
            console.log(`[InnerPeace] Detected ${website}, ensuring script is injected`);
            // The manifest will handle the injection, but we can add additional logic here if needed
        }
    }
});

console.log('[InnerPeace] Background script loaded'); 