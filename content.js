function toggleFeedVisibility(visible) {
    const feed = document.querySelector('[data-id="feed-container"]') || document.querySelector('.scaffold-finite-scroll');
    if (feed) {
        feed.style.display = visible ? 'block' : 'none';
    }
}

function toggleAsideVisibility(visible) {
    const aside = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]');
    if (aside) {
        aside.style.display = visible ? 'block' : 'none';
    }
}

// Get stored preferences for feed and aside visibility
chrome.storage.sync.get(['showFeed', 'showAside'], (result) => {
    const showFeed = result.showFeed !== undefined ? result.showFeed : false;
    const showAside = result.showAside !== undefined ? result.showAside : false;
    toggleFeedVisibility(showFeed);
    toggleAsideVisibility(showAside);
});

// Listen for messages to toggle feed or aside visibility
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleFeed") {
        toggleFeedVisibility(message.value);
    } else if (message.action === "toggleAside") {
        toggleAsideVisibility(message.value);
    }
});
