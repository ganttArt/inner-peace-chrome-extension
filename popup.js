const toggleFeed = document.getElementById('toggleFeed');
const toggleAside = document.getElementById('toggleAside');

// Get and set the initial states of both checkboxes from storage
chrome.storage.sync.get(['showFeed', 'showAside'], (result) => {
    toggleFeed.checked = result.showFeed || false;
    toggleAside.checked = result.showAside || false;
});

// Handle change events for both checkboxes
toggleFeed.addEventListener('change', () => {
    const newFeedValue = toggleFeed.checked;
    chrome.storage.sync.set({ showFeed: newFeedValue }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleFeed",
                value: newFeedValue
            });
        });
    });
});

toggleAside.addEventListener('change', () => {
    const newAsideValue = toggleAside.checked;
    chrome.storage.sync.set({ showAside: newAsideValue }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleAside",
                value: newAsideValue
            });
        });
    });
});
