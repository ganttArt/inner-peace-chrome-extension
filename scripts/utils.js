// Utility functions for InnerPeace content scripts
(function () {
    /**
     * Sets the display property of an element based on visibility
     * @param {Element} element - The DOM element to modify
     * @param {boolean} visible - Whether the element should be visible
     */
    function setDisplay (element, visible) {
        if (element) {
            element.style.display = visible ? '' : 'none'
        }
    }

    /**
     * Sets the display property of multiple elements based on visibility
     * @param {Element[]} elements - Array of DOM elements to modify
     * @param {boolean} visible - Whether the elements should be visible
     */
    function setDisplayMultiple (elements, visible) {
        elements.forEach(element => setDisplay(element, visible))
    }

    // Export to global scope for use in other content scripts
    window.InnerPeaceUtils = {
        setDisplay,
        setDisplayMultiple
    }
})()
