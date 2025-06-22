// Popup script for InnerPeace extension
// Dynamically loads controls based on the current website

let currentWebsite = null;
let currentConfig = null;

// Initialize the popup
async function initializePopup() {
    try {
        console.log('[InnerPeace] Initializing popup...');
        
        // Check if we're in the extension context
        if (!chrome?.runtime?.id) {
            throw new Error('Not in extension context');
        }
        
        // Get current website from background script
        const response = await Promise.race([
            chrome.runtime.sendMessage({ action: 'getCurrentWebsite' }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Background script timeout')), 3000)
            )
        ]);
        console.log('[InnerPeace] Background response:', response);
        
        // Handle undefined or null response
        if (!response) {
            throw new Error('Background script returned undefined response');
        }
        
        currentWebsite = response.website;
        currentConfig = response.config;
        
        console.log('[InnerPeace] Current website:', currentWebsite);
        console.log('[InnerPeace] Current config:', currentConfig);
        
        if (currentWebsite && currentConfig) {
            setupWebsiteControls();
        } else {
            console.log('[InnerPeace] Website not supported or config missing');
            // Try to get the current tab URL directly as a fallback
            await tryFallbackDetection();
        }
    } catch (error) {
        console.error('Error initializing popup:', error);
        // Try fallback detection if background script fails
        await tryFallbackDetection();
    }
}

// Fallback detection method
async function tryFallbackDetection() {
    try {
        console.log('[InnerPeace] Trying fallback detection...');
        
        // Check if we're in the extension context
        if (!chrome?.runtime?.id) {
            throw new Error('Not in extension context');
        }
        
        // Get the current tab directly
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].url) {
            console.log('[InnerPeace] Current tab URL:', tabs[0].url);
            
            // Parse the URL manually
            const url = new URL(tabs[0].url);
            const hostname = url.hostname;
            console.log('[InnerPeace] Parsed hostname:', hostname);
            
            // Check if it's a supported website
            if (hostname.includes('youtube.com')) {
                currentWebsite = 'youtube.com';
                currentConfig = {
                    script: 'scripts/youtube.js',
                    settings: ['youtube_showFeed', 'youtube_showRightPanel']
                };
                console.log('[InnerPeace] Fallback detected YouTube');
                setupWebsiteControls();
                return;
            } else if (hostname.includes('linkedin.com')) {
                currentWebsite = 'linkedin.com';
                currentConfig = {
                    script: 'scripts/linkedin.js',
                    settings: ['linkedin_showFeed', 'linkedin_showAside']
                };
                console.log('[InnerPeace] Fallback detected LinkedIn');
                setupWebsiteControls();
                return;
            }
        }
        
        // If we get here, the website is not supported
        showUnsupportedWebsite();
    } catch (error) {
        console.error('Error in fallback detection:', error);
        showUnsupportedWebsite();
    }
}

// Setup controls for the current website
async function setupWebsiteControls() {
    const container = document.getElementById('controls-container');
    container.innerHTML = ''; // Clear existing content
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = `${currentWebsite.charAt(0).toUpperCase() + currentWebsite.slice(1)} Settings`;
    header.className = 'website-header';
    container.appendChild(header);
    
    // Get current settings
    let settings = {};
    try {
        const settingsResponse = await Promise.race([
            chrome.runtime.sendMessage({ 
                action: 'getWebsiteSettings', 
                website: currentWebsite 
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Settings retrieval timeout')), 3000)
            )
        ]);
        
        // Handle undefined or null response
        if (settingsResponse) {
            settings = settingsResponse;
        }
    } catch (error) {
        console.error('Error getting settings, using defaults:', error);
        // Use default settings if we can't get them
        if (currentWebsite === 'youtube.com') {
            settings = { youtube_showFeed: false, youtube_showRightPanel: false };
        } else if (currentWebsite === 'linkedin.com') {
            settings = { linkedin_showFeed: false, linkedin_showAside: false };
        }
    }
    
    console.log('[InnerPeace] Retrieved settings:', settings);
    
    // Create controls based on website configuration
    if (currentWebsite === 'linkedin.com') {
        createLinkedInControls(settings);
    } else if (currentWebsite === 'youtube.com') {
        createYouTubeControls(settings);
    }
    // Add more website-specific control creators here
    // else if (currentWebsite === 'facebook.com') {
    //     createFacebookControls(settings);
    // }
}

// Create LinkedIn-specific controls
function createLinkedInControls(settings) {
    const container = document.getElementById('controls-container');
    
    // Feed toggle
    const feedControl = createToggleControl(
        'linkedin_showFeed',
        'Show Feed',
        settings.linkedin_showFeed || false,
        'Toggle the main LinkedIn feed visibility'
    );
    container.appendChild(feedControl);
    
    // Aside toggle
    const asideControl = createToggleControl(
        'linkedin_showAside',
        'Show News Sidebar',
        settings.linkedin_showAside || false,
        'Toggle the LinkedIn news sidebar visibility'
    );
    container.appendChild(asideControl);
}

// Create YouTube-specific controls
function createYouTubeControls(settings) {
    const container = document.getElementById('controls-container');
    
    // Feed toggle
    const feedControl = createToggleControl(
        'youtube_showFeed',
        'Show Home Feed',
        settings.youtube_showFeed || false,
        'Toggle the YouTube home page video feed visibility'
    );
    container.appendChild(feedControl);
    
    // Right panel toggle
    const rightPanelControl = createToggleControl(
        'youtube_showRightPanel',
        'Show Video Suggestions',
        settings.youtube_showRightPanel || false,
        'Toggle the right panel and additional video content sections when watching videos'
    );
    container.appendChild(rightPanelControl);
}

// Create a toggle control
function createToggleControl(settingKey, label, defaultValue, description) {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'control-item';
    
    const labelElement = document.createElement('label');
    labelElement.className = 'control-label';
    labelElement.textContent = label;
    
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = defaultValue;
    toggle.className = 'control-toggle';
    
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'control-description';
    descriptionElement.textContent = description;
    
    // Handle toggle changes
    toggle.addEventListener('change', async () => {
        const newValue = toggle.checked;
        const settings = { [settingKey]: newValue };
        
        try {
            await Promise.race([
                chrome.runtime.sendMessage({
                    action: 'updateWebsiteSettings',
                    website: currentWebsite,
                    settings: settings
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Settings update timeout')), 3000)
                )
            ]);
        } catch (error) {
            console.error('Error updating settings:', error);
            // Optionally show user feedback here
        }
    });
    
    controlDiv.appendChild(labelElement);
    controlDiv.appendChild(toggle);
    controlDiv.appendChild(descriptionElement);
    
    return controlDiv;
}

// Show message for unsupported websites
function showUnsupportedWebsite() {
    const container = document.getElementById('controls-container');
    container.innerHTML = `
        <div class="unsupported-message">
            <h2>Website Not Supported</h2>
            <p>This website is not currently supported by InnerPeace.</p>
            <p>Supported websites:</p>
            <ul>
                <li>LinkedIn</li>
                <li>YouTube</li>
                <!-- Add more supported websites here -->
            </ul>
            <p><small>Debug: Current website detected as: ${currentWebsite || 'none'}</small></p>
        </div>
    `;
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', initializePopup);
