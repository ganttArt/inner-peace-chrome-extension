// LinkedIn Aside Module
(function() {
    function toggleAsideVisibility(visible) {
        const aside = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]');
        if (aside) {
            aside.style.display = visible ? '' : 'none';
        }
    }

    function updateAsideVisibility() {
        try {
            if (!chrome?.runtime?.id) return;
        } catch (err) {
            console.error("chrome.runtime unavailable:", err);
            return;
        }

        try {
            chrome.storage.sync.get(['linkedin_showAside'], function (result) {
                try {
                    const showAside = typeof result.linkedin_showAside !== 'undefined' ? result.linkedin_showAside : false;
                    toggleAsideVisibility(showAside);
                    console.log('[InnerPeace] Applied LinkedIn aside setting:', showAside);
                } catch (e) {
                    console.error("Error inside storage callback:", e);
                }
            });
        } catch (error) {
            console.error("Error in updateAsideVisibility:", error);
        }
    }

    function setupAsideObserver() {
        try {
            let observer = new MutationObserver((mutations, obs) => {
                const asideExists = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]');
                if (asideExists) {
                    updateAsideVisibility();
                    obs.disconnect();
                    console.log('[InnerPeace] LinkedIn aside observer disconnected after applying settings.');
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            console.log('[InnerPeace] LinkedIn aside observer set up.');
        } catch (err) {
            console.error("Error setting up LinkedIn aside MutationObserver:", err);
        }
    }

    function immediateAsideCheck() {
        setTimeout(() => {
            const asideExists = document.querySelector('aside.scaffold-layout__aside[aria-label="LinkedIn News"]');
            if (asideExists) {
                updateAsideVisibility();
            }
        }, 1000);
    }

    function periodicAsideCheck() {
        const interval = setInterval(() => {
            try {
                if (!chrome?.runtime?.id) {
                    clearInterval(interval);
                    return;
                }
                if (window.location.pathname.startsWith('/feed')) {
                    updateAsideVisibility();
                }
            } catch (err) {
                console.error("Error in LinkedIn aside fallback interval:", err);
                clearInterval(interval);
            }
        }, 1500);
    }

    // Export to global LinkedIn object
    window.LinkedInAside = {
        toggleAsideVisibility,
        updateAsideVisibility,
        setupAsideObserver,
        immediateAsideCheck,
        periodicAsideCheck
    };
})(); 