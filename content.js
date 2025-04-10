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

// Set up a MutationObserver to watch for changes in the page's DOM (e.g., when navigating to a new section)
const observer = new MutationObserver(() => {
    chrome.storage.sync.get(['showFeed', 'showAside'], (result) => {
        const showFeed = result.showFeed !== undefined ? result.showFeed : false;
        const showAside = result.showAside !== undefined ? result.showAside : false;
        toggleFeedVisibility(showFeed);
        toggleAsideVisibility(showAside);
    });
});

// Configure the observer to watch for changes in the body element
observer.observe(document.body, {
    childList: true,
    subtree: true,
});

// Optionally, you can also observe changes in the URL using the `popstate` event (if LinkedIn uses SPA navigation).
window.addEventListener('popstate', () => {
    chrome.storage.sync.get(['showFeed', 'showAside'], (result) => {
        const showFeed = result.showFeed !== undefined ? result.showFeed : false;
        const showAside = result.showAside !== undefined ? result.showAside : false;
        toggleFeedVisibility(showFeed);
        toggleAsideVisibility(showAside);
    });
});
