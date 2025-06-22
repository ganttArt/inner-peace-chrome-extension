# InnerPeace Chrome Extension

A Chrome extension that helps you maintain focus by toggling visibility of distracting elements on various websites.

## Features

- **LinkedIn Support**: Toggle the main feed and news sidebar visibility
- **YouTube Support**: Toggle home feed, sidebar, and comments
- **Modular Architecture**: Easy to add support for new websites
- **Dynamic UI**: Popup automatically adapts to the current website
- **Persistent Settings**: Your preferences are saved across sessions

## Project Structure

```
inner-peace-chrome-extension/
├── manifest.json          # Extension configuration
├── package.json           # Project dependencies and scripts
├── README.md              # Project documentation
├── .eslintrc.js           # Linting configuration
├── playwright.config.js   # Playwright E2E test configuration
├── .gitignore             # Git ignore rules
├── src/                   # Core extension files
│   ├── background.js      # Background service worker
│   ├── popup.js           # Popup logic
│   ├── popup.html         # Popup interface
│   ├── styles.css         # Popup styles
│   └── icons/             # Extension icons
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── scripts/               # Content scripts (injected into websites)
│   ├── template.js        # Template for new content scripts
│   ├── watch-tests.js     # Test watcher script
│   ├── linkedin/          # LinkedIn-specific scripts
│   │   ├── aside.js
│   │   ├── feed.js
│   │   └── index.js
│   └── youtube/           # YouTube-specific scripts
│       ├── homefeed.js
│       ├── index.js
│       └── videopage.js
├── tests/                 # All test code and outputs
│   ├── e2e/               # End-to-end tests (Playwright)
│   ├── integration/       # Integration tests
│   ├── unit/              # Unit tests
│   ├── test-output/       # Generated test output (coverage, reports)
│   ├── setup.js           # Jest setup
│   └── TESTING.md         # Testing documentation
└── .github/               # CI/CD workflows
```

## Adding Support for New Websites

To add support for a new website, follow these steps:

### 1. Create a Content Script

Copy `scripts/template.js` and create a new file (e.g., `scripts/youtube/index.js`):

```javascript
// Example: scripts/youtube/index.js
(function () {
    function toggleHomeFeed(visible) {
        const homeFeed = document.querySelector('#contents.ytd-rich-grid-renderer');
        if (homeFeed) {
            homeFeed.style.display = visible ? '' : 'none';
        }
    }

    function toggleSidebar(visible) {
        const sidebar = document.querySelector('#secondary.ytd-watch-flexy');
        if (sidebar) {
            sidebar.style.display = visible ? '' : 'none';
        }
    }

    // ... rest of the implementation
})();
```

### 2. Update the Manifest

Add the new content script to `manifest.json`:

```json
{
    "content_scripts": [
        {
            "matches": ["*://www.linkedin.com/*"],
            "js": ["scripts/linkedin/feed.js", "scripts/linkedin/aside.js", "scripts/linkedin/index.js"],
            "run_at": "document_idle"
        },
        {
            "matches": ["*://www.youtube.com/*"],
            "js": ["scripts/youtube/homefeed.js", "scripts/youtube/videopage.js", "scripts/youtube/index.js"],
            "run_at": "document_idle"
        }
    ]
}
```

### 3. Update Background Script

Add the website configuration to `src/background.js`:

```javascript
const WEBSITE_CONFIGS = {
    'linkedin.com': {
        script: 'scripts/linkedin/index.js',
        settings: ['linkedin_showFeed', 'linkedin_showAside']
    },
    'youtube.com': {
        script: 'scripts/youtube/index.js',
        settings: ['youtube_showHomeFeed', 'youtube_showSidebar', 'youtube_showComments']
    }
};
```

### 4. Update Popup Script

Add website-specific controls to `src/popup.js`:

```javascript
// In setupWebsiteControls function
if (currentWebsite === 'linkedin.com') {
    createLinkedInControls(settings);
} else if (currentWebsite === 'youtube.com') {
    createYouTubeControls(settings);
}

// Add the control creator function
function createYouTubeControls(settings) {
    const container = document.getElementById('controls-container');
    
    const homeFeedControl = createToggleControl(
        'youtube_showHomeFeed',
        'Show Home Feed',
        settings.youtube_showHomeFeed || false,
        'Toggle the YouTube home page video grid'
    );
    container.appendChild(homeFeedControl);
    
    const sidebarControl = createToggleControl(
        'youtube_showSidebar',
        'Show Sidebar',
        settings.youtube_showSidebar || false,
        'Toggle the YouTube sidebar with recommendations'
    );
    container.appendChild(sidebarControl);
    
    const commentsControl = createToggleControl(
        'youtube_showComments',
        'Show Comments',
        settings.youtube_showComments || false,
        'Toggle the YouTube comments section'
    );
    container.appendChild(commentsControl);
}
```

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

## Usage

1. Navigate to a supported website (currently LinkedIn and YouTube)
2. Click the InnerPeace extension icon
3. Use the toggles to show/hide distracting elements
4. Your settings will be automatically applied and saved

## Development

The extension uses a modular architecture:

- **Background Script**: Handles communication and manages website configurations
- **Content Scripts**: Website-specific logic for toggling elements
- **Popup**: Dynamic UI that adapts to the current website
- **Storage**: Chrome's sync storage for persistent settings

## Contributing

To add support for a new website:

1. Study the website's DOM structure
2. Create a content script based on the template
3. Update the manifest and background script
4. Add UI controls to the popup
5. Test thoroughly on the target website

## License

This project is open source and available under the MIT License.
